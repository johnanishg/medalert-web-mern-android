// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures environment variables are available when modules initialize
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
// __dirname is backend/src, so ../.env points to backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

// Now import other modules (they can now access process.env)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
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
import speechRoutes from './routes/speechRoutes.js';
import { scheduleFollowUpReminders } from './services/followUpScheduler.js';
import { schedulePatientMedicineReminders } from './services/patientMedicineScheduler.js';

// Debug: Check if environment variables are loaded
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');
console.log('🌐 GCLOUD_PROJECT_ID loaded:', process.env.GCLOUD_PROJECT_ID ? 'YES' : 'NO');
console.log('🌐 GCLOUD_PROJECT_ID value:', process.env.GCLOUD_PROJECT_ID || 'NOT SET');
console.log('🤖 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
console.log('🤖 GEMINI_API_KEY value:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://johnanish2874:00090@cluster0.on0nxrx.mongodb.net/medalert';
    await mongoose.connect(mongoURI);
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
app.use('/api/speech', speechRoutes);

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
