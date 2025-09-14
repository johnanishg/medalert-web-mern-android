import cron from 'node-cron';
import { sendMedicationReminder } from './twilioService.js';
import Patient from '../models/Patient.js';

/**
 * Schedule medication reminders based on frequency
 * @param {Object} medication - Medication object with frequency and patient info
 */
export const scheduleMedicationReminder = (medication) => {
  const { frequency, patientName, patientPhone, medicineName, dosage, doctorName } = medication;
  
  // Parse frequency to determine schedule
  let cronExpression = '';
  
  if (frequency.toLowerCase().includes('daily') || frequency.toLowerCase().includes('once')) {
    // Daily at 9 AM
    cronExpression = '0 9 * * *';
  } else if (frequency.toLowerCase().includes('twice') || frequency.toLowerCase().includes('2 times')) {
    // Twice daily at 9 AM and 9 PM
    cronExpression = '0 9,21 * * *';
  } else if (frequency.toLowerCase().includes('three') || frequency.toLowerCase().includes('3 times')) {
    // Three times daily at 8 AM, 2 PM, and 8 PM
    cronExpression = '0 8,14,20 * * *';
  } else if (frequency.toLowerCase().includes('four') || frequency.toLowerCase().includes('4 times')) {
    // Four times daily at 8 AM, 12 PM, 4 PM, and 8 PM
    cronExpression = '0 8,12,16,20 * * *';
  } else {
    // Default to daily at 9 AM
    cronExpression = '0 9 * * *';
  }
  
  // Schedule the reminder
  const task = cron.schedule(cronExpression, async () => {
    try {
      console.log(`Sending medication reminder for ${medicineName} to ${patientName}`);
      
      const result = await sendMedicationReminder(
        patientPhone,
        patientName,
        medicineName,
        dosage,
        frequency,
        doctorName
      );
      
      if (result.success) {
        console.log(`Medication reminder sent successfully to ${patientName}`);
      } else {
        console.error(`Failed to send medication reminder to ${patientName}:`, result.error);
      }
    } catch (error) {
      console.error('Error in medication reminder scheduler:', error);
    }
  }, {
    scheduled: false, // Don't start immediately
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  return task;
};

/**
 * Schedule reminders for all active medications of a patient
 * @param {string} patientId - Patient ID
 */
export const scheduleAllPatientMedications = async (patientId) => {
  try {
    const patient = await Patient.findById(patientId);
    
    if (!patient || !patient.currentMedications) {
      console.log(`No medications found for patient ${patientId}`);
      return;
    }
    
    // Schedule reminders for each medication
    patient.currentMedications.forEach((medication, index) => {
      const reminderData = {
        frequency: medication.frequency,
        patientName: patient.name,
        patientPhone: patient.phoneNumber,
        medicineName: medication.name,
        dosage: medication.dosage,
        doctorName: medication.prescribedBy
      };
      
      const task = scheduleMedicationReminder(reminderData);
      task.start();
      
      console.log(`Scheduled reminder for ${medication.name} for patient ${patient.name}`);
    });
    
  } catch (error) {
    console.error('Error scheduling patient medications:', error);
  }
};

/**
 * Stop all medication reminders for a patient
 * @param {string} patientId - Patient ID
 */
export const stopPatientMedicationReminders = (patientId) => {
  // This would require storing task references, which we'll implement later
  console.log(`Stopping medication reminders for patient ${patientId}`);
};

export default {
  scheduleMedicationReminder,
  scheduleAllPatientMedications,
  stopPatientMedicationReminders
};
