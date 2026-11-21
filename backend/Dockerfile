FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' ./mvnw && chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests --no-transfer-progress || true

COPY src/ src/
RUN ./mvnw clean package -DskipTests --no-transfer-progress

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl wget

COPY --from=builder /app/target/*.jar app.jar

ENV PORT=5000
EXPOSE 5000

ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar --server.port=${PORT:-5000}"]
