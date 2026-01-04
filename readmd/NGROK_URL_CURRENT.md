# Current ngrok URL

## 🌐 Active ngrok URL

**URL:** `https://rosalba-hatchable-unreversibly.ngrok-free.dev`

**Full API URL:** `https://rosalba-hatchable-unreversibly.ngrok-free.dev/api/`

## 📱 Android App Configuration

The Android app has been updated to use this URL in `android-app/app/build.gradle`.

## ⚠️ Important Notes

### Free ngrok URL Changes

With **free ngrok**, the URL changes **each time you restart ngrok**. 

**When the URL changes:**
1. Run `npm run backend:ngrok:auto` again
2. Copy the new URL
3. Update `android-app/app/build.gradle` with the new URL
4. Rebuild the app: `cd android-app && ./gradlew clean assembleDebug`

### For Stable URL (Recommended)

**Upgrade to ngrok paid plan ($8/month):**
1. Go to: https://dashboard.ngrok.com/billing
2. Upgrade to paid plan
3. Reserve domain: https://dashboard.ngrok.com/cloud-edge/domains
4. Use: `ngrok http 5000 --domain=your-domain.ngrok.io`
5. Update Android app **once** - URL never changes!

## 🚀 Quick Commands

```bash
# Start backend with ngrok (shows URL automatically)
npm run backend:ngrok:auto

# Get current ngrok URL
./scripts/get-ngrok-url.sh

# View ngrok dashboard
# Open: http://localhost:4040
```

## ✅ Current Status

- ✅ ngrok is configured and working
- ✅ Backend is accessible via ngrok URL
- ✅ Android app is configured with current URL
- ⚠️ URL will change when ngrok restarts (free tier)

## 🔄 When URL Changes

If you restart ngrok and get a new URL:

1. **Get new URL:**
   ```bash
   npm run backend:ngrok:auto
   # Or check: http://localhost:4040
   ```

2. **Update Android app:**
   - Edit: `android-app/app/build.gradle`
   - Update `API_BASE_URL` with new URL
   - Rebuild: `cd android-app && ./gradlew clean assembleDebug`

3. **Or upgrade to paid ngrok** for a stable URL that never changes!


