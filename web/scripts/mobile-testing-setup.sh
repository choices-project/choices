#!/bin/bash

echo "🚀 Mobile Testing Setup for Choices Platform"
echo "============================================="

# Generate PWA icons
echo "📱 Generating PWA icons..."
node scripts/generate-pwa-icons.js

# Get local IP address
echo "🌐 Getting your local IP address..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not determine your local IP address"
    echo "Please run 'ifconfig' (Mac/Linux) or 'ipconfig' (Windows) to find your IP"
else
    echo "✅ Your local IP address is: $LOCAL_IP"
    echo ""
    echo "📱 Mobile Testing Instructions:"
    echo "1. Make sure your phone is on the same WiFi network as this computer"
    echo "2. Open your phone's browser and go to: http://$LOCAL_IP:3000"
    echo "3. For authentication, go to: http://$LOCAL_IP:3000/dev-login"
    echo "4. Enter any email address to bypass authentication"
    echo "5. Test the biometric authentication features"
    echo ""
    echo "🔧 Alternative: Use ngrok for public access"
    echo "1. Install ngrok: npm install -g ngrok"
    echo "2. Run: ngrok http 3000"
    echo "3. Use the ngrok URL on your phone"
    echo "4. For authentication: [ngrok-url]/dev-login"
fi

echo ""
echo "✅ PWA is now enabled for development"
echo "✅ Development authentication bypass is available"
echo "✅ Biometric authentication should work on mobile"
echo "✅ Service worker will be available for offline functionality"
echo ""
echo "🔄 Restart your development server:"
echo "   npm run dev"
