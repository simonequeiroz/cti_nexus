package br.com.ctinexus.dto;

import java.util.Map;

// Formato de todo erro que a API devolve. O front mostra a "mensagem" na tela.
// "campos" só vem quando o formulário tem erro (ex.: { "email": "E-mail inválido..." }), igual aos erros por campo do front.
public record ErroResponse(int status, String mensagem, Map<String, String> campos) {

    public ErroResponse(int status, String mensagem) { // Atalho para erro sem campos.
        this(status, mensagem, Map.of());
    }
}
