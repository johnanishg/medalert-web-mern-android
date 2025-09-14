import express from 'express';
import Diagnosis from '../models/Diagnosis.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Temporary endpoint to list all diagnoses (for debugging)
router.get('/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const diagnoses = await Diagnosis.find({})
      .populate('doctorId', 'name specialization')
      .sort({ diagnosisDate: -1 });

    console.log('All diagnoses in database:', diagnoses.length);
    diagnoses.forEach((d, i) => {
      console.log(`Diagnosis ${i + 1}:`, {
        id: d._id,
        patientId: d.patientId,
        diagnosis: d.diagnosis,
        doctorName: d.doctorName,
        date: d.diagnosisDate
      });
    });

    res.status(200).json({
      message: 'All diagnoses retrieved',
      count: diagnoses.length,
      diagnoses: diagnoses
    });
  } catch (error) {
    console.error('Get all diagnoses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get diagnosis history for a patient
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('Fetching diagnosis history for patient:', patientId);
    console.log('User role:', req.user.role);
    
    // Check if user is doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Try to find diagnoses with the exact patientId
    const diagnoses = await Diagnosis.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ diagnosisDate: -1 });

    console.log('Found diagnoses:', diagnoses.length);
    console.log('Diagnoses data:', diagnoses);
    
    // If no diagnoses found, try to find all diagnoses to see what patientIds exist
    if (diagnoses.length === 0) {
      console.log('No diagnoses found for patientId:', patientId);
      const allDiagnoses = await Diagnosis.find({}).select('patientId diagnosis diagnosisDate');
      console.log('All diagnoses in database:');
      allDiagnoses.forEach((d, i) => {
        console.log(`  ${i + 1}. PatientId: ${d.patientId}, Diagnosis: ${d.diagnosis}, Date: ${d.diagnosisDate}`);
      });
    }

    res.status(200).json({
      message: 'Diagnosis history retrieved successfully',
      diagnoses
    });

  } catch (error) {
    console.error('Get diagnosis history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new diagnosis
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      patientId,
      diagnosis,
      symptoms,
      treatment,
      medications,
      followUpDate,
      notes
    } = req.body;

    // Get doctor information
    const doctor = await Doctor.findById(req.user.userId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const newDiagnosis = new Diagnosis({
      patientId,
      doctorId: req.user.userId,
      doctorName: doctor.name,
      diagnosis,
      symptoms: symptoms || [],
      treatment,
      medications: medications || [],
      followUpDate,
      notes
    });

    await newDiagnosis.save();

    res.status(201).json({
      message: 'Diagnosis created successfully',
      diagnosis: newDiagnosis
    });

  } catch (error) {
    console.error('Create diagnosis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update diagnosis
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user is doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const diagnosis = await Diagnosis.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }

    res.status(200).json({
      message: 'Diagnosis updated successfully',
      diagnosis
    });

  } catch (error) {
    console.error('Update diagnosis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete diagnosis
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const diagnosis = await Diagnosis.findByIdAndDelete(id);

    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }

    res.status(200).json({
      message: 'Diagnosis deleted successfully'
    });

  } catch (error) {
    console.error('Delete diagnosis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
