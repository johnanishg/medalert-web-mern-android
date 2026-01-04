import Caretaker from '../models/Caretaker.js';
import { sendGeneralNotification, validatePhoneNumber } from './twilioService.js';

/**
 * Notify caretaker when a patient misses a medication dose
 * @param {Object} patient - Patient document
 * @param {Object} medicine - Medicine object from patient's currentMedications
 * @param {Date} scheduledTime - When the dose was scheduled
 * @param {Date} missedTime - When the dose was marked as missed (current time)
 * @returns {Promise<Object>} - Notification result
 */
export const notifyCaretakerMissedDose = async (patient, medicine, scheduledTime, missedTime) => {
  try {
    // Check if patient has a selected caretaker
    if (!patient.selectedCaretaker || !patient.selectedCaretaker.caretakerId) {
      console.log(`⚠️  Patient ${patient.name} does not have a selected caretaker`);
      return {
        success: false,
        message: 'No caretaker assigned'
      };
    }

    // Find the caretaker
    const caretaker = await Caretaker.findById(patient.selectedCaretaker.caretakerId);
    if (!caretaker) {
      console.log(`⚠️  Caretaker not found for patient ${patient.name}`);
      return {
        success: false,
        message: 'Caretaker not found'
      };
    }

    // Format scheduled time
    const scheduledTimeStr = scheduledTime 
      ? scheduledTime.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      : 'Unknown';

    // Format missed time
    const missedTimeStr = missedTime.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Create notification message
    const message = `Missed Medication Alert

Patient: ${patient.name}
Medicine: ${medicine.name} (${medicine.dosage})
Scheduled Time: ${scheduledTimeStr}
Missed At: ${missedTimeStr}

Please check on the patient and ensure they take their medication.
- MedAlert System`;

    // Try to get caretaker phone number
    // Note: Caretaker model doesn't have phoneNumber field yet
    // For now, we'll log the notification
    // In the future, you may want to add phoneNumber to Caretaker model
    // or use email notifications
    
    console.log(`📱 Would notify caretaker ${caretaker.name} (${caretaker.email}):`);
    console.log(`   ${message}`);

    // If caretaker has phone number in future, uncomment this:
    /*
    if (caretaker.phoneNumber && validatePhoneNumber(caretaker.phoneNumber)) {
      const result = await sendGeneralNotification(
        caretaker.phoneNumber,
        caretaker.name,
        message
      );
      return result;
    }
    */

    // For now, return success but log that notification would be sent
    return {
      success: true,
      messageId: 'logged',
      status: 'Notification logged (SMS not configured for caretakers yet)',
      caretakerName: caretaker.name,
      caretakerEmail: caretaker.email
    };

  } catch (error) {
    console.error('Error in notifyCaretakerMissedDose:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  notifyCaretakerMissedDose
};

