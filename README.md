# MedAlert - Smart Medication Management System

![MedAlert Logo](https://img.shields.io/badge/MedAlert-Healthcare-blue?style=for-the-badge&logo=medical-cross)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb)

A comprehensive healthcare management system designed to help patients, doctors, and caregivers manage medications, appointments, and health records efficiently.

## 🚀 Features

### 👥 Multi-Role Dashboard System
- **Patient Dashboard**: Medicine management, appointment tracking, notification settings
- **Doctor Dashboard**: Patient management, prescription creation, diagnosis tracking
- **Admin Dashboard**: System administration, user management, data analytics
- **Caretaker Dashboard**: Patient monitoring, emergency contacts, approval management

### 💊 Smart Medication Management
- Real-time medication tracking
- Customizable reminder notifications
- Dosage and frequency management
- Medicine history and adherence tracking
- Prescription management with multiple medicines

### 📱 Advanced Notifications
- **Twilio SMS Integration**: Automated medication reminders
- **Custom Timing**: Patient-set notification schedules
- **Multi-level Alerts**: 30-minute advance + exact time notifications
- **Follow-up Reminders**: Doctor appointment notifications

### 🤖 AI-Powered Assistant
- **Google Gemini Integration**: Context-aware chatbot
- **Dashboard-Specific Help**: Tailored assistance for each user role
- **Healthcare Guidance**: Medication advice and system navigation
- **Real-time Support**: Instant answers to user queries

### 📊 Comprehensive Logging
- **Centralized Logging System**: Site-wide popup log viewer
- **Importance Levels**: Critical, High, Medium, Low log filtering
- **Real-time Monitoring**: Live system activity tracking
- **Debug Support**: Detailed error tracking and resolution

### 🎨 Modern UI/UX
- **Dark/Light Theme**: User preference support
- **Responsive Design**: Mobile-first approach
- **Tailwind CSS**: Modern, clean interface
- **Accessibility**: WCAG compliant design

## 🛠️ Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Node-cron** for scheduled tasks
- **Twilio** for SMS notifications

### External Services
- **Google Gemini AI** for chatbot functionality
- **Twilio** for SMS notifications
- **MongoDB Atlas** (optional cloud deployment)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18.0 or higher)
- **MongoDB** (v6.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/johnanishg/medalert.git
cd medalert
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Environment Configuration

Create environment files in both root and backend directories:

#### Root `.env` file:
```env
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

#### Backend `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/medalert

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Admin
ADMIN_ACCESS_KEY=your-admin-access-key
```

### 4. Database Setup

#### Start MongoDB
```bash
# On Linux/macOS
sudo systemctl start mongod
# OR
mongod --dbpath /data/db

# On Windows
net start MongoDB
```

#### Create Admin User
```bash
cd backend
node -e "
import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';

mongoose.connect('mongodb://localhost:27017/medalert');

const createAdmin = async () => {
  const admin = new Admin({
    name: 'System Admin',
    email: 'admin@medalert.com',
    password: 'admin123',
    adminLevel: 'admin'
  });
  
  await admin.save();
  console.log('Admin user created successfully');
  process.exit(0);
};

createAdmin();
"
```

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm start
```

#### Start Frontend Development Server
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

## 📱 Usage Guide

### Patient Dashboard
1. **Register/Login** as a patient
2. **View Medications** and set custom reminders
3. **Track Appointments** and medical history
4. **Manage Caretakers** and approval requests
5. **Use AI Chatbot** for medication guidance

### Doctor Dashboard
1. **Login** with doctor credentials
2. **Search Patients** by ID or name
3. **Add Medications** with detailed instructions
4. **Create Prescriptions** with multiple medicines
5. **Track Patient History** and diagnoses

### Admin Dashboard
1. **Login** with admin credentials
2. **Manage Users** (patients, doctors, caretakers)
3. **Approve Doctor Registrations**
4. **View System Analytics** and logs
5. **Monitor Notifications** and system health

### Caretaker Dashboard
1. **Login** with caretaker credentials
2. **Request Patient Access** for monitoring
3. **View Approved Patients** and their medications
4. **Monitor Health Status** and emergency contacts

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login

### Patient Management
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/medicines` - Get patient medicines

### Doctor Management
- `GET /api/doctors/patients` - Get doctor's patients
- `POST /api/doctors/add-medicine/:patientId` - Add medicine to patient
- `POST /api/prescriptions/create` - Create prescription

### Admin Management
- `GET /api/admin/users/:role` - Get users by role
- `GET /api/admin/medications` - Get all medications
- `GET /api/admin/prescriptions` - Get all prescriptions
- `PUT /api/admin/approve-doctor/:id` - Approve doctor

## 🤖 AI Chatbot Setup

### Google Gemini API Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file as `VITE_GEMINI_API_KEY`
4. The chatbot will automatically be available in all dashboards

### Chatbot Features
- **Context-Aware**: Understands current dashboard and user role
- **Healthcare Focused**: Provides medication and health guidance
- **Real-time Responses**: Instant answers to user queries
- **Multi-language Support**: Supports multiple languages

## 📞 SMS Notifications Setup

### Twilio Configuration
1. Sign up for [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and Phone Number
3. Add credentials to backend `.env` file
4. Verify your phone number in Twilio console

### Notification Types
- **Medication Reminders**: Custom timing notifications
- **Appointment Alerts**: Follow-up appointment reminders
- **Emergency Notifications**: Critical health alerts
- **System Updates**: Important system notifications

## 🧪 Testing

### Run Frontend Tests
```bash
npm test
```

### Run Backend Tests
```bash
cd backend
npm test
```

### Manual Testing
1. **User Registration**: Test all user types
2. **Authentication**: Login/logout functionality
3. **Dashboard Navigation**: All dashboard features
4. **API Endpoints**: Test all API routes
5. **Notifications**: SMS and in-app notifications

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder to your hosting platform
```

### Backend Deployment (Railway/Heroku)
```bash
cd backend
# Configure environment variables
# Deploy to your hosting platform
```

### Database Deployment
- **MongoDB Atlas**: Cloud database hosting
- **Local MongoDB**: Self-hosted database
- **Docker**: Containerized deployment

## 📊 Monitoring & Logging

### Log Viewer
- Access via the log toggle button in any dashboard
- Filter by importance level (Critical, High, Medium, Low)
- Real-time log monitoring
- Export logs for analysis

### System Health
- Database connection monitoring
- API endpoint health checks
- User activity tracking
- Error rate monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **John Anish G** - Project Lead & Full-Stack Developer
- **Contributors** - Open for community contributions

## 📞 Support

For support and questions:
- **Email**: support@medalert.com
- **GitHub Issues**: [Create an issue](https://github.com/johnanishg/medalert/issues)
- **Documentation**: [Wiki](https://github.com/johnanishg/medalert/wiki)

## 🗺️ Roadmap

### Upcoming Features
- [ ] **Mobile App**: React Native mobile application
- [ ] **IoT Integration**: Smart pill dispensers and wearables
- [ ] **Telemedicine**: Video consultation features
- [ ] **Analytics Dashboard**: Advanced health analytics
- [ ] **Multi-language Support**: Internationalization
- [ ] **Blockchain Integration**: Secure health records
- [ ] **Machine Learning**: Predictive health insights

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - AI chatbot integration
- **v1.2.0** - Advanced logging system
- **v1.3.0** - Multi-role dashboard optimization

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **MongoDB** for the robust database solution
- **Google** for the Gemini AI API
- **Twilio** for SMS notification services
- **Tailwind CSS** for the beautiful UI framework
- **Open Source Community** for inspiration and support

---

**Made with ❤️ for better healthcare management**

![GitHub stars](https://img.shields.io/github/stars/johnanishg/medalert?style=social)
![GitHub forks](https://img.shields.io/github/forks/johnanishg/medalert?style=social)
![GitHub issues](https://img.shields.io/github/issues/johnanishg/medalert)
![GitHub license](https://img.shields.io/github/license/johnanishg/medalert)
