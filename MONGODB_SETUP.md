# MongoDB Setup Instructions

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/medalert

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Access Key
ADMIN_ACCESS_KEY=medalert2025
```

## 2. MongoDB Installation

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The connection string `mongodb://localhost:27017/medalert` will create a database named "medalert"

### Option 2: MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local` with your Atlas connection string

## 3. Create Admin User

After setting up MongoDB, you can create an admin user by making a POST request to:

```
POST /api/admin/create-admin
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@medalert.com",
  "password": "admin123"
}
```

Or use curl:
```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@medalert.com","password":"admin123"}'
```

## 4. Database Structure

The application will automatically create the following collections in the "medalert" database:

- `users` - User accounts (admin, doctor, patient, caretaker)
- `medications` - Medication database
- `userMedications` - User-specific medication prescriptions
- `medicationLogs` - Medication intake logs
- `devices` - IoT device information
- `notifications` - Notification system
- `familyMembers` - Family member contacts
- `pillIdentifications` - AI pill identification results
- `voiceCommands` - Voice command logs

## 5. User Roles

- **Admin**: Full system access, can approve doctors
- **Doctor**: Can register patients, view patient data, prescribe medications
- **Patient**: Can view their medications, logs, and notifications
- **Caretaker**: Can monitor assigned patients, view notifications

## 6. Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Admin access key protection (`medalert2025`)
- Input validation and sanitization
