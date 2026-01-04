# Network Connectivity Troubleshooting Guide

## Current Status
- ✅ Backend is running on port 5000
- ✅ ngrok tunnel is active: `https://rosalba-hatchable-unreversibly.ngrok-free.dev`
- ✅ API endpoint is accessible from server
- ❌ Android app cannot connect: "No route to host"

## Common Causes & Solutions

### 1. ngrok Free Tier Browser Warning Page

**Problem:** Free ngrok URLs show a browser warning page that must be accepted before API calls work.

**Solution:**
1. Open the ngrok URL in a browser on your computer:
   ```
   https://rosalba-hatchable-unreversibly.ngrok-free.dev
   ```
2. Click "Visit Site" to bypass the warning
3. This enables API access for a period of time

**Better Solution:** Upgrade to ngrok paid plan to remove the warning page requirement.

### 2. Network Connectivity Issues

**Check if Android device can reach ngrok:**
1. On your Android device, open a browser
2. Navigate to: `https://rosalba-hatchable-unreversibly.ngrok-free.dev`
3. If it doesn't load, check:
   - Device is connected to internet (Wi-Fi or mobile data)
   - No firewall blocking HTTPS connections
   - VPN is not interfering

### 3. ngrok URL Changed (Free Tier)

**Problem:** Free ngrok URLs change each time you restart ngrok.

**Check current URL:**
```bash
./scripts/get-ngrok-url.sh
```

**Update Android app:**
1. Edit `android-app/app/build.gradle`
2. Update `API_BASE_URL` with new URL
3. Rebuild: `cd android-app && ./gradlew clean assembleDebug`

### 4. Android App Configuration

**Verify the app is using correct URL:**
- Check logs: Look for `"Using API URL from BuildConfig: ..."`
- Should show: `https://rosalba-hatchable-unreversibly.ngrok-free.dev/api/`

**If URL is wrong:**
1. Edit `android-app/app/build.gradle`
2. Update both `debug` and `release` buildConfigField
3. Rebuild the app

### 5. Timeout Issues

**Current timeout settings:**
- Connect timeout: 30 seconds
- Read timeout: 30 seconds
- Write timeout: 30 seconds

**If timeouts occur:**
- Check backend logs for slow responses
- Verify ngrok tunnel is stable
- Consider increasing timeout values in `NetworkModule.kt`

### 6. SSL/Certificate Issues

**Problem:** Android might reject ngrok's SSL certificate.

**Solution:** This is usually handled automatically, but if issues persist:
- Ensure device date/time is correct
- Clear app data and reinstall
- Check Android security settings

## Quick Diagnostic Steps

### Step 1: Verify Backend is Running
```bash
curl http://localhost:5000/api/
# Should return: {"message":"Route not found"}
```

### Step 2: Verify ngrok is Running
```bash
curl -s http://localhost:4040/api/tunnels | grep public_url
# Should show the ngrok URL
```

### Step 3: Test ngrok URL from Server
```bash
curl https://rosalba-hatchable-unreversibly.ngrok-free.dev/api/
# Should return: {"message":"Route not found"}
```

### Step 4: Test from Android Device Browser
1. Open browser on Android device
2. Navigate to: `https://rosalba-hatchable-unreversibly.ngrok-free.dev`
3. Accept ngrok warning if shown
4. Should see backend response or ngrok page

### Step 5: Check Android App Logs
Look for these log messages:
- `NetworkModule: Using API URL from BuildConfig: ...`
- `PatientRepository: Fetching patient profile for user: ...`
- Any connection errors or timeouts

## Recommended Solutions

### Option 1: Accept ngrok Warning Page (Quick Fix)
1. Open ngrok URL in browser
2. Click "Visit Site"
3. Try Android app again

### Option 2: Use Local Network (If on Same Wi-Fi)
1. Find your computer's local IP: `ip addr show` or `ifconfig`
2. Update Android app to use: `http://YOUR_LOCAL_IP:5000/api/`
3. Rebuild app
4. **Note:** Only works if device is on same Wi-Fi network

### Option 3: Upgrade to ngrok Paid Plan (Best Solution)
1. Go to https://dashboard.ngrok.com/billing
2. Upgrade to paid plan ($8/month)
3. Reserve a domain: https://dashboard.ngrok.com/cloud-edge/domains
4. Update `package.json`: `"tunnel:ngrok": "ngrok http 5000 --domain=your-domain.ngrok.io"`
5. Update Android app once with stable URL
6. **Benefit:** No warning page, stable URL, better reliability

## Current Configuration

**Backend:** Running on port 5000
**ngrok URL:** `https://rosalba-hatchable-unreversibly.ngrok-free.dev`
**Android App URL:** `https://rosalba-hatchable-unreversibly.ngrok-free.dev/api/`

## Next Steps

1. **Immediate:** Open ngrok URL in browser and accept warning page
2. **Short-term:** Test Android app connection
3. **Long-term:** Consider upgrading to ngrok paid plan for stable URL

## Still Having Issues?

1. Check backend logs: `/tmp/medalert-backend.log`
2. Check ngrok logs: `/tmp/medalert-ngrok.log`
3. Check Android logcat for detailed error messages
4. Verify network connectivity from Android device
5. Test API endpoint directly from device browser

