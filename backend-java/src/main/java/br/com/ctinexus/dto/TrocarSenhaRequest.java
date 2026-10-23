package br.com.ctinexus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Tela "Crie sua nova senha": a pessoa logada troca a própria senha.
// Pede a senha atual (a temporária) para provar que é ela mesma, e não alguém usando o computador dela.
public record TrocarSenhaRequest(
        @NotBlank(message = "Informe a senha atual.")
        String senhaAtual,

        @NotBlank(message = "Informe a nova senha.")
        @Size(min = 6, max = 72, message = "A senha precisa ter pelo menos 6 caracteres.")
        String senhaNova
) {}
