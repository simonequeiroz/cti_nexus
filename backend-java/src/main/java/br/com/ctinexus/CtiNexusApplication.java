package br.com.ctinexus; // "Endereço" da classe: igual às pastas src/main/java/br/com/ctinexus.

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Classe principal: é por aqui que o Spring Boot começa (como o main.js do front).
// @SpringBootApplication faz o Spring procurar sozinho os controllers, services etc.
// em br.com.ctinexus e nas subpastas (controller/, service/, repository/...).
@SpringBootApplication
public class CtiNexusApplication {

    public static void main(String[] args) {
        SpringApplication.run(CtiNexusApplication.class, args); // Liga o servidor na porta 8080.
    }
}
