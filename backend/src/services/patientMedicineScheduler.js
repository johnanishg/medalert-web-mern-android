import cron from 'node-cron';
import MedicineNotification from '../models/MedicineNotification.js';
import Prescription from '../models/Prescription.js';
import { sendMedicationReminder, sendGeneralNotification, validatePhoneNumber } from './twilioService.js';

/**
 * Send medication reminders based on patient-set timings
 */
export const sendPatientMedicineReminders = async () => {
  try {
    console.log('💊 Checking for patient medicine reminders...');
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Calculate 30 minutes ago time
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const thirtyMinutesAgoTime = thirtyMinutesAgo.toTimeString().slice(0, 5);
    
    console.log(`Current time: ${currentTime}, 30 minutes ago: ${thirtyMinutesAgoTime}`);
    
    // Find all active medicine notifications and populate prescription data
    const activeNotifications = await MedicineNotification.find({
      isActive: true
    }).populate('prescriptionId', 'doctorName doctorId');

    let remindersSent = 0;
    let advanceRemindersSent = 0;

    for (const notification of activeNotifications) {
      // Use the patient information stored directly in the notification
      const patient = {
        name: notification.patientName,
        phoneNumber: notification.patientPhone
      };
      
      if (!patient.phoneNumber || !validatePhoneNumber(patient.phoneNumber)) {
        continue;
      }

      // Get doctor name from prescription or use default
      let doctorName = 'MedAlert System';
      if (notification.prescriptionId && notification.prescriptionId.doctorName) {
        doctorName = notification.prescriptionId.doctorName;
      }

      for (const timeSlot of notification.notificationTimes) {
        if (!timeSlot.isActive) continue;
        
        const notificationTime = timeSlot.time;
        const [hours, minutes] = notificationTime.split(':').map(Number);
        
        // Check for 30-minute advance reminder
        const advanceTime = new Date();
        advanceTime.setHours(hours, minutes, 0, 0);
        advanceTime.setMinutes(advanceTime.getMinutes() - 30);
        const advanceTimeString = advanceTime.toTimeString().slice(0, 5);
        
        // Check if current time matches 30-minute advance time
        if (currentTime === advanceTimeString) {
          const wasAlreadySent = notification.notificationsSent.some(sent => {
            const sentTime = new Date(sent.scheduledTime);
            const sentTimeString = sentTime.toTimeString().slice(0, 5);
            return sentTimeString === advanceTimeString && 
                   sent.notificationType === 'reminder' &&
                   sent.status === 'sent';
          });
          
          if (!wasAlreadySent) {
            try {
              const smsResult = await sendMedicationReminder(
                patient.phoneNumber,
                patient.name,
                notification.medicineName,
                notification.dosage,
                `${notification.frequency || 'As prescribed'} - 30min advance for ${notificationTime}`,
                doctorName
              );

              if (smsResult.success) {
                // Record the notification
                notification.notificationsSent.push({
                  scheduledTime: advanceTime,
                  notificationType: 'reminder',
                  status: 'sent',
                  messageId: smsResult.messageId
                });
                await notification.save();
                
                advanceRemindersSent++;
                console.log(`✅ 30-min advance reminder sent to ${patient.name} for ${notification.medicineName} at ${notificationTime}`);
              }
            } catch (error) {
              console.error(`❌ Failed to send 30-min advance reminder to ${patient.name}:`, error);
            }
          }
        }
        
        // Check for exact time reminder
        if (currentTime === notificationTime) {
          const wasAlreadySent = notification.notificationsSent.some(sent => {
            const sentTime = new Date(sent.scheduledTime);
            const sentTimeString = sentTime.toTimeString().slice(0, 5);
            return sentTimeString === notificationTime && 
                   sent.notificationType === 'time' &&
                   sent.status === 'sent';
          });
          
          if (!wasAlreadySent) {
            try {
              const smsResult = await sendMedicationReminder(
                patient.phoneNumber,
                patient.name,
                notification.medicineName,
                notification.dosage,
                `${notification.frequency || 'As prescribed'} - Time: ${notificationTime}`,
                doctorName
              );

              if (smsResult.success) {
                // Record the notification
                const exactTime = new Date();
                exactTime.setHours(hours, minutes, 0, 0);
                
                notification.notificationsSent.push({
                  scheduledTime: exactTime,
                  notificationType: 'time',
                  status: 'sent',
                  messageId: smsResult.messageId
                });
                await notification.save();
                
                remindersSent++;
                console.log(`✅ Medicine reminder sent to ${patient.name} for ${notification.medicineName} at ${notificationTime}`);
              }
            } catch (error) {
              console.error(`❌ Failed to send medicine reminder to ${patient.name}:`, error);
            }
          }
        }
      }
    }

    console.log(`💊 Medicine reminder check completed: ${remindersSent} exact reminders, ${advanceRemindersSent} advance reminders sent`);

  } catch (error) {
    console.error('Error in patient medicine reminder scheduler:', error);
  }
};

