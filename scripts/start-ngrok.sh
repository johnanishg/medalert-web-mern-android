#!/bin/bash

# Start ngrok tunnel and extract the public URL
# This script starts ngrok and outputs the URL for use in Android app

PORT=${1:-5000}

echo "🚀 Starting ngrok tunnel on port $PORT..."
echo "📋 Once ngrok starts, copy the 'Forwarding' URL (https://xxxx.ngrok-free.app)"
echo ""

# Start ngrok in background and capture URL
ngrok http $PORT --log=stdout 2>&1 | while IFS= read -r line; do
    # Look for the forwarding URL
    if echo "$line" | grep -q "started tunnel"; then
        echo "✅ ngrok tunnel started!"
    fi
    # Extract URL from ngrok output
    if echo "$line" | grep -qE "https://[a-z0-9-]+\.ngrok(-free)?\.app"; then
        URL=$(echo "$line" | grep -oE "https://[a-z0-9-]+\.ngrok(-free)?\.app" | head -1)
        if [ ! -z "$URL" ]; then
            echo ""
            echo "🌐 Your ngrok URL: $URL"
            echo "📱 Update Android app build.gradle with:"
            echo "   buildConfigField \"String\", \"API_BASE_URL\", '\"$URL/api/\"'"
            echo ""
        fi
    fi
done


