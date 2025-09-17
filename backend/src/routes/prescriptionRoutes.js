import express from 'express';
import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Diagnosis from '../models/Diagnosis.js';
import { verifyToken } from '../middleware/auth.js';
import { sendGeneralNotification, validatePhoneNumber } from '../services/twilioService.js';

const router = express.Router();

// Smart Scheduler Function
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

// Create a new prescription (creates visit record)
router.post('/create', verifyToken, async (req, res) => {
  try {
    console.log('Prescription creation request received');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const {
      patientId,
      medicines,
      diagnosis,
      symptoms,
      treatment,
      notes,
      followUpDate,
      followUpRequired,
      followUpNotes,
      visitType
    } = req.body;

    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    // Validate required fields
    if (!patientId || !medicines || !diagnosis) {
      return res.status(400).json({ message: 'Patient ID, medicines, and diagnosis are required.' });
    }

    // Get patient information
    // Try to find by userId first (custom ID like PATDB3RVU), then by _id (MongoDB ObjectId)
    let patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      // If not found by userId, try by _id (in case someone passes MongoDB ObjectId)
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Get doctor information (optional - user might be admin)
    let doctor = null;
    if (req.user.role === 'doctor') {
      // Use userId instead of id since that's what's in the JWT token
      doctor = await Doctor.findById(req.user.userId);
      if (!doctor) {
        // Don't fail - user is authenticated as doctor, just not in Doctor collection
        // This can happen if the user was created directly in User collection
      }
    }

    // Create prescription
    console.log('Creating prescription...');
    const prescription = new Prescription({
      patientId,
      patientName: patient.name,
      patientPhone: patient.phoneNumber,
      doctorId: req.user.userId,
      doctorName: req.user.name,
      medicines,
      diagnosis,
      symptoms: symptoms || [],
      treatment: treatment || '',
      notes: notes || '',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      followUpRequired: followUpRequired || false,
      followUpNotes: followUpNotes || '',
      visitType: visitType || 'consultation'
    });

    console.log('Saving prescription...');
    await prescription.save();
    console.log('Prescription saved successfully:', prescription._id);

    // Update patient's current medications with new prescription medicines
    console.log('Updating patient medications...');
    if (!patient.currentMedications) {
      patient.currentMedications = [];
    }

    // Add new medicines to patient's current medications with smart scheduling
    console.log('Current medications before update:', patient.currentMedications?.length || 0);
    const prescriptionTime = new Date();
    
    medicines.forEach(medicine => {
      // Generate smart schedule if timing is not provided
      let timing = medicine.timing || [];
      let scheduleExplanation = '';
      
      if (!timing || timing.length === 0) {
        const smartSchedule = generateSmartSchedule({
          prescriptionTime,
          frequency: medicine.frequency,
          doctorRecommendations: medicine.doctorRecommendations || medicine.instructions
        });
        timing = smartSchedule.timing;
        scheduleExplanation = smartSchedule.explanation;
        console.log(`Smart schedule generated for ${medicine.name}:`, smartSchedule);
      }
      
      const newMedication = {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instructions: medicine.instructions || '',
        timing: timing,
        foodTiming: medicine.foodTiming || '',
        prescribedBy: req.user.name,
        prescribedDate: prescriptionTime.toISOString(),
        prescriptionId: prescription._id,
        scheduleExplanation: scheduleExplanation,
        smartScheduled: !medicine.timing || medicine.timing.length === 0
      };
      patient.currentMedications.push(newMedication);
      console.log('Added medicine to current medications:', newMedication.name, 'with timing:', timing);
    });
    console.log('Patient medications updated. Total medications:', patient.currentMedications.length);

    // Create a visit record for this prescription
    console.log('Creating visit record...');
    const visitRecord = {
      visitDate: new Date(),
      visitType: visitType || 'consultation',
      doctorId: req.user.userId,
      doctorName: req.user.name,
      diagnosis: diagnosis,
      notes: notes || `Prescription created with ${medicines.length} medicine(s)`,
      medicines: medicines.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || ''
      })),
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      followUpRequired: followUpRequired || false
    };

    // Add visit to patient's visit history
    if (!patient.visits) {
      patient.visits = [];
    }
    patient.visits.push(visitRecord);

    // Create a diagnosis record
    console.log('Creating diagnosis record...');
    try {
      const diagnosisRecord = new Diagnosis({
        patientId: patient._id,
        patientName: patient.name,
        doctorId: req.user.userId,
        doctorName: req.user.name,
        diagnosis: diagnosis,
        symptoms: symptoms || [],
        treatment: treatment || notes || '',
        medications: medicines.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || ''
        })),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || '',
        diagnosisDate: new Date()
      });

      await diagnosisRecord.save();
      console.log('✅ Diagnosis record saved successfully:', diagnosisRecord._id);
    } catch (diagnosisError) {
      console.error('❌ Error creating diagnosis record:', diagnosisError);
      console.error('Diagnosis error details:', diagnosisError.message);
      // Don't fail the entire request if diagnosis creation fails
    }

    console.log('Saving patient with visit record...');
    await patient.save();
    console.log('Patient saved successfully');

    // Send SMS notification to patient about prescription (non-blocking)
    if (patient.phoneNumber && validatePhoneNumber(patient.phoneNumber)) {
      // Don't await this - let it run in background
      sendGeneralNotification(
        patient.phoneNumber,
        patient.name,
        `New prescription from Dr. ${req.user.name}. Diagnosis: ${diagnosis}. Follow-up: ${followUpDate || 'Not scheduled'}`
      ).then(result => {
        if (result.success) {
          console.log(`Prescription notification sent to ${patient.name}`);
        }
      }).catch(smsError => {
        console.error('Error sending prescription notification:', smsError);
      });
    }

    console.log('Sending success response...');
    const responseData = {
      message: 'Prescription created successfully and patient notified',
      prescription,
      visit: prescription.visitSummary
    };
    console.log('Response data:', responseData);
    res.status(201).json(responseData);
    console.log('Response sent successfully');

  } catch (error) {
    console.error('Create prescription error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get prescriptions for a patient
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify access (patient can see their own, doctor can see their patients)
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({ patientId })
      .sort({ visitDate: -1 })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name userId');

    res.status(200).json({
      message: 'Prescriptions retrieved successfully',
      prescriptions
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search patient and get prescriptions by doctor for that patient
router.get('/patient/:patientId/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;
    
    console.log('Searching prescriptions for patient:', patientId, 'by doctor:', doctorId);
    
    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    // Check if the doctor is requesting their own prescriptions (unless admin)
    if (req.user.role === 'doctor' && doctorId !== req.user.userId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own prescriptions.' 
      });
    }

    // First, verify the patient exists
    // Try to find by userId first (custom ID like PATDB3RVU), then by _id (MongoDB ObjectId)
    let patient = await Patient.findOne({ userId: patientId });
    if (!patient) {
      // If not found by userId, try by _id (in case someone passes MongoDB ObjectId)
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Get prescriptions for this patient by this doctor
    // Use the patient's MongoDB _id for prescription search
    const prescriptions = await Prescription.find({ 
      patientId: patient._id,  // Use MongoDB ObjectId, not custom userId
      doctorId: doctorId 
    })
      .populate('patientId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    console.log('Found prescriptions:', prescriptions.length);

    res.status(200).json({
      message: 'Patient prescriptions retrieved successfully',
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber
      },
      prescriptions
    });

  } catch (error) {
    console.error('Get patient prescriptions by doctor error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get prescriptions by doctor
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify access
    if (req.user.role === 'doctor' && req.user.userId !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({ doctorId })
      .sort({ visitDate: -1 })
      .populate('patientId', 'name userId phoneNumber')
      .populate('doctorId', 'name specialization');

    res.status(200).json({
      message: 'Prescriptions retrieved successfully',
      prescriptions
    });

  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single prescription
router.get('/:prescriptionId', verifyToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('patientId', 'name userId phoneNumber')
      .populate('doctorId', 'name specialization');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify access
    if (req.user.role === 'patient' && prescription.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      message: 'Prescription retrieved successfully',
      prescription
    });

  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update prescription status
router.put('/:prescriptionId/status', verifyToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Verify access (doctor or admin only)
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    prescription.status = status;
    await prescription.save();

    res.status(200).json({
      message: 'Prescription status updated successfully',
      prescription
    });

  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming follow-ups
router.get('/follow-ups/upcoming', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    const query = {
      followUpRequired: true,
      followUpDate: { $gte: today },
      status: 'active'
    };

    // Filter by doctor if user is a doctor
    if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    }

    const upcomingFollowUps = await Prescription.find(query)
      .sort({ followUpDate: 1 })
      .populate('patientId', 'name userId phoneNumber')
      .populate('doctorId', 'name specialization');

    res.status(200).json({
      message: 'Upcoming follow-ups retrieved successfully',
      followUps: upcomingFollowUps
    });

  } catch (error) {
    console.error('Get upcoming follow-ups error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a prescription (only by the prescribing doctor)
router.put('/update/:prescriptionId', verifyToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const updateData = req.body;
    
    console.log('Prescription update request received');
    console.log('Prescription ID:', prescriptionId);
    console.log('User:', req.user);
    console.log('Update data:', updateData);
    
    // Verify the user is a doctor or admin
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Doctor or Admin privileges required.' });
    }

    // Find the prescription
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Check if the current user is the prescribing doctor (unless admin)
    if (req.user.role === 'doctor' && prescription.doctorId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only edit prescriptions that you have created.' 
      });
    }

    // Store original prescription for history
    const originalPrescription = {
      medicines: prescription.medicines,
      diagnosis: prescription.diagnosis,
      symptoms: prescription.symptoms,
      treatment: prescription.treatment,
      notes: prescription.notes,
      followUpDate: prescription.followUpDate,
      followUpRequired: prescription.followUpRequired,
      followUpNotes: prescription.followUpNotes,
      visitType: prescription.visitType,
      updatedAt: new Date()
    };

    // Update prescription fields
    const updatedPrescription = {
      ...prescription.toObject(),
      ...updateData,
      lastEditedBy: req.user.name,
      lastEditedAt: new Date(),
      editHistory: prescription.editHistory ? [...prescription.editHistory, originalPrescription] : [originalPrescription]
    };

    // Update the prescription
    await Prescription.findByIdAndUpdate(prescriptionId, updatedPrescription);

    // If medicines were updated, also update patient's current medications
    if (updateData.medicines) {
      const patient = await Patient.findById(prescription.patientId);
      if (patient) {
        // Remove old medicines from this prescription
        patient.currentMedications = patient.currentMedications.filter(
          med => med.prescriptionId?.toString() !== prescriptionId
        );

        // Add updated medicines
        const prescriptionTime = new Date();
        updateData.medicines.forEach(medicine => {
          // Generate smart schedule if timing is not provided
          let timing = medicine.timing || [];
          let scheduleExplanation = '';
          
          if (!timing || timing.length === 0) {
            const smartSchedule = generateSmartSchedule({
              prescriptionTime,
              frequency: medicine.frequency,
              doctorRecommendations: medicine.doctorRecommendations || medicine.instructions
            });
            timing = smartSchedule.timing;
            scheduleExplanation = smartSchedule.explanation;
            console.log(`Smart schedule generated for ${medicine.name}:`, smartSchedule);
          }
          
          const newMedication = {
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            instructions: medicine.instructions || '',
            timing: timing,
            foodTiming: medicine.foodTiming || '',
            prescribedBy: req.user.name,
            prescribedDate: prescriptionTime.toISOString(),
            prescriptionId: prescriptionId,
            scheduleExplanation: scheduleExplanation,
            smartScheduled: !medicine.timing || medicine.timing.length === 0,
            lastEditedBy: req.user.name,
            lastEditedAt: new Date()
          };
          patient.currentMedications.push(newMedication);
        });

        // Update visit record
        const visitIndex = patient.visits.findIndex(visit => 
          visit.doctorId === prescription.doctorId && 
          visit.visitDate && 
          new Date(visit.visitDate).toDateString() === new Date(prescription.visitDate).toDateString()
        );

        if (visitIndex !== -1) {
          patient.visits[visitIndex] = {
            ...patient.visits[visitIndex],
            diagnosis: updateData.diagnosis || patient.visits[visitIndex].diagnosis,
            notes: updateData.notes || patient.visits[visitIndex].notes,
            medicines: updateData.medicines || patient.visits[visitIndex].medicines,
            lastEditedBy: req.user.name,
            lastEditedAt: new Date()
          };
        }

        await patient.save();
        console.log('Patient medications and visit record updated');
      }
    }

    // Get the updated prescription
    const finalPrescription = await Prescription.findById(prescriptionId);

    console.log('Prescription updated successfully');

    res.status(200).json({
      message: 'Prescription updated successfully',
      prescription: finalPrescription
    });

  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

export default router;
