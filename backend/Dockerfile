# Dockerfile
# Multi-stage build: build with Maven, run with a slim JRE
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the full project (avoids missing .mvn errors)
COPY . .

# Build the jar (skip tests in CI/local fast build)
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
