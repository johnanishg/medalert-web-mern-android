import mongoose from 'mongoose';

const generateUniqueId = () => {
  const prefix = 'DEV';
  const randomPart = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${prefix}${randomPart}`;
};

const deviceSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    unique: true, 
    required: false,
    default: generateUniqueId
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['smart_pillbox', 'medication_dispenser', 'wearable_monitor', 'sensor', 'other']
  },
  manufacturer: { 
    type: String, 
    required: true 
  },
  model: { 
    type: String, 
    required: true 
  },
  serialNumber: { 
    type: String, 
    unique: true, 
    required: true 
  },
  macAddress: { 
    type: String, 
    unique: true, 
    required: false 
  },
  ipAddress: { 
    type: String, 
    required: false 
  },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'maintenance', 'error'], 
    default: 'offline' 
  },
  batteryLevel: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: null 
  },
  signalStrength: { 
    type: Number, 
    min: -100, 
    max: 0, 
    default: null 
  },
  firmwareVersion: { 
    type: String, 
    default: '1.0.0' 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  lastMaintenance: { 
    type: Date 
  },
  nextMaintenance: { 
    type: Date 
  },
  
  // Patient assignment
  assignedPatient: {
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Patient' 
    },
    patientName: { 
      type: String 
    },
    assignedAt: { 
      type: Date, 
      default: Date.now 
    },
    assignedBy: { 
      type: String 
    }
  },
  
  // Location information
  location: {
    room: { 
      type: String 
    },
    floor: { 
      type: String 
    },
    building: { 
      type: String 
    },
    address: { 
      type: String 
    },
    coordinates: {
      latitude: { 
        type: Number 
      },
      longitude: { 
        type: Number 
      }
    }
  },
  
  // Device capabilities
  capabilities: [{
    name: { 
      type: String, 
      required: true 
    },
    enabled: { 
      type: Boolean, 
      default: true 
    },
    parameters: { 
      type: mongoose.Schema.Types.Mixed 
    }
  }],
  
  // Configuration
  configuration: {
    timezone: { 
      type: String, 
      default: 'UTC' 
    },
    language: { 
      type: String, 
      default: 'en' 
    },
    alertSettings: {
      soundEnabled: { 
        type: Boolean, 
        default: true 
      },
      vibrationEnabled: { 
        type: Boolean, 
        default: true 
      },
      ledEnabled: { 
        type: Boolean, 
        default: true 
      }
    },
    medicationSettings: {
      reminderInterval: { 
        type: Number, 
        default: 5 
      }, // minutes
      maxRetries: { 
        type: Number, 
        default: 3 
      },
      autoDispense: { 
        type: Boolean, 
        default: false 
      }
    }
  },
  
  // Health monitoring data
  healthData: [{
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    metric: { 
      type: String, 
      required: true 
    },
    value: { 
      type: Number, 
      required: true 
    },
    unit: { 
      type: String, 
      required: true 
    },
    quality: { 
      type: String, 
      enum: ['good', 'fair', 'poor'], 
      default: 'good' 
    }
  }],
  
  // Medication dispensing history
  dispensingHistory: [{
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    medicationName: { 
      type: String, 
      required: true 
    },
    dosage: { 
      type: String, 
      required: true 
    },
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Patient' 
    },
    success: { 
      type: Boolean, 
      required: true 
    },
    notes: { 
      type: String 
    }
  }],
  
  // Alerts and notifications
  alerts: [{
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    type: { 
      type: String, 
      enum: ['battery_low', 'connection_lost', 'medication_missed', 'maintenance_due', 'error'], 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    message: { 
      type: String, 
      required: true 
    },
    acknowledged: { 
      type: Boolean, 
      default: false 
    },
    acknowledgedBy: { 
      type: String 
    },
    acknowledgedAt: { 
      type: Date 
    }
  }],
  
  // System fields
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save hook to generate unique ID and update timestamp
deviceSchema.pre('save', async function(next) {
  try {
    // Always generate unique ID if not already set
    if (!this.deviceId) {
      this.deviceId = generateUniqueId();
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save hook to ensure deviceId is set
deviceSchema.post('save', function(doc) {
  if (!doc.deviceId) {
    doc.deviceId = generateUniqueId();
    doc.save();
  }
});

// Indexes for efficient queries
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ serialNumber: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ 'assignedPatient.patientId': 1 });
deviceSchema.index({ lastSeen: -1 });
deviceSchema.index({ createdAt: -1 });

// Virtual for device age
deviceSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for connection status
deviceSchema.virtual('isConnected').get(function() {
  const now = new Date();
  const lastSeen = new Date(this.lastSeen);
  const timeDiff = (now - lastSeen) / (1000 * 60); // minutes
  return timeDiff < 5; // Consider connected if seen within 5 minutes
});

// Method to update last seen
deviceSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Method to add health data
deviceSchema.methods.addHealthData = function(metric, value, unit, quality = 'good') {
  this.healthData.push({
    metric,
    value,
    unit,
    quality
  });
  return this.save();
};

// Method to add alert
deviceSchema.methods.addAlert = function(type, message, severity = 'medium') {
  this.alerts.push({
    type,
    message,
    severity
  });
  return this.save();
};

// Method to acknowledge alert
deviceSchema.methods.acknowledgeAlert = function(alertId, acknowledgedBy) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
  }
  return this.save();
};

const Device = mongoose.model('Device', deviceSchema);

export default Device;
