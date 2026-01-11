# GeoAttendance Pro - Advanced Features Implementation

## 1. Real-Time Attendance Tracking

### Automatic Check-in/Check-out Logic

The system automatically marks attendance when employees enter or exit geofenced areas:

```typescript
// Geofence Event Handler
async function handleGeofenceEvent(userId, latitude, longitude, accuracy) {
  // Find if user is inside any geofence
  const currentGeofence = await findGeofenceContainingPoint(latitude, longitude);
  
  // Get latest attendance record
  const latestRecord = await getLatestAttendanceRecord(userId);
  
  if (currentGeofence) {
    // User entered a geofence
    if (!latestRecord || latestRecord.checkOutTime) {
      // Create new check-in record
      const record = {
        userId,
        geofenceId: currentGeofence.id,
        checkInTime: new Date(),
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        locationAccuracy: accuracy,
        status: 'CHECKED_IN'
      };
      
      await saveAttendanceRecord(record);
      await sendCheckInNotification(userId, currentGeofence);
    }
  } else {
    // User left all geofences
    if (latestRecord && !latestRecord.checkOutTime) {
      // Update check-out record
      latestRecord.checkOutTime = new Date();
      latestRecord.checkOutLatitude = latitude;
      latestRecord.checkOutLongitude = longitude;
      latestRecord.status = 'CHECKED_OUT';
      
      await updateAttendanceRecord(latestRecord);
      await sendCheckOutNotification(userId);
    }
  }
}
```

### Location Accuracy Verification

Prevents proxy attendance by verifying location accuracy:

```typescript
// Verify location accuracy before check-in
async function verifyLocationAccuracy(latitude, longitude, accuracy) {
  const ACCURACY_THRESHOLD = 100; // meters
  
  if (accuracy > ACCURACY_THRESHOLD) {
    throw new Error('Location accuracy too low. Please try again.');
  }
  
  // Additional verification using multiple location sources
  const wifiLocation = await getWifiLocation();
  const gpsLocation = { latitude, longitude };
  
  const distance = calculateDistance(wifiLocation, gpsLocation);
  if (distance > ACCURACY_THRESHOLD) {
    throw new Error('Location verification failed. GPS and WiFi locations do not match.');
  }
  
  return true;
}
```

### Attendance Status Determination

```typescript
// Determine attendance status based on time
async function determineAttendanceStatus(checkInTime, geofence) {
  const WORK_START_TIME = '09:00'; // 9 AM
  const LATE_THRESHOLD = 30; // 30 minutes
  
  const checkInHour = checkInTime.getHours();
  const checkInMinute = checkInTime.getMinutes();
  const checkInTimeStr = `${checkInHour}:${checkInMinute}`;
  
  if (checkInTimeStr > WORK_START_TIME) {
    const timeDiff = calculateTimeDifference(checkInTimeStr, WORK_START_TIME);
    if (timeDiff > LATE_THRESHOLD) {
      return 'LATE';
    }
  }
  
  return 'PRESENT';
}
```

## 2. Push Notifications System

### Firebase Cloud Messaging Setup

```typescript
// Initialize FCM
async function initializeFCM() {
  try {
    // Request notification permission
    const permission = await messaging().requestPermission();
    
    if (permission === messaging.AuthorizationStatus.AUTHORIZED ||
        permission === messaging.AuthorizationStatus.PROVISIONAL) {
      
      // Get FCM token
      const token = await messaging().getToken();
      
      // Send token to backend
      await ApiService.updateFCMToken(token);
      
      // Listen for messages
      setupMessageHandlers();
    }
  } catch (error) {
    console.error('FCM initialization error:', error);
  }
}

// Setup message handlers
function setupMessageHandlers() {
  // Foreground messages
  messaging().onMessage(async (remoteMessage) => {
    handleForegroundNotification(remoteMessage);
  });
  
  // Background messages
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    handleBackgroundNotification(remoteMessage);
  });
  
  // Notification opened
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationOpened(remoteMessage);
  });
}
```

### Notification Types

#### 1. Check-in Notification
```typescript
async function sendCheckInNotification(user, geofence) {
  const notification = {
    type: 'CHECK_IN',
    title: 'Check-in Successful',
    body: `You checked in at ${geofence.name} at ${new Date().toLocaleTimeString()}`,
    userId: user.id,
    data: {
      geofenceId: geofence.id,
      timestamp: new Date().toISOString()
    }
  };
  
  // Send to user
  await sendNotification(user.fcmToken, notification);
  
  // Send to manager
  if (user.manager) {
    const managerNotification = {
      ...notification,
      title: `${user.firstName} ${user.lastName} checked in`,
      userId: user.manager.id
    };
    await sendNotification(user.manager.fcmToken, managerNotification);
  }
}
```

