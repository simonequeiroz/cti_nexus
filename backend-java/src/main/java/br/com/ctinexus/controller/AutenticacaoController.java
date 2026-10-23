package br.com.ctinexus.controller;

import br.com.ctinexus.dto.CadastroRequest;
import br.com.ctinexus.dto.EsqueciSenhaRequest;
import br.com.ctinexus.dto.LoginRequest;
import br.com.ctinexus.dto.LoginResponse;
import br.com.ctinexus.dto.TrocarSenhaRequest;
import br.com.ctinexus.dto.UsuarioResponse;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// "Recepção" da API de autenticação (slide 20): recebe o pedido HTTP, repassa ao service e devolve a resposta.
// Nenhuma regra fica aqui: tudo está no AutenticacaoService.
@RestController                 // Os métodos devolvem JSON.
@RequestMapping("/api/auth")    // Começo do endereço de todas as rotas desta classe.
public class AutenticacaoController {

    private final AutenticacaoService autenticacaoService;

    public AutenticacaoController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    // POST /api/auth/cadastro  -> pedido de acesso (tela #/cadastro). Público.
    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED) // 201 Created, como no slide 27.
    public UsuarioResponse cadastrar(@RequestBody @Valid CadastroRequest dados) { // @Valid confere as anotações do DTO.
        return autenticacaoService.cadastrar(dados);
    }

    // POST /api/auth/login  -> devolve o token. Público.
    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest dados) {
        return autenticacaoService.login(dados);
    }

    // POST /api/auth/esqueci-senha  -> marca o pedido para o administrador. Público.
    // Sempre a mesma resposta, exista o e-mail ou não (ninguém descobre quem está cadastrado).
    @PostMapping("/esqueci-senha")
    public Map<String, String> esqueciSenha(@RequestBody @Valid EsqueciSenhaRequest dados) {
        autenticacaoService.esqueciSenha(dados);
        return Map.of("mensagem", "Solicitação registrada. Se o e-mail estiver cadastrado, o administrador enviará uma senha temporária.");
    }

    // POST /api/auth/trocar-senha  -> a pessoa logada troca a própria senha. Exige token.
    @PostMapping("/trocar-senha")
    public UsuarioResponse trocarSenha(@AuthenticationPrincipal Usuario usuario, @RequestBody @Valid TrocarSenhaRequest dados) {
        return autenticacaoService.trocarSenha(usuario, dados);
    }

    // GET /api/auth/me  -> quem é o dono do token (slide 30). Exige token.
    // @AuthenticationPrincipal entrega o usuário que o JwtFiltroAutenticacao colocou no contexto.
    @GetMapping("/me")
    public UsuarioResponse eu(@AuthenticationPrincipal Usuario usuario) {
        return UsuarioResponse.de(usuario);
    }
}
