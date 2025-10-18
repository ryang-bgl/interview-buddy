FROM amazoncorretto:21
WORKDIR /app
COPY server-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]