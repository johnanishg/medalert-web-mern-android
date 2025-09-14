import express from 'express';
import Caretaker from '../models/Caretaker.js';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get caretaker profile
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const caretaker = await Caretaker.findById(id);
    
    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    res.status(200).json({
      message: 'Caretaker profile retrieved successfully',
      caretaker
    });
  } catch (error) {
    console.error('Get caretaker profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update caretaker profile
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

    const caretaker = await Caretaker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    res.status(200).json({
      message: 'Caretaker profile updated successfully',
      caretaker
    });
  } catch (error) {
    console.error('Update caretaker profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search patient by unique ID
router.get('/search-patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findOne({ userId: patientId });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient found successfully',
      patient
    });

  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Request patient approval
router.post('/request-patient-approval/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if approval already exists
    const existingApproval = patient.caretakerApprovals.find(
      approval => approval.caretakerId.toString() === caretakerId
    );

    if (existingApproval) {
      return res.status(400).json({ 
        message: 'Approval request already exists',
        status: existingApproval.status
      });
    }

    // Add approval request to patient
    patient.caretakerApprovals.push({
      caretakerId: caretakerId,
      status: 'pending'
    });

    // Add approval request to caretaker
    const caretaker = await Caretaker.findById(caretakerId);
    if (caretaker) {
      caretaker.patientApprovals.push({
        patientId: patient._id,
        status: 'pending'
      });
      await caretaker.save();
    }

    await patient.save();

    res.status(200).json({
      message: 'Approval request sent successfully',
      patient: patient
    });

  } catch (error) {
    console.error('Request patient approval error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get caretaker's approval requests
router.get('/approval-requests', verifyToken, async (req, res) => {
  try {
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const caretaker = await Caretaker.findById(caretakerId)
      .populate('patientApprovals.patientId', 'name email userId age gender phoneNumber');

    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    res.status(200).json({
      message: 'Approval requests retrieved successfully',
      approvalRequests: caretaker.patientApprovals
    });

  } catch (error) {
    console.error('Get approval requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get approved patients
router.get('/approved-patients', verifyToken, async (req, res) => {
  try {
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const caretaker = await Caretaker.findById(caretakerId)
      .populate('patientApprovals.patientId', 'name email userId age gender phoneNumber emergencyContact medicalHistory currentMedications');

    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    const approvedPatients = caretaker.patientApprovals
      .filter(approval => approval.status === 'approved')
      .map(approval => approval.patientId);

    res.status(200).json({
      message: 'Approved patients retrieved successfully',
      patients: approvedPatients
    });

  } catch (error) {
    console.error('Get approved patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
