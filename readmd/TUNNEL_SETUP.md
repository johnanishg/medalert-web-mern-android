# Tunnel Setup Guide for MedAlert

## Problem: LocalTunnel URL Changes

LocalTunnel subdomains are **not guaranteed**. If the subdomain `medalert123` is already in use, LocalTunnel will assign a random subdomain (e.g., `smart-dodo-20.loca.lt`), which breaks the Android app connection.

## Solutions

### ✅ Option 1: Use Local Network IP (Recommended for Development)

**Best for:** Development on the same Wi-Fi network

1. **Find your computer's IP address:**
   ```bash
   hostname -I | awk '{print $1}'
   # Current IP: 192.168.29.72
   ```

2. **Update Android app `build.gradle`:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", '"http://192.168.29.72:5000/api/"'
   ```

3. **Start backend without tunnel:**
   ```bash
   npm run backend
   ```

4. **Connect Android device to the same Wi-Fi network**

**Pros:**
- ✅ Stable URL (doesn't change)
- ✅ No external dependencies
- ✅ Faster (no tunnel overhead)
- ✅ Works reliably

**Cons:**
- ❌ Only works on same Wi-Fi network
- ❌ Requires knowing your IP address

---

### Option 2: Use ngrok (More Reliable Tunnel)

**Best for:** Testing from different networks or external access

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok  # macOS
   ```

2. **Create free account and get auth token:**
   - Sign up at https://ngrok.com/
   - Get your auth token from dashboard

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Start ngrok with reserved domain (paid) or random (free):**
   ```bash
   # Free (random URL each time)
   ngrok http 5000
   
   # Paid (reserved domain - stable URL)
   ngrok http 5000 --domain=medalert.ngrok.io
   ```

5. **Update package.json:**
   ```json
   "tunnel": "ngrok http 5000",
   ```

6. **Update Android app with ngrok URL**

**Pros:**
- ✅ Works from any network
- ✅ Can reserve domain (paid plan)
- ✅ More reliable than LocalTunnel

**Cons:**
- ❌ Free tier: random URL each time
- ❌ Paid tier needed for stable URL
- ❌ Requires account setup

---

### Option 3: Use ngrok with Reserved Domain (Best for Production Testing)

1. **Sign up for ngrok paid plan** ($8/month)
2. **Reserve a domain:** `medalert.ngrok.io`
3. **Update package.json:**
   ```json
   "tunnel": "ngrok http 5000 --domain=medalert.ngrok.io",
   ```
4. **Update Android app:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", '"https://medalert.ngrok.io/api/"'
   ```

**Pros:**
- ✅ Stable URL (never changes)
- ✅ Works from any network
- ✅ Professional solution

**Cons:**
- ❌ Costs $8/month
- ❌ Requires paid account

---

### Option 4: Make URL Configurable in Android App

**Best for:** Flexible development

1. **Add URL configuration in Android app settings**
2. **Allow users to change backend URL at runtime**
3. **Store in SharedPreferences or DataStore**

This requires code changes to make the URL dynamic.

---

## Current Configuration

- **Local IP:** `192.168.29.72:5000`
- **Tunnel Command:** `npx lt --port 5000 --subdomain medalert123`
- **Android App URL:** Currently set to `https://medalert123.loca.lt/api/` (unreliable)

## Recommendation

For **development**, use **Option 1** (local network IP):
- Update `android-app/app/build.gradle` to use `http://192.168.29.72:5000/api/`
- Run `npm run backend` (without tunnel)
- Connect Android device to same Wi-Fi

For **production testing** or **external access**, use **Option 3** (ngrok with reserved domain).

---

## Quick Fix for Current Issue

To fix the immediate problem:

1. **Update Android app build.gradle:**
   ```gradle
   buildConfigField "String", "API_BASE_URL", '"http://192.168.29.72:5000/api/"'
   ```

2. **Rebuild Android app:**
   ```bash
   cd android-app
   ./gradlew clean assembleDebug
   ```

3. **Start backend without tunnel:**
   ```bash
   npm run backend
   ```

4. **Ensure Android device is on same Wi-Fi network**