#### 2. Late Arrival Notification
```typescript
async function sendLateArrivalNotification(user) {
  const notification = {
    type: 'LATE_ARRIVAL',
    title: 'Late Arrival Alert',
    body: `${user.firstName} arrived late at ${new Date().toLocaleTimeString()}`,
    userId: user.manager?.id,
    priority: 'high'
  };
  
  if (user.manager) {
    await sendNotification(user.manager.fcmToken, notification);
  }
}
```

#### 3. Geofence Violation Notification
```typescript
async function sendGeofenceViolationNotification(user, geofence) {
  const notification = {
    type: 'GEOFENCE_VIOLATION',
    title: 'Geofence Violation',
    body: `${user.firstName} left ${geofence.name} unexpectedly`,
    userId: user.manager?.id,
    priority: 'high',
    data: {
      geofenceId: geofence.id,
      userId: user.id
    }
  };
  
  if (user.manager) {
    await sendNotification(user.manager.fcmToken, notification);
  }
}
```

#### 4. Leave Approval Notification
```typescript
async function sendLeaveApprovalNotification(user, approved) {
  const notification = {
    type: 'LEAVE_APPROVAL',
    title: `Leave Request ${approved ? 'Approved' : 'Rejected'}`,
    body: `Your leave request has been ${approved ? 'approved' : 'rejected'}`,
    userId: user.id,
    data: {
      approved: approved
    }
  };
  
  await sendNotification(user.fcmToken, notification);
}
```

### Email Alerts

```typescript
// Send email alerts for critical events
async function sendEmailAlert(recipient, subject, body, htmlBody) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject: subject,
    text: body,
    html: htmlBody
  };
  
  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipient}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

// Example: Send late arrival email to manager
async function sendLateArrivalEmail(manager, employee, checkInTime) {
  const subject = `Late Arrival Alert - ${employee.firstName} ${employee.lastName}`;
  const body = `
    Employee: ${employee.firstName} ${employee.lastName}
    Check-in Time: ${checkInTime}
    Status: Late Arrival
    
    Please take appropriate action.
  `;
  
  await sendEmailAlert(manager.email, subject, body, body);
}
```

## 3. Offline Synchronization

### Local Database Setup

```typescript
// SQLite database initialization
import SQLite from 'react-native-sqlite-storage';

async function initializeLocalDatabase() {
  const db = await SQLite.openDatabase({
    name: 'geo-attendance.db',
    location: 'default'
  });
  
  // Create tables
  await db.transaction((tx) => {
    // Attendance records table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY,
        userId INTEGER,
        geofenceId INTEGER,
        checkInTime TEXT,
        checkOutTime TEXT,
        checkInLatitude REAL,
        checkInLongitude REAL,
        checkOutLatitude REAL,
        checkOutLongitude REAL,
        accuracy REAL,
        status TEXT,
        synced BOOLEAN DEFAULT 0,
        createdAt TEXT
      )
    `);
    
    // Location history table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS location_history (
        id INTEGER PRIMARY KEY,
        userId INTEGER,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        timestamp TEXT,
        synced BOOLEAN DEFAULT 0
      )
    `);
    
    // Sync queue table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY,
        action TEXT,
        entityType TEXT,
        entityId INTEGER,
        data TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `);
  });
  
  return db;
}
```

### Offline Data Sync Logic

```typescript
// Sync manager
class OfflineSyncManager {
  private db: any;
  private isOnline: boolean = true;
  
  constructor(db: any) {
    this.db = db;
    this.setupNetworkListener();
  }
  
  // Setup network connectivity listener
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected || false;
      
      if (this.isOnline) {
        this.syncAllPendingData();
      }
    });
  }
  
  // Sync all pending data
  async syncAllPendingData() {
    try {
      // Sync attendance records
      await this.syncAttendanceRecords();
      
      // Sync location history
      await this.syncLocationHistory();
      
      // Sync other pending actions
      await this.syncQueuedActions();
      
      console.log('Offline sync completed');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  
  // Sync attendance records
  private async syncAttendanceRecords() {
    const unsyncedRecords = await this.getUnsyncedAttendanceRecords();
    
    for (const record of unsyncedRecords) {
      try {
        // Send to backend
        await ApiService.syncAttendanceRecord(record);
        
        // Mark as synced
        await this.markAttendanceAsSynced(record.id);
      } catch (error) {
        console.error(`Failed to sync attendance record ${record.id}:`, error);
        await this.incrementRetryCount(record.id);
      }
    }
  }
  
  // Sync location history
  private async syncLocationHistory() {
    const unsyncedLocations = await this.getUnsyncedLocations();
    
    for (const location of unsyncedLocations) {
      try {
        await ApiService.syncLocationHistory(location);
        await this.markLocationAsSynced(location.id);
      } catch (error) {
        console.error(`Failed to sync location ${location.id}:`, error);
      }
    }
  }
  
  // Get unsynced records
  private async getUnsyncedAttendanceRecords() {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM attendance_records WHERE synced = 0',
          [],
          (_, result) => resolve(result.rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }
  
  // Mark as synced
  private async markAttendanceAsSynced(id: number) {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'UPDATE attendance_records SET synced = 1 WHERE id = ?',
          [id],
          () => resolve(true),
          (_, error) => reject(error)
        );
      });
    });
  }
}
```

### Conflict Resolution

```typescript
// Handle conflicts during sync
async function resolveConflict(localData, remoteData) {
  // Strategy: Server data takes precedence
  if (remoteData.updatedAt > localData.updatedAt) {
    return remoteData;
  }
  
  // If local is newer, merge changes
  return {
    ...remoteData,
    ...localData,
    updatedAt: new Date()
  };
}

