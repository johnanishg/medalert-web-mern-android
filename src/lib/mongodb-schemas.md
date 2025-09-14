# MongoDB Schema Documentation

## Collections Overview

The Medicine Alert System uses the following MongoDB collections:

### 1. Users Collection
Stores user profile information and preferences.

```javascript
{
  _id: ObjectId,
  email: String (unique),
  fullName: String,
  dateOfBirth: Date (optional),
  phoneNumber: String (optional),
  preferredLanguage: String (default: "en"),
  timezone: String (default: "UTC"),
  emergencyContact: {
    name: String,
    phone: String
  } (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Medications Collection
Master database of available medications.

```javascript
{
  _id: ObjectId,
  name: String,
  genericName: String (optional),
  brandNames: [String] (optional),
  dosageForm: String (optional), // tablet, capsule, liquid, etc.
  strength: String (optional),
  description: String (optional),
  sideEffects: [String] (optional),
  contraindications: [String] (optional),
  createdAt: Date
}
```

### 3. UserMedications Collection
User's prescribed medications with embedded schedules.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  medicationId: ObjectId (ref: Medications),
  prescribedBy: String (optional),
  prescriptionDate: Date (optional),
  startDate: Date,
  endDate: Date (optional),
  dosage: String,
  instructions: String (optional),
  withFood: Boolean (default: false),
  isActive: Boolean (default: true),
  schedules: [{
    timeOfDay: String, // HH:MM format
    daysOfWeek: [Number], // 1=Monday, 7=Sunday
    isActive: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4. MedicationLogs Collection
History of medication intake events.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  userMedicationId: ObjectId (ref: UserMedications),
  scheduledTime: Date,
  actualTime: Date (optional),
  status: String, // taken, missed, delayed, skipped
  method: String (optional), // voice_confirmed, button_pressed, camera_verified, manual
  notes: String (optional),
  createdAt: Date
}
```

### 5. FamilyMembers Collection
Emergency contacts and notification recipients.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  name: String,
  relationship: String (optional),
  email: String (optional),
  phoneNumber: String (optional),
  notificationPreferences: {
    missedMedication: Boolean,
    emergency: Boolean,
    dailySummary: Boolean
  },
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### 6. Devices Collection
IoT device management and status.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  deviceName: String,
  deviceType: String (default: "medicine_alert_box"),
  macAddress: String (optional),
  ipAddress: String (optional),
  firmwareVersion: String (optional),
  lastSeen: Date (optional),
  batteryLevel: Number (0-100, optional),
  status: String, // active, inactive, maintenance
  location: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### 7. PillIdentifications Collection
Camera-based pill recognition records.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  deviceId: ObjectId (ref: Devices, optional),
  imageUrl: String (optional),
  identifiedMedicationId: ObjectId (ref: Medications, optional),
  confidenceScore: Number (0-1, optional),
  verificationStatus: String, // pending, confirmed, rejected
  createdAt: Date
}
```

### 8. VoiceCommands Collection
Voice interaction logs.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  deviceId: ObjectId (ref: Devices, optional),
  commandText: String (optional),
  intent: String (optional),
  confidenceScore: Number (0-1, optional),
  responseText: String (optional),
  language: String (default: "en"),
  createdAt: Date
}
```

### 9. Notifications Collection
Alert and reminder history.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  recipientType: String, // user, family_member
  recipientId: ObjectId (optional),
  notificationType: String, // medication_reminder, missed_medication, low_battery, device_offline, daily_summary
  title: String,
  message: String,
  deliveryMethod: [String], // push, sms, email, voice
  status: String, // pending, sent, delivered, failed
  scheduledFor: Date (optional),
  sentAt: Date (optional),
  createdAt: Date
}
```

## Indexes

The following indexes are automatically created for optimal performance:

- `users.email` (unique)
- `userMedications.userId + isActive`
- `medicationLogs.userId + scheduledTime` (descending)
- `devices.userId + status`
- `notifications.userId + status`
- `medications` (text search on name and genericName)

## Key Features

### 1. Embedded vs Referenced Data
- **Embedded**: Medication schedules are embedded within UserMedications for atomic updates
- **Referenced**: User relationships use ObjectId references for data consistency

### 2. Flexible Schema
- Optional fields allow for gradual data collection
- Arrays support multiple values (brand names, side effects, etc.)
- Nested objects for complex data (emergency contacts, notification preferences)

### 3. Time Zone Support
- All timestamps stored in UTC
- User timezone preference for display purposes
- Scheduled times stored as strings for easy parsing

### 4. Multi-language Support
- User preferred language setting
- Voice commands can be in different languages
- Notification messages can be localized

### 5. Device Management
- Track multiple devices per user
- Monitor device health (battery, connectivity)
- Support for different device types

### 6. Analytics Ready
- Comprehensive logging for adherence tracking
- Voice command analysis
- Device usage patterns
- Notification effectiveness metrics