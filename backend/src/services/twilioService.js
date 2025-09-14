import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are properly configured
let client = null;
if (accountSid && authToken && twilioPhoneNumber && 
    accountSid.startsWith('AC') && 
    accountSid !== 'your_twilio_account_sid_here') {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    client = null;
  }
} else {
  console.log('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
  console.log('   Please update .env file with your Twilio credentials:');
  console.log('   - TWILIO_ACCOUNT_SID (starts with AC)');
  console.log('   - TWILIO_AUTH_TOKEN');
  console.log('   - TWILIO_PHONE_NUMBER (starts with +)');
}

/**
 * Send medication reminder SMS to patient
 * @param {string} phoneNumber - Patient's phone number (10 digits)
 * @param {string} patientName - Patient's name
 * @param {string} medicineName - Medicine name
 * @param {string} dosage - Medicine dosage
 * @param {string} frequency - Medicine frequency
 * @param {string} doctorName - Doctor's name
 * @returns {Promise<Object>} - Twilio message result
 */
export const sendMedicationReminder = async (phoneNumber, patientName, medicineName, dosage, frequency, doctorName) => {
  try {
    // Check if Twilio client is available
    if (!client) {
      console.log('📱 SMS not sent - Twilio not configured. Would have sent:');
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message: Medication reminder for ${medicineName}`);
      return {
        success: true,
        messageId: 'simulated',
        status: 'simulated - Twilio not configured'
      };
    }

    // Format phone number to international format (assuming India +91)
    let formattedPhoneNumber = phoneNumber;
    
    // Remove any non-digit characters first
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 (India country code)
    if (cleanNumber.length === 10) {
      formattedPhoneNumber = `+91${cleanNumber}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      // If it's 12 digits starting with 91, just add +
      formattedPhoneNumber = `+${cleanNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      // If it doesn't start with +, add +91
      formattedPhoneNumber = `+91${cleanNumber}`;
    }
    
    console.log(`📱 Formatting phone number: ${phoneNumber} → ${formattedPhoneNumber}`);
    
    const message = `Medicine Reminder
Hi ${patientName},
Time to take your ${medicineName} (${dosage})
When: ${frequency}
Prescribed by: Dr. ${doctorName}
- MedAlert`;

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber
    });

    console.log('Medication reminder sent successfully:', result.sid);
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };

  } catch (error) {
    console.error('Error sending medication reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send appointment reminder SMS
 * @param {string} phoneNumber - Patient's phone number
 * @param {string} patientName - Patient's name
 * @param {string} appointmentDate - Appointment date
 * @param {string} doctorName - Doctor's name
 * @returns {Promise<Object>} - Twilio message result
 */
export const sendAppointmentReminder = async (phoneNumber, patientName, appointmentDate, doctorName) => {
  try {
    // Check if Twilio client is available
    if (!client) {
      console.log('📱 SMS not sent - Twilio not configured. Would have sent:');
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message: Appointment reminder for ${appointmentDate}`);
      return {
        success: true,
        messageId: 'simulated',
        status: 'simulated - Twilio not configured'
      };
    }

    // Format phone number to international format (assuming India +91)
    let formattedPhoneNumber = phoneNumber;
    
    // Remove any non-digit characters first
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 (India country code)
    if (cleanNumber.length === 10) {
      formattedPhoneNumber = `+91${cleanNumber}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      // If it's 12 digits starting with 91, just add +
      formattedPhoneNumber = `+${cleanNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      // If it doesn't start with +, add +91
      formattedPhoneNumber = `+91${cleanNumber}`;
    }
    
    console.log(`📱 Formatting phone number: ${phoneNumber} → ${formattedPhoneNumber}`);
    
    const message = `Appointment Reminder
Hi ${patientName},
You have an appointment scheduled:
Date: ${appointmentDate}
Doctor: Dr. ${doctorName}
Please arrive 15 minutes early.
- MedAlert`;

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber
    });

    console.log('Appointment reminder sent successfully:', result.sid);
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };

  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send general notification SMS
 * @param {string} phoneNumber - Patient's phone number
 * @param {string} patientName - Patient's name
 * @param {string} message - Custom message
 * @returns {Promise<Object>} - Twilio message result
 */
export const sendGeneralNotification = async (phoneNumber, patientName, message) => {
  try {
    // Check if Twilio client is available
    if (!client) {
      console.log('📱 SMS not sent - Twilio not configured. Would have sent:');
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message: ${message}`);
      return {
        success: true,
        messageId: 'simulated',
        status: 'simulated - Twilio not configured'
      };
    }

    // Format phone number to international format (assuming India +91)
    let formattedPhoneNumber = phoneNumber;
    
    // Remove any non-digit characters first
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 (India country code)
    if (cleanNumber.length === 10) {
      formattedPhoneNumber = `+91${cleanNumber}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      // If it's 12 digits starting with 91, just add +
      formattedPhoneNumber = `+${cleanNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      // If it doesn't start with +, add +91
      formattedPhoneNumber = `+91${cleanNumber}`;
    }
    
    console.log(`📱 Formatting phone number: ${phoneNumber} → ${formattedPhoneNumber}`);
    
    const fullMessage = `MedAlert Notification
Hi ${patientName},
${message}
- MedAlert Team`;

    const result = await client.messages.create({
      body: fullMessage,
      from: twilioPhoneNumber,
      to: formattedPhoneNumber
    });

    console.log('General notification sent successfully:', result.sid);
    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };

  } catch (error) {
    console.error('Error sending general notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate phone number format (10 digits)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether phone number is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  return cleanNumber.length === 10;
};

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 10) {
    return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  }
  
  return phoneNumber;
};

export default {
  sendMedicationReminder,
  sendAppointmentReminder,
  sendGeneralNotification,
  validatePhoneNumber,
  formatPhoneNumber
};
