# Geo Attendance Backend - Local build notes

This backend project requires Java 17 to compile and run due to Lombok and annotation-processor compatibility with the build toolchain.

Quick setup (macOS / zsh):

1) Install a JDK 17 distribution if not installed. Example (Homebrew):

```bash
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

2) Set JAVA_HOME for current terminal (temporary):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v17)
```

To make this permanent, add the line above to your `~/.zshrc` and `source ~/.zshrc`.

3) Build the project:

```bash
cd /path/to/backend
mvn -DskipTests clean compile
```

4) Run the application:

```bash
mvn -DskipTests spring-boot:run
```

Notes:
- The project currently uses Lombok. If you prefer using JDK 21, update the Lombok version in `pom.xml` to a compatible release (if available).
- The security configuration exposes `/auth/**` and `/api/auth/**` endpoints so they are not secured by JWT authentication.

