import express from 'express';
import Patient from '../models/Patient.js';
import Caretaker from '../models/Caretaker.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get patient profile
router.get('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find patient by MongoDB _id first, then by userId field
    let patient = await Patient.findById(id);
    if (!patient) {
      patient = await Patient.findOne({ userId: id });
    }
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log('Patient profile found:', {
      name: patient.name,
      userId: patient.userId,
      currentMedicationsCount: patient.currentMedications?.length || 0
    });

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

    // Update the caretaker's approval status
    const caretaker = await Caretaker.findById(caretakerId);
    
    // Update the approval status
    patient.caretakerApprovals[approvalIndex].status = status;
    if (status === 'approved') {
      patient.caretakerApprovals[approvalIndex].approvedAt = new Date();
      // Set the selected caretaker when patient approves
      patient.selectedCaretaker = {
        caretakerId: caretakerId,
        caretakerUserId: caretaker.userId,
        caretakerName: caretaker.name,
        caretakerEmail: caretaker.email,
        assignedAt: new Date()
      };
    } else {
      patient.caretakerApprovals[approvalIndex].rejectedAt = new Date();
    }

    // Update the caretaker's approval status
    if (caretaker) {
      const caretakerApprovalIndex = caretaker.patientApprovals.findIndex(
        approval => approval.patientId.toString() === patientId
      );
      
      if (caretakerApprovalIndex !== -1) {
        caretaker.patientApprovals[caretakerApprovalIndex].status = status;
        if (status === 'approved') {
          caretaker.patientApprovals[caretakerApprovalIndex].approvedAt = new Date();
          // Add patient to caretaker's assigned patients
          if (!caretaker.assignedPatients.includes(patient._id)) {
            caretaker.assignedPatients.push(patient._id);
          }
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

// Remove current caretaker (patient only)
router.delete('/remove-caretaker', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.userId;
    
    // Check if user is patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!patient.selectedCaretaker) {
      return res.status(400).json({ message: 'No caretaker assigned to remove' });
    }

    const caretakerId = patient.selectedCaretaker.caretakerId;
    
    // Remove patient from caretaker's assignedPatients
    const caretaker = await Caretaker.findById(caretakerId);
    if (caretaker) {
      caretaker.assignedPatients = caretaker.assignedPatients.filter(
        id => id.toString() !== patient._id.toString()
      );
      await caretaker.save();
    }

    // Clear patient's selectedCaretaker
    patient.selectedCaretaker = undefined;
    await patient.save();

    res.status(200).json({
      message: 'Caretaker removed successfully',
      patient: patient
    });

  } catch (error) {
    console.error('Remove caretaker error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific medicine (patient only)
router.put('/medicines/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;
    const updateData = req.body;
    
    // Get the current user (patient) - req.user.userId is the MongoDB _id
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(medicineIndex);
    if (index < 0 || index >= (patient.currentMedications?.length || 0)) {
      return res.status(400).json({ message: 'Invalid medicine index.' });
    }

    // Update the medicine
    const originalMedicine = patient.currentMedications[index];
    
    console.log('Original medicine before update:', {
      index,
      name: originalMedicine.name,
      dosage: originalMedicine.dosage,
      frequency: originalMedicine.frequency,
      timing: originalMedicine.timing
    });
    
    console.log('Update data received:', updateData);
    
    const updatedMedicine = {
      ...originalMedicine,
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Patient'
    };

    // Ensure required fields are preserved
    if (!updatedMedicine.name) updatedMedicine.name = originalMedicine.name;
    if (!updatedMedicine.dosage) updatedMedicine.dosage = originalMedicine.dosage;
    if (!updatedMedicine.frequency) updatedMedicine.frequency = originalMedicine.frequency;

    console.log('Updated medicine after merge:', {
      index,
      name: updatedMedicine.name,
      dosage: updatedMedicine.dosage,
      frequency: updatedMedicine.frequency,
      timing: updatedMedicine.timing
    });

    patient.currentMedications[index] = updatedMedicine;

    await patient.save();

    console.log('Medicine updated successfully and saved to database');

    res.status(200).json({
      message: 'Medicine updated successfully',
      medicine: updatedMedicine
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific medicine (patient only)
router.delete('/medicines/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;
    
    // Get the current user (patient) - req.user.userId is the MongoDB _id
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const index = parseInt(medicineIndex);
    if (index < 0 || index >= (patient.currentMedications?.length || 0)) {
      return res.status(400).json({ message: 'Invalid medicine index.' });
    }

    // Remove the medicine
    const deletedMedicine = patient.currentMedications[index];
    patient.currentMedications.splice(index, 1);
    await patient.save();

    res.status(200).json({
      message: 'Medicine deleted successfully',
      deletedMedicine: deletedMedicine
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update medicine schedule
router.post('/schedule/:medicineIndex', verifyToken, async (req, res) => {
  try {
    const { medicineIndex } = req.params;
    const { medicineName, timing, duration, durationType, startDate, endDate, totalTablets, tabletsPerDay } = req.body;
    const userId = req.user.id;

    console.log('Creating/updating schedule for medicine:', {
      medicineIndex,
      medicineName,
      timing,
      duration,
      durationType,
      startDate,
      endDate,
      totalTablets,
      tabletsPerDay,
      userId
    });

    // Find patient by userId
    let patient = await Patient.findOne({ userId: userId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate medicine index
    const index = parseInt(medicineIndex);
    if (index < 0 || index >= patient.currentMedications.length) {
      return res.status(400).json({ message: 'Invalid medicine index' });
    }

    const medicine = patient.currentMedications[index];
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Update medicine with schedule information
    const updatedMedicine = {
      ...medicine,
      timing: timing || medicine.timing,
      duration: duration || medicine.duration,
      durationType: durationType || medicine.durationType,
      startDate: startDate || medicine.startDate,
      endDate: endDate || medicine.endDate,
      totalTablets: totalTablets || medicine.totalTablets,
      tabletsPerDay: tabletsPerDay || medicine.tabletsPerDay,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Patient'
    };

    patient.currentMedications[index] = updatedMedicine;
    await patient.save();

    console.log('Schedule updated successfully for medicine:', medicineName);

    res.status(200).json({
      message: 'Schedule created/updated successfully',
      medicine: updatedMedicine
    });
  } catch (error) {
    console.error('Create/update schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get patient notifications
router.get('/notifications/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Fetching notifications for patient:', { id, userId });

    // Find patient by userId
    let patient = await Patient.findOne({ userId: userId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // For now, return empty notifications array
    // In the future, this could be expanded to include system notifications, reminders, etc.
    const notifications = [];

    res.status(200).json({
      message: 'Patient notifications retrieved successfully',
      notifications
    });
  } catch (error) {
    console.error('Get patient notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manual sync notification timings to patient medicines
router.post('/sync-notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Manual sync: Looking up patient with ID:', userId);
    
    // Find patient
    let patient = await Patient.findById(userId);
    if (!patient) {
      patient = await Patient.findOne({ userId: userId });
    }
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log('Manual sync: Found patient:', {
      _id: patient._id,
      userId: patient.userId,
      name: patient.name,
      currentMedicationsCount: patient.currentMedications?.length || 0
    });
    
    // Import MedicineNotification model
    const MedicineNotification = (await import('../models/MedicineNotification.js')).default;
    
    // Get all active notifications for this patient
    const notifications = await MedicineNotification.find({
      patientId: patient._id,
      isActive: true
    });
    
    console.log('Manual sync: Found notifications:', notifications.length);
    
    let syncCount = 0;
    
    // Sync each notification to patient medicines
    for (const notification of notifications) {
      console.log('Manual sync: Processing notification:', {
        medicineName: notification.medicineName,
        dosage: notification.dosage,
        notificationTimes: notification.notificationTimes
      });
      
      // Find matching medicines
      const matchingMedicines = patient.currentMedications
        .map((med, index) => ({ med, index }))
        .filter(({ med }) => med.name === notification.medicineName && med.dosage === notification.dosage);
      
      if (matchingMedicines.length > 0) {
        const timingStrings = notification.notificationTimes.map(time => time.time);
        
        // Update all matching medicines
        matchingMedicines.forEach(({ index }) => {
          patient.currentMedications[index].timing = timingStrings;
          patient.currentMedications[index].updatedAt = new Date().toISOString();
          patient.currentMedications[index].updatedBy = 'Patient';
        });
        
        syncCount += matchingMedicines.length;
        console.log('Manual sync: Updated', matchingMedicines.length, 'medicines for', notification.medicineName);
      }
    }
    
    if (syncCount > 0) {
      await patient.save();
      console.log('Manual sync: Saved patient with', syncCount, 'updated medicines');
    }
    
    res.status(200).json({
      message: 'Notification sync completed',
      syncedMedicines: syncCount,
      totalNotifications: notifications.length
    });
    
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available caretakers for patient selection
router.get('/caretakers', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const caretakers = await Caretaker.find(
      query, 
      'userId name email experience specializations hourlyRate'
    ).sort({ name: 1 });

    res.status(200).json({
      message: 'Available caretakers retrieved successfully',
      caretakers
    });
  } catch (error) {
    console.error('Get caretakers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign caretaker to patient
router.post('/assign-caretaker', verifyToken, async (req, res) => {
  try {
    const { caretakerUserId } = req.body;
    const userId = req.user.id || req.user.userId;
    
    console.log('Assign caretaker request:', { caretakerUserId, userId, userRole: req.user.role });

    // Find patient
    let patient = await Patient.findById(userId);
    if (!patient) {
      patient = await Patient.findOne({ userId: userId });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find caretaker
    const caretaker = await Caretaker.findOne({ userId: caretakerUserId });
    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    // Check if approval request already exists
    const existingApproval = patient.caretakerApprovals.find(
      approval => approval.caretakerId.toString() === caretaker._id.toString()
    );

    if (existingApproval) {
      if (existingApproval.status === 'pending') {
        return res.status(400).json({ message: 'Approval request already pending' });
      } else if (existingApproval.status === 'approved') {
        return res.status(400).json({ message: 'Caretaker already approved' });
      }
    }

    // Create approval request instead of direct assignment
    patient.caretakerApprovals.push({
      caretakerId: caretaker._id,
      caretakerUserId: caretaker.userId,
      status: 'pending',
      requestedAt: new Date()
    });

    await patient.save();

    // Add approval request to caretaker's patientApprovals
    const existingCaretakerApproval = caretaker.patientApprovals.find(
      approval => approval.patientId.toString() === patient._id.toString()
    );

    if (!existingCaretakerApproval) {
      caretaker.patientApprovals.push({
        patientId: patient._id,
        status: 'pending',
        requestedAt: new Date()
      });
      await caretaker.save();
      console.log('Approval request created:', patient.name, '->', caretaker.name);
    } else {
      console.log('Approval request already exists:', patient.name, '->', caretaker.name);
    }

    res.status(200).json({
      message: 'Approval request sent to caretaker successfully',
      status: 'pending',
      caretaker: {
        userId: caretaker.userId,
        name: caretaker.name,
        email: caretaker.email,
        experience: caretaker.experience,
        specializations: caretaker.specializations
      }
    });
  } catch (error) {
    console.error('Assign caretaker error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Direct caretaker assignment (for testing)
router.post('/direct-assign-caretaker', verifyToken, async (req, res) => {
  try {
    const { caretakerUserId } = req.body;
    const userId = req.user.id || req.user.userId;
    
    console.log('Direct assign caretaker request:', { caretakerUserId, userId, userRole: req.user.role });

    // Find patient
    let patient = await Patient.findById(userId);
    if (!patient) {
      patient = await Patient.findOne({ userId: userId });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find caretaker
    const caretaker = await Caretaker.findOne({ userId: caretakerUserId });
    if (!caretaker) {
      return res.status(404).json({ message: 'Caretaker not found' });
    }

    // Directly assign the caretaker
    patient.selectedCaretaker = {
      caretakerId: caretaker._id,
      caretakerUserId: caretaker.userId,
      caretakerName: caretaker.name,
      caretakerEmail: caretaker.email,
      assignedAt: new Date()
    };

    // Add patient to caretaker's assigned patients
    if (!caretaker.assignedPatients.includes(patient._id)) {
      caretaker.assignedPatients.push(patient._id);
      await caretaker.save();
    }

    await patient.save();

    console.log('Direct assignment successful:', patient.name, '->', caretaker.name, 'ID:', caretaker.userId);

    res.status(200).json({
      message: 'Caretaker assigned successfully',
      caretaker: {
        userId: caretaker.userId,
        name: caretaker.name,
        email: caretaker.email
      }
    });
  } catch (error) {
    console.error('Direct assign caretaker error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove caretaker assignment
router.delete('/remove-caretaker', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Find patient
    let patient = await Patient.findById(userId);
    if (!patient) {
      patient = await Patient.findOne({ userId: userId });
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!patient.selectedCaretaker) {
      return res.status(400).json({ message: 'No caretaker assigned' });
    }

    // Remove from caretaker's assigned patients
    if (patient.selectedCaretaker.caretakerId) {
      await Caretaker.findByIdAndUpdate(
        patient.selectedCaretaker.caretakerId,
        { $pull: { assignedPatients: patient._id } }
      );
    }

    // Clear patient's selected caretaker
    patient.selectedCaretaker = undefined;
    await patient.save();

    res.status(200).json({
      message: 'Caretaker removed successfully'
    });
  } catch (error) {
    console.error('Remove caretaker error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
