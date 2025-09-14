import express from 'express';
import Patient from '../models/Patient.js';
import Caretaker from '../models/Caretaker.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get patient profile
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient profile retrieved successfully',
      patient
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update patient profile
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

    const patient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient profile updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get caretaker approval requests for patient
router.get('/caretaker-requests', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.userId;
    
    // Check if user is patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findById(patientId)
      .populate('caretakerApprovals.caretakerId', 'name email userId experience certifications');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Caretaker requests retrieved successfully',
      caretakerRequests: patient.caretakerApprovals
    });

  } catch (error) {
    console.error('Get caretaker requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve or reject caretaker request
router.put('/caretaker-approval/:caretakerId', verifyToken, async (req, res) => {
  try {
    const { caretakerId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const patientId = req.user.userId;
    
    // Check if user is patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find the approval request
    const approvalIndex = patient.caretakerApprovals.findIndex(
      approval => approval.caretakerId.toString() === caretakerId
    );

    if (approvalIndex === -1) {
      return res.status(404).json({ message: 'Caretaker request not found' });
    }

    // Update the approval status
    patient.caretakerApprovals[approvalIndex].status = status;
    if (status === 'approved') {
      patient.caretakerApprovals[approvalIndex].approvedAt = new Date();
    } else {
      patient.caretakerApprovals[approvalIndex].rejectedAt = new Date();
    }

    // Update the caretaker's approval status
    const caretaker = await Caretaker.findById(caretakerId);
    if (caretaker) {
      const caretakerApprovalIndex = caretaker.patientApprovals.findIndex(
        approval => approval.patientId.toString() === patientId
      );
      
      if (caretakerApprovalIndex !== -1) {
        caretaker.patientApprovals[caretakerApprovalIndex].status = status;
        if (status === 'approved') {
          caretaker.patientApprovals[caretakerApprovalIndex].approvedAt = new Date();
        } else {
          caretaker.patientApprovals[caretakerApprovalIndex].rejectedAt = new Date();
        }
        await caretaker.save();
      }
    }

    await patient.save();

    res.status(200).json({
      message: `Caretaker request ${status} successfully`,
      patient: patient
    });

  } catch (error) {
    console.error('Update caretaker approval error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
