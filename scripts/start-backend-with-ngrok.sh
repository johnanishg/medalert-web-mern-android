#!/bin/bash

# Start backend and ngrok, then automatically extract and display the URL
# This makes it easier to get the ngrok URL for Android app configuration

echo "🚀 Starting backend and ngrok..."
echo ""

# Start backend in background
npm run backend > /tmp/medalert-backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start ngrok in background
ngrok http 5000 > /tmp/medalert-ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Try to get URL from ngrok API
echo "📡 Getting ngrok URL..."
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$NGROK_URL" ]; then
        echo ""
        echo "✅ ngrok is running!"
        echo "🌐 Your ngrok URL: $NGROK_URL"
        echo ""
        echo "📱 To update Android app:"
        echo "   1. Edit: android-app/app/build.gradle"
        echo "   2. Update API_BASE_URL to:"
        echo "      buildConfigField \"String\", \"API_BASE_URL\", '\"$NGROK_URL/api/\"'"
        echo "   3. Rebuild: cd android-app && ./gradlew clean assembleDebug"
        echo ""
        echo "💡 Tip: For a stable URL, upgrade to ngrok paid plan and reserve a domain"
        echo ""
        echo "Press Ctrl+C to stop both backend and ngrok"
        echo ""
        
        # Show logs
        tail -f /tmp/medalert-backend.log /tmp/medalert-ngrok.log 2>/dev/null &
        TAIL_PID=$!
        
        # Wait for interrupt
        trap "kill $BACKEND_PID $NGROK_PID $TAIL_PID 2>/dev/null; exit" INT TERM
        wait
        
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Could not get ngrok URL after 10 attempts"
        echo "Check if ngrok is configured: ngrok config add-authtoken YOUR_TOKEN"
        kill $BACKEND_PID $NGROK_PID 2>/dev/null
        exit 1
    fi
    
    sleep 1
done


