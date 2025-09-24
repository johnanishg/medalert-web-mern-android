import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import managementRoutes from './routes/managementRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import caretakerRoutes from './routes/caretakerRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import medicineNotificationRoutes from './routes/medicineNotificationRoutes.js';
import adminMutationRoutes from './routes/adminMutationRoutes.js';
import adherenceRoutes from './routes/adherenceRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import { scheduleFollowUpReminders } from './services/followUpScheduler.js';
import { schedulePatientMedicineReminders } from './services/patientMedicineScheduler.js';

// Load environment variables
dotenv.config();

// Debug: Check if JWT_SECRET is loaded
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medalert';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('✅ MongoDB connected successfully to medalert database');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Tip: Make sure MongoDB is running and accessible');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MedAlert MongoDB API Server is running!',
    database: 'medalert',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/caretakers', caretakerRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medicine-notifications', medicineNotificationRoutes);
app.use('/api/admin-mutations', adminMutationRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MedAlert Backend Server running on port ${PORT}`);
  console.log(`📊 Database: medalert`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Network accessible at: http://192.168.29.72:${PORT}/api`);
  
  // Start follow-up reminder scheduler
  scheduleFollowUpReminders();
  
  // Start patient medicine reminder scheduler
  schedulePatientMedicineReminders();
});
