import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB connection
let client: MongoClient;
let db: Db;

export async function connectToMongoDB() {
  if (!client) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('medalert');
  }
  return db;
}

// MongoDB Document Interfaces
export interface UserDocument {
  _id?: ObjectId;
  email: string;
  fullName: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  preferredLanguage: string;
  timezone: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationDocument {
  _id?: ObjectId;
  name: string;
  genericName?: string;
  brandNames?: string[];
  dosageForm?: string; // tablet, capsule, liquid, etc.
  strength?: string;
  description?: string;
  sideEffects?: string[];
  contraindications?: string[];
  createdAt: Date;
}

export interface UserMedicationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  medicationId: ObjectId;
  prescribedBy?: string;
  prescriptionDate?: Date;
  startDate: Date;
  endDate?: Date;
  dosage: string;
  instructions?: string;
  withFood: boolean;
  isActive: boolean;
  schedules: Array<{
    timeOfDay: string; // HH:MM format
    daysOfWeek: number[]; // 1=Monday, 7=Sunday
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationLogDocument {
  _id?: ObjectId;
  userId: ObjectId;
  userMedicationId: ObjectId;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'missed' | 'delayed' | 'skipped';
  method?: 'voice_confirmed' | 'button_pressed' | 'camera_verified' | 'manual';
  notes?: string;
  createdAt: Date;
}

export interface FamilyMemberDocument {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  relationship?: string;
  email?: string;
  phoneNumber?: string;
  notificationPreferences: {
    missedMedication: boolean;
    emergency: boolean;
    dailySummary: boolean;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface DeviceDocument {
  _id?: ObjectId;
  userId: ObjectId;
  deviceName: string;
  deviceType: string;
  macAddress?: string;
  ipAddress?: string;
  firmwareVersion?: string;
  lastSeen?: Date;
  batteryLevel?: number;
  status: 'active' | 'inactive' | 'maintenance';
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PillIdentificationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  deviceId?: ObjectId;
  imageUrl?: string;
  identifiedMedicationId?: ObjectId;
  confidenceScore?: number;
  verificationStatus: 'pending' | 'confirmed' | 'rejected';
  createdAt: Date;
}

export interface VoiceCommandDocument {
  _id?: ObjectId;
  userId: ObjectId;
  deviceId?: ObjectId;
  commandText?: string;
  intent?: string;
  confidenceScore?: number;
  responseText?: string;
  language: string;
  createdAt: Date;
}

export interface NotificationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  recipientType: 'user' | 'family_member';
  recipientId?: ObjectId;
  notificationType: 'medication_reminder' | 'missed_medication' | 'low_battery' | 'device_offline' | 'daily_summary';
  title: string;
  message: string;
  deliveryMethod: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
}

// MongoDB Service Class
export class MongoDBService {
  private static db: Db;

  static async initialize() {
    this.db = await connectToMongoDB();
    await this.createIndexes();
  }

  private static async createIndexes() {
    // Create indexes for better performance
    await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await this.db.collection('userMedications').createIndex({ userId: 1, isActive: 1 });
    await this.db.collection('medicationLogs').createIndex({ userId: 1, scheduledTime: -1 });
    await this.db.collection('devices').createIndex({ userId: 1, status: 1 });
    await this.db.collection('notifications').createIndex({ userId: 1, status: 1 });
    await this.db.collection('medications').createIndex({ name: 'text', genericName: 'text' });
  }

  // User operations
  static async createUser(user: Omit<UserDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    const newUser: UserDocument = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection<UserDocument>('users').insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }

  static async getUserById(userId: string): Promise<UserDocument | null> {
    return await this.db.collection<UserDocument>('users').findOne({ _id: new ObjectId(userId) });
  }

  static async getUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.db.collection<UserDocument>('users').findOne({ email });
  }

  static async updateUser(userId: string, updates: Partial<UserDocument>): Promise<UserDocument | null> {
    const result = await this.db.collection<UserDocument>('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Medication operations
  static async searchMedications(query: string): Promise<MedicationDocument[]> {
    return await this.db.collection<MedicationDocument>('medications')
      .find({ $text: { $search: query } })
      .limit(10)
      .toArray();
  }

  static async createMedication(medication: Omit<MedicationDocument, '_id' | 'createdAt'>): Promise<MedicationDocument> {
    const newMedication: MedicationDocument = {
      ...medication,
      createdAt: new Date()
    };

    const result = await this.db.collection<MedicationDocument>('medications').insertOne(newMedication);
    return { ...newMedication, _id: result.insertedId };
  }

  // User medication operations
  static async getUserMedications(userId: string): Promise<UserMedicationDocument[]> {
    return await this.db.collection<UserMedicationDocument>('userMedications')
      .find({ userId: new ObjectId(userId), isActive: true })
      .toArray();
  }

  static async addUserMedication(medication: Omit<UserMedicationDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserMedicationDocument> {
    const newMedication: UserMedicationDocument = {
      ...medication,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection<UserMedicationDocument>('userMedications').insertOne(newMedication);
    return { ...newMedication, _id: result.insertedId };
  }

  static async updateUserMedication(medicationId: string, updates: Partial<UserMedicationDocument>): Promise<UserMedicationDocument | null> {
    const result = await this.db.collection<UserMedicationDocument>('userMedications').findOneAndUpdate(
      { _id: new ObjectId(medicationId) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Medication log operations
  static async getMedicationLogs(userId: string, limit = 50): Promise<MedicationLogDocument[]> {
    return await this.db.collection<MedicationLogDocument>('medicationLogs')
      .find({ userId: new ObjectId(userId) })
      .sort({ scheduledTime: -1 })
      .limit(limit)
      .toArray();
  }

  static async logMedicationIntake(log: Omit<MedicationLogDocument, '_id' | 'createdAt'>): Promise<MedicationLogDocument> {
    const newLog: MedicationLogDocument = {
      ...log,
      createdAt: new Date()
    };

    const result = await this.db.collection<MedicationLogDocument>('medicationLogs').insertOne(newLog);
    return { ...newLog, _id: result.insertedId };
  }

  // Family member operations
  static async getFamilyMembers(userId: string): Promise<FamilyMemberDocument[]> {
    return await this.db.collection<FamilyMemberDocument>('familyMembers')
      .find({ userId: new ObjectId(userId), isActive: true })
      .toArray();
  }

  static async addFamilyMember(familyMember: Omit<FamilyMemberDocument, '_id' | 'createdAt'>): Promise<FamilyMemberDocument> {
    const newFamilyMember: FamilyMemberDocument = {
      ...familyMember,
      createdAt: new Date()
    };

    const result = await this.db.collection<FamilyMemberDocument>('familyMembers').insertOne(newFamilyMember);
    return { ...newFamilyMember, _id: result.insertedId };
  }

  // Device operations
  static async getUserDevices(userId: string): Promise<DeviceDocument[]> {
    return await this.db.collection<DeviceDocument>('devices')
      .find({ userId: new ObjectId(userId) })
      .toArray();
  }

  static async addDevice(device: Omit<DeviceDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<DeviceDocument> {
    const newDevice: DeviceDocument = {
      ...device,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.db.collection<DeviceDocument>('devices').insertOne(newDevice);
    return { ...newDevice, _id: result.insertedId };
  }

  static async updateDeviceStatus(deviceId: string, status: DeviceDocument['status'], batteryLevel?: number): Promise<DeviceDocument | null> {
    const updates: any = { status, updatedAt: new Date() };
    if (batteryLevel !== undefined) {
      updates.batteryLevel = batteryLevel;
      updates.lastSeen = new Date();
    }

    const result = await this.db.collection<DeviceDocument>('devices').findOneAndUpdate(
      { _id: new ObjectId(deviceId) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Pill identification operations
  static async addPillIdentification(identification: Omit<PillIdentificationDocument, '_id' | 'createdAt'>): Promise<PillIdentificationDocument> {
    const newIdentification: PillIdentificationDocument = {
      ...identification,
      createdAt: new Date()
    };

    const result = await this.db.collection<PillIdentificationDocument>('pillIdentifications').insertOne(newIdentification);
    return { ...newIdentification, _id: result.insertedId };
  }

  // Voice command operations
  static async addVoiceCommand(command: Omit<VoiceCommandDocument, '_id' | 'createdAt'>): Promise<VoiceCommandDocument> {
    const newCommand: VoiceCommandDocument = {
      ...command,
      createdAt: new Date()
    };

    const result = await this.db.collection<VoiceCommandDocument>('voiceCommands').insertOne(newCommand);
    return { ...newCommand, _id: result.insertedId };
  }

  // Notification operations
  static async createNotification(notification: Omit<NotificationDocument, '_id' | 'createdAt'>): Promise<NotificationDocument> {
    const newNotification: NotificationDocument = {
      ...notification,
      createdAt: new Date()
    };

    const result = await this.db.collection<NotificationDocument>('notifications').insertOne(newNotification);
    return { ...newNotification, _id: result.insertedId };
  }

  static async getPendingNotifications(): Promise<NotificationDocument[]> {
    return await this.db.collection<NotificationDocument>('notifications')
      .find({ 
        status: 'pending',
        $or: [
          { scheduledFor: { $lte: new Date() } },
          { scheduledFor: { $exists: false } }
        ]
      })
      .toArray();
  }

  static async updateNotificationStatus(notificationId: string, status: NotificationDocument['status']): Promise<void> {
    const updates: any = { status };
    if (status === 'sent') {
      updates.sentAt = new Date();
    }

    await this.db.collection<NotificationDocument>('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: updates }
    );
  }

  // Analytics and reporting
  static async getMedicationAdherenceStats(userId: string, days = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId: new ObjectId(userId),
          scheduledTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    return await this.db.collection('medicationLogs').aggregate(pipeline).toArray();
  }

  static async getDeviceHealthStatus(userId: string): Promise<DeviceDocument[]> {
    return await this.db.collection<DeviceDocument>('devices')
      .find({ 
        userId: new ObjectId(userId),
        $or: [
          { batteryLevel: { $lt: 20 } },
          { status: { $ne: 'active' } },
          { lastSeen: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 24 hours ago
        ]
      })
      .toArray();
  }
}