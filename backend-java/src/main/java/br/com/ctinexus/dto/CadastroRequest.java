package br.com.ctinexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// DTO = "formulário" que chega na API (slide 18). Aqui: o pedido de acesso da tela #/cadastro.
// record = classe curta só com dados (o Java cria construtor e getters sozinho).
// As anotações conferem os campos ANTES de chegar no service; se falhar, a API devolve 400.
// Mesmas regras do front (utils/validacaoUsuario.js).
public record CadastroRequest(

        @NotBlank(message = "Informe o nome completo.")
        @Size(min = 3, max = 120, message = "Informe o nome completo (pelo menos 3 letras).")
        String nome,

        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "E-mail inválido. Ex.: nome@empresa.com")
        String email,

        @Size(max = 80, message = "O cargo pode ter até 80 caracteres.")
        String cargo, // Opcional: sem @NotBlank.

        @NotBlank(message = "Informe a senha.")
        @Size(min = 6, message = "A senha precisa ter pelo menos 6 caracteres.")
        String senha
) {}