/**
 * Schedule patient medicine reminders to run every minute
 */
export const schedulePatientMedicineReminders = () => {
  // Run every minute to check for exact times
  const task = cron.schedule('* * * * *', async () => {
    await sendPatientMedicineReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('⏰ Patient medicine reminder scheduler started (every minute)');
  return task;
};

/**
 * Send immediate medicine reminder (for testing or manual triggers)
 */
export const sendImmediateMedicineReminder = async (notificationId, reminderType = 'time') => {
  try {
    const notification = await MedicineNotification.findById(notificationId)
      .populate('patientId', 'name phoneNumber')
      .populate('prescriptionId', 'doctorName doctorId');

    if (!notification) {
      throw new Error('Medicine notification not found');
    }

    if (!notification.isActive) {
      throw new Error('Medicine notification is not active');
    }

    const patient = notification.patientId;
    
    if (!patient.phoneNumber || !validatePhoneNumber(patient.phoneNumber)) {
      throw new Error('Invalid or missing phone number');
    }

    // Get doctor name from prescription or use default
    let doctorName = 'MedAlert System';
    if (notification.prescriptionId && notification.prescriptionId.doctorName) {
      doctorName = notification.prescriptionId.doctorName;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    let message = '';
    if (reminderType === 'reminder') {
      message = `⏰ Medicine Reminder (30 min advance)\n\nHi ${patient.name},\n\nYou have a medicine scheduled in 30 minutes:\n\n💊 ${notification.medicineName} (${notification.dosage})\n⏰ Time: ${currentTime}\n${notification.foodTiming ? `🍽️ ${notification.foodTiming} food` : ''}\n${notification.instructions ? `📝 ${notification.instructions}` : ''}\n\nPlease prepare your medicine. Stay healthy! 💚\n\n- MedAlert Team`;
    } else {
      message = `💊 Medicine Time!\n\nHi ${patient.name},\n\nIt's time to take your medicine:\n\n💊 ${notification.medicineName} (${notification.dosage})\n⏰ Time: ${currentTime}\n${notification.foodTiming ? `🍽️ ${notification.foodTiming} food` : ''}\n${notification.instructions ? `📝 ${notification.instructions}` : ''}\n\nTake care and stay healthy! 💚\n\n- MedAlert Team`;
    }
    
    const smsResult = await sendMedicationReminder(
      patient.phoneNumber,
      patient.name,
      notification.medicineName,
      notification.dosage,
      notification.frequency,
      doctorName
    );

    if (smsResult.success) {
      // Record the notification
      notification.notificationsSent.push({
        scheduledTime: now,
        notificationType: reminderType,
        status: 'sent',
        messageId: smsResult.messageId
      });
      await notification.save();
      
      return {
        success: true,
        message: `${reminderType === 'reminder' ? 'Advance' : 'Medicine'} reminder sent to ${patient.name}`
      };
    } else {
      return {
        success: false,
        error: smsResult.error
      };
    }
  } catch (error) {
    console.error('Error sending immediate medicine reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendPatientMedicineReminders,
  schedulePatientMedicineReminders,
  sendImmediateMedicineReminder
};
