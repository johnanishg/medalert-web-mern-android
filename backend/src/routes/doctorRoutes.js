import express from 'express';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';
import { sendMedicationReminder, validatePhoneNumber } from '../services/twilioService.js';
import { scheduleMedicationReminder } from '../services/medicationScheduler.js';

const router = express.Router();

// Smart Scheduler Function (same as in prescriptionRoutes.js)
function generateSmartSchedule(config) {
  const { prescriptionTime, frequency, doctorRecommendations } = config;
  const currentHour = prescriptionTime.getHours();
  const currentMinute = prescriptionTime.getMinutes();
  
  // Parse frequency to determine how many times per day
  const timesPerDay = parseFrequency(frequency);
  
  // Determine the next appropriate time based on current time
  const nextTime = getNextAppropriateTime(currentHour, currentMinute, timesPerDay, doctorRecommendations);
  
  // Generate timing array based on frequency and next time
  const timing = generateTimingArray(timesPerDay, nextTime);
  
  // Calculate start date (today if it's early enough, tomorrow if too late)
  const startDate = calculateStartDate(prescriptionTime, nextTime);
  
  // Calculate next dose time
  const nextDoseTime = calculateNextDoseTime(startDate, timing[0]);
  
  // Generate explanation
  const explanation = generateExplanation(prescriptionTime, timing, startDate, doctorRecommendations);
  
  return {
    timing,
    startDate,
    nextDoseTime,
    explanation
  };
}

function parseFrequency(frequency) {
  const freq = frequency.toLowerCase();
  
  if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily')) {
    return 1;
  } else if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
    return 2;
  } else if (freq.includes('thrice') || freq.includes('3 times') || freq.includes('tid')) {
    return 3;
  } else if (freq.includes('4 times') || freq.includes('qid')) {
    return 4;
  } else if (freq.includes('every 6 hours') || freq.includes('6 hourly')) {
    return 4; // 4 times per day
  } else if (freq.includes('every 8 hours') || freq.includes('8 hourly')) {
    return 3; // 3 times per day
  } else if (freq.includes('every 12 hours') || freq.includes('12 hourly')) {
    return 2; // 2 times per day
  } else if (freq.includes('every 24 hours') || freq.includes('24 hourly')) {
    return 1; // 1 time per day
  }
  
  // Try to extract number from frequency
  const match = freq.match(/(\d+)\s*times?/);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Default to once daily
  return 1;
}

function getNextAppropriateTime(currentHour, currentMinute, timesPerDay, doctorRecommendations) {
  const currentTime = currentHour * 60 + currentMinute;
  
  // Define time slots
  const timeSlots = [
    { hour: 8, minute: 0, label: 'Morning', start: 6 * 60, end: 11 * 60 }, // 6:00 AM - 11:00 AM
    { hour: 14, minute: 0, label: 'Afternoon', start: 11 * 60, end: 17 * 60 }, // 11:00 AM - 5:00 PM
    { hour: 20, minute: 0, label: 'Evening', start: 17 * 60, end: 22 * 60 }, // 5:00 PM - 10:00 PM
    { hour: 22, minute: 0, label: 'Night', start: 22 * 60, end: 24 * 60 } // 10:00 PM - 12:00 AM
  ];
  
  // Check doctor recommendations first
  if (doctorRecommendations) {
    const rec = doctorRecommendations.toLowerCase();
    if (rec.includes('morning')) {
      return { hour: 8, minute: 0, label: 'Morning' };
    } else if (rec.includes('afternoon')) {
      return { hour: 14, minute: 0, label: 'Afternoon' };
    } else if (rec.includes('evening')) {
      return { hour: 20, minute: 0, label: 'Evening' };
    } else if (rec.includes('night')) {
      return { hour: 22, minute: 0, label: 'Night' };
    }
  }
  
  // Determine next appropriate time based on current time and frequency
  if (timesPerDay === 1) {
    // Once daily - find the next appropriate time slot
    for (const slot of timeSlots) {
      if (currentTime < slot.end) {
        return slot;
      }
    }
    // If it's very late, start tomorrow morning
    return timeSlots[0];
  } else if (timesPerDay === 2) {
    // Twice daily - morning and evening
    if (currentTime < 12 * 60) { // Before noon
      return { hour: 8, minute: 0, label: 'Morning' };
    } else {
      return { hour: 20, minute: 0, label: 'Evening' };
    }
  } else if (timesPerDay === 3) {
    // Three times daily - morning, afternoon, evening
    if (currentTime < 10 * 60) { // Before 10 AM
      return { hour: 8, minute: 0, label: 'Morning' };
    } else if (currentTime < 16 * 60) { // Before 16 PM
      return { hour: 14, minute: 0, label: 'Afternoon' };
    } else {
      return { hour: 20, minute: 0, label: 'Evening' };
    }
  } else if (timesPerDay === 4) {
    // Four times daily - every 6 hours
    if (currentTime < 6 * 60) { // Before 6 AM
      return { hour: 6, minute: 0, label: 'Early Morning' };
    } else if (currentTime < 12 * 60) { // Before noon
      return { hour: 12, minute: 0, label: 'Noon' };
    } else if (currentTime < 18 * 60) { // Before 6 PM
      return { hour: 18, minute: 0, label: 'Evening' };
    } else {
      return { hour: 0, minute: 0, label: 'Midnight' };
    }
  }
  
  // Default fallback
  return { hour: 8, minute: 0, label: 'Morning' };
}

