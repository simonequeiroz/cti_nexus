package br.com.ctinexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// "Esqueci minha senha" na tela de login: só o e-mail. JSON: { "email": "ana@empresa.com" }
public record EsqueciSenhaRequest(
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "E-mail inválido. Ex.: nome@empresa.com")
        String email
) {}
