package br.com.ctinexus.service;

import org.springframework.http.HttpStatus;

// Erro de regra do sistema (ex.: "e-mail já cadastrado"), com o código HTTP que a API deve devolver.
// O service "lança" (throw) e o TratadorDeErros (config/) transforma em resposta JSON.
// Parecido com o ColunaObrigatoriaError do front (utils/leituraPlanilha.js).
public class RegraDeNegocioException extends RuntimeException {

    private final HttpStatus status; // Ex.: 409 CONFLICT, 401 UNAUTHORIZED, 403 FORBIDDEN.

    public RegraDeNegocioException(HttpStatus status, String mensagem) {
        super(mensagem); // A mensagem que aparece para o usuário.
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
