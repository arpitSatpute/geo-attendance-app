# GeoAttendance Pro - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup (Java Spring Boot)](#backend-setup)
3. [Frontend Setup (React Native Expo)](#frontend-setup)
4. [Database Configuration](#database-configuration)
5. [API Configuration](#api-configuration)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 20GB free space
- **Internet**: Stable connection for API calls

### Required Software
- **Java**: JDK 11 or higher
- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **Git**: Latest version
- **Docker**: (Optional, for containerization)
- **MySQL**: v8.0 or PostgreSQL v14+

### API Keys Required
- Google Maps API Key
- Firebase Cloud Messaging credentials
- SMTP credentials for email service

## Backend Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/geo-attendance-app.git
cd geo-attendance-app/backend
```

### Step 2: Install Java Dependencies
```bash
# Verify Java installation
java -version

# If not installed, download from https://www.oracle.com/java/technologies/downloads/
```

### Step 3: Configure Application Properties
Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/geo_attendance
    username: root
    password: your_password
  
  mail:
    host: smtp.gmail.com
    username: your-email@gmail.com
    password: your-app-password

app:
  jwt:
    secret: your-super-secret-jwt-key
  google-maps:
    api-key: your-google-maps-api-key
```

### Step 4: Create Database
```bash
# Using MySQL
mysql -u root -p
CREATE DATABASE geo_attendance;
CREATE USER 'geo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON geo_attendance.* TO 'geo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Or using PostgreSQL
psql -U postgres
CREATE DATABASE geo_attendance;
CREATE USER geo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE geo_attendance TO geo_user;
\q
```

### Step 5: Build Backend
```bash
# Using Maven
mvn clean install

# Or using Gradle
gradle build
```

### Step 6: Run Backend
```bash
# Using Maven
mvn spring-boot:run

# Or run JAR file
java -jar target/geo-attendance-backend-1.0.0.jar

# Backend will start on http://localhost:8080/api
```

### Step 7: Verify Backend
```bash
# Check API health
curl http://localhost:8080/api/health

# View Swagger documentation
# Open browser: http://localhost:8080/api/swagger-ui.html
```

## Frontend Setup

### Step 1: Install Node Dependencies
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
# or
yarn install
```

### Step 2: Configure Environment Variables
Create `.env` file in frontend root:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_FIREBASE_CONFIG={
  "apiKey": "your-firebase-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "your-sender-id",
  "appId": "your-app-id"
}
```

### Step 3: Install Expo CLI
```bash
npm install -g expo-cli

# Verify installation
expo --version
```

### Step 4: Install Required Dependencies
```bash
# Location services
npm install expo-location

# Maps
npm install react-native-maps

# Firebase
npm install @react-native-firebase/app @react-native-firebase/messaging

# Local storage
npm install @react-native-async-storage/async-storage

# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs

# State management
npm install redux react-redux
```

### Step 5: Run Frontend in Development
```bash
# Start Expo development server
expo start

# For iOS (requires macOS)
expo start -i

# For Android
expo start -a

# For Web
expo start -w
```

### Step 6: Test on Device
```bash
# Download Expo Go app from App Store or Google Play
# Scan QR code from terminal with Expo Go app
# App will load on your device
```

## Database Configuration

### MySQL Setup
```sql
-- Create database
CREATE DATABASE geo_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'geo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON geo_attendance.* TO 'geo_user'@'localhost';

-- Create tables (Spring Data JPA will handle this with DDL)
-- Or run migrations manually
```

### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE geo_attendance;

-- Create user
CREATE USER geo_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE geo_attendance TO geo_user;

-- Connect to database
\c geo_attendance

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO geo_user;
```

### Database Migrations
```bash
# Using Flyway (if configured)
mvn flyway:migrate

# Or using Liquibase
mvn liquibase:update
```

## API Configuration

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API
   - Geocoding API
   - Directions API
4. Create API key
5. Add to configuration

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Add Android app:
   - Download `google-services.json`
   - Place in `android/app/` directory
4. Add iOS app:
   - Download `GoogleService-Info.plist`
   - Place in `ios/` directory
5. Enable Cloud Messaging
6. Add credentials to `.env`

### Email Service Configuration
```yaml
# Gmail SMTP
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password  # Generate app-specific password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

## Deployment

### Docker Deployment

#### Backend Docker Setup
```dockerfile
# Dockerfile for backend
FROM openjdk:11-jre-slim
COPY target/geo-attendance-backend-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
# Build Docker image
docker build -t geo-attendance-backend:1.0.0 .

# Run Docker container
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:mysql://db:3306/geo_attendance \
  -e SPRING_DATASOURCE_USERNAME=geo_user \
  -e SPRING_DATASOURCE_PASSWORD=secure_password \
  --name geo-attendance-backend \
  geo-attendance-backend:1.0.0
```

#### Docker Compose Setup
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/geo_attendance
      SPRING_DATASOURCE_USERNAME: geo_user
      SPRING_DATASOURCE_PASSWORD: secure_password
    depends_on:
      - db
  
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: geo_attendance
      MYSQL_USER: geo_user
      MYSQL_PASSWORD: secure_password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down
```

### Cloud Deployment

#### AWS Deployment
```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create EC2 instance
aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 --instance-type t2.medium

# Deploy application
# Copy JAR to EC2
scp -i key.pem target/geo-attendance-backend-1.0.0.jar ec2-user@instance-ip:/home/ec2-user/

# SSH into instance and run
ssh -i key.pem ec2-user@instance-ip
java -jar geo-attendance-backend-1.0.0.jar
```

#### Google Cloud Deployment
```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Create App Engine application
gcloud app create

# Deploy application
gcloud app deploy
```

#### Azure Deployment
```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Create resource group
az group create --name geo-attendance-rg --location eastus

# Create App Service Plan
az appservice plan create --name geo-attendance-plan --resource-group geo-attendance-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group geo-attendance-rg --plan geo-attendance-plan --name geo-attendance-app --runtime "JAVA|11-java11"

# Deploy application
az webapp deployment source config-zip --resource-group geo-attendance-rg --name geo-attendance-app --src app.zip
```

### Mobile App Deployment

#### iOS Deployment
```bash
# Build for iOS
expo build:ios

# This will generate an .ipa file
# Submit to App Store using Xcode or Transporter
```

#### Android Deployment
```bash
# Build for Android
expo build:android

# This will generate an .apk or .aab file
# Upload to Google Play Console
```

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in application.yml
server:
  port: 8081
```

#### Database Connection Error
```bash
# Check MySQL service
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql

# Verify credentials in application.yml
# Test connection
mysql -u geo_user -p -h localhost geo_attendance
```

#### JWT Token Issues
```bash
# Regenerate JWT secret in application.yml
app:
  jwt:
    secret: $(openssl rand -base64 32)
```

### Frontend Issues

#### Expo Connection Issues
```bash
# Clear cache
expo start -c

# Restart Expo server
# Press 'r' in terminal

# Check network connectivity
ping google.com
```

#### Location Permission Denied
```bash
# iOS: Check Settings > Privacy > Location
# Android: Check Settings > Apps > Permissions > Location

# Clear app cache
expo start -c
```

#### Maps Not Loading
```bash
# Verify Google Maps API key
# Check API is enabled in Google Cloud Console
# Verify API key restrictions are correct
```

### Database Issues

#### Migration Failed
```bash
# Check migration files
ls -la src/main/resources/db/migration/

# Rollback migration
mvn flyway:undo

# Rerun migration
mvn flyway:migrate
```

#### Connection Pool Exhausted
```yaml
# Increase connection pool size in application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30
      minimum-idle: 10
```

## Performance Optimization

### Backend Optimization
```yaml
# Enable compression
server:
  compression:
    enabled: true
    min-response-size: 1024

# Connection pooling
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

# Caching
spring:
  cache:
    type: redis
```

### Frontend Optimization
```bash
# Build optimized bundle
expo build:android --release-channel production

# Enable code splitting
expo export
```

## Security Best Practices

1. **API Security**
   - Always use HTTPS in production
   - Implement rate limiting
   - Validate all inputs
   - Use strong JWT secrets

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Encrypt sensitive data

3. **Mobile Security**
   - Implement certificate pinning
   - Secure local storage
   - Validate SSL certificates
   - Use secure random generators

4. **Access Control**
   - Implement RBAC
   - Regular security audits
   - Monitor access logs
   - Implement 2FA for admin accounts

## Monitoring & Logging

### Backend Logging
```yaml
logging:
  level:
    root: INFO
    com.geoattendance: DEBUG
  file:
    name: logs/geo-attendance.log
```

### Frontend Logging
```javascript
// Enable debug logging
import { enableLogging } from './utils/logger';
enableLogging(true);
```

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log aggregation
- **New Relic**: APM monitoring

## Support & Documentation

- **API Documentation**: http://localhost:8080/api/swagger-ui.html
- **GitHub Issues**: https://github.com/yourusername/geo-attendance-app/issues
- **Email Support**: support@geoattendance.com
- **Documentation**: https://docs.geoattendance.com
