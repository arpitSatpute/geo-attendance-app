# GeoAttendance Pro - System Architecture

## System Overview

GeoAttendance Pro is a three-tier distributed system consisting of a React Native Expo mobile frontend, Java Spring Boot backend, and MySQL/PostgreSQL database. The system uses real-time geofencing technology to automate employee attendance tracking through GPS location monitoring.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│              (React Native Expo - iOS/Android)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Layer (Screens & Components)                     │   │
│  │  - Employee Dashboard                               │   │
│  │  - Manager Dashboard                                │   │
│  │  - Admin Dashboard                                  │   │
│  │  - Map View with Geofences                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer                               │   │
│  │  - Location Tracking Service                        │   │
│  │  - Offline Data Sync                                │   │
│  │  - Local Storage Management                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Client Layer                                   │   │
│  │  - REST API Calls                                   │   │
│  │  - WebSocket Connection                            │   │
│  │  - Token Management                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ (HTTPS/WSS)
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Server                          │
│              (Java Spring Boot 3.x)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Gateway & Load Balancer                         │   │
│  │  - Request Routing                                  │   │
│  │  - Rate Limiting                                    │   │
│  │  - CORS Handling                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  REST Controllers                                   │   │
│  │  - AuthController                                  │   │
│  │  - AttendanceController                            │   │
│  │  - GeofenceController                              │   │
│  │  - UserController                                  │   │
│  │  - ReportController                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebSocket Handler                                 │   │
│  │  - Real-time Location Updates                      │   │
│  │  - Notification Broadcasting                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer (Services)                   │   │
│  │  - GeofencingService                               │   │
│  │  - AttendanceService                               │   │
│  │  - LocationService                                 │   │
│  │  - NotificationService                             │   │
│  │  - AuthenticationService                           │   │
│  │  - ReportService                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Access Layer (Repositories)                  │   │
│  │  - UserRepository                                  │   │
│  │  - AttendanceRepository                            │   │
│  │  - GeofenceRepository                              │   │
│  │  - LeaveRepository                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External Service Integration                      │   │
│  │  - Google Maps API                                 │   │
│  │  - Firebase Cloud Messaging                        │   │
│  │  - Email Service (SMTP)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ (JDBC/ORM)
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│              (MySQL 8.0 / PostgreSQL 14+)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Storage                                       │   │
│  │  - Users & Roles                                   │   │
│  │  - Attendance Records                              │   │
│  │  - Geofences                                       │   │
│  │  - Leaves                                          │   │
│  │  - Notifications                                   │   │
│  │  - Audit Logs                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Caching Layer (Redis)                             │   │
│  │  - Session Storage                                 │   │
│  │  - Geofence Cache                                  │   │
│  │  - User Location Cache                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  role ENUM('EMPLOYEE', 'MANAGER', 'ADMIN') DEFAULT 'EMPLOYEE',
  department VARCHAR(100),
  manager_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### Geofences Table
```sql
CREATE TABLE geofences (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INT DEFAULT 100,
  polygon_coordinates JSON,
  geofence_type ENUM('CIRCLE', 'POLYGON') DEFAULT 'CIRCLE',
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_active (is_active),
  INDEX idx_location (latitude, longitude)
);
```

### Attendance Records Table
```sql
CREATE TABLE attendance_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  geofence_id BIGINT,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  location_accuracy_meters FLOAT,
  device_info VARCHAR(255),
  network_type VARCHAR(50),
  status ENUM('CHECKED_IN', 'CHECKED_OUT', 'ABSENT', 'LATE', 'EARLY_LEAVE') DEFAULT 'CHECKED_IN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (geofence_id) REFERENCES geofences(id),
  INDEX idx_user_date (user_id, DATE(check_in_time)),
  INDEX idx_check_in_time (check_in_time),
  INDEX idx_status (status)
);
```

### Leaves Table
```sql
CREATE TABLE leaves (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  leave_type ENUM('SICK', 'CASUAL', 'ANNUAL', 'UNPAID') DEFAULT 'CASUAL',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  approved_by BIGINT,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_date_range (start_date, end_date)
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  notification_type ENUM('CHECK_IN', 'CHECK_OUT', 'GEOFENCE_VIOLATION', 'LATE_ARRIVAL', 'LEAVE_APPROVAL', 'SYSTEM_ALERT') DEFAULT 'SYSTEM_ALERT',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_record_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created_at (created_at)
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_action (user_id, action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);
```

### Location History Table
```sql
CREATE TABLE location_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters FLOAT,
  altitude FLOAT,
  speed FLOAT,
  heading FLOAT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_timestamp (user_id, timestamp),
  INDEX idx_location (latitude, longitude),
  INDEX idx_created_at (created_at)
);
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### User Management Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/{id}` - Update user (Admin only)
- `DELETE /api/users/{id}` - Delete user (Admin only)

