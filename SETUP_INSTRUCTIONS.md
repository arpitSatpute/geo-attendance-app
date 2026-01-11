# GeoAttendance Pro - Setup Guide

## Overview
This project connects a Spring Boot backend with an Expo (React Native) mobile application for geolocation-based attendance tracking. Works on both Android and iOS.

## Prerequisites

### Backend Requirements
- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+ (or compatible database)
- Redis (optional, for caching)

### Frontend Requirements
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS development)

## Quick Start

### 1. Backend Setup

#### Step 1: Configure Database
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE geo_attendance;
EXIT;
```

#### Step 2: Update Application Configuration
Edit `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/geo_attendance
    username: YOUR_MYSQL_USERNAME
    password: YOUR_MYSQL_PASSWORD
```

#### Step 3: Build and Run Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### 2. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
# or
yarn install
```

#### Step 2: Configure Environment Variables
Edit `frontend/.env`:

**For iOS Simulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

**For Android Emulator:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api
```

**For Physical Device:**
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8080/api
```

To find your computer's IP:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`
- Linux: `ip addr show`

#### Step 3: Start Expo Development Server
```bash
npm start
# or
expo start
```

#### Step 4: Run on Device/Simulator

**For iOS:**
```bash
npm run ios
# or press 'i' in the Expo terminal
```

**For Android:**
```bash
npm run android
# or press 'a' in the Expo terminal
```

**For Physical Device:**
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal
3. Make sure your device is on the same Wi-Fi network as your computer

## Project Structure

```
geo-attendance-app/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       ├── java/com/geoattendance/
│   │       │   ├── config/           # Security & Web Config
│   │       │   ├── controller/       # REST Controllers
│   │       │   ├── dto/              # Data Transfer Objects
│   │       │   ├── entity/           # JPA Entities
│   │       │   ├── repository/       # Data Repositories
│   │       │   ├── security/         # JWT & Security
│   │       │   └── service/          # Business Logic
│   │       └── resources/
│   │           └── application.yml   # Config
│   └── pom.xml                       # Maven dependencies
│
└── frontend/                   # Expo Mobile App
    ├── src/
    │   ├── config/            # App configuration
    │   ├── screens/           # UI Screens
    │   ├── services/          # API Services
    │   └── components/        # Reusable Components
    ├── app.json               # Expo configuration
    ├── package.json           # npm dependencies
    └── .env                   # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Attendance
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/history` - Get attendance history
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/statistics` - Get attendance stats

## Testing the Connection

### 1. Test Backend Health
```bash
curl http://localhost:8080/api/auth/login
```

### 2. Test from Mobile App
The app should automatically connect to the backend URL specified in `.env`

### 3. Register a Test User
Use the app's registration screen or test with curl:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "1234567890",
    "role": "EMPLOYEE"
  }'
```

## Common Issues & Solutions

### Issue: Cannot connect to backend from Android Emulator
**Solution:** Use `http://10.0.2.2:8080/api` instead of `localhost`

### Issue: Cannot connect to backend from iOS Simulator
**Solution:** Use `http://localhost:8080/api`

### Issue: Cannot connect from physical device
**Solution:** 
1. Ensure device and computer are on same Wi-Fi
2. Use your computer's IP address (not localhost)
3. Check firewall settings allow port 8080

### Issue: CORS errors
**Solution:** The backend is configured to allow all origins. If issues persist, check `SecurityConfig.java`

### Issue: JWT token errors
**Solution:** Update the JWT secret in `application.yml`:
```yaml
app:
  jwt:
    secret: your-new-secret-key-at-least-32-characters-long
```

## Building for Production

### Backend
```bash
cd backend
./mvnw clean package
java -jar target/geo-attendance-backend-1.0.0.jar
```

### Frontend

#### Android APK
```bash
cd frontend
eas build --platform android
```

#### iOS IPA
```bash
cd frontend
eas build --platform ios
```

## Environment Variables Reference

### Backend (application.yml)
- `spring.datasource.url` - Database URL
- `spring.datasource.username` - Database username
- `spring.datasource.password` - Database password
- `app.jwt.secret` - JWT secret key
- `app.jwt.expiration` - Token expiration time

### Frontend (.env)
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_APP_NAME` - Application name
- `EXPO_PUBLIC_APP_VERSION` - Application version

## Security Notes

1. **Change default JWT secret** in production
2. **Use HTTPS** for production API
3. **Configure proper CORS** origins for production
4. **Use environment-specific** database credentials
5. **Enable Firebase** or push notifications for production (optional)

## Next Steps

1. Configure your database with proper credentials
2. Update JWT secret key
3. Test authentication flow
4. Test geolocation and attendance features
5. Configure maps API key (if using Google Maps)
6. Set up proper error handling and logging
7. Configure push notifications (optional)

## Support

For issues or questions:
- Check logs in `backend/logs/geo-attendance.log`
- Check Expo logs with `expo start --log`
- Review Spring Boot console output

## License

[Your License Here]
