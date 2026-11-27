# Receita do contêiner do back-end (usada pelo Render). O Render não tem Java pronto, então ele segue
# esta receita para montar uma "caixa" com o Java 21 e o nosso sistema dentro.
# São duas etapas ("multi-stage"): uma caixa grande para COMPILAR e uma pequena para RODAR.

# ===== ETAPA 1: compilar (Maven + JDK 21) =====
FROM maven:3.9-eclipse-temurin-21 AS compilacao
WORKDIR /app
# Primeiro só o pom.xml: o Docker guarda as bibliotecas baixadas e, se o pom não mudar, não baixa de novo.
COPY pom.xml .
RUN mvn -q dependency:go-offline
# Depois o código. -DskipTests: os testes rodam no PC (mvn test) antes do push; aqui só empacotamos.
COPY src ./src
RUN mvn -q package -DskipTests

# ===== ETAPA 2: rodar (só o Java, sem Maven nem código-fonte) =====
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copia da etapa 1 apenas o .jar pronto (o sistema inteiro num arquivo só).
COPY --from=compilacao /app/target/cti-nexus-api-0.0.1-SNAPSHOT.jar app.jar
# O plano grátis do Render tem 512 MB de memória: o Java usa no máximo 75% dela.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
# Só documenta a porta do PC; no Render vale a variável PORT (server.port=${PORT:8080}).
EXPOSE 8080
# Comando que liga o back-end quando a caixa inicia.
ENTRYPOINT ["java", "-jar", "app.jar"]
