import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongoose';
import { User } from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      confirmPassword, 
      role,
      // Doctor-specific fields
      licenseNumber,
      specialization,
      hospital,
      // Patient-specific fields
      dateOfBirth,
      phoneNumber,
      // Caretaker-specific fields
      experience,
      certifications
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user data based on role
    const userData: any = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      role,
      isApproved: role === 'admin' || role === 'patient' || role === 'caretaker' // Auto-approve non-doctors
    };

    // Add role-specific fields
    if (role === 'doctor') {
      if (!licenseNumber || !specialization || !hospital) {
        return res.status(400).json({ message: 'Doctor-specific fields are required' });
      }
      userData.licenseNumber = licenseNumber;
      userData.specialization = specialization;
      userData.hospital = hospital;
    } else if (role === 'patient') {
      if (dateOfBirth || phoneNumber) {
        userData.dateOfBirth = dateOfBirth;
        userData.phoneNumber = phoneNumber;
      }
    } else if (role === 'caretaker') {
      if (!experience || !certifications) {
        return res.status(400).json({ message: 'Caretaker-specific fields are required' });
      }
      userData.experience = experience;
      userData.certifications = certifications;
    }

    // Create user
    const user = new User(userData);
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

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
