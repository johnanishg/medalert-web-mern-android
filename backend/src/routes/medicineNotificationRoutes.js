import express from 'express';
import MedicineNotification from '../models/MedicineNotification.js';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';
import { sendMedicationReminder, validatePhoneNumber } from '../services/twilioService.js';

const router = express.Router();

// Get all medicine notifications for a patient
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify access (patient can see their own, doctor can see their patients)
    const currentUserId = req.user.id || req.user.userId;
    if (req.user.role === 'patient' && currentUserId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notifications = await MedicineNotification.find({ 
      patientId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Medicine notifications retrieved successfully',
      notifications
    });

  } catch (error) {
    console.error('Get medicine notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update medicine notification timings
router.post('/set-timings', verifyToken, async (req, res) => {
  try {
    const {
      medicineName,
      dosage,
      instructions,
      foodTiming,
      notificationTimes,
      frequency,
      duration,
      prescriptionId
    } = req.body;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
    }

    // Validate required fields
    if (!medicineName || !dosage || !notificationTimes || notificationTimes.length === 0) {
      return res.status(400).json({ message: 'Medicine name, dosage, and notification times are required.' });
    }

    // Validate notification times format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const time of notificationTimes) {
      if (!timeRegex.test(time.time)) {
        return res.status(400).json({ message: `Invalid time format: ${time.time}. Use HH:MM format.` });
      }
    }

    // Get patient information
    const patientId = req.user.id || req.user.userId;
    
    // Try to find patient by MongoDB _id first, then by userId field
    let patient = await Patient.findById(patientId);
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Check if notification already exists for this medicine
    let medicineNotification = await MedicineNotification.findOne({
      patientId: patient._id, // Use MongoDB _id
      medicineName,
      dosage,
      isActive: true
    });

    if (medicineNotification) {
      // Update existing notification
      medicineNotification.notificationTimes = notificationTimes;
      medicineNotification.instructions = instructions || '';
      medicineNotification.foodTiming = foodTiming || '';
      medicineNotification.frequency = frequency || 'As prescribed';
      medicineNotification.duration = duration || 'As prescribed';
    } else {
      // Create new notification
      medicineNotification = new MedicineNotification({
        patientId: patient._id, // Use MongoDB _id
        patientName: patient.name,
        patientPhone: patient.phoneNumber,
        medicineName,
        dosage,
        instructions: instructions || '',
        foodTiming: foodTiming || '',
        notificationTimes,
        frequency: frequency || 'As prescribed',
        duration: duration || 'As prescribed',
        prescriptionId: prescriptionId || null
      });
    }

    await medicineNotification.save();

    res.status(201).json({
      message: 'Medicine notification timings set successfully',
      notification: medicineNotification
    });

  } catch (error) {
    console.error('Set medicine notification timings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update notification timing for a specific medicine
router.put('/:notificationId/timings', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { notificationTimes } = req.body;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
    }

    // Validate notification times format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const time of notificationTimes) {
      if (!timeRegex.test(time.time)) {
        return res.status(400).json({ message: `Invalid time format: ${time.time}. Use HH:MM format.` });
      }
    }

    const currentUserId = req.user.id || req.user.userId;
    const notification = await MedicineNotification.findOne({
      _id: notificationId,
      patientId: currentUserId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Medicine notification not found.' });
    }

    notification.notificationTimes = notificationTimes;
    await notification.save();

    res.status(200).json({
      message: 'Notification timings updated successfully',
      notification
    });

  } catch (error) {
    console.error('Update notification timings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle notification active status
router.put('/:notificationId/toggle', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { isActive } = req.body;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
    }

    const currentUserId = req.user.id || req.user.userId;
    const notification = await MedicineNotification.findOne({
      _id: notificationId,
      patientId: currentUserId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Medicine notification not found.' });
    }

    notification.isActive = isActive;
    await notification.save();

    res.status(200).json({
      message: `Notification ${isActive ? 'activated' : 'deactivated'} successfully`,
      notification
    });

  } catch (error) {
    console.error('Toggle notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete medicine notification
router.delete('/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify the user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
    }

    // Get patient information
    const patientId = req.user.id || req.user.userId;
    
    // Try to find patient by MongoDB _id first, then by userId field
    let patient = await Patient.findById(patientId);
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const notification = await MedicineNotification.findOne({
      _id: notificationId,
      patientId: patient._id // Use MongoDB _id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Medicine notification not found.' });
    }

    // Get medicine details before deletion for patient medication removal
    const medicineName = notification.medicineName;
    const medicineDosage = notification.dosage;

    // Actually delete the notification from database
    await MedicineNotification.findByIdAndDelete(notificationId);

    // Also remove the medicine from patient's currentMedications if it exists
    if (patient.currentMedications && patient.currentMedications.length > 0) {
      patient.currentMedications = patient.currentMedications.filter(med => 
        !(med.name === medicineName && med.dosage === medicineDosage)
      );
      await patient.save();
      console.log(`✅ Removed medicine ${medicineName} (${medicineDosage}) from patient's currentMedications`);
    }

    res.status(200).json({
      message: 'Medicine notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming notifications for a patient
router.get('/patient/:patientId/upcoming', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify access
    const currentUserId = req.user.id || req.user.userId;
    if (req.user.role === 'patient' && currentUserId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifications = await MedicineNotification.find({
      patientId,
      isActive: true
    });

    // Calculate upcoming notifications
    const upcomingNotifications = [];
    
    for (const notification of notifications) {
      for (const timeSlot of notification.notificationTimes) {
        if (!timeSlot.isActive) continue;
        
        const [hours, minutes] = timeSlot.time.split(':').map(Number);
        
        // Check today
        const todayNotification = new Date(now);
        todayNotification.setHours(hours, minutes, 0, 0);
        
        if (todayNotification > now) {
          upcomingNotifications.push({
            notificationId: notification._id,
            medicineName: notification.medicineName,
            dosage: notification.dosage,
            time: timeSlot.time,
            label: timeSlot.label,
            scheduledTime: todayNotification,
            instructions: notification.instructions,
            foodTiming: notification.foodTiming
          });
        }
        
        // Check tomorrow
        const tomorrowNotification = new Date(tomorrow);
        tomorrowNotification.setHours(hours, minutes, 0, 0);
        
        upcomingNotifications.push({
          notificationId: notification._id,
          medicineName: notification.medicineName,
          dosage: notification.dosage,
          time: timeSlot.time,
          label: timeSlot.label,
          scheduledTime: tomorrowNotification,
          instructions: notification.instructions,
          foodTiming: notification.foodTiming
        });
      }
    }

    // Sort by scheduled time
    upcomingNotifications.sort((a, b) => a.scheduledTime - b.scheduledTime);

    res.status(200).json({
      message: 'Upcoming notifications retrieved successfully',
      upcomingNotifications: upcomingNotifications.slice(0, 10) // Limit to next 10
    });

  } catch (error) {
    console.error('Get upcoming notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
