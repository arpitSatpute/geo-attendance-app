# GeoAttendance Pro - Deployment and Operations Guide

## Executive Summary

This document provides comprehensive guidance for deploying GeoAttendance Pro to production environments. The system consists of a Java Spring Boot backend, React Native Expo mobile frontend, and MySQL/PostgreSQL database. This guide covers infrastructure setup, deployment procedures, monitoring, and operational best practices.

## Infrastructure Requirements

### Server Specifications

| Component | Minimum | Recommended | Production |
|-----------|---------|-------------|------------|
| CPU Cores | 2 | 4 | 8+ |
| RAM | 4GB | 8GB | 16GB+ |
| Storage | 50GB | 100GB | 500GB+ |
| Network | 10Mbps | 100Mbps | 1Gbps |
| Uptime SLA | 95% | 99% | 99.9% |

### Software Stack

The production environment requires the following software components:

- **Backend Runtime**: Java 11 or higher with Spring Boot 3.x
- **Database**: MySQL 8.0+ or PostgreSQL 14+
- **Cache Layer**: Redis 6.0+ for session and data caching
- **Message Queue**: RabbitMQ or Apache Kafka for async processing
- **Container Runtime**: Docker 20.10+ and Docker Compose 1.29+
- **Reverse Proxy**: Nginx 1.20+ for load balancing
- **SSL/TLS**: Let's Encrypt certificates with automatic renewal

## Backend Deployment

### Docker Containerization

Create a production-grade Docker image for the backend:

```dockerfile
# Multi-stage build for optimized image size
FROM maven:3.8.1-openjdk-11 as builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=builder /app/target/geo-attendance-backend-1.0.0.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD java -cp app.jar org.springframework.boot.loader.JarLauncher health

EXPOSE 8080
ENTRYPOINT ["java", "-Xmx1024m", "-Xms512m", "-jar", "app.jar"]
```

Build and push the Docker image:

```bash
# Build image
docker build -t geo-attendance-backend:1.0.0 .

# Tag for registry
docker tag geo-attendance-backend:1.0.0 your-registry/geo-attendance-backend:1.0.0

# Push to registry
docker push your-registry/geo-attendance-backend:1.0.0
```

### Docker Compose Setup

Create a complete stack with all services:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/geo-attendance-backend:1.0.0
    container_name: geo-attendance-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/geo_attendance
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      APP_JWT_SECRET: ${JWT_SECRET}
      APP_GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
    depends_on:
      - db
      - redis
    networks:
      - geo-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: mysql:8.0
    container_name: geo-attendance-db
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: geo_attendance
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - geo-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: geo-attendance-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - geo-network
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    container_name: geo-attendance-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - geo-network
    restart: unless-stopped

volumes:
  db_data:
  redis_data:

networks:
  geo-network:
    driver: bridge
```

### Nginx Configuration

Configure Nginx as a reverse proxy with load balancing:

```nginx
upstream backend {
  least_conn;
  server backend:8080 max_fails=3 fail_timeout=30s;
  server backend-2:8080 max_fails=3 fail_timeout=30s;
  server backend-3:8080 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name api.geoattendance.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.geoattendance.com;

  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
  limit_req zone=api_limit burst=20 nodelay;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # WebSocket support
  location /api/ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
  }
}
```

## Database Deployment

### Database Initialization

Create initialization script for database setup:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS geo_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS 'geo_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON geo_attendance.* TO 'geo_user'@'%';

-- Use database
USE geo_attendance;

-- Create tables (Spring Data JPA will handle schema creation)
-- But ensure proper indexing for performance

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, check_in_time);
CREATE INDEX idx_geofence_active ON geofences(is_active);
CREATE INDEX idx_location_user_time ON location_history(user_id, timestamp);

FLUSH PRIVILEGES;
```

### Database Backup Strategy

Implement automated daily backups:

```bash
#!/bin/bash
# backup.sh - Daily database backup script

BACKUP_DIR="/backups/geo-attendance"
DB_NAME="geo_attendance"
DB_USER="geo_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://geo-attendance-backups/

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1
```

## Mobile App Deployment

### iOS Deployment

Build and submit to App Store:

```bash
# Build for iOS
eas build --platform ios --auto-submit

# Or manual build
expo build:ios

# Submit to App Store
eas submit --platform ios
```

### Android Deployment

Build and submit to Google Play:

```bash
# Build for Android
eas build --platform android --auto-submit

# Or manual build
expo build:android

# Submit to Google Play
eas submit --platform android
```

### App Configuration

Create environment-specific configuration:

