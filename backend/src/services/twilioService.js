import twilio from 'twilio';

// Lazy initialization - client will be initialized on first use or when initializeTwilio() is called
let client = null;
let initialized = false;

// Get environment variables (will be available after dotenv.config() is called)
const getTwilioConfig = () => {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim(),
    authToken: process.env.TWILIO_AUTH_TOKEN?.trim(),
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim()
  };
};

// Initialize Twilio client - call this after .env is loaded
export const initializeTwilio = () => {
  if (initialized) return;
  
  const { accountSid, authToken, twilioPhoneNumber } = getTwilioConfig();
  
  // Debug logging
  console.log('🔍 Twilio Configuration Check:');
  console.log('   TWILIO_ACCOUNT_SID:', accountSid ? `Found (${accountSid.length} chars)` : 'MISSING');
  console.log('   TWILIO_AUTH_TOKEN:', authToken ? `Found (${authToken.length} chars)` : 'MISSING');
  console.log('   TWILIO_PHONE_NUMBER:', twilioPhoneNumber ? `Found (${twilioPhoneNumber})` : 'MISSING');

  // Initialize Twilio client only if credentials are properly configured
  if (accountSid && authToken && twilioPhoneNumber && 
      accountSid.startsWith('AC') && 
      accountSid !== 'your_twilio_account_sid_here' &&
      accountSid !== 'your-twilio-account-sid') {
    try {
      client = twilio(accountSid, authToken);
      console.log('✅ Twilio client initialized successfully');
      initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Twilio client:', error.message);
      client = null;
      initialized = true;
    }
  } else {
    console.log('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
    if (!accountSid) {
      console.log('   ❌ TWILIO_ACCOUNT_SID is missing or empty');
    } else if (!accountSid.startsWith('AC')) {
      console.log(`   ❌ TWILIO_ACCOUNT_SID should start with 'AC', got: ${accountSid.substring(0, 5)}...`);
    } else if (accountSid === 'your_twilio_account_sid_here' || accountSid === 'your-twilio-account-sid') {
      console.log('   ❌ TWILIO_ACCOUNT_SID contains placeholder value');
    }
    if (!authToken) {
      console.log('   ❌ TWILIO_AUTH_TOKEN is missing or empty');
    }
    if (!twilioPhoneNumber) {
      console.log('   ❌ TWILIO_PHONE_NUMBER is missing or empty');
    } else if (!twilioPhoneNumber.startsWith('+')) {
      console.log(`   ❌ TWILIO_PHONE_NUMBER should start with '+', got: ${twilioPhoneNumber}`);
    }
    console.log('   📝 Please update backend/.env file with your Twilio credentials:');
    console.log('      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('      TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.log('      TWILIO_PHONE_NUMBER=+1234567890');
    initialized = true;
  }
};

// Get or initialize client (lazy initialization on first use)
const getClient = () => {
  if (!initialized) {
    initializeTwilio();
  }
  return client;
};

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
    const twilioClient = getClient();
    const { twilioPhoneNumber } = getTwilioConfig();
    
    // Check if Twilio client is available
    if (!twilioClient || !twilioPhoneNumber) {
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

    const result = await twilioClient.messages.create({
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
    const twilioClient = getClient();
    const { twilioPhoneNumber } = getTwilioConfig();
    
    // Check if Twilio client is available
    if (!twilioClient || !twilioPhoneNumber) {
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

    const result = await twilioClient.messages.create({
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
    const twilioClient = getClient();
    const { twilioPhoneNumber } = getTwilioConfig();
    
    // Check if Twilio client is available
    if (!twilioClient || !twilioPhoneNumber) {
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

    const result = await twilioClient.messages.create({
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
