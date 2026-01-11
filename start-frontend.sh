#!/bin/bash

# GeoAttendance Pro - Frontend Startup Script

echo "📱 Starting GeoAttendance Pro Mobile App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the correct directory?"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Installation failed. Please check the errors above."
        exit 1
    fi
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating default .env file..."
    cat > .env << 'EOF'
# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:8080/api

# App Configuration
EXPO_PUBLIC_APP_NAME=GeoAttendance Pro
EXPO_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "✅ Created .env file. Please update the API URL if needed."
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 Starting Expo development server..."
echo ""
echo "📱 To run on device:"
echo "   - iOS: Press 'i' or run 'npm run ios'"
echo "   - Android: Press 'a' or run 'npm run android'"
echo "   - Physical device: Scan QR code with Expo Go app"
echo ""
echo "⚙️  API Configuration:"
cat .env | grep EXPO_PUBLIC_API_URL
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npx expo start
