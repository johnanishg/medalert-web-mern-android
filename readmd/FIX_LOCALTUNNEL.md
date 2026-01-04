# Fix LocalTunnel Unreliable Subdomain Issue

## Problem

LocalTunnel (`medalert123.loca.lt`) only works the **first time** after editing the file, then assigns random URLs like:
- `https://cuddly-mule-23.loca.lt`
- `https://serious-penguin-33.loca.lt`

This breaks the Android app connection because it's hardcoded to `medalert123.loca.lt`.

## Why This Happens

LocalTunnel **does not guarantee** subdomain reservation. The subdomain `medalert123` is only available if:
1. No one else is using it
2. You're the first to request it
3. The server hasn't reassigned it

## Solutions

### ✅ Solution 1: Use ngrok (Recommended)

**ngrok is more reliable and offers stable domains with paid plan.**

#### Quick Setup:

1. **Configure ngrok:**
   ```bash
   # Get token from https://dashboard.ngrok.com/get-started/your-authtoken
   ngrok config add-authtoken YOUR_TOKEN
   ```

2. **Start with auto URL extraction:**
   ```bash
   npm run backend:ngrok:auto
   ```
   This will show you the ngrok URL automatically.

3. **Or start normally and get URL:**
   ```bash
   npm run backend:ngrok
   # Then in another terminal:
   ./scripts/get-ngrok-url.sh
   ```

4. **Update Android app** with the ngrok URL shown.

#### For Stable URL (Paid):

1. **Upgrade ngrok:** https://dashboard.ngrok.com/billing ($8/month)
2. **Reserve domain:** https://dashboard.ngrok.com/cloud-edge/domains
3. **Use reserved domain:**
   ```bash
   ngrok http 5000 --domain=your-domain.ngrok.io
   ```
4. **Update Android app once** - URL never changes!

---

### Solution 2: Make Android App URL Dynamic

Instead of hardcoding the URL, make it configurable:

1. **Add URL input in Android app settings**
2. **Store in SharedPreferences/DataStore**
3. **Allow users to change backend URL at runtime**

This requires code changes to the Android app.

---

### Solution 3: Use Script to Auto-Update Android App

Create a script that:
1. Starts LocalTunnel
2. Extracts the URL
3. Automatically updates `build.gradle`
4. Rebuilds the app

**Note:** This is complex and requires rebuilding the app each time.

---

### Solution 4: Use Your Own Domain with Reverse Proxy

1. **Get a domain** (e.g., `medalert.yourdomain.com`)
2. **Set up reverse proxy** (nginx, Caddy, etc.)
3. **Point to ngrok or your server**
4. **Use stable domain in Android app**

---

## Recommended Approach

**For Development:**
- Use **ngrok free tier** with the auto-extract script
- Update Android app URL when it changes (or use paid for stability)

**For Production Testing:**
- Use **ngrok paid plan** with reserved domain
- Stable URL that never changes

**For Production:**
- Deploy to a real server (AWS, Heroku, etc.)
- Use your own domain with HTTPS

---

## Quick Fix Right Now

1. **Stop LocalTunnel** (Ctrl+C)

2. **Set up ngrok:**
   ```bash
   # One-time setup
   ngrok config add-authtoken YOUR_TOKEN
   
   # Start backend with ngrok
   npm run backend:ngrok
   ```

3. **Get the URL:**
   - Open http://localhost:4040 in browser (ngrok dashboard)
   - Or run: `./scripts/get-ngrok-url.sh`

4. **Update Android app:**
   - Edit `android-app/app/build.gradle`
   - Update `API_BASE_URL` with ngrok URL
   - Rebuild app

5. **For stability, upgrade to paid ngrok** and reserve a domain.

---

## Why ngrok is Better

| Feature | LocalTunnel | ngrok Free | ngrok Paid |
|---------|-------------|------------|------------|
| Subdomain guarantee | ❌ No | ❌ No | ✅ Yes |
| Reliability | ⚠️ Low | ✅ Medium | ✅ High |
| Stable URL | ❌ No | ❌ No | ✅ Yes |
| Cost | Free | Free | $8/month |
| Dashboard | ❌ No | ✅ Yes | ✅ Yes |

**Conclusion:** For reliable cross-network access, ngrok (especially paid) is the best solution.


