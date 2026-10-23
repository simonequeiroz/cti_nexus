package br.com.ctinexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// O administrador define uma senha temporária para quem pediu "Esqueci minha senha".
// JSON: { "senha": "Temp2026" }. A pessoa vai ser obrigada a trocar no próximo login.
public record SenhaTemporariaRequest(
        @NotBlank(message = "Informe a senha temporária.")
        @Size(min = 6, max = 72, message = "A senha precisa ter pelo menos 6 caracteres.")
        String senha
) {}