// Merge attendance records
async function mergeAttendanceRecords(local, remote) {
  return {
    id: remote.id,
    userId: remote.userId,
    geofenceId: remote.geofenceId || local.geofenceId,
    checkInTime: remote.checkInTime || local.checkInTime,
    checkOutTime: remote.checkOutTime || local.checkOutTime,
    status: remote.status || local.status,
    updatedAt: new Date()
  };
}
```

## 4. Analytics and Reporting

### Attendance Analytics

```typescript
// Calculate attendance metrics
async function calculateAttendanceMetrics(userId, startDate, endDate) {
  const records = await getAttendanceRecords(userId, startDate, endDate);
  
  const totalDays = calculateWorkingDays(startDate, endDate);
  const presentDays = records.filter(r => r.status === 'PRESENT').length;
  const lateDays = records.filter(r => r.status === 'LATE').length;
  const absentDays = totalDays - presentDays;
  
  const totalHours = records.reduce((sum, r) => {
    if (r.checkInTime && r.checkOutTime) {
      return sum + calculateDuration(r.checkInTime, r.checkOutTime);
    }
    return sum;
  }, 0);
  
  return {
    totalDays,
    presentDays,
    lateDays,
    absentDays,
    attendancePercentage: (presentDays / totalDays) * 100,
    totalHours,
    averageHoursPerDay: totalHours / presentDays
  };
}
```

### Report Generation

```typescript
// Generate attendance report
async function generateAttendanceReport(userId, startDate, endDate, format) {
  const records = await getAttendanceRecords(userId, startDate, endDate);
  const metrics = await calculateAttendanceMetrics(userId, startDate, endDate);
  
  const report = {
    userId,
    startDate,
    endDate,
    generatedAt: new Date(),
    metrics,
    records,
    summary: generateReportSummary(metrics)
  };
  
  if (format === 'csv') {
    return generateCSVReport(report);
  } else if (format === 'pdf') {
    return generatePDFReport(report);
  }
  
  return report;
}

// Generate CSV report
function generateCSVReport(report) {
  let csv = 'Date,Check-in,Check-out,Duration,Status\n';
  
  report.records.forEach(record => {
    const date = new Date(record.checkInTime).toLocaleDateString();
    const checkIn = new Date(record.checkInTime).toLocaleTimeString();
    const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A';
    const duration = calculateDuration(record.checkInTime, record.checkOutTime);
    
    csv += `${date},${checkIn},${checkOut},${duration},${record.status}\n`;
  });
  
  return csv;
}
```

## 5. Performance Optimization

### Location Update Batching

```typescript
// Batch location updates to reduce API calls
class LocationUpdateBatcher {
  private batch: any[] = [];
  private batchSize = 10;
  private batchTimeout = 30000; // 30 seconds
  
  async addLocation(location: any) {
    this.batch.push(location);
    
    if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }
  
  private async flushBatch() {
    if (this.batch.length === 0) return;
    
    try {
      await ApiService.batchUpdateLocations(this.batch);
      this.batch = [];
    } catch (error) {
      console.error('Batch update error:', error);
    }
  }
}
```

### Data Caching

```typescript
// Cache frequently accessed data
class DataCache {
  private cache = new Map();
  private ttl = new Map();
  
  set(key: string, data: any, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, data);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key: string) {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }
}
```

## 6. Security Enhancements

### Secure Token Storage

```typescript
// Use secure storage for sensitive data
import * as SecureStore from 'expo-secure-store';

async function storeAuthToken(token: string) {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}
```

### Request Signing

```typescript
// Sign API requests for additional security
function signRequest(method: string, path: string, body?: any) {
  const timestamp = Date.now();
  const secret = process.env.API_SECRET;
  
  const message = `${method}${path}${timestamp}${body ? JSON.stringify(body) : ''}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return {
    'X-Signature': signature,
    'X-Timestamp': timestamp
  };
}
```

This comprehensive guide covers all advanced features needed for a production-ready GeoAttendance Pro application.
