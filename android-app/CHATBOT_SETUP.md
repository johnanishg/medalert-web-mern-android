# MedAlert Android Chatbot Setup

This document explains how to set up the AI chatbot feature in the MedAlert Android app using Google's Gemini API.

## Prerequisites

1. A Google account
2. Access to Google AI Studio
3. Android Studio with the project set up

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Configuration

### Method 1: Build Configuration (Recommended for Development)

1. Open `android-app/app/build.gradle`
2. Find the `buildTypes` section
3. Update the `GEMINI_API_KEY` field in both debug and release configurations:

```gradle
buildTypes {
    debug {
        buildConfigField "String", "API_BASE_URL", '"http://192.168.29.72:5000/api/"'
        buildConfigField "String", "GEMINI_API_KEY", '"your-actual-api-key-here"'
    }
    release {
        buildConfigField "String", "API_BASE_URL", '"http://127.0.0.1:5000/api/"'
        buildConfigField "String", "GEMINI_API_KEY", '"your-actual-api-key-here"'
    }
}
```

4. Replace `"your-actual-api-key-here"` with your actual Gemini API key
5. Sync the project

### Method 2: Environment Variables (For Production)

For production builds, consider using environment variables or secure storage:

1. Create a `local.properties` file in the android-app directory (if not exists)
2. Add your API key:

```properties
GEMINI_API_KEY=your-actual-api-key-here
```

3. Update the build.gradle to read from local.properties:

```gradle
def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

buildTypes {
    debug {
        buildConfigField "String", "GEMINI_API_KEY", "\"${localProperties.getProperty('GEMINI_API_KEY', 'your-gemini-api-key-here')}\""
    }
}
```

## Features

The chatbot provides:

- **Context-aware assistance** based on the patient dashboard
- **MedAlert-specific guidance** for healthcare management
- **Real-time help** with system navigation
- **Data interpretation** for medicines, appointments, and notifications
- **Health analysis** with comprehensive insights
- **Multi-language support** (English, Hindi, Kannada)

## Usage

1. Open the MedAlert Android app
2. Navigate to the dashboard
3. Tap the AI Assistant icon (🤖) in the top navigation
4. Start chatting with the AI assistant
5. Use quick action buttons for common queries:
   - **Adherence**: Analyze medication adherence patterns
   - **History**: Review medical history and diagnoses
   - **Schedule**: Optimize medication schedule
   - **Trends**: Analyze health trends

## Chatbot Capabilities

### Patient Dashboard Assistance
- Medicine management guidance
- Notification setup help
- Visit history explanation
- Caretaker management
- Adherence tracking insights

### Health Analysis
- Medication pattern analysis
- Adherence rate calculations
- Health trend identification
- Medical history insights
- Lifestyle recommendations

### System Navigation
- Feature explanations
- Usage guidance
- Troubleshooting help
- Best practices

## Troubleshooting

### Chatbot Shows "AI Assistant Unavailable"

1. **Check API Key Configuration**:
   - Verify the API key is correctly set in build.gradle
   - Ensure the key is valid and active
   - Check for typos in the configuration

2. **Network Connectivity**:
   - Ensure the device has internet access
   - Check if the API key has proper permissions

3. **Build Configuration**:
   - Clean and rebuild the project
   - Verify BuildConfig is generated correctly
   - Check if the API key is being read properly

### Common Issues

1. **API Key Not Working**:
   - Verify the key is from Google AI Studio
   - Check if the key has expired
   - Ensure the key has proper permissions

2. **Network Errors**:
   - Check internet connectivity
   - Verify firewall settings
   - Test with a different network

3. **Build Errors**:
   - Clean and rebuild the project
   - Check for dependency conflicts
   - Verify all imports are correct

## Security Considerations

- **Never commit API keys to version control**
- Use environment variables for production
- Consider using secure storage for sensitive keys
- Regularly rotate API keys
- Monitor API usage and costs

## Dependencies

The chatbot feature uses the following dependencies:

```gradle
implementation 'com.google.ai.client.generativeai:generativeai:0.2.2'
```

## Support

If you encounter issues:

1. Check the Android logs for error messages
2. Verify the API key configuration
3. Test with a simple message first
4. Check network connectivity
5. Review the Gemini API documentation

## API Usage and Costs

- The Gemini API has usage limits and costs
- Monitor your usage in Google AI Studio
- Consider implementing rate limiting for production
- Set up billing alerts if needed

## Future Enhancements

- Voice input support
- Image analysis for medication identification
- Offline mode with cached responses
- Custom training for MedAlert-specific responses
- Integration with wearable devices
