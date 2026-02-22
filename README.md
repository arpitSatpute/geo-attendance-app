# GeoAttendance App 📍⏱️

An advanced, full-stack employee attendance and management system designed to streamline workforce tracking through location-based logic, biometric verification, and dynamic hierarchical roles. 

GeoAttendance empowers organizations with a mobile-first solution for tracking employee hours, managing remote/field teams, handling leave requests, and automating basic payroll structures.

## 🌟 Application Overview

GeoAttendance replaces legacy punch-cards and rigid tracking systems with a highly flexible mobile platform. Organizations define "Geofences" (virtual geographic perimeters) where employees are allowed to clock in and out. Coupled with Real-Time Communication and Face Verification, the application ensures authenticity, accuracy, and ease of use for HR and Management alike.

The application serves three primary user roles:
1. **Employees:** Can securely log attendance within authorized zones, view their salary history, apply for leaves, and manage their personal profiles.
2. **Managers:** Have an aggregated view of their assigned teams. Managers can monitor live attendance statuses, approve or reject leave requests, and manage the base salaries or direct reports within their hierarchy.
3. **Admins:** Handle system-wide settings, user onboarding, global geofence creation, and high-level organizational structure.

---

## 🚀 Key Features

### 📍 Intelligent Geofencing & Attendance
*   **Virtual Boundaries:** Admins and Managers can define custom geofences using geographical coordinates.
*   **Location-restricted Check-ins:** Employees are blocked from checking in or out unless their device's GPS verifies they are physically within an active geofence.
*   **Real-time Status Boards:** Managers can view live "Working/Checked In" statuses for all their team members.

### 🤳 Face Registration & Verification
*   **Biometric Anti-Spoofing:** Employees register their face during onboarding. Daily attendance check-ins require real-time face verification to prevent proxy attendance using advanced frontend recognition screens.

### 👥 Hierarchical Team & Employee Management
*   **Dynamic Data Pipelines:** All user data, reporting manager connections, and team assignments are fetched dynamically; no hardcoded static data.
*   **Manager Dashboards:** A dedicated hub for managers showing daily activity logs, team distribution, and in-depth profiles for each direct report.
*   **Transfer of Authority:** Managers and Admins can easily reassign employees to different teams or transfer reporting authority with a single click.

### 💰 Automated Salary & Leave Processing
*   **Leave Application & Approval Flow:** Employees can submit leave requests. Real-time push notifications (via WebSockets) alert managers for quick approval/rejection.
*   **Financial Tracking:** View historical base salaries, monthly attendance ratios, generated net salary (with automatic deductions/proration based on attendance/absences), and payment history.

### 🔔 Real-time Notification System
*   **WebSocket Integration:** Live system utilizing WebSockets ensures that status changes, approvals, and important alerts are broadcast to the user immediately.
*   **In-App Notification Bell:** Track unread system notices on almost every screen.

---

## 🛠️ Technology Stack

### Frontend (Mobile App)
*   **Framework:** React Native + Expo
*   **Language:** TypeScript
*   **State Management:** Redux
*   **Location Services:** `expo-location` for GPS polling and geofence intersections.
*   **Styling & UI:** Custom styling, `expo-linear-gradient`, `react-native-element-dropdown`, and `@expo/vector-icons`.

### Backend
*   **Framework:** Java with Spring Boot
*   **Database:** MongoDB
*   **Authentication:** JWT (JSON Web Tokens) with Spring Security
*   **Real-Time Comms:** WebSockets / STOMP
*   **Architecture:** RESTful API principles

---

## ⚙️ Getting Started / Working Needs

### Prerequisites
1.  **Node.js** (v16+) and **npm**
2.  **Java JDK** 17 or higher
3.  **MongoDB** running locally or a MongoDB Atlas connection string.
4.  **Expo CLI** (`npm i -g expo-cli`)

### Environment Variables
You will need to configure `.env` files for both the frontend and backend.
*   **Backend:** Needs MongoDB URI, JWT Secret, Session durations.
*   **Frontend:** Needs the local network IP or deployed domain for the Backend API URL to ensure successful requests from physical devices or emulators.

### Running the Application Locally

#### 1. Backend Server
Navigate to the root directory and run the shell script:
```bash
./start-backend.sh
```
*(Alternatively, navigate to `backend/` and run `./mvnw spring-boot:run`)*

#### 2. Frontend Application
Open a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install
npx expo start
```
Use the Expo Go app on your physical iOS/Android device to scan the QR code, or run it via an Android Emulator / iOS Simulator.

---

## 🔒 Security Practices
*   **No Hardcoded Credentials:** Passwords are hashed before database insertion.
*   **JWT Handshakes:** Every API request outside of `/auth/login` and `/auth/register` requires a valid Bearer token.
*   **GPS Spoofing Mitigation:** Backend logic validates location timestamps to detect simulated environments.
