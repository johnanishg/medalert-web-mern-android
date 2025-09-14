import express from 'express';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';
import { sendMedicationReminder, validatePhoneNumber } from '../services/twilioService.js';
import { scheduleMedicationReminder } from '../services/medicationScheduler.js';

const router = express.Router();

// Get doctor profile
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor profile retrieved successfully',
      doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update doctor profile
router.put('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.password;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.isApproved; // Only admin can change approval status

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor profile updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search patient by unique ID
router.get('/search-patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    const Patient = (await import('../models/Patient.js')).default;
    const patient = await Patient.findOne({ userId: patientId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found with this ID' });
    }

    // Return patient data (excluding sensitive information like password)
    const patientData = {
      _id: patient._id,
      userId: patient.userId,
      name: patient.name,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      age: patient.age,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      emergencyContact: patient.emergencyContact,
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    res.status(200).json({
      message: 'Patient found successfully',
      patient: patientData
    });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add medicine to patient with SMS notification
router.post('/add-medicine/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, duration, instructions } = req.body;
    
    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    // Validate required fields
    if (!name || !dosage || !frequency) {
      return res.status(400).json({ message: 'Medicine name, dosage, and frequency are required.' });
    }

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Create new medication object with enhanced fields
    const newMedication = {
      name,
      dosage,
      frequency,
      duration: duration || 'As prescribed',
      instructions: instructions || '',
      prescribedBy: req.user.name,
      prescribedDate: new Date().toISOString(),
      // Enhanced fields
      timing: req.body.timing || [],
      foodTiming: req.body.foodTiming || '',
      durationType: req.body.durationType || 'dateRange',
      startDate: req.body.startDate || '',
      endDate: req.body.endDate || '',
      totalTablets: req.body.totalTablets || '',
      tabletsPerDay: req.body.tabletsPerDay || ''
    };

    // Add medication to patient's current medications
    if (!patient.currentMedications) {
      patient.currentMedications = [];
    }
    
    patient.currentMedications.push(newMedication);

    // Create a visit record for this medicine prescription
    const visitRecord = {
      visitDate: new Date(),
      visitType: 'medicine_prescription',
      doctorId: req.user._id,
      doctorName: req.user.name,
      diagnosis: req.body.diagnosis || 'Medicine prescription',
      notes: req.body.notes || `Prescribed ${name} - ${dosage}`,
      medicines: [{
        name,
        dosage,
        frequency,
        duration: duration || 'As prescribed',
        instructions: instructions || ''
      }],
      followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : null,
      followUpRequired: req.body.followUpRequired || false
    };

    // Add visit to patient's visit history
    if (!patient.visits) {
      patient.visits = [];
    }
    patient.visits.push(visitRecord);
    
    await patient.save();

    // Send SMS notification if patient has valid phone number
    if (patient.phoneNumber && validatePhoneNumber(patient.phoneNumber)) {
      try {
        const smsResult = await sendMedicationReminder(
          patient.phoneNumber,
          patient.name,
          name,
          dosage,
          frequency,
          req.user.name
        );

        if (smsResult.success) {
          console.log(`SMS sent successfully to ${patient.name} for medication ${name}`);
        } else {
          console.error(`Failed to send SMS to ${patient.name}:`, smsResult.error);
        }
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
        // Don't fail the request if SMS fails
      }
    } else {
      console.log(`Skipping SMS for patient ${patient.name} - invalid or missing phone number`);
    }

    // Schedule medication reminders
    try {
      const reminderData = {
        frequency,
        patientName: patient.name,
        patientPhone: patient.phoneNumber,
        medicineName: name,
        dosage,
        doctorName: req.user.name
      };
      
      scheduleMedicationReminder(reminderData);
    } catch (scheduleError) {
      console.error('Error scheduling medication reminder:', scheduleError);
      // Don't fail the request if scheduling fails
    }

    res.status(200).json({
      message: 'Medicine added successfully and patient notified',
      medication: newMedication,
      patient: {
        _id: patient._id,
        name: patient.name,
        phoneNumber: patient.phoneNumber
      }
    });

  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
