## Speech-to-Text (Google Cloud)

This backend exposes an endpoint to transcribe short microphone recordings using Google Cloud Speech-to-Text.

### Endpoint

- POST `/api/speech/transcribe`
  - Form fields:
    - `audio` (file): WebM audio blob recorded in the browser
    - `languageCode` (string, optional): BCP-47 code like `en-US`, `hi-IN`, `kn-IN`
    - `sampleRateHertz` (number, optional)
  - Response: `{ success: boolean, transcription?: string, message?: string }`

### Credentials

Credentials are read from existing environment variables. Do not modify credential contents in code.

Required env vars (already supported and loaded via dotenv):
- `GCLOUD_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON)

No code changes are needed when rotating credentials; update the `.env` values only.

# MedAlert Backend API

RESTful API server for the MedAlert healthcare management system built with Node.js, Express.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0+)
- MongoDB (v6.0+)
- npm or yarn

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create a `.env` file in the backend directory:
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

### Start Server
```bash
npm start
```

Server runs on `http://localhost:5001`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "age": 30,
  "gender": "male",
  "phoneNumber": "1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "userType": "patient"
}
```

#### Admin Login
```http
POST /api/auth/admin-login
Content-Type: application/json

{
  "email": "admin@medalert.com",
  "password": "admin123",
  "adminKey": "your-admin-key"
}
```

### Patient Endpoints

#### Get Patient Profile
```http
GET /api/patients/profile
Authorization: Bearer <token>
```

#### Update Patient Profile
```http
PUT /api/patients/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "age": 31,
  "phoneNumber": "9876543210"
}
```

#### Get Patient Medicines
```http
GET /api/patients/medicines
Authorization: Bearer <token>
```

### Doctor Endpoints

#### Search Patient
```http
GET /api/doctors/search-patient/:patientId
Authorization: Bearer <token>
```

#### Add Medicine to Patient
```http
POST /api/doctors/add-medicine/:patientId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Paracetamol",
  "dosage": "500mg",
  "frequency": "2 times daily",
  "timing": ["morning", "evening"],
  "foodTiming": "after food",
  "durationType": "dateRange",
  "startDate": "2024-01-01",
  "endDate": "2024-01-15",
  "instructions": "Take with water"
}
```

#### Create Prescription
```http
POST /api/prescriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient_id_here",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "2 times daily",
      "duration": "7 days",
      "instructions": "Take with water"
    }
  ],
  "followUpDate": "2024-01-15",
  "notes": "Follow up in 2 weeks"
}
```

### Admin Endpoints

#### Get Users by Role
```http
GET /api/admin/users/:role
Authorization: Bearer <token>
```

#### Get All Medications
```http
GET /api/admin/medications
Authorization: Bearer <token>
```

#### Get All Prescriptions
```http
GET /api/admin/prescriptions
Authorization: Bearer <token>
```

#### Approve Doctor
```http
PUT /api/admin/approve-doctor/:id
Authorization: Bearer <token>
```

### Medicine Notification Endpoints

#### Create/Update Notification
```http
POST /api/medicine-notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "medicineName": "Paracetamol",
  "customTiming": "09:00",
  "frequency": "daily"
}
```

#### Get Notifications
```http
GET /api/medicine-notifications
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/medicine-notifications/:id
Authorization: Bearer <token>
```

## 🗄️ Database Models

### Patient Model
```javascript
{
  userId: String,
  name: String,
  email: String,
  age: Number,
  gender: String,
  phoneNumber: String,
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    timing: [String],
    foodTiming: String,
    duration: String,
    instructions: String,
    addedAt: Date,
    prescriptionId: String
  }],
  visits: [{
    date: Date,
    type: String,
    doctorName: String,
    notes: String
  }],
  caretakerApprovals: [String]
}
```

### Doctor Model
```javascript
{
  userId: String,
  name: String,
  email: String,
  licenseNumber: String,
  specialization: String,
  hospital: String,
  isApproved: Boolean,
  approvedBy: String,
  approvedAt: Date
}
```

### Prescription Model
```javascript
{
  patientId: String,
  doctorId: String,
  doctorName: String,
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  followUpDate: Date,
  notes: String,
  isActive: Boolean,
  createdAt: Date
}
```

### MedicineNotification Model
```javascript
{
  patientId: String,
  medicineName: String,
  customTiming: String,
  frequency: String,
  duration: String,
  isActive: Boolean,
  createdAt: Date
}
```

## 🔧 Middleware

### Authentication Middleware
```javascript
const verifyToken = (req, res, next) => {
  // JWT token verification
  // Sets req.user with decoded token data
}
```

### Admin Middleware
```javascript
const verifyAdminToken = (req, res, next) => {
  // Admin role verification
  // Ensures user has admin privileges
}
```

## 📅 Scheduled Tasks

### Medication Reminders
- **Cron Job**: Runs every minute
- **Function**: `medicationScheduler.js`
- **Purpose**: Send SMS reminders for medications

### Follow-up Reminders
- **Cron Job**: Runs daily at 9 AM
- **Function**: `followUpScheduler.js`
- **Purpose**: Send appointment reminders

### Patient Medicine Reminders
- **Cron Job**: Runs every minute
- **Function**: `patientMedicineScheduler.js`
- **Purpose**: Send custom timing reminders

## 🔔 SMS Integration

### Twilio Service
```javascript
// Send medication reminder
await sendMedicationReminder(phoneNumber, medicineName, timing);

// Send general notification
await sendGeneralNotification(phoneNumber, message);
```

### Message Templates
- **Medication Reminder**: "Reminder: Take [medicine] at [time]"
- **Appointment Reminder**: "Appointment reminder: [date] with Dr. [name]"
- **Follow-up**: "Follow-up appointment scheduled for [date]"

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Manual Testing
```bash
# Test database connection
node -e "import mongoose from 'mongoose'; mongoose.connect('mongodb://localhost:27017/medalert'); console.log('Connected');"

# Test API endpoints
curl -X GET http://localhost:5001/api/health
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:
- `MONGODB_URI`
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_PHONE_NUMBER` (optional)
- `ADMIN_ACCESS_KEY`

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Check
```http
GET /api/health
```

### Logging
- **Console Logs**: Development debugging
- **File Logs**: Production logging
- **Error Tracking**: Comprehensive error handling

### Performance Monitoring
- **Response Times**: API endpoint performance
- **Database Queries**: MongoDB query optimization
- **Memory Usage**: Node.js memory monitoring

## 🔒 Security

### Authentication
- **JWT Tokens**: Secure user authentication
- **Password Hashing**: bcrypt password encryption
- **Role-based Access**: User role verification

### Data Protection
- **Input Validation**: Request data sanitization
- **SQL Injection Prevention**: MongoDB query protection
- **CORS Configuration**: Cross-origin request handling

### API Security
- **Rate Limiting**: Request throttling
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data protection

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### JWT Token Error
```bash
# Check JWT_SECRET in .env file
echo $JWT_SECRET

# Verify token format
node -e "console.log(require('jsonwebtoken').verify('your-token', 'your-secret'))"
```

#### Twilio SMS Not Working
```bash
# Check Twilio credentials
# Verify phone number format (+91XXXXXXXXXX)
# Check Twilio account balance
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=medalert:* npm start
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For backend-specific issues:
- **GitHub Issues**: [Create an issue](https://github.com/johnanishg/medalert/issues)
- **Email**: backend@medalert.com
- **Documentation**: [API Docs](https://github.com/johnanishg/medalert/wiki/API-Documentation)