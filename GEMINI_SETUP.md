# Gemini AI Chatbot Setup

## Getting Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Environment Configuration

Create a `.env` file in the root directory with:

```
VITE_GEMINI_API_KEY=your-actual-api-key-here
```

Replace `your-actual-api-key-here` with the API key you obtained from Google AI Studio.

## Features

The chatbot provides:
- **Context-aware assistance** based on your current dashboard
- **MedAlert-specific guidance** for healthcare management
- **Real-time help** with system navigation
- **Data interpretation** for medicines, appointments, and notifications

## Dashboard-Specific Help

### Patient Dashboard
- Medicine management guidance
- Notification setup help
- Visit history explanation
- Caretaker management

### Doctor Dashboard
- Patient search assistance
- Medicine prescription guidance
- Patient data interpretation
- System navigation help

### Admin Dashboard
- User management guidance
- System administration help
- Approval process assistance
- Data overview explanation

## Usage

1. Click the chat icon in the bottom-right corner
2. Ask questions about your dashboard or MedAlert features
3. Get contextual help based on your current role and data

## Troubleshooting

If the chatbot shows "AI Assistant Unavailable":
1. Check that your `.env` file exists and contains the correct API key
2. Restart the development server after adding the API key
3. Verify the API key is valid at Google AI Studio