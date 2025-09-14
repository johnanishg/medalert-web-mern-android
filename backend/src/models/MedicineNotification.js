import mongoose from 'mongoose';

const medicineNotificationSchema = new mongoose.Schema({
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
  
  // Medicine information
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  foodTiming: {
    type: String,
    enum: ['Before', 'After', 'With', ''],
    default: ''
  },
  
  // Notification timings (patient-set)
  notificationTimes: [{
    time: {
      type: String, // Format: "HH:MM" (24-hour format)
      required: true
    },
    label: {
      type: String, // e.g., "Morning", "Afternoon", "Night", "Custom"
      default: 'Custom'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Notification tracking
  notificationsSent: [{
    scheduledTime: {
      type: Date,
      required: true
    },
    notificationType: {
      type: String,
      enum: ['reminder', 'time'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'sent'
    },
    messageId: {
      type: String
    }
  }],
  
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  
  // Prescription reference
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  // Frequency information
  frequency: {
    type: String,
    default: 'As prescribed'
  },
  duration: {
    type: String,
    default: 'As prescribed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
medicineNotificationSchema.index({ patientId: 1, isActive: 1 });
medicineNotificationSchema.index({ 'notificationTimes.time': 1, isActive: 1 });
medicineNotificationSchema.index({ 'notificationsSent.scheduledTime': 1 });

// Virtual for next notification time
medicineNotificationSchema.virtual('nextNotificationTime').get(function() {
  if (!this.isActive || this.notificationTimes.length === 0) {
    return null;
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Find next notification time today or tomorrow
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    for (const notificationTime of this.notificationTimes) {
      if (!notificationTime.isActive) continue;
      
      const [hours, minutes] = notificationTime.time.split(':').map(Number);
      const notificationDateTime = new Date(targetDate);
      notificationDateTime.setHours(hours, minutes, 0, 0);
      
      // Check if this time is in the future
      if (notificationDateTime > now) {
        return notificationDateTime;
      }
    }
  }
  
  return null;
});

// Ensure virtual fields are serialized
medicineNotificationSchema.set('toJSON', { virtuals: true });

const MedicineNotification = mongoose.model('MedicineNotification', medicineNotificationSchema);

export default MedicineNotification;
