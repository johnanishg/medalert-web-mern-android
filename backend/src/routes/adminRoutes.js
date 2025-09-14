import express from 'express';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Caretaker from '../models/Caretaker.js';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';
import Admin from '../models/Admin.js';
import Prescription from '../models/Prescription.js';
import MedicineNotification from '../models/MedicineNotification.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};


// Get all doctors
router.get('/doctors', verifyAdminToken, async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Doctors retrieved successfully',
      doctors: doctors
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending doctors
router.get('/pending-doctors', verifyAdminToken, async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ isApproved: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Pending doctors retrieved successfully',
      doctors: pendingDoctors
    });

  } catch (error) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve doctor
router.put('/approve-doctor/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { 
        isApproved: true, 
        approvedBy: req.user.userId,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor approved successfully',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        isApproved: doctor.isApproved,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospital: doctor.hospital
      }
    });

  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject doctor
router.delete('/reject-doctor/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor application rejected and removed successfully'
    });

  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create first admin user (no authentication required)
router.post('/create-first-admin', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    if (!name || !email || !password || !adminKey) {
      return res.status(400).json({ message: 'Name, email, password, and admin key are required' });
    }

    // Verify admin key
    if (adminKey !== process.env.ADMIN_ACCESS_KEY) {
      return res.status(401).json({ message: 'Invalid admin access key' });
    }

    // Check if any admin already exists
    const existingAdmins = await Admin.countDocuments();
    if (existingAdmins > 0) {
      return res.status(400).json({ message: 'Admin already exists. Use /create-admin endpoint instead.' });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
      adminLevel: 'admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'First admin user created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        userId: admin.userId
      }
    });

  } catch (error) {
    console.error('Create first admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create admin user
router.post('/create-admin', verifyAdminToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
      adminLevel: 'admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        userId: admin.userId
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get users by role
router.get('/users/:role', verifyAdminToken, async (req, res) => {
  try {
    const { role } = req.params;
    let users = [];

    switch (role) {
      case 'patients':
        users = await Patient.find({}, 'userId name email age gender phoneNumber dateOfBirth isActive createdAt lastLogin currentMedications');
        break;
      case 'doctors':
        users = await Doctor.find({}, 'userId name email isApproved isActive createdAt lastLogin licenseNumber specialization hospital');
        break;
      case 'caretakers':
        users = await Caretaker.find({}, 'userId name email isActive createdAt lastLogin experience');
        break;
      case 'managers':
        users = await Manager.find({}, 'userId name email department isActive createdAt lastLogin');
        break;
      case 'employees':
        users = await Employee.find({}, 'userId name email department position isActive createdAt lastLogin');
        break;
      case 'admins':
        users = await Admin.find({}, 'userId name email adminLevel isActive createdAt lastLogin');
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }

    res.status(200).json({
      message: `${role} retrieved successfully`,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single patient
router.get('/users/patients/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient retrieved successfully',
      patient
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update patient
router.put('/users/patients/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findByIdAndUpdate(id, updateData, { new: true });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient updated successfully',
      patient
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete patient
router.delete('/users/patients/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update doctor
router.put('/users/doctors/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, updateData, { new: true });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor updated successfully',
      doctor
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete doctor
router.delete('/users/doctors/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin profile
router.get('/profile/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin profile retrieved successfully',
      admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update admin profile
router.put('/profile/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.password;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const admin = await Admin.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin profile updated successfully',
      admin
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all medications from all patients
router.get('/medications', verifyAdminToken, async (req, res) => {
  try {
    const patients = await Patient.find({}, 'currentMedications name email');
    const allMedications = [];
    
    patients.forEach(patient => {
      if (patient.currentMedications && patient.currentMedications.length > 0) {
        patient.currentMedications.forEach(med => {
          allMedications.push({
            _id: med._id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            patientName: patient.name,
            patientEmail: patient.email,
            patientId: patient._id,
            addedAt: med.addedAt
          });
        });
      }
    });

    res.status(200).json({
      message: 'Medications retrieved successfully',
      medications: allMedications,
      count: allMedications.length
    });

  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all prescriptions
router.get('/prescriptions', verifyAdminToken, async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    const formattedPrescriptions = prescriptions.map(prescription => ({
      _id: prescription._id,
      user: prescription.patientId?.name || 'Unknown Patient',
      userEmail: prescription.patientId?.email || 'Unknown Email',
      doctor: prescription.doctorId?.name || 'Unknown Doctor',
      medications: prescription.medicines || [],
      active: prescription.isActive,
      createdAt: prescription.createdAt,
      followUpDate: prescription.followUpDate
    }));

    res.status(200).json({
      message: 'Prescriptions retrieved successfully',
      prescriptions: formattedPrescriptions,
      count: formattedPrescriptions.length
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific medication (admin only)
router.put('/medications/:medicationId', verifyAdminToken, async (req, res) => {
  try {
    const { medicationId } = req.params;
    const updateData = req.body;
    
    // Find the patient who has this medication
    const patient = await Patient.findOne({ 'currentMedications._id': medicationId });
    if (!patient) {
      return res.status(404).json({ message: 'Medication not found.' });
    }

    // Find the medication index
    const medicationIndex = patient.currentMedications.findIndex(med => med._id.toString() === medicationId);
    if (medicationIndex === -1) {
      return res.status(404).json({ message: 'Medication not found in patient record.' });
    }

    // Update the medication
    patient.currentMedications[medicationIndex] = {
      ...patient.currentMedications[medicationIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.name
    };

    await patient.save();

    res.status(200).json({
      message: 'Medication updated successfully',
      medication: patient.currentMedications[medicationIndex]
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a specific medication (admin only)
router.delete('/medications/:medicationId', verifyAdminToken, async (req, res) => {
  try {
    const { medicationId } = req.params;
    
    // Find the patient who has this medication
    const patient = await Patient.findOne({ 'currentMedications._id': medicationId });
    if (!patient) {
      return res.status(404).json({ message: 'Medication not found.' });
    }

    // Find the medication index
    const medicationIndex = patient.currentMedications.findIndex(med => med._id.toString() === medicationId);
    if (medicationIndex === -1) {
      return res.status(404).json({ message: 'Medication not found in patient record.' });
    }

    // Remove the medication
    const deletedMedication = patient.currentMedications[medicationIndex];
    patient.currentMedications.splice(medicationIndex, 1);
    await patient.save();

    res.status(200).json({
      message: 'Medication deleted successfully',
      deletedMedication: deletedMedication
    });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a specific prescription (admin only)
router.put('/prescriptions/:prescriptionId', verifyAdminToken, async (req, res) => {
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
router.delete('/prescriptions/:prescriptionId', verifyAdminToken, async (req, res) => {
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

// Get all devices (mock data for now - would be real device data in production)
router.get('/devices', verifyAdminToken, async (req, res) => {
  try {
    // In a real application, this would fetch from a Device model
    // For now, we'll return an empty array since we don't have device tracking yet
    const devices = [];

    res.status(200).json({
      message: 'Devices retrieved successfully',
      devices: devices,
      count: devices.length
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all logs (medication adherence logs)
router.get('/logs', verifyAdminToken, async (req, res) => {
  try {
    const patients = await Patient.find({}, 'name email currentMedications');
    const logs = [];
    
    patients.forEach(patient => {
      if (patient.currentMedications && patient.currentMedications.length > 0) {
        patient.currentMedications.forEach(med => {
          logs.push({
            _id: `${patient._id}_${med._id}`,
            user: patient.name,
            userEmail: patient.email,
            medication: med.name,
            status: 'Active', // This would be tracked in a real system
            time: med.addedAt || new Date()
          });
        });
      }
    });

    res.status(200).json({
      message: 'Logs retrieved successfully',
      logs: logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all notifications
router.get('/notifications', verifyAdminToken, async (req, res) => {
  try {
    const notifications = await MedicineNotification.find()
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      user: notification.patientId?.name || 'Unknown Patient',
      userEmail: notification.patientId?.email || 'Unknown Email',
      message: `Medication reminder for ${notification.medicineName}`,
      status: notification.isActive ? 'Active' : 'Inactive',
      createdAt: notification.createdAt,
      medicineName: notification.medicineName,
      customTiming: notification.customTiming
    }));

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications: formattedNotifications,
      count: formattedNotifications.length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;