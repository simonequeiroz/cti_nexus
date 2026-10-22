package br.com.ctinexus.dto;

import br.com.ctinexus.model.Papel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// O que o administrador manda ao CADASTRAR (POST) ou EDITAR (PUT) um usuário na tela Usuários.
// Diferente do pedido de acesso: aqui o papel vem junto e o usuário já nasce ativo.
// Senha: obrigatória no cadastro; na edição, vazia = manter a atual (a regra está no UsuarioService).
public record UsuarioAdminRequest(

        @NotBlank(message = "Informe o nome completo.")
        @Size(min = 3, max = 120, message = "Informe o nome completo (pelo menos 3 letras).")
        String nome,

        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "E-mail inválido. Ex.: nome@empresa.com")
        String email,

        @Size(max = 72, message = "A senha pode ter até 72 caracteres.") // Limite do BCrypt.
        String senha,

        @NotNull(message = "Escolha o papel do usuário.")
        Papel papel
) {}
