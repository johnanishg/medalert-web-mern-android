import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Generate unique alphanumeric ID for caretakers
const generateUniqueId = () => {
  const prefix = 'CAR';
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
};

const caretakerSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'caretaker' },
  
  // Caretaker-specific fields
  experience: { type: Number, required: true }, // years of experience
  certifications: [String],
  specializations: [String], // e.g., elderly care, disability care, etc.
  
  // Professional details
  hourlyRate: { type: Number, default: 0 },
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  
  // Patient assignments and approvals
  assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  patientApprovals: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    rejectedAt: Date
  }],
  
  // System fields
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate unique ID and hash password
caretakerSchema.pre('save', async function(next) {
  try {
    // Always generate unique ID if not already set
    if (!this.userId) {
      this.userId = generateUniqueId();
    }
    
    // Hash password if modified
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save hook to ensure userId is set
caretakerSchema.post('save', function(doc) {
  if (!doc.userId) {
    doc.userId = generateUniqueId();
    doc.save().catch(err => console.error('Error setting userId:', err));
  }
});

// Method to compare password
caretakerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Caretaker', caretakerSchema);
