import express from 'express';
import mongoose from 'mongoose';
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

// Get diagnosis history for a patient (doctor/admin only)
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

// Get own visits/diagnoses (patient can access their own data)
router.get('/my-visits', verifyToken, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patient access only.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    console.log('Fetching visits for patient userId:', userId);

    // Find patient by userId
    let patient = await Patient.findOne({ userId: userId });
    if (!patient && mongoose.isValidObjectId(userId)) {
      patient = await Patient.findById(userId);
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get diagnoses for this patient
    const diagnoses = await Diagnosis.find({ patientId: patient._id })
      .populate('doctorId', 'name specialization')
      .sort({ diagnosisDate: -1 });

    // Also get visits from patient.visits array
    const patientVisits = patient.visits || [];

    // Combine and format the data
    const allVisits = [
      // From Diagnosis model
      ...diagnoses.map(d => ({
        id: d._id,
        visitDate: d.diagnosisDate,
        visitType: 'consultation',
        doctorId: d.doctorId?._id || d.doctorId,
        doctorName: d.doctorName,
        doctorSpecialization: d.doctorId?.specialization,
        diagnosis: d.diagnosis,
        symptoms: d.symptoms || [],
        treatment: d.treatment,
        medications: d.medications || [],
        followUpDate: d.followUpDate,
        followUpRequired: !!d.followUpDate,
        notes: d.notes,
        source: 'diagnosis'
      })),
      // From Patient.visits array
      ...patientVisits.map((v, index) => ({
        id: v._id || `visit-${index}`,
        visitDate: v.visitDate,
        visitType: v.visitType || 'consultation',
        doctorId: v.doctorId,
        doctorName: v.doctorName,
        diagnosis: v.diagnosis,
        medicines: v.medicines || [],
        followUpDate: v.followUpDate,
        followUpRequired: v.followUpRequired || false,
        notes: v.notes,
        source: 'patient_visits'
      }))
    ];

    // Sort by visit date (most recent first)
    allVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    // Remove duplicates (same date, same doctor)
    const uniqueVisits = [];
    const seen = new Set();
    for (const visit of allVisits) {
      const key = `${visit.visitDate}-${visit.doctorName || visit.doctorId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueVisits.push(visit);
      }
    }

    console.log(`Found ${diagnoses.length} diagnoses and ${patientVisits.length} patient visits, ${uniqueVisits.length} unique visits`);

    res.status(200).json({
      message: 'Visits retrieved successfully',
      visits: uniqueVisits,
      count: uniqueVisits.length
    });

  } catch (error) {
    console.error('Get my visits error:', error);
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
