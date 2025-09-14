import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Caretaker from '../models/Caretaker.js';
import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_ACCESS_KEY = 'medalert2025';

// Helper function to get the appropriate model based on role
const getModelByRole = (role) => {
  switch (role) {
    case 'patient':
      return Patient;
    case 'doctor':
      return Doctor;
    case 'caretaker':
      return Caretaker;
    case 'manager':
      return Manager;
    case 'employee':
      return Employee;
    case 'admin':
      return Admin;
    default:
      throw new Error('Invalid role');
  }
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Get the appropriate model
    const Model = getModelByRole(role);
    
    // Find user by email
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved (for doctors)
    if (role === 'doctor' && !user.isApproved) {
      return res.status(401).json({ message: 'Account pending approval' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user response based on role
    let userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      userId: user.userId,
      isApproved: user.isApproved || true // Default to true for non-doctors
    };

    // Add role-specific fields
    if (role === 'caretaker') {
      userResponse = {
        ...userResponse,
        experience: user.experience,
        hourlyRate: user.hourlyRate,
        certifications: user.certifications,
        specializations: user.specializations,
        availability: user.availability
      };
    } else if (role === 'doctor') {
      userResponse = {
        ...userResponse,
        licenseNumber: user.licenseNumber,
        specialization: user.specialization,
        hospital: user.hospital,
        experience: user.experience,
        consultationFee: user.consultationFee,
        qualifications: user.qualifications
      };
    } else if (role === 'patient') {
      userResponse = {
        ...userResponse,
        dateOfBirth: user.dateOfBirth,
        age: user.age,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        medicalHistory: user.medicalHistory,
        allergies: user.allergies,
        selectedCaretaker: user.selectedCaretaker
      };
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, ...roleSpecificData } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Get the appropriate model
    const Model = getModelByRole(role);

    // Check if user already exists
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user data
    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      ...roleSpecificData
    };

    // Calculate age from date of birth for patients
    if (role === 'patient' && roleSpecificData.dateOfBirth && !roleSpecificData.age) {
      const today = new Date();
      const birthDate = new Date(roleSpecificData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      userData.age = age;
    }

    // Create new user
    const user = new Model(userData);
    await user.save();

    // Handle caretaker assignment for patients
    if (role === 'patient' && roleSpecificData.selectedCaretakerId) {
      try {
        const caretaker = await Caretaker.findOne({ userId: roleSpecificData.selectedCaretakerId });
        if (caretaker) {
          // Update patient's selected caretaker
          user.selectedCaretaker = {
            caretakerId: caretaker._id,
            caretakerUserId: caretaker.userId,
            assignedAt: new Date()
          };

          // Add patient to caretaker's assigned patients
          if (!caretaker.assignedPatients.includes(user._id)) {
            caretaker.assignedPatients.push(user._id);
            await caretaker.save();
          }

          await user.save();
        }
      } catch (error) {
        console.error('Error assigning caretaker during registration:', error);
        // Don't fail registration if caretaker assignment fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Different messages based on role
    let message = 'Registration successful';
    if (role === 'doctor') {
      message = 'Details sent to team MedAlert. You will receive a mail once approved.';
    }

    res.status(201).json({
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userId: user.userId,
        isApproved: user.isApproved || true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin login endpoint
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;

    if (!email || !password || !adminKey) {
      return res.status(400).json({ message: 'Email, password, and admin key are required' });
    }

    if (adminKey !== ADMIN_ACCESS_KEY) {
      return res.status(401).json({ message: 'Invalid admin access key' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin._id, 
        email: admin.email, 
        role: admin.role,
        name: admin.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        userId: admin.userId
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;