package br.com.ctinexus.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Teste rápido da aula: GET http://localhost:8080/api/health -> {"status":"ok"}. Público (sem token).
// Serve para saber se o back-end está ligado (e, no Render, para o serviço de monitoramento).
@RestController
public class SaudeController {

    @GetMapping("/api/health")
    public Map<String, String> saude() {
        return Map.of("status", "ok");
    }
}
