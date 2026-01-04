# MedAlert Development Guide

## 🚀 Quick Start

### For Local Development (Same Wi-Fi Network)

**Recommended for Android app development**

1. **Start backend:**
   ```bash
   npm run backend
   # or
   npm run backend:local
   ```

2. **Backend will be available at:**
   - Local: `http://localhost:5000/api`
   - Network: `http://192.168.29.72:5000/api` (for Android devices on same Wi-Fi)

3. **Android app is configured to use:** `http://192.168.29.72:5000/api/`

4. **Ensure:**
   - Android device is on the same Wi-Fi network
   - Firewall allows connections on port 5000
   - Backend is running before testing Android app

### For External Access (Tunnel)

**Use only when you need to test from different networks**

⚠️ **Warning:** Tunnel URLs change randomly, breaking Android app connection!

1. **Start backend with tunnel:**
   ```bash
   npm run backend:tunnel
   ```

2. **Tunnel URL will be displayed** (changes each time):
   - Example: `https://lucky-donkey-12.loca.lt`
   - ⚠️ This URL is NOT stable!

3. **If you need tunnel, update Android app manually:**
   - Edit `android-app/app/build.gradle`
   - Update `API_BASE_URL` with the new tunnel URL
   - Rebuild the app

## 📱 Android App Configuration

### Current Setup

The Android app is configured to use your local network IP:
- **URL:** `http://192.168.29.72:5000/api/`
- **Location:** `android-app/app/build.gradle`

### To Change Backend URL

1. **Edit:** `android-app/app/build.gradle`
2. **Find:** `buildConfigField "String", "API_BASE_URL"`
3. **Update with your desired URL:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", '"http://YOUR_IP:5000/api/"'
   ```
4. **Rebuild app:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

## 🔧 Troubleshooting

### Android App Can't Connect

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/api
   ```

2. **Check your IP address:**
   ```bash
   hostname -I | awk '{print $1}'
   ```

3. **Verify Android device is on same Wi-Fi:**
   - Settings → Wi-Fi → Check network name matches

4. **Check firewall:**
   ```bash
   sudo ufw status
   # If needed, allow port 5000:
   sudo ufw allow 5000
   ```

5. **Test connection from Android device:**
   - Open browser on Android
   - Navigate to: `http://192.168.29.72:5000/api`
   - Should see: `{"message":"MedAlert MongoDB API Server is running!",...}`

### Tunnel URL Keeps Changing

This is expected behavior with LocalTunnel. Solutions:

1. **Use local IP instead** (recommended for development)
2. **Use ngrok with reserved domain** (paid, see `TUNNEL_SETUP.md`)
3. **Update Android app URL manually** each time tunnel starts

## 📊 Environment Variables

All environment variables are loaded from `backend/.env`:
- ✅ `GCLOUD_PROJECT_ID` - Google Cloud project
- ✅ `GEMINI_API_KEY` - Gemini AI API key
- ✅ `JWT_SECRET` - JWT authentication secret
- ✅ `MONGODB_URI` - MongoDB connection string
- ⚠️ `TWILIO_*` - Optional (SMS notifications)

See `CREDENTIALS_NEEDED.md` for details.

## 🎯 Development Workflow

1. **Start backend:**
   ```bash
   npm run backend
   ```

2. **In another terminal, start frontend:**
   ```bash
   npm run dev
   ```

3. **Build and run Android app:**
   ```bash
   cd android-app
   ./gradlew assembleDebug
   # Install on device or emulator
   ```

4. **All services should be accessible:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api`
   - Android app: Uses `http://192.168.29.72:5000/api`

## 🔐 Security Notes

- **Development:** Using local IP is fine
- **Production:** Use HTTPS with proper domain
- **Tunnel:** Not secure for production (use only for testing)

## 📝 Notes

- Local IP (`192.168.29.72`) may change if you reconnect to Wi-Fi
- If IP changes, update Android app `build.gradle` and rebuild
- Tunnel is unreliable for Android app development
- Local network is fastest and most reliable for development


