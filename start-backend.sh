#!/bin/bash

# GeoAttendance Pro - Backend Startup Script

echo "🚀 Starting GeoAttendance Pro Backend..."
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Error: Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Error: Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java version check passed"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if pom.xml exists
if [ ! -f "pom.xml" ]; then
    echo "❌ Error: pom.xml not found. Are you in the correct directory?"
    exit 1
fi

echo "📦 Building backend..."
./mvnw clean install -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting Spring Boot application..."
echo "   Backend will be available at: http://localhost:8080"
echo "   API endpoints: http://localhost:8080/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

./mvnw spring-boot:run
