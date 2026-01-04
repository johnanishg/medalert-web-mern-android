#!/bin/bash

# Script to extract ngrok URL from ngrok API
# This helps get the URL automatically instead of manually copying it

# Start ngrok in background if not running
if ! pgrep -f "ngrok http" > /dev/null; then
    echo "Starting ngrok..."
    ngrok http 5000 > /dev/null 2>&1 &
    sleep 3
fi

# Get ngrok URL from local API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Could not get ngrok URL. Make sure ngrok is running:"
    echo "   npm run tunnel:ngrok"
    echo ""
    echo "Or check ngrok web interface: http://localhost:4040"
else
    echo "✅ ngrok URL found: $NGROK_URL"
    echo ""
    echo "📱 Update Android app build.gradle:"
    echo "   buildConfigField \"String\", \"API_BASE_URL\", '\"$NGROK_URL/api/\"'"
    echo ""
    echo "Then rebuild: cd android-app && ./gradlew clean assembleDebug"
fi


