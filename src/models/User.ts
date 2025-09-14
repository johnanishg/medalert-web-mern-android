import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient' | 'caretaker';
  isApproved: boolean;
  // Doctor-specific fields
  licenseNumber?: string;
  specialization?: string;
  hospital?: string;
  // Patient-specific fields
  dateOfBirth?: Date;
  phoneNumber?: string;
  // Caretaker-specific fields
  experience?: string;
  certifications?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient', 'caretaker'],
    required: true
  },
  isApproved: { type: Boolean, default: false }, // Only relevant for doctors
  // Doctor-specific fields
  licenseNumber: { type: String },
  specialization: { type: String },
  hospital: { type: String },
  // Patient-specific fields
  dateOfBirth: { type: Date },
  phoneNumber: { type: String },
  // Caretaker-specific fields
  experience: { type: String },
  certifications: { type: String }
}, { 
  timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