function generateTimingArray(timesPerDay, nextTime) {
  const timing = [];
  
  if (timesPerDay === 1) {
    timing.push(`${nextTime.hour.toString().padStart(2, '0')}:${nextTime.minute.toString().padStart(2, '0')}`);
  } else if (timesPerDay === 2) {
    // Morning and evening
    timing.push('08:00', '20:00');
  } else if (timesPerDay === 3) {
    // Morning, afternoon, evening
    timing.push('08:00', '14:00', '20:00');
  } else if (timesPerDay === 4) {
    // Every 6 hours
    timing.push('06:00', '12:00', '18:00', '00:00');
  } else {
    // Custom frequency - distribute evenly
    const interval = 24 / timesPerDay;
    for (let i = 0; i < timesPerDay; i++) {
      const hour = Math.floor(i * interval);
      timing.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }
  
  return timing;
}

function calculateStartDate(prescriptionTime, nextTime) {
  const currentHour = prescriptionTime.getHours();
  const currentMinute = prescriptionTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const nextTimeMinutes = nextTime.hour * 60 + nextTime.minute;
  
  // If the next dose time is today and there's enough time (at least 30 minutes)
  if (nextTimeMinutes > currentTime + 30) {
    return new Date(prescriptionTime);
  } else {
    // Start tomorrow
    const tomorrow = new Date(prescriptionTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}

function calculateNextDoseTime(startDate, firstTime) {
  const [hours, minutes] = firstTime.split(':').map(Number);
  const nextDoseTime = new Date(startDate);
  nextDoseTime.setHours(hours, minutes, 0, 0);
  return nextDoseTime;
}

function generateExplanation(prescriptionTime, timing, startDate, doctorRecommendations) {
  const prescriptionTimeStr = prescriptionTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const startDateStr = startDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const timingStr = timing.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }).join(', ');
  
  let explanation = `Prescribed at ${prescriptionTimeStr}. `;
  
  if (doctorRecommendations) {
    explanation += `Based on doctor's recommendation (${doctorRecommendations}), `;
  }
  
  explanation += `medication schedule will start ${startDateStr} at ${timingStr}. `;
  
  if (timing.length === 1) {
    explanation += 'This is a once-daily medication.';
  } else {
    explanation += `This medication should be taken ${timing.length} times per day.`;
  }
  
  return explanation;
}

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
      visits: patient.visits || [], // Include visit history for medicine tracking
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

    // Generate smart schedule if timing is not provided
    let timing = req.body.timing || [];
    let scheduleExplanation = '';
    const prescriptionTime = new Date();
    
    if (!timing || timing.length === 0) {
      const smartSchedule = generateSmartSchedule({
        prescriptionTime,
        frequency,
        doctorRecommendations: instructions
      });
      timing = smartSchedule.timing;
      scheduleExplanation = smartSchedule.explanation;
      console.log(`Smart schedule generated for ${name}:`, smartSchedule);
    }
    
    // Create new medication object with enhanced fields
    const newMedication = {
      name,
      dosage,
      frequency,
      duration: duration || 'As prescribed',
      instructions: instructions || '',
      prescribedBy: req.user.name,
      prescribedDate: prescriptionTime.toISOString(),
      // Enhanced fields
      timing: timing,
      foodTiming: req.body.foodTiming || '',
      durationType: req.body.durationType || 'dateRange',
      startDate: req.body.startDate || '',
      endDate: req.body.endDate || '',
      totalTablets: req.body.totalTablets || '',
      tabletsPerDay: req.body.tabletsPerDay || '',
      scheduleExplanation: scheduleExplanation,
      smartScheduled: !req.body.timing || req.body.timing.length === 0
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
      doctorId: req.user.userId,
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
