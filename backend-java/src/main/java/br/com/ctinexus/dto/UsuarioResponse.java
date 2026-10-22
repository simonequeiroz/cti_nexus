package br.com.ctinexus.dto;

import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;

import java.time.LocalDateTime;
import java.util.List;

// Dados do usuário que SAEM da API, sem a senha (slide 18: "sem expor sua senha").
// Nunca devolver a entidade Usuario direto: ela tem o senhaHash.
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        String cargo,
        Papel papel,              // null enquanto o pedido está pendente.
        SituacaoUsuario situacao,
        List<String> permissoes,  // O front usa para mostrar/esconder telas e botões.
        LocalDateTime criadoEm
) {
    // Converte a entidade (banco) para o DTO (resposta). "static" = chama sem criar objeto: UsuarioResponse.de(usuario).
    public static UsuarioResponse de(Usuario u) {
        List<String> permissoes = u.getPapel() == null ? List.of() : u.getPapel().getPermissoes();
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getCargo(),
                u.getPapel(), u.getSituacao(), permissoes, u.getCriadoEm());
    }
}
