import express from 'express';
import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get all medicines for a patient (admin only)
router.get('/patient/:patientId/medicines', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    res.status(200).json({
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email
      },
      medicines: patient.currentMedications || []
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific medicine (admin only)
router.put('/patient/:patientId/medicines/:medicineIndex', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId, medicineIndex } = req.params;
    const updateData = req.body;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(medicineIndex);
    if (index < 0 || index >= (patient.currentMedications?.length || 0)) {
      return res.status(400).json({ message: 'Invalid medicine index.' });
    }

    // Update the medicine
    patient.currentMedications[index] = {
      ...patient.currentMedications[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.name
    };

    await patient.save();

    res.status(200).json({
      message: 'Medicine updated successfully',
      medicine: patient.currentMedications[index]
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific medicine (admin only)
router.delete('/patient/:patientId/medicines/:medicineIndex', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId, medicineIndex } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(medicineIndex);
    if (index < 0 || index >= (patient.currentMedications?.length || 0)) {
      return res.status(400).json({ message: 'Invalid medicine index.' });
    }

    const deletedMedicine = patient.currentMedications[index];
    patient.currentMedications.splice(index, 1);
    await patient.save();

    res.status(200).json({
      message: 'Medicine deleted successfully',
      deletedMedicine
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all visits for a patient (admin only)
router.get('/patient/:patientId/visits', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    res.status(200).json({
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email
      },
      visits: patient.visits || []
    });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific visit (admin only)
router.put('/patient/:patientId/visits/:visitIndex', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId, visitIndex } = req.params;
    const updateData = req.body;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(visitIndex);
    if (index < 0 || index >= (patient.visits?.length || 0)) {
      return res.status(400).json({ message: 'Invalid visit index.' });
    }

    // Update the visit
    patient.visits[index] = {
      ...patient.visits[index],
      ...updateData,
      updatedAt: new Date(),
      updatedBy: req.user.name
    };

    await patient.save();

    res.status(200).json({
      message: 'Visit updated successfully',
      visit: patient.visits[index]
    });
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific visit (admin only)
router.delete('/patient/:patientId/visits/:visitIndex', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { patientId, visitIndex } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(visitIndex);
    if (index < 0 || index >= (patient.visits?.length || 0)) {
      return res.status(400).json({ message: 'Invalid visit index.' });
    }

    const deletedVisit = patient.visits[index];
    patient.visits.splice(index, 1);
    await patient.save();

    res.status(200).json({
      message: 'Visit deleted successfully',
      deletedVisit
    });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all prescriptions (admin only)
router.get('/prescriptions', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      prescriptions
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific prescription (admin only)
router.put('/prescriptions/:prescriptionId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const updateData = req.body;
    
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Update the prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: req.user.name
      },
      { new: true }
    ).populate('patientId', 'name email').populate('doctorId', 'name email');

    res.status(200).json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific prescription (admin only)
router.delete('/prescriptions/:prescriptionId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    await Prescription.findByIdAndDelete(prescriptionId);

    res.status(200).json({
      message: 'Prescription deleted successfully',
      deletedPrescription: prescription
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
