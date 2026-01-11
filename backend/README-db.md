# Local database for GeoAttendance backend

This repository includes a small `docker-compose.yml` to run a local PostgreSQL instance for development.

Quick start (macOS / zsh):

1. Start Postgres via Docker Compose

```bash
docker compose up -d postgres
```

2. Verify Postgres is healthy

```bash
docker compose ps
# or
docker logs -f $(docker compose ps -q postgres)
```

3. Build and run the backend (ensure you have Maven installed):

```bash
mvn clean package -DskipTests
mvn spring-boot:run
```

Database connection (matches `application.yml`):
- URL: `jdbc:postgresql://localhost:5432/geo_attendance`
- Username: `postgres`
- Password: `0000`

Stop and remove:

```bash
docker compose down -v
```

If you'd like I can also add a small `init.sql` to seed a default admin user; tell me if you want that.

