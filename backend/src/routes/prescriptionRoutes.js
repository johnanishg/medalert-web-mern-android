import express from 'express';
import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { verifyToken } from '../middleware/auth.js';
import { sendGeneralNotification, validatePhoneNumber } from '../services/twilioService.js';

const router = express.Router();

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
    const patient = await Patient.findById(patientId);
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

    // Add new medicines to patient's current medications
    medicines.forEach(medicine => {
      const newMedication = {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instructions: medicine.instructions || '',
        timing: medicine.timing || [],
        foodTiming: medicine.foodTiming || '',
        prescribedBy: req.user.name,
        prescribedDate: new Date().toISOString(),
        prescriptionId: prescription._id
      };
      patient.currentMedications.push(newMedication);
    });
    console.log('Patient medications updated');

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

// Get prescriptions by doctor
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify access
    if (req.user.role === 'doctor' && req.user.id !== doctorId) {
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

export default router;
