# 🎯 GeoAttendance Pro - Quick Start Guide

**✨ Spring Boot Backend + Expo Mobile App (Android & iOS)**

This project has been configured to work with the latest technologies:
- ✅ Spring Boot 3.2.2 with Java 17
- ✅ Expo SDK 50 (React Native 0.73)
- ✅ JWT Authentication (No Firebase required)
- ✅ CORS configured for mobile apps
- ✅ Works on Android & iOS

---

## 🚀 Quick Start (2 Steps!)

### 1️⃣ Start the Backend

```bash
./start-backend.sh
```

This will:
- ✅ Check Java version (17+)
- ✅ Build the Spring Boot application
- ✅ Start the server on `http://localhost:8080`

**First time?** Make sure MongoDB is running and update `backend/src/main/resources/application.yml` with your MongoDB connection URI.

### 2️⃣ Start the Mobile App

```bash
./start-frontend.sh
```

This will:
- ✅ Install dependencies (if needed)
- ✅ Check environment configuration
- ✅ Start Expo development server

Then:
- Press **`i`** for iOS Simulator
- Press **`a`** for Android Emulator
- Or scan QR code with **Expo Go** app on your physical device

---

## 📋 Prerequisites

### Backend
- ☕ Java 17 or higher
- 📦 Maven 3.8+
- 🍃 MongoDB 5.0+ (Community Edition)

### Frontend
- 📦 Node.js 18+
- 📱 Expo CLI (auto-installed)
- 🤖 Android Studio (for Android) or 🍎 Xcode (for iOS)

---

## 🔧 Configuration

### Backend Configuration

Edit [`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml):

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/geo_attendance
      # For MongoDB with authentication:
      # uri: mongodb://username:password@localhost:27017/geo_attendance?authSource=geo_attendance
```

### Frontend Configuration

Edit [`frontend/.env`](frontend/.env):

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

💡 **Find your IP:** Run `ifconfig` (Mac/Linux) or `ipconfig` (Windows)

---

## 🗄️ Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE geo_attendance;
EXStart MongoDB
brew services start mongodb-community@7.0  # macOS
# OR
sudo systemctl start mongod  # Linux

# Connect to MongoDB
mongosh

# Create database (auto-created on first use)
use geo_attendance

# Verify connection
db.stats()
```

**See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed MongoDB setup instructions.**
## 📱 Running on Devices

### iOS Simulator
```bash
cd frontend
npm run ios
```

### Android Emulator
```bash
cd frontend
npm run android
```

### Physical Device
1. Install **Expo Go** from App Store or Play Store
2. Run `npm start` in frontend folder
3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app
4. Make sure device is on **same Wi-Fi** as your computer

---

## 🧪 Testing the Setup

### 1. Test Backend
```bash
curl http://localhost:8080/api/auth/login
```

Should return: `{"status":401,"error":"Unauthorized"...}` (This is good! API is working)

### 2. Register Test User

**Via Mobile App:** Use the registration screen

**Via curl:**
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

### 3. Login
Use the credentials you just created in the mobile app!

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/attendance/check-in` | Check in attendance |
| POST | `/api/attendance/check-out` | Check out attendance |
| GET | `/api/attendance/today` | Get today's attendance |
| GET | `/api/attendance/history` | Get attendance history |

---

## 📁 Project Structure

```
geo-attendance-app/
├── 🔧 backend/              Spring Boot API
│   ├── src/main/java/com/geoattendance/
│   │   ├── config/          Security & CORS
│   │   ├── controller/      REST endpoints
│   │   ├── entity/          Database models
│   │   ├── repository/      Data access
│   │   ├── security/        JWT & Auth
│   │   └── service/         Business logic
│   └── src/main/resources/
│       └── application.yml  Configuration
│
├── 📱 frontend/             Expo Mobile App
│   ├── src/
│   │   ├── config/         App configuration
│   │   ├── screens/        UI screens
│   │   ├── services/       API services
│   │   └── components/     UI components
│   ├── app.json            Expo config
│   ├── package.json        Dependencies
│   └── .env                Environment vars
│
├── start-backend.sh        🚀 Start backend
├── start-frontend.sh       📱 Start mobile app
└── SETUP_INSTRUCTIONS.md   📖 Detailed guide
```

---

## ❓ Common Issues

### ❌ Cannot connect to backend from Android
**Solution:** Use `http://10.0.2.2:8080/api` in `.env`

### ❌ Cannot connect to backend from iOS
**Solution:** Use `http://localhost:8080/api` in `.env`

### ❌ Cannot connect from physical device
**Solution:** 
1. Use your computer's IP address (not localhost)
2. Ensure same Wi-Fi network
3. Check firewall allows port 8080

### ❌ Port 8080 already in use
**Solution:** 
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### ❌ Expo SDK mismatch
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security Notes

⚠️ **Before Production:**
1. Change JWT secret in `application.yml`
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Configure proper CORS origins
5. Use strong database credentials

---

## 🎓 What's New?

### ✅ Removed Firebase
- No more Firebase dependencies
- Direct REST API communication
- JWT-based authentication

### ✅ Updated to Latest Versions
- Spring Boot 3.2.2 (from 3.1.5)
- Java 17 (from 11)
- Expo SDK 50 (from 49)
- React Native 0.73 (from 0.72)

### ✅ Enhanced Configuration
- CORS properly configured for mobile
- JWT authentication with proper error handling
- Environment-based configuration

---

## 📚 Learn More

- [Detailed Setup Guide](SETUP_INSTRUCTIONS.md)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)

---

## 🆘 Need Help?

1. Check logs:
   - Backend: Console output or `backend/logs/geo-attendance.log`
   - Frontend: Expo dev tools (Metro bundler)

2. Verify configuration:
   - Backend: `application.yml`
   - Frontend: `.env`

3. Test API directly with curl or Postman

---

## 🎉 You're All Set!

Start developing your geolocation-based attendance tracking system!

**Happy Coding! 🚀**
