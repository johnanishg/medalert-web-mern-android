# ngrok Setup for MedAlert

## 🎯 Goal
Set up a stable tunnel URL that works from any network (not just same Wi-Fi).

## ⚠️ Important: ngrok URL Options

### Option 1: Free ngrok (Random URL each time)
- **Cost:** Free
- **Stability:** URL changes each time you restart ngrok
- **Solution:** Use script to extract URL automatically

### Option 2: Paid ngrok (Stable Reserved Domain) ⭐ RECOMMENDED
- **Cost:** $8/month
- **Stability:** Same URL every time (e.g., `medalert.ngrok.io`)
- **Best for:** Production testing and reliable Android app connection

## 🚀 Quick Setup

### Step 1: Configure ngrok (First Time Only)

1. **Sign up for ngrok account:**
   - Go to https://ngrok.com/signup
   - Create a free account

2. **Get your auth token:**
   - After signing up, go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### Step 2: Choose Your Setup

#### A. Free ngrok (Random URL - Manual Update)

1. **Start backend with ngrok:**
   ```bash
   npm run backend:ngrok
   ```

2. **Copy the ngrok URL** from the terminal output:
   - Look for: `Forwarding  https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:5000`

3. **Update Android app:**
   - Edit `android-app/app/build.gradle`
   - Update `API_BASE_URL` with the ngrok URL:
     ```gradle
     buildConfigField "String", "API_BASE_URL", '"https://xxxx-xxxx-xxxx.ngrok-free.app/api/"'
     ```

4. **Rebuild Android app:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

⚠️ **Note:** You'll need to update the Android app URL each time you restart ngrok!

#### B. Paid ngrok (Stable URL) ⭐ RECOMMENDED

1. **Upgrade to ngrok paid plan:**
   - Go to https://dashboard.ngrok.com/billing
   - Upgrade to paid plan ($8/month)

2. **Reserve a domain:**
   - Go to https://dashboard.ngrok.com/cloud-edge/domains
   - Click "Reserve Domain"
   - Choose a domain like: `medalert.ngrok.io`

3. **Update package.json:**
   ```json
   "tunnel:ngrok": "ngrok http 5000 --domain=medalert.ngrok.io"
   ```

4. **Update Android app once:**
   - Edit `android-app/app/build.gradle`
   - Set URL to your reserved domain:
     ```gradle
     buildConfigField "String", "API_BASE_URL", '"https://medalert.ngrok.io/api/"'
     ```

5. **Start backend:**
   ```bash
   npm run backend:ngrok
   ```

6. **Rebuild Android app once:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

✅ **Done!** The URL will never change, and your Android app will always connect.

## 📱 Current Android App Configuration

The Android app is currently set to use:
- **URL:** `http://192.168.29.72:5000/api/` (local network only)

To use ngrok, update it to:
- **Free ngrok:** `https://xxxx-xxxx-xxxx.ngrok-free.app/api/` (changes each time)
- **Paid ngrok:** `https://medalert.ngrok.io/api/` (stable)

## 🔧 Troubleshooting

### ngrok not connecting

1. **Check if ngrok is authenticated:**
   ```bash
   ngrok config check
   ```

2. **Re-authenticate if needed:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. **Check if port 5000 is in use:**
   ```bash
   lsof -i :5000
   ```

### Android app can't connect

1. **Verify ngrok is running:**
   - Check terminal for ngrok URL
   - Visit the URL in browser to test

2. **Check Android app URL:**
   - Ensure it matches the ngrok URL exactly
   - Include `/api/` at the end

3. **Rebuild Android app:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

### ngrok URL keeps changing (Free tier)

This is expected with free ngrok. Solutions:
1. **Upgrade to paid plan** for stable domain (recommended)
2. **Use script to auto-extract URL** (see below)
3. **Manually update Android app** each time

## 🛠️ Advanced: Auto-Extract ngrok URL

Create a script to automatically extract and display the ngrok URL:

```bash
# Start ngrok and extract URL
ngrok http 5000 --log=stdout 2>&1 | grep -oE "https://[a-z0-9-]+\.ngrok(-free)?\.app" | head -1
```

## 📊 Comparison

| Feature | Local IP | LocalTunnel | ngrok Free | ngrok Paid |
|---------|----------|-------------|------------|------------|
| Works from any network | ❌ | ✅ | ✅ | ✅ |
| Stable URL | ✅ | ❌ | ❌ | ✅ |
| Cost | Free | Free | Free | $8/month |
| Setup complexity | Easy | Easy | Medium | Medium |
| Reliability | High | Low | Medium | High |

## 🎯 Recommendation

For **reliable cross-network access**, use **ngrok paid plan** with a reserved domain:
- ✅ Stable URL (never changes)
- ✅ Works from any network
- ✅ Professional solution
- ✅ Worth the $8/month for development

For **testing/development**, free ngrok works but requires manual URL updates.


