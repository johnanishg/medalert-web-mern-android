import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Generate unique alphanumeric ID for admins
const generateUniqueId = () => {
  const prefix = 'ADM';
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
};

const adminSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  
  // Admin-specific fields
  adminLevel: { type: String, enum: ['super', 'admin', 'moderator'], default: 'admin' },
  permissions: [String], // e.g., 'manage_users', 'view_analytics', 'system_settings'
  
  // Management scope
  managedManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }],
  managedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  
  // System fields
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate unique ID and hash password
adminSchema.pre('save', async function(next) {
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
adminSchema.post('save', function(doc) {
  if (!doc.userId) {
    doc.userId = generateUniqueId();
    doc.save().catch(err => console.error('Error setting userId:', err));
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Admin', adminSchema);
