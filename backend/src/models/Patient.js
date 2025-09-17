import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Generate unique alphanumeric ID for patients
const generateUniqueId = () => {
  const prefix = 'PAT';
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
};

const patientSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'patient' },
  
  // Patient-specific fields
  dateOfBirth: { type: Date, required: true },
  age: { type: Number, required: false },
  gender: { type: String, required: false, enum: ['male', 'female', 'other'] },
  phoneNumber: { type: String, required: true },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalHistory: [{
    condition: String,
    diagnosisDate: Date,
    status: String
  }],
  allergies: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    timing: [String], // ['morning', 'afternoon', 'night']
    foodTiming: String, // 'Before', 'After', 'With'
    prescribedBy: String,
    prescribedDate: String,
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    scheduleExplanation: String, // Explanation of how the schedule was generated
    smartScheduled: { type: Boolean, default: false }, // Whether schedule was auto-generated
    adherence: [{
      timestamp: { type: Date, default: Date.now },
      taken: { type: Boolean, required: true },
      notes: String,
      recordedBy: String
    }],
    lastEditedBy: String,
    lastEditedAt: Date
  }],
  
  // Visit history
  visits: [{
    visitDate: { type: Date, default: Date.now },
    visitType: { type: String, enum: ['medicine_prescription', 'consultation', 'follow_up', 'emergency'], default: 'medicine_prescription' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    doctorName: String,
    diagnosis: String,
    notes: String,
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    followUpDate: Date,
    followUpRequired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Caretaker assignments
  selectedCaretaker: {
    caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caretaker' },
    caretakerUserId: { type: String }, // For easy lookup
    caretakerName: { type: String }, // Caretaker's name for display
    caretakerEmail: { type: String }, // Caretaker's email for display
    assignedAt: { type: Date, default: Date.now }
  },
  
  // Caretaker approvals
  caretakerApprovals: [{
    caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caretaker' },
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

// Pre-save hook to generate unique ID, hash password, and calculate age
patientSchema.pre('save', async function(next) {
  try {
    // Always generate unique ID if not already set
    if (!this.userId) {
      this.userId = generateUniqueId();
    }
    
    // Hash password if modified
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    
    // Calculate age from date of birth if not already set or if date of birth changed
    if (this.dateOfBirth && (!this.age || this.isModified('dateOfBirth'))) {
      const today = new Date();
      const birthDate = new Date(this.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      this.age = age;
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save hook to ensure userId is set
patientSchema.post('save', function(doc) {
  if (!doc.userId) {
    doc.userId = generateUniqueId();
    doc.save().catch(err => console.error('Error setting userId:', err));
  }
});

// Method to compare password
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Patient', patientSchema);
