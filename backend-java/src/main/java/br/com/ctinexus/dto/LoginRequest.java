package br.com.ctinexus.dto;

import jakarta.validation.constraints.NotBlank;

// O que chega no login (slide 18). JSON de exemplo: { "email": "admin@ctinexus.com", "senha": "123456" }
public record LoginRequest(
        @NotBlank(message = "Informe o e-mail.") String email,
        @NotBlank(message = "Informe a senha.") String senha
) {}
