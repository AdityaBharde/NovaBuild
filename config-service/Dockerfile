FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S novabuild && adduser -S novabuild -G novabuild
USER novabuild

COPY target/*.jar app.jar

EXPOSE 8888

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
