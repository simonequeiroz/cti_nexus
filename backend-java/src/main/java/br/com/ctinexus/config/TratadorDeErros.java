package br.com.ctinexus.config;

import br.com.ctinexus.dto.ErroResponse;
import br.com.ctinexus.service.RegraDeNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

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
}
