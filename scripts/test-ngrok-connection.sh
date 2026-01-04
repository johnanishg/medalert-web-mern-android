#!/bin/bash

# Script to test ngrok connection and provide diagnostic information

echo "🔍 Testing ngrok Connection..."
echo ""

# Get current ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrok is not running!"
    echo ""
    echo "Start ngrok with:"
    echo "  npm run backend:ngrok:auto"
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"
echo ""

# Test backend locally
echo "📡 Testing backend on localhost:5000..."
LOCAL_TEST=$(curl -s http://localhost:5000/api/ 2>&1)
if echo "$LOCAL_TEST" | grep -q "message"; then
    echo "✅ Backend is running locally"
else
    echo "❌ Backend is not responding on localhost:5000"
    echo "   Response: $LOCAL_TEST"
fi
echo ""

# Test ngrok URL
echo "🌐 Testing ngrok URL..."
NGROK_TEST=$(curl -s "$NGROK_URL/api/" 2>&1)
if echo "$NGROK_TEST" | grep -q "message"; then
    echo "✅ ngrok tunnel is working"
    echo "   Response: $NGROK_TEST"
else
    echo "⚠️  ngrok URL test result:"
    echo "   $NGROK_TEST"
    echo ""
    echo "   This might be the ngrok warning page."
    echo "   Open $NGROK_URL in a browser and click 'Visit Site'"
fi
echo ""

# Check for ngrok warning page
echo "📋 Diagnostic Information:"
echo ""
echo "1. Backend Status:"
ps aux | grep -E "node.*server\.js" | grep -v grep > /dev/null && echo "   ✅ Backend process is running" || echo "   ❌ Backend process not found"
echo ""

echo "2. ngrok Status:"
ps aux | grep -E "ngrok http" | grep -v grep > /dev/null && echo "   ✅ ngrok process is running" || echo "   ❌ ngrok process not found"
echo ""

echo "3. Android App Configuration:"
echo "   Current URL in build.gradle should be:"
echo "   $NGROK_URL/api/"
echo ""

echo "4. Next Steps:"
echo "   a) Open this URL in a browser: $NGROK_URL"
echo "   b) If you see a warning page, click 'Visit Site'"
echo "   c) Test the API: $NGROK_URL/api/"
echo "   d) If Android app still fails, check device network connectivity"
echo ""

echo "💡 Tip: For stable URL without warning page, upgrade to ngrok paid plan"
echo ""

