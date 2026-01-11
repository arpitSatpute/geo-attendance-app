# API Testing Guide

## Quick Test with curl

### 1. Test Backend Health
```bash
curl http://localhost:8080/api/auth/login
```

Expected: 401 error (API is working, just not authenticated)

### 2. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "role": "EMPLOYEE"
  }'
```

Expected: `{"message":"User registered successfully"}`

### 3. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

Expected: `{"token":"eyJhbGc...","user":{...}}`

Save the token for next requests!

### 4. Get Current User
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Check In
```bash
curl -X POST http://localhost:8080/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10
  }'
```

### 6. Get Today's Attendance
```bash
curl -X GET http://localhost:8080/api/attendance/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing from Different Devices

### From Android Emulator
Replace `localhost` with `10.0.2.2`:
```bash
curl http://10.0.2.2:8080/api/auth/login
```

### From Physical Device
Replace `localhost` with your computer's IP (e.g., `192.168.1.100`):
```bash
curl http://192.168.1.100:8080/api/auth/login
```

## Postman Collection

You can import this collection into Postman:

```json
{
  "info": {
    "name": "GeoAttendance Pro API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"User\",\n  \"phone\": \"1234567890\",\n  \"role\": \"EMPLOYEE\"\n}"
            },
            "url": {"raw": "http://localhost:8080/api/auth/register"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {"raw": "http://localhost:8080/api/auth/login"}
          }
        }
      ]
    }
  ]
}
```

## Browser Testing

Open Swagger UI in your browser:
```
http://localhost:8080/swagger-ui/index.html
```

This provides a complete interactive API documentation!
