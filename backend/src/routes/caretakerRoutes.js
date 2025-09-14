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
    
    console.log('Request approval - patientId:', patientId);
    console.log('Request approval - caretakerId:', caretakerId);
    console.log('Request approval - user role:', req.user.role);
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Try to find patient by userId first, then by _id
    console.log('Searching for patient by userId:', patientId);
    let patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      console.log('Not found by userId, trying by _id:', patientId);
      // If not found by userId, try by MongoDB _id
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      console.log('Patient not found with either userId or _id');
      return res.status(404).json({ message: 'Patient not found' });
    }
    console.log('Patient found:', patient.name, 'userId:', patient.userId);

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
    console.log('Looking for caretaker with ID:', caretakerId);
    const caretaker = await Caretaker.findById(caretakerId);
    if (caretaker) {
      console.log('Caretaker found:', caretaker.name);
      caretaker.patientApprovals.push({
        patientId: patient._id,
        status: 'pending'
      });
      await caretaker.save();
    } else {
      console.log('Caretaker not found with ID:', caretakerId);
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

    // Find caretaker by MongoDB _id (userId in token is the _id)
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

    // Find caretaker by MongoDB _id (userId in token is the _id)
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

// Debug endpoint to check current user info
router.get('/debug-user', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Debug user request:', {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name
    });

    // Find the caretaker
    const caretaker = await Caretaker.findById(req.user.userId);
    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found in database' });
    }

    res.status(200).json({
      message: 'User debug info',
      jwtUser: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      },
      databaseCaretaker: {
        _id: caretaker._id,
        userId: caretaker.userId,
        email: caretaker.email,
        name: caretaker.name,
        assignedPatients: caretaker.assignedPatients
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all assigned patients (both directly assigned and approved)
router.get('/assigned-patients', verifyToken, async (req, res) => {
  try {
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Fetching assigned patients for caretaker:', caretakerId);

    // Find caretaker by MongoDB _id (userId in token is the _id)
    const caretaker = await Caretaker.findById(caretakerId)
      .populate('assignedPatients', 'name email userId age gender phoneNumber emergencyContact medicalHistory currentMedications selectedCaretaker')
      .populate('patientApprovals.patientId', 'name email userId age gender phoneNumber emergencyContact medicalHistory currentMedications selectedCaretaker');

    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    // Get directly assigned patients
    const directlyAssignedPatients = caretaker.assignedPatients || [];
    
    // Get approved patients from approval requests
    const approvedPatients = caretaker.patientApprovals
      .filter(approval => approval.status === 'approved')
      .map(approval => approval.patientId);

    // Combine both lists and remove duplicates
    const allPatients = [...directlyAssignedPatients];
    approvedPatients.forEach(patient => {
      if (!allPatients.find(p => p._id.toString() === patient._id.toString())) {
        allPatients.push(patient);
      }
    });

    console.log('Directly assigned patients:', directlyAssignedPatients.length);
    console.log('Approved patients:', approvedPatients.length);
    console.log('Total patients:', allPatients.length);

    res.status(200).json({
      message: 'Assigned patients retrieved successfully',
      patients: allPatients,
      directlyAssigned: directlyAssignedPatients,
      approved: approvedPatients
    });

  } catch (error) {
    console.error('Get assigned patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve or reject patient request
router.put('/approve-patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
    }

    console.log('Caretaker approval request:', { patientId, status, caretakerId });

    // Find the patient
    let patient = await Patient.findById(patientId);
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find the approval request in patient's caretakerApprovals
    const patientApprovalIndex = patient.caretakerApprovals.findIndex(
      approval => approval.caretakerId.toString() === caretakerId
    );

    if (patientApprovalIndex === -1) {
      return res.status(404).json({ message: 'Patient request not found' });
    }

    // Update the approval status in patient's record
    patient.caretakerApprovals[patientApprovalIndex].status = status;
    if (status === 'approved') {
      patient.caretakerApprovals[patientApprovalIndex].approvedAt = new Date();
      // Set the selected caretaker
      patient.selectedCaretaker = {
        caretakerId: caretakerId,
        caretakerUserId: caretaker.userId, // Use the caretaker's userId field, not the MongoDB _id
        assignedAt: new Date()
      };
    } else {
      patient.caretakerApprovals[patientApprovalIndex].rejectedAt = new Date();
    }

    // Update the caretaker's approval status
    const caretaker = await Caretaker.findById(caretakerId);
    if (caretaker) {
      const caretakerApprovalIndex = caretaker.patientApprovals.findIndex(
        approval => approval.patientId.toString() === patient._id.toString()
      );
      
      if (caretakerApprovalIndex !== -1) {
        caretaker.patientApprovals[caretakerApprovalIndex].status = status;
        if (status === 'approved') {
          caretaker.patientApprovals[caretakerApprovalIndex].approvedAt = new Date();
          // Add patient to assigned patients
          if (!caretaker.assignedPatients.includes(patient._id)) {
            caretaker.assignedPatients.push(patient._id);
            console.log('Patient added to caretaker assignedPatients after approval:', patient.name, '->', caretaker.name);
          }
        } else {
          caretaker.patientApprovals[caretakerApprovalIndex].rejectedAt = new Date();
        }
        await caretaker.save();
      }
    }

    await patient.save();

    res.status(200).json({
      message: `Patient request ${status} successfully`,
      patient: {
        _id: patient._id,
        name: patient.name,
        userId: patient.userId,
        email: patient.email
      }
    });

  } catch (error) {
    console.error('Caretaker approve patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove patient from caretaker's assigned list
router.delete('/remove-patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const caretakerId = req.user.userId;
    
    // Check if user is caretaker
    if (req.user.role !== 'caretaker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('🔍 Remove patient request:', { 
      patientId, 
      caretakerId, 
      userRole: req.user.role,
      userEmail: req.user.email,
      userName: req.user.name
    });

    // Find the patient
    let patient = await Patient.findById(patientId);
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }
    if (!patient) {
      console.log('❌ Patient not found with ID:', patientId);
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find the caretaker by userId (string ID)
    const caretaker = await Caretaker.findOne({ userId: caretakerId });
    if (!caretaker) {
      console.log('❌ Caretaker not found with userId:', caretakerId);
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    console.log('✅ Found patient:', { 
      patientId: patient._id, 
      patientUserId: patient.userId, 
      patientName: patient.name,
      patientSelectedCaretaker: patient.selectedCaretaker
    });
    console.log('✅ Found caretaker:', { 
      caretakerId: caretaker._id, 
      caretakerUserId: caretaker.userId, 
      caretakerName: caretaker.name,
      assignedPatients: caretaker.assignedPatients 
    });

    // Remove patient from caretaker's assigned patients
    console.log('🔍 Checking patient assignment...');
    console.log('Patient _id to find:', patient._id.toString());
    console.log('Caretaker assignedPatients:', caretaker.assignedPatients.map(id => id.toString()));
    
    const patientIndex = caretaker.assignedPatients.findIndex(
      id => id.toString() === patient._id.toString()
    );

    console.log('Patient index in assignedPatients:', patientIndex);

    if (patientIndex === -1) {
      console.log('❌ Patient not found in caretaker assignedPatients array');
      console.log('This means the patient is not assigned to this caretaker');
      return res.status(400).json({ message: 'Patient not assigned to this caretaker' });
    }

    caretaker.assignedPatients.splice(patientIndex, 1);
    await caretaker.save();

    // Update patient's selected caretaker to null
    if (patient.selectedCaretaker && patient.selectedCaretaker.caretakerId.toString() === caretaker._id.toString()) {
      patient.selectedCaretaker = undefined;
      await patient.save();
    }

    // Update approval status to rejected
    const approvalIndex = patient.caretakerApprovals.findIndex(
      approval => approval.caretakerId.toString() === caretaker._id.toString()
    );

    if (approvalIndex !== -1) {
      patient.caretakerApprovals[approvalIndex].status = 'rejected';
      patient.caretakerApprovals[approvalIndex].rejectedAt = new Date();
      await patient.save();
    }

    // Update caretaker's approval status
    const caretakerApprovalIndex = caretaker.patientApprovals.findIndex(
      approval => approval.patientId.toString() === patient._id.toString()
    );

    if (caretakerApprovalIndex !== -1) {
      caretaker.patientApprovals[caretakerApprovalIndex].status = 'rejected';
      caretaker.patientApprovals[caretakerApprovalIndex].rejectedAt = new Date();
      await caretaker.save();
    }

    console.log('Patient removed from caretaker:', patient.name, '->', caretaker.name);

    res.status(200).json({
      message: 'Patient removed successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        userId: patient.userId
      }
    });

  } catch (error) {
    console.error('Remove patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
