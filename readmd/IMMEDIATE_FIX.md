# 🚨 Immediate Fix for LocalTunnel Issue

## The Problem

LocalTunnel **does NOT guarantee** the subdomain `medalert123`. It only works the first time, then assigns random URLs like:
- `https://cuddly-mule-23.loca.lt` 
- `https://serious-penguin-33.loca.lt`

This breaks your Android app because it's hardcoded to `medalert123.loca.lt`.

## ✅ Solution: Switch to ngrok

ngrok is more reliable and offers stable domains.

### Step 1: Configure ngrok (One-time, 2 minutes)

1. **Sign up:** https://ngrok.com/signup (free account is fine)
2. **Get token:** https://dashboard.ngrok.com/get-started/your-authtoken
3. **Configure:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### Step 2: Start Backend with ngrok

**Option A: Auto-extract URL (Easiest)**
```bash
npm run backend:ngrok:auto
```
This will automatically show you the ngrok URL.

**Option B: Manual**
```bash
npm run backend:ngrok
```
Then in another terminal:
```bash
./scripts/get-ngrok-url.sh
```

### Step 3: Update Android App

1. **Copy the ngrok URL** (looks like: `https://xxxx-xxxx-xxxx.ngrok-free.app`)

2. **Edit:** `android-app/app/build.gradle`

3. **Update both debug and release:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", '"https://YOUR_NGROK_URL/api/"'
   ```
   Replace `YOUR_NGROK_URL` with your actual ngrok URL.

4. **Rebuild:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

### Step 4: For Stable URL (Recommended)

**Free ngrok:** URL changes each time (you'll need to update Android app)

**Paid ngrok ($8/month):** Stable URL that never changes
1. Upgrade: https://dashboard.ngrok.com/billing
2. Reserve domain: https://dashboard.ngrok.com/cloud-edge/domains
3. Use: `ngrok http 5000 --domain=your-domain.ngrok.io`
4. Update Android app **once** - done forever!

---

## Why LocalTunnel Fails

LocalTunnel subdomains are **first-come-first-served** and **not reserved**. The `medalert123` subdomain:
- ✅ Works if you're first to request it
- ❌ Fails if someone else is using it
- ❌ Gets reassigned randomly

**ngrok is better because:**
- ✅ More reliable
- ✅ Has a dashboard (http://localhost:4040)
- ✅ Paid plan offers stable domains
- ✅ Better for production use

---

## Quick Commands

```bash
# Configure ngrok (one-time)
ngrok config add-authtoken YOUR_TOKEN

# Start with auto URL extraction
npm run backend:ngrok:auto

# Or start normally
npm run backend:ngrok

# Get URL manually
./scripts/get-ngrok-url.sh

# View ngrok dashboard
# Open: http://localhost:4040
```

---

## Current Status

- ❌ **LocalTunnel:** Unreliable (random URLs)
- ✅ **ngrok:** Ready to use (needs configuration)
- ✅ **Scripts:** Created to help extract URLs

**Next step:** Configure ngrok and switch to it!


