import mongoose from 'mongoose';

const diagnosisSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  doctorName: { type: String, required: true },
  diagnosis: { type: String, required: true },
  symptoms: [String],
  treatment: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpDate: Date,
  notes: String,
  diagnosisDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
diagnosisSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Diagnosis', diagnosisSchema);
