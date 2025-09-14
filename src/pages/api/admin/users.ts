import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongoose';
import { User } from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await connectDB();

    // Get all users
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        // Include role-specific fields
        ...(user.role === 'doctor' && {
          licenseNumber: user.licenseNumber,
          specialization: user.specialization,
          hospital: user.hospital
        }),
        ...(user.role === 'patient' && {
          dateOfBirth: user.dateOfBirth,
          phoneNumber: user.phoneNumber
        }),
        ...(user.role === 'caretaker' && {
          experience: user.experience,
          certifications: user.certifications
        })
      }))
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
