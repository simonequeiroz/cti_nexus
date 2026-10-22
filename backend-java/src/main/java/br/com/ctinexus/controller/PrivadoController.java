package br.com.ctinexus.controller;

import br.com.ctinexus.model.Usuario;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Rota de teste da aula (slide 29): sem token -> 401; com token válido -> 200.
// Serve só para provar que a proteção JWT funciona.
@RestController
public class PrivadoController {

    @GetMapping("/api/privado")
    public Map<String, String> privado(@AuthenticationPrincipal Usuario usuario) {
        return Map.of("mensagem", "Acesso liberado para " + usuario.getNome() + ".");
    }
}
