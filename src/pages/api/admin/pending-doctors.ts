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

    // Get pending doctors
    const pendingDoctors = await User.find(
      { role: 'doctor', isApproved: false },
      { password: 0 }
    ).sort({ createdAt: -1 });

    res.status(200).json({
      doctors: pendingDoctors.map(doctor => ({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        isApproved: doctor.isApproved,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        createdAt: doctor.createdAt
      }))
    });

  } catch (error) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
