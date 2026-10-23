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
        LocalDateTime criadoEm,
        boolean deveTrocarSenha,          // true = entrou com senha temporária; o front abre a tela "Crie sua nova senha".
        LocalDateTime pediuNovaSenhaEm    // Pedido de "Esqueci minha senha" esperando o administrador (null = nenhum).
) {
    // Converte a entidade (banco) para o DTO (resposta). "static" = chama sem criar objeto: UsuarioResponse.de(usuario).
    public static UsuarioResponse de(Usuario u) {
        // Enquanto a senha for temporária, não tem permissão nenhuma (igual ao JwtFiltroAutenticacao).
        List<String> permissoes = u.getPapel() == null || u.isDeveTrocarSenha() ? List.of() : u.getPapel().getPermissoes();
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getCargo(),
                u.getPapel(), u.getSituacao(), permissoes, u.getCriadoEm(),
                u.isDeveTrocarSenha(), u.getPediuNovaSenhaEm());
    }
}