```json
{
  "production": {
    "apiUrl": "https://api.geoattendance.com",
    "googleMapsApiKey": "your-production-key",
    "firebaseConfig": {
      "projectId": "geo-attendance-prod"
    }
  },
  "staging": {
    "apiUrl": "https://staging-api.geoattendance.com",
    "googleMapsApiKey": "your-staging-key",
    "firebaseConfig": {
      "projectId": "geo-attendance-staging"
    }
  }
}
```

## Monitoring and Logging

### Application Monitoring

Setup monitoring with Prometheus and Grafana:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'geo-attendance'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/actuator/prometheus'
```

### Log Aggregation

Configure ELK Stack (Elasticsearch, Logstash, Kibana):

```yaml
# logstash.conf
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [type] == "java-springboot" {
    mutate {
      add_field => { "[@metadata][index_name]" => "geo-attendance-%{+YYYY.MM.dd}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_name]}"
  }
}
```

### Health Checks

Implement comprehensive health checks:

```java
@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    @GetMapping
    public ResponseEntity<HealthStatus> health() {
        HealthStatus status = new HealthStatus();
        status.setStatus("UP");
        status.setDatabase(checkDatabase());
        status.setRedis(checkRedis());
        status.setExternalApis(checkExternalApis());
        return ResponseEntity.ok(status);
    }
    
    private boolean checkDatabase() {
        try {
            // Perform quick database query
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

## Security Hardening

### SSL/TLS Configuration

```bash
# Generate SSL certificate with Let's Encrypt
certbot certonly --standalone -d api.geoattendance.com

# Auto-renewal with cron
0 0 1 * * certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW firewall rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3306/tcp  # MySQL (internal only)
ufw enable
```

### API Rate Limiting

Implement rate limiting at multiple levels:

```java
@Configuration
public class RateLimitingConfig {
    
    @Bean
    public RateLimiter rateLimiter() {
        return RateLimiter.create(100.0); // 100 requests per second
    }
}
```

## Scaling Strategy

### Horizontal Scaling

Deploy multiple backend instances behind load balancer:

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Or with Kubernetes
kubectl scale deployment geo-attendance-backend --replicas=3
```

### Database Scaling

Implement read replicas for database:

```sql
-- Create read replica
CHANGE MASTER TO
  MASTER_HOST='primary-db',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;
```

### Caching Strategy

Implement multi-level caching:

```java
@Cacheable(value = "geofences", key = "#id")
public Geofence getGeofence(Long id) {
    return geofenceRepository.findById(id).orElse(null);
}

@CacheEvict(value = "geofences", key = "#id")
public void updateGeofence(Long id, Geofence geofence) {
    geofenceRepository.save(geofence);
}
```

## Disaster Recovery

### Backup and Recovery Plan

| Component | Backup Frequency | Retention | Recovery Time |
|-----------|-----------------|-----------|---------------|
| Database | Daily | 30 days | 15 minutes |
| Application | Per release | 10 releases | 5 minutes |
| Configuration | Per change | 90 days | 2 minutes |

### Recovery Procedures

```bash
# Restore database from backup
gunzip < /backups/backup_20240115_020000.sql.gz | mysql -u geo_user -p geo_attendance

# Rollback application
docker pull your-registry/geo-attendance-backend:1.0.0-previous
docker-compose up -d backend
```

## Performance Tuning

### JVM Optimization

```bash
# Set JVM parameters
export JAVA_OPTS="-Xmx2048m -Xms1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Database Optimization

```sql
-- Enable query cache
SET GLOBAL query_cache_size = 268435456;
SET GLOBAL query_cache_type = 1;

-- Optimize tables
OPTIMIZE TABLE users;
OPTIMIZE TABLE attendance_records;
OPTIMIZE TABLE geofences;
```

## Operational Runbooks

### Incident Response

**Database Connection Pool Exhaustion**
1. Check active connections: `SHOW PROCESSLIST;`
2. Identify long-running queries
3. Kill problematic connections: `KILL <connection_id>;`
4. Increase pool size if needed
5. Restart affected services

**High Memory Usage**
1. Check memory usage: `free -h`
2. Identify memory-consuming processes: `top`
3. Check garbage collection logs
4. Increase heap size if needed
5. Restart application

**API Response Time Degradation**
1. Check database query performance
2. Review application logs for errors
3. Check Redis cache hit rate
4. Monitor network latency
5. Scale horizontally if needed

## Conclusion

This deployment guide provides a comprehensive roadmap for deploying GeoAttendance Pro to production. Follow these procedures carefully, test thoroughly in staging environments, and maintain detailed documentation of your specific deployment configuration. Regular monitoring, backup verification, and security audits are essential for maintaining a reliable and secure system.
