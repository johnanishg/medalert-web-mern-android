# 🚀 Quick ngrok Setup - Get Your Stable URL

## Step 1: Configure ngrok (One-time setup)

1. **Sign up for ngrok:**
   - Go to: https://ngrok.com/signup
   - Create a free account (or paid for stable domain)

2. **Get your auth token:**
   - After signup, visit: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy the token (looks like: `2abc123def456ghi789jkl012mno345pq_678rst901uvw234xyz`)

3. **Configure ngrok on your system:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```
   Replace `YOUR_TOKEN_HERE` with the token you copied.

## Step 2: Choose Your Plan

### Option A: Free ngrok (URL changes each time) ⚠️

**For quick testing:**

1. **Start backend with ngrok:**
   ```bash
   npm run backend:ngrok
   ```

2. **Wait for ngrok to start**, then look for this line:
   ```
   Forwarding  https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:5000
   ```

3. **Copy the URL** (the `https://xxxx-xxxx-xxxx.ngrok-free.app` part)

4. **Update Android app:**
   - Edit: `android-app/app/build.gradle`
   - Find: `buildConfigField "String", "API_BASE_URL"`
   - Replace with your ngrok URL:
     ```gradle
     buildConfigField "String", "API_BASE_URL", '"https://xxxx-xxxx-xxxx.ngrok-free.app/api/"'
     ```

5. **Rebuild Android app:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

⚠️ **Problem:** You'll need to do steps 3-5 every time you restart ngrok!

---

### Option B: Paid ngrok (Stable URL) ⭐ RECOMMENDED

**Best for reliable Android app connection:**

1. **Upgrade to paid plan:**
   - Go to: https://dashboard.ngrok.com/billing
   - Upgrade to paid plan ($8/month)
   - Or use free trial if available

2. **Reserve a domain:**
   - Go to: https://dashboard.ngrok.com/cloud-edge/domains
   - Click "Reserve Domain"
   - Choose: `medalert.ngrok.io` (or any available name)

3. **Update package.json** (already done, but verify):
   ```json
   "tunnel:ngrok": "ngrok http 5000 --domain=medalert.ngrok.io"
   ```
   Replace `medalert.ngrok.io` with your reserved domain.

4. **Update Android app ONCE:**
   - Edit: `android-app/app/build.gradle`
   - Set:
     ```gradle
     buildConfigField "String", "API_BASE_URL", '"https://medalert.ngrok.io/api/"'
     ```
   Replace `medalert.ngrok.io` with your reserved domain.

5. **Rebuild Android app ONCE:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

6. **Start backend:**
   ```bash
   npm run backend:ngrok
   ```

✅ **Done!** The URL will never change. Your Android app will always connect!

---

## Step 3: Test Connection

1. **Start backend with ngrok:**
   ```bash
   npm run backend:ngrok
   ```

2. **Verify ngrok is working:**
   - Open browser: http://localhost:4040 (ngrok web interface)
   - Or check terminal for the forwarding URL

3. **Test the API:**
   - Visit your ngrok URL in browser: `https://your-url.ngrok.io/api`
   - Should see: `{"message":"MedAlert MongoDB API Server is running!",...}`

4. **Test from Android app:**
   - Build and install app
   - Try to login or make API call
   - Check logs if connection fails

---

## 🔧 Helper Scripts

### Get ngrok URL automatically:
```bash
./scripts/get-ngrok-url.sh
```

This will show you the current ngrok URL and the exact line to add to your Android app.

---

## 📱 Current Android App Status

The Android app is currently configured for:
- **Local network:** `http://192.168.29.72:5000/api/`

After setting up ngrok, update it to:
- **ngrok URL:** `https://your-ngrok-url/api/`

---

## ❓ FAQ

**Q: Why is my ngrok URL different each time?**  
A: Free ngrok assigns random URLs. Upgrade to paid for a stable domain.

**Q: Can I use LocalTunnel instead?**  
A: LocalTunnel doesn't guarantee subdomains. ngrok is more reliable.

**Q: How do I know if ngrok is working?**  
A: Visit http://localhost:4040 in your browser to see the ngrok dashboard.

**Q: My Android app still can't connect?**  
A: 
1. Verify ngrok URL is correct in build.gradle
2. Rebuild the app: `./gradlew clean assembleDebug`
3. Check ngrok is running: `npm run backend:ngrok`
4. Test URL in browser first

---

## 🎯 Next Steps

1. **Configure ngrok** (Step 1 above)
2. **Choose your plan** (Free or Paid)
3. **Update Android app** with ngrok URL
4. **Start backend:** `npm run backend:ngrok`
5. **Test connection** from Android app

For detailed information, see `NGROK_SETUP.md`.


