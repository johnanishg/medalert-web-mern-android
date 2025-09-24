import express from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Record medicine adherence (taken/not taken)
router.post('/record/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;
    const { taken, timestamp, notes } = req.body;

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

    // Create adherence record
    const adherenceRecord = {
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      taken: taken,
      notes: notes || '',
      recordedBy: req.user.role === 'patient' ? 'patient' : req.user.name
    };

    // Add to adherence history
    medicine.adherence.push(adherenceRecord);

    // Update last taken timestamp if medicine was taken
    if (taken) {
      medicine.lastTaken = new Date();
    }

    await patient.save();

    res.status(200).json({
      message: 'Adherence recorded successfully',
      adherence: adherenceRecord,
      medicine: medicine
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
