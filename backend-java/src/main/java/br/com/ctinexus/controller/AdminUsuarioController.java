package br.com.ctinexus.controller;

import br.com.ctinexus.dto.AlterarSituacaoRequest;
import br.com.ctinexus.dto.UsuarioResponse;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Rotas da tela Usuários (#/usuarios). Todas exigem a permissão "gerenciar_usuarios"
// (regra em ConfiguracaoSeguranca: "/api/admin/**"). Analista ou gestor recebem 403.
@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    public AdminUsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // GET /api/admin/usuarios  -> lista todos (inclusive pedidos pendentes).
    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    // PATCH /api/admin/usuarios/{id}/status  -> aprovar, desativar, reativar ou trocar papel.
    // {id} no endereço vira o parâmetro "id" (@PathVariable).
    @PatchMapping("/{id}/status")
    public UsuarioResponse alterarSituacao(@PathVariable Long id,
                                           @RequestBody @Valid AlterarSituacaoRequest dados,
                                           @AuthenticationPrincipal Usuario quemAltera) { // Quem está logado.
        return usuarioService.alterarSituacao(id, dados, quemAltera);
    }

    // DELETE /api/admin/usuarios/{id}  -> recusar pedido de acesso (só pendentes).
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204: deu certo e não há nada para devolver.
    public void recusarPedido(@PathVariable Long id) {
        usuarioService.recusarPedido(id);
    }
}