### Attendance Endpoints
- `POST /api/attendance/check-in` - Check-in with location
- `POST /api/attendance/check-out` - Check-out with location
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/report` - Generate attendance report
- `GET /api/attendance/statistics` - Get attendance statistics

### Location Endpoints
- `POST /api/location/update` - Update current location
- `GET /api/location/current` - Get current location
- `GET /api/location/history` - Get location history
- `GET /api/location/team` - Get team member locations (Manager)

### Geofence Endpoints
- `POST /api/geofences` - Create geofence
- `GET /api/geofences` - List geofences
- `GET /api/geofences/{id}` - Get geofence details
- `PUT /api/geofences/{id}` - Update geofence
- `DELETE /api/geofences/{id}` - Delete geofence
- `POST /api/geofences/{id}/check` - Check if location is inside geofence

### Leave Endpoints
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves` - Get leave history
- `PUT /api/leaves/{id}` - Update leave request
- `POST /api/leaves/{id}/approve` - Approve leave (Manager)
- `POST /api/leaves/{id}/reject` - Reject leave (Manager)

### Notification Endpoints
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `DELETE /api/notifications/{id}` - Delete notification

### Report Endpoints
- `GET /api/reports/attendance` - Generate attendance report
- `GET /api/reports/analytics` - Get analytics data
- `GET /api/reports/export` - Export report (CSV/PDF)

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Managed React Native platform
- **Redux** or **Context API** - State management
- **React Navigation** - Navigation library
- **Google Maps API** - Map visualization
- **Firebase Cloud Messaging** - Push notifications
- **SQLite** - Local offline database
- **Axios** - HTTP client

### Backend
- **Java 11+** - Programming language
- **Spring Boot 3.x** - Framework
- **Spring Data JPA** - ORM
- **Spring Security** - Authentication and authorization
- **Spring WebSocket** - Real-time communication
- **MySQL 8.0** or **PostgreSQL 14+** - Database
- **Redis** - Caching and session storage
- **JWT** - Token-based authentication
- **Swagger/OpenAPI** - API documentation
- **JUnit 5** - Testing framework
- **Mockito** - Mocking framework

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Kubernetes** - Container orchestration (optional)
- **GitHub Actions** - CI/CD pipeline
- **AWS/GCP/Azure** - Cloud hosting

## Security Architecture

### Authentication Flow
1. User submits credentials (email/password)
2. Backend validates credentials against hashed password
3. Backend generates JWT token with user claims
4. Token is stored securely on mobile device
5. Token is included in Authorization header for API requests
6. Backend validates token signature and expiration

### Authorization Flow
1. Request arrives at backend with JWT token
2. Token is decoded and user role is extracted
3. Endpoint checks if user role has permission
4. Request is allowed or rejected based on role

### Data Security
- All passwords are hashed using bcrypt
- All API communications use HTTPS/TLS
- Sensitive data is encrypted at rest
- JWT tokens have short expiration times
- Refresh tokens are used for long-lived sessions
- CORS is configured to allow only trusted origins

## Real-Time Communication

### WebSocket Events
- `location.update` - Real-time location update
- `attendance.check_in` - Check-in event
- `attendance.check_out` - Check-out event
- `geofence.entry` - Geofence entry event
- `geofence.exit` - Geofence exit event
- `notification.new` - New notification event

### Event Broadcasting
- Location updates are broadcast to managers
- Check-in/check-out events are broadcast to relevant users
- Geofence violations are broadcast to admins
- Notifications are sent to specific users

## Performance Optimization

### Caching Strategy
- Geofence data is cached in Redis for quick access
- User session data is cached in Redis
- Frequently accessed reports are cached
- Cache invalidation is triggered on data updates

### Database Optimization
- Indexes are created on frequently queried columns
- Queries are optimized to minimize database load
- Connection pooling is used for database connections
- Pagination is implemented for large result sets

### API Optimization
- Response compression is enabled (gzip)
- API responses are paginated
- Unnecessary data fields are excluded from responses
- Rate limiting is implemented to prevent abuse

## Scalability Considerations

### Horizontal Scaling
- Backend can be deployed on multiple servers
- Load balancer distributes requests across servers
- Database can be replicated for read scaling
- Redis cluster can be used for distributed caching

### Vertical Scaling
- Server resources can be increased as needed
- Database can be optimized for larger datasets
- Connection pooling can be adjusted

## Disaster Recovery

### Backup Strategy
- Database is backed up daily
- Backups are stored in multiple locations
- Point-in-time recovery is possible

### Failover Strategy
- Database has master-slave replication
- Automatic failover is triggered on master failure
- Application servers can be restarted automatically
- Load balancer removes failed servers from rotation

## Monitoring & Logging

### Application Monitoring
- Request/response times are monitored
- Error rates are tracked
- API endpoint performance is monitored
- Database query performance is monitored

### Logging Strategy
- All API requests are logged
- All errors are logged with stack traces
- Security events are logged in audit logs
- Performance metrics are logged

### Alerting
- Alerts are triggered for high error rates
- Alerts are triggered for slow API responses
- Alerts are triggered for database issues
- Alerts are sent to operations team
