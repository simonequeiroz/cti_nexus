package br.com.ctinexus.config;

import br.com.ctinexus.dto.ErroResponse;
import br.com.ctinexus.service.RegraDeNegocioException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

import java.util.LinkedHashMap;
import java.util.Map;

// É o "ErroHandler" da aula de validação: mesmo papel, mas devolve TODOS os campos com erro de uma vez,
// no formato { status, mensagem, campos } que o front já entende (o slide devolve só o primeiro erro).
// Transforma os erros do sistema em respostas JSON padronizadas (ErroResponse),
// em vez da página de erro genérica do Spring. Vale para todos os controllers.
@RestControllerAdvice
public class TratadorDeErros {

    // Erros de regra lançados pelos services (e-mail repetido, senha errada, último administrador...).
    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<ErroResponse> regraDeNegocio(RegraDeNegocioException e) {
        // Se o erro é de um campo (ex.: e-mail repetido), o front mostra a mensagem embaixo daquele campo.
        Map<String, String> campos = e.getCampo() == null ? Map.of() : Map.of(e.getCampo(), e.getMessage());
        return ResponseEntity.status(e.getStatus())
                .body(new ErroResponse(e.getStatus().value(), e.getMessage(), campos));
    }

    // Erros das anotações dos DTOs (@NotBlank, @Email, @Size...): devolve 400 com o erro de cada campo.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> campoInvalido(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getField(), erro.getDefaultMessage())); // Um erro por campo.
        return ResponseEntity.badRequest()
                .body(new ErroResponse(HttpStatus.BAD_REQUEST.value(), "Confira os campos destacados.", campos));
    }

    // Erros de uma LISTA: @RequestBody List<@Valid ClienteDTO>.
    // Atenção: em lista o Spring lança ESTA exceção, e não a MethodArgumentNotValidException do slide.
    // Sem este método, a resposta seria um erro genérico, sem dizer qual campo está errado.
    // Exemplo do que devolve: { "[0].nomeCliente": "O nome do cliente é obrigatório" }.  [0] = primeiro item da lista.
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErroResponse> listaInvalida(HandlerMethodValidationException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (ParameterValidationResult resultado : e.getParameterValidationResults()) { // Um resultado por item com erro.
            String item = "[" + resultado.getContainerIndex() + "]";                    // Posição do item na lista.
            for (MessageSourceResolvable erro : resultado.getResolvableErrors()) {       // Cada anotação que falhou.
                String campo = erro instanceof FieldError f ? item + "." + f.getField() : item;
                campos.putIfAbsent(campo, erro.getDefaultMessage()); // Um erro por campo.
            }
        }
        return ResponseEntity.badRequest()
                .body(new ErroResponse(HttpStatus.BAD_REQUEST.value(), "Dados inválidos. Confira os campos destacados.", campos));
    }

    // Corpo que não é um JSON válido (vírgula faltando, acento estragado, texto no lugar de lista...): 400.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> jsonIlegivel(HttpMessageNotReadableException e) {
        // O JSON está certo, mas um valor não cabe no tipo do DTO (data 2025-02-31, texto no faturamento): aponta o campo.
        // Isso acontece ANTES das anotações: sem conseguir converter, o Java nem chega a criar o DTO.
        if (e.getCause() instanceof MismatchedInputException erro && !erro.getPath().isEmpty()) {
            Map<String, String> campos = Map.of(caminho(erro), "Valor em formato inválido (data: aaaa-mm-dd; número: 1850000.50)");
            return ResponseEntity.badRequest()
                    .body(new ErroResponse(HttpStatus.BAD_REQUEST.value(), "Dados inválidos. Confira os campos destacados.", campos));
        }
        return ResponseEntity.badRequest()
                .body(new ErroResponse(HttpStatus.BAD_REQUEST.value(), "Os dados enviados não estão num formato válido (JSON)."));
    }

    // Monta o caminho do campo com erro, no mesmo formato da lista: "[0].dataContratacao".
    private static String caminho(JacksonException erro) {
        StringBuilder texto = new StringBuilder();
        for (JacksonException.Reference parte : erro.getPath()) {
            if (parte.getPropertyName() == null) texto.append('[').append(parte.getIndex()).append(']'); // Posição na lista.
            else texto.append(texto.isEmpty() ? "" : ".").append(parte.getPropertyName());               // Nome do campo.
        }
        return texto.toString();
    }
}
