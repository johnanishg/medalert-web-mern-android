import cron from 'node-cron';
import Prescription from '../models/Prescription.js';
import { sendAppointmentReminder, validatePhoneNumber } from './twilioService.js';

/**
 * Send follow-up reminders for upcoming appointments
 */
export const sendFollowUpReminders = async () => {
  try {
    console.log('🔔 Checking for follow-up reminders...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find prescriptions with follow-ups tomorrow that haven't been notified
    const upcomingFollowUps = await Prescription.find({
      followUpRequired: true,
      followUpDate: {
        $gte: today,
        $lt: tomorrow
      },
      followUpNotificationSent: false,
      status: 'active'
    }).populate('patientId', 'name phoneNumber');

    console.log(`Found ${upcomingFollowUps.length} follow-up reminders to send`);

    for (const prescription of upcomingFollowUps) {
      try {
        const patient = prescription.patientId;
        
        if (patient.phoneNumber && validatePhoneNumber(patient.phoneNumber)) {
          const smsResult = await sendAppointmentReminder(
            patient.phoneNumber,
            patient.name,
            prescription.followUpDate.toLocaleDateString(),
            prescription.doctorName
          );

          if (smsResult.success) {
            // Mark notification as sent
            prescription.followUpNotificationSent = true;
            prescription.followUpNotificationDate = new Date();
            await prescription.save();
            
            console.log(`✅ Follow-up reminder sent to ${patient.name} for ${prescription.followUpDate.toLocaleDateString()}`);
          } else {
            console.error(`❌ Failed to send follow-up reminder to ${patient.name}:`, smsResult.error);
          }
        } else {
          console.log(`⚠️ Skipping follow-up reminder for ${patient.name} - invalid phone number`);
        }
      } catch (error) {
        console.error(`Error sending follow-up reminder for prescription ${prescription._id}:`, error);
      }
    }

    console.log('🔔 Follow-up reminder check completed');
  } catch (error) {
    console.error('Error in follow-up reminder scheduler:', error);
  }
};

/**
 * Schedule follow-up reminders to run daily at 9 AM
 */
export const scheduleFollowUpReminders = () => {
  // Run daily at 9 AM
  const task = cron.schedule('0 9 * * *', async () => {
    await sendFollowUpReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('📅 Follow-up reminder scheduler started (daily at 9 AM)');
  return task;
};

/**
 * Send immediate follow-up notification (for testing or manual triggers)
 */
export const sendImmediateFollowUpNotification = async (prescriptionId) => {
  try {
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patientId', 'name phoneNumber');

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (!prescription.followUpRequired || !prescription.followUpDate) {
      throw new Error('No follow-up scheduled for this prescription');
    }

    const patient = prescription.patientId;
    
    if (patient.phoneNumber && validatePhoneNumber(patient.phoneNumber)) {
      const smsResult = await sendAppointmentReminder(
        patient.phoneNumber,
        patient.name,
        prescription.followUpDate.toLocaleDateString(),
        prescription.doctorName
      );

      if (smsResult.success) {
        // Mark notification as sent
        prescription.followUpNotificationSent = true;
        prescription.followUpNotificationDate = new Date();
        await prescription.save();
        
        return {
          success: true,
          message: `Follow-up reminder sent to ${patient.name}`
        };
      } else {
        return {
          success: false,
          error: smsResult.error
        };
      }
    } else {
      return {
        success: false,
        error: 'Invalid or missing phone number'
      };
    }
  } catch (error) {
    console.error('Error sending immediate follow-up notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendFollowUpReminders,
  scheduleFollowUpReminders,
  sendImmediateFollowUpNotification
};
