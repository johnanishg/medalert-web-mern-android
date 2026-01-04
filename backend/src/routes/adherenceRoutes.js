import express from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';
import { notifyCaretakerMissedDose } from '../services/caretakerNotificationService.js';

const router = express.Router();

// Record medicine adherence (taken/not taken)
router.post('/record/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;
    const { doseId, taken, timestamp, scheduledTime, notes } = req.body;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Only patients can record adherence.' });
    }

    // Find the authenticated patient (patients record their own adherence)
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate medicine index
    const index = parseInt(medicineIndex);
    if (index < 0 || index >= patient.currentMedications.length) {
      return res.status(400).json({ message: 'Invalid medicine index' });
    }

    const medicine = patient.currentMedications[index];
    
    // Initialize adherence tracking if not exists
    if (!medicine.adherence) {
      medicine.adherence = [];
    }

    // Parse scheduled time if provided
    const scheduledDateTime = scheduledTime ? new Date(scheduledTime) : null;
    const recordedTime = timestamp ? new Date(timestamp) : new Date();
    
    // Check if dose was missed (not taken within 2 hours after scheduled time)
    let isMissed = false;
    if (scheduledDateTime && taken === false) {
      // If marked as not taken, check if it's past the 2-hour window
      const twoHoursAfter = new Date(scheduledDateTime.getTime() + (2 * 60 * 60 * 1000));
      if (recordedTime > twoHoursAfter) {
        isMissed = true;
      }
    } else if (scheduledDateTime && taken === true) {
      // If marked as taken, check if it was taken within 2 hours
      const twoHoursAfter = new Date(scheduledDateTime.getTime() + (2 * 60 * 60 * 1000));
      if (recordedTime > twoHoursAfter) {
        isMissed = true;
      }
    }

    // Create adherence record with dose information
    const adherenceRecord = {
      timestamp: recordedTime,
      taken: taken,
      notes: notes || (taken ? 'Marked as taken' : 'Marked as missed'),
      recordedBy: req.user.role === 'patient' ? 'patient' : req.user.name,
      doseId: doseId || null,
      scheduledTime: scheduledDateTime || null,
      isMissed: isMissed
    };

    // Add to adherence history
    medicine.adherence.push(adherenceRecord);

    // Update last taken timestamp if medicine was taken
    if (taken) {
      medicine.lastTaken = recordedTime;
    }

    await patient.save();

    // Notify caretaker if dose was missed
    if (isMissed && patient.selectedCaretaker && patient.selectedCaretaker.caretakerId) {
      try {
        await notifyCaretakerMissedDose(
          patient,
          medicine,
          scheduledDateTime,
          recordedTime
        );
      } catch (notifyError) {
        console.error('Error notifying caretaker:', notifyError);
        // Don't fail the request if notification fails
      }
    }

    res.status(200).json({
      message: 'Adherence recorded successfully',
      adherence: adherenceRecord,
      medicine: medicine,
      isMissed: isMissed
    });

  } catch (error) {
    console.error('Record adherence error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get adherence history for a medicine
router.get('/history/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Only patients can view adherence history.' });
    }

    // Find the authenticated patient
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const index = parseInt(medicineIndex);
    if (index < 0 || index >= patient.currentMedications.length) {
      return res.status(400).json({ message: 'Invalid medicine index' });
    }

    const medicine = patient.currentMedications[index];
    const adherence = medicine.adherence || [];

    res.status(200).json({
      medicine: {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency
      },
      adherence: adherence
    });

  } catch (error) {
    console.error('Get adherence history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all adherence data for a patient (for doctor dashboard)
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    // Find the patient by Mongo _id (if valid) or by human userId (e.g., PATXXXX)
    let patient = null;
    if (mongoose.isValidObjectId(patientId)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log('Patient found:', patient.name);
    console.log('Current medications count:', patient.currentMedications?.length || 0);

    // Extract adherence data from all medicines
    const adherenceData = patient.currentMedications.map((medicine, index) => {
      const adherenceRecords = medicine.adherence || [];
      console.log(`Medicine ${index}: ${medicine.name}, Adherence records: ${adherenceRecords.length}`);
      
      return {
        medicineIndex: index,
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        timing: medicine.timing || [],
        adherence: adherenceRecords,
        lastTaken: medicine.lastTaken,
        prescribedDate: medicine.prescribedDate
      };
    });

    console.log('Total adherence data entries:', adherenceData.length);
    console.log('Medicines with adherence data:', adherenceData.filter(med => med.adherence.length > 0).length);

    res.status(200).json({
      patientId: patient._id,
      patientName: patient.name,
      adherenceData: adherenceData
    });

  } catch (error) {
    console.error('Get patient adherence error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
