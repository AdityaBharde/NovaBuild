FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Run as non-root user for security
RUN addgroup -S novabuild && adduser -S novabuild -G novabuild
USER novabuild

COPY discovery-service/target/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
