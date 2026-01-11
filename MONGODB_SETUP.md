# MongoDB Setup Guide for GeoAttendance Pro

## Prerequisites

- MongoDB 5.0 or higher
- Java 17
- Maven 3.8+
- Node.js 18+

## MongoDB Installation

### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify MongoDB is running
mongosh
```

### Ubuntu/Debian
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Add MongoDB repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a Windows service

## Database Setup

### 1. Connect to MongoDB
```bash
mongosh
```

### 2. Create Database and User
```javascript
// Switch to geo_attendance database (auto-creates)
use geo_attendance

// Create admin user for the database
db.createUser({
  user: "geoattendance_admin",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "geo_attendance" },
    { role: "dbAdmin", db: "geo_attendance" }
  ]
})

// Verify user created
db.getUsers()
```

### 3. Create Indexes
```javascript
// User collection indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "active": 1 })

// Attendance records indexes
db.attendance_records.createIndex({ "userId": 1, "checkInTime": 1 })
db.attendance_records.createIndex({ "userId": 1, "status": 1 })
db.attendance_records.createIndex({ "checkInTime": 1 })

// Geofence indexes
db.geofences.createIndex({ "location": "2dsphere" })
db.geofences.createIndex({ "isActive": 1 })
db.geofences.createIndex({ "createdById": 1 })

// Leave indexes
db.leaves.createIndex({ "userId": 1, "status": 1 })
db.leaves.createIndex({ "startDate": 1, "endDate": 1 })
```

## Backend Configuration

### Update application.yml

**For MongoDB without authentication:**
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/geo_attendance
```

**For MongoDB with authentication:**
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://geoattendance_admin:your_secure_password@localhost:27017/geo_attendance?authSource=geo_attendance
```

**Full configuration example:**
```yaml
spring:
  application:
    name: geo-attendance-backend
  
  data:
    mongodb:
      uri: mongodb://localhost:27017/geo_attendance
      # Or with auth:
      # uri: mongodb://geoattendance_admin:password@localhost:27017/geo_attendance?authSource=geo_attendance
      
      # Connection pool settings
      auto-index-creation: true
      
  # Disable JPA auto-configuration (no longer needed)
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration
```

## Starting the Application

### 1. Start MongoDB
```bash
# macOS
brew services start mongodb-community@7.0

# Linux
sudo systemctl start mongod

# Windows - MongoDB runs as a service automatically
```

### 2. Verify MongoDB is Running
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Should output: { ok: 1 }
```

### 3. Build and Run Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### 4. Start Frontend
```bash
cd frontend
npm install
npx expo start
```

## MongoDB Management Tools

### MongoDB Compass (GUI)
Download from: https://www.mongodb.com/products/compass

Connection string:
```
mongodb://localhost:27017/geo_attendance
```

### mongosh (CLI)
```bash
# Connect to database
mongosh mongodb://localhost:27017/geo_attendance

# Show collections
show collections

# Query users
db.users.find().pretty()

# Count documents
db.users.countDocuments()
db.attendance_records.countDocuments()

# Find user by email
db.users.findOne({ email: "test@example.com" })
```

## Common MongoDB Commands

```javascript
// Show all databases
show dbs

// Switch to geo_attendance database
use geo_attendance

// Show all collections
show collections

// Insert a test user
db.users.insertOne({
  email: "test@example.com",
  password: "$2a$10$...",  // bcrypt hash
  firstName: "Test",
  lastName: "User",
  role: "EMPLOYEE",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Find all users
db.users.find()

// Find users by role
db.users.find({ role: "EMPLOYEE" })

// Update user
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { active: false } }
)

// Delete user
db.users.deleteOne({ email: "test@example.com" })

// Get today's attendance
db.attendance_records.find({
  checkInTime: {
    $gte: new Date(new Date().setHours(0,0,0,0)),
    $lt: new Date(new Date().setHours(23,59,59,999))
  }
})

// Drop collection (careful!)
db.users.drop()

// Drop entire database (very careful!)
db.dropDatabase()
```

## Backup and Restore

### Backup Database
```bash
# Backup entire database
mongodump --db=geo_attendance --out=/backup/

# Backup specific collection
mongodump --db=geo_attendance --collection=users --out=/backup/
```

### Restore Database
```bash
# Restore entire database
mongorestore --db=geo_attendance /backup/geo_attendance/

# Restore specific collection
mongorestore --db=geo_attendance --collection=users /backup/geo_attendance/users.bson
```

## Production Considerations

### 1. Enable Authentication
Edit `/etc/mongod.conf`:
```yaml
security:
  authorization: enabled
```

### 2. Configure Replica Set (for high availability)
```yaml
replication:
  replSetName: "rs0"
```

### 3. Connection Pool Settings
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/geo_attendance?maxPoolSize=20&minPoolSize=5
```

### 4. Enable SSL/TLS
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/geo_attendance?ssl=true
```

## Troubleshooting

### MongoDB won't start
```bash
# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
tail -f /var/log/mongodb/mongod.log  # Linux

# Check if port is in use
lsof -i :27017

# Remove lock file if needed
sudo rm /data/db/mongod.lock
mongod --repair
```

### Connection refused
```bash
# Verify MongoDB is running
ps aux | grep mongod

# Check MongoDB status
brew services list  # macOS
sudo systemctl status mongod  # Linux
```

### Authentication failed
```bash
# Connect without auth first
mongosh --noauth

# Recreate user
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["root"]
})
```

## Migration from PostgreSQL

If you have existing PostgreSQL data:

1. Export data from PostgreSQL
2. Transform to JSON format
3. Import to MongoDB using `mongoimport`

Example:
```bash
# Export from PostgreSQL to JSON
psql -d geo_attendance -c "COPY (SELECT row_to_json(t) FROM users t) TO STDOUT" > users.json

# Import to MongoDB
mongoimport --db geo_attendance --collection users --file users.json --jsonArray
```

## Performance Optimization

### Create Compound Indexes
```javascript
// For frequent queries
db.attendance_records.createIndex({ userId: 1, checkInTime: -1 })
db.attendance_records.createIndex({ userId: 1, status: 1 })
```

### Monitor Query Performance
```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty()
```

## Useful Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Spring Data MongoDB Reference](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

---

**Your GeoAttendance Pro is now configured with MongoDB! 🚀**
