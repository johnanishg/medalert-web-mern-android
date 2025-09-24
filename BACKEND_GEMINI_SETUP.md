# Backend Gemini API Configuration Guide

This guide explains how to configure the Gemini API through the backend server, which is the recommended approach for production deployments.

## 🎯 Overview

The chatbot now uses a **backend-based architecture** where:
- **Backend**: Handles Gemini API calls and manages the API key securely
- **Android App**: Communicates with the backend via REST API
- **Benefits**: Better security, centralized configuration, easier management

## 🔧 Backend Setup

### 1. Install Dependencies

First, install the required dependencies in the backend:

```bash
cd backend
npm install @google/generative-ai
```

### 2. Environment Configuration

Create or update your `.env` file in the backend directory:

```bash
# Add this to your backend/.env file
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

**To get your Gemini API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file

### 3. Backend Files Created

The following files have been created for the backend integration:

#### `backend/src/services/geminiService.js`
- Core Gemini AI service
- Handles API calls to Google's Gemini API
- Manages safety settings and content filtering
- Provides context-aware responses

#### `backend/src/routes/chatbotRoutes.js`
- REST API endpoints for chatbot functionality
- `/api/chatbot/status` - Check if chatbot is available
- `/api/chatbot/message` - Send message to chatbot
- `/api/chatbot/analyze` - Get health analysis

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will now include the chatbot endpoints at:
- `GET /api/chatbot/status`
- `POST /api/chatbot/message`
- `POST /api/chatbot/analyze`

## 📱 Android App Configuration

### 1. Remove Direct Gemini Dependency

The Android app no longer needs direct Gemini API integration. The dependency has been updated to use the backend API instead.

### 2. Updated Files

#### `GeminiService.kt` (Updated)
- Now communicates with backend API instead of direct Gemini calls
- Uses `ChatbotApiService` for HTTP requests
- Maintains the same interface for the UI

#### `ChatbotApiService.kt` (New)
- Retrofit interface for backend API calls
- Defines request/response models
- Handles HTTP communication

#### `NetworkModule.kt` (Updated)
- Added `ChatbotApiService` provider
- Updated `GeminiService` to use backend API

## 🚀 Testing the Setup

### 1. Test Backend API

```bash
# Test if chatbot is available
curl http://localhost:5000/api/chatbot/status

# Expected response:
{
  "success": true,
  "available": true,
  "message": "Chatbot is available"
}
```

### 2. Test Chatbot Message

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can you help me?",
    "context": {
      "dashboardType": "patient",
      "userInfo": {"name": "Test User"},
      "currentData": {},
      "availableFeatures": ["Medication Management"]
    },
    "chatHistory": []
  }'
```

### 3. Test Android App

1. **Build and run** the Android app
2. **Navigate to dashboard** and tap the AI Assistant icon (🤖)
3. **Check logs** for successful API communication
4. **Send a test message** to verify functionality

## 🔒 Security Benefits

### API Key Security
- ✅ **Backend-only**: API key never exposed to client apps
- ✅ **Environment variables**: Secure key storage
- ✅ **Server-side validation**: All AI processing on server
- ✅ **Rate limiting**: Can be implemented on backend
- ✅ **Logging**: Centralized request logging

### Content Safety
- ✅ **Server-side filtering**: Content safety on backend
- ✅ **Medical disclaimers**: Built into system prompts
- ✅ **Professional guidance**: Healthcare-focused responses only

## 📊 API Endpoints

### GET `/api/chatbot/status`
Check if the chatbot service is available.

**Response:**
```json
{
  "success": true,
  "available": true,
  "message": "Chatbot is available"
}
```

### POST `/api/chatbot/message`
Send a message to the chatbot.

**Request:**
```json
{
  "message": "User's message",
  "context": {
    "dashboardType": "patient",
    "userInfo": {"name": "John Doe"},
    "currentData": {...},
    "availableFeatures": [...]
  },
  "chatHistory": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response text"
}
```

### POST `/api/chatbot/analyze`
Get comprehensive health analysis.

**Request:**
```json
{
  "context": {
    "dashboardType": "patient",
    "userInfo": {...},
    "currentData": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comprehensive health analysis..."
}
```

## 🛠️ Troubleshooting

### Backend Issues

1. **"Gemini API key not found"**
   - Check `.env` file has `GEMINI_API_KEY` set
   - Restart the backend server
   - Verify the API key is valid

2. **"Chatbot is not available"**
   - Check backend logs for errors
   - Verify Gemini API key is working
   - Test API key at Google AI Studio

3. **Network errors**
   - Check backend is running on correct port
   - Verify Android app API URL configuration
   - Check firewall settings

### Android App Issues

1. **"AI Assistant Unavailable"**
   - Check backend is running
   - Verify API endpoints are accessible
   - Check network connectivity

2. **Message sending fails**
   - Check backend logs
   - Verify API key configuration
   - Test with curl commands

## 🔄 Migration from Direct API

If you were using the direct Gemini API integration:

1. **Remove** the direct Gemini dependency from `build.gradle`
2. **Update** the API key configuration to use backend
3. **Test** the new backend-based implementation
4. **Deploy** with backend API key configuration

## 📈 Production Deployment

### Environment Variables
```bash
# Production .env
GEMINI_API_KEY=your-production-api-key
NODE_ENV=production
PORT=5000
```

### Security Considerations
- Use environment variables for API keys
- Implement rate limiting on backend
- Add request logging and monitoring
- Use HTTPS in production
- Consider API key rotation

## ✅ Benefits of Backend Approach

1. **Security**: API keys never exposed to client
2. **Centralized**: Single point of configuration
3. **Scalable**: Can handle multiple clients
4. **Maintainable**: Easier to update and manage
5. **Monitoring**: Centralized logging and analytics
6. **Rate Limiting**: Can implement usage controls

The backend-based approach provides better security, scalability, and maintainability for the MedAlert chatbot feature!
