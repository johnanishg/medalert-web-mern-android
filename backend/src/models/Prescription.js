import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  // Patient information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  
  // Doctor information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  
  // Prescription details
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      default: ''
    },
    timing: [{
      type: String,
      enum: ['morning', 'afternoon', 'night']
    }],
    foodTiming: {
      type: String,
      enum: ['Before', 'After', 'With', ''],
      default: ''
    }
  }],
  
  // Medical information
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String
  }],
  treatment: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Follow-up information
  followUpDate: {
    type: Date
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpNotes: {
    type: String,
    default: ''
  },
  
  // Visit information
  visitDate: {
    type: Date,
    default: Date.now
  },
  visitType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine'],
    default: 'consultation'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Notification tracking
  followUpNotificationSent: {
    type: Boolean,
    default: false
  },
  followUpNotificationDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
prescriptionSchema.index({ patientId: 1, visitDate: -1 });
prescriptionSchema.index({ doctorId: 1, visitDate: -1 });
prescriptionSchema.index({ followUpDate: 1, followUpRequired: 1 });

// Virtual for visit summary
prescriptionSchema.virtual('visitSummary').get(function() {
  return {
    date: this.visitDate,
    doctor: this.doctorName,
    diagnosis: this.diagnosis,
    medicinesCount: this.medicines.length,
    followUpRequired: this.followUpRequired,
    followUpDate: this.followUpDate
  };
});

// Ensure virtual fields are serialized
prescriptionSchema.set('toJSON', { virtuals: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
