package br.com.ctinexus.security;

import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// "Leitor que verifica o crachá" (slide 25). Roda ANTES de todo controller, em toda requisição.
// Procura "Authorization: Bearer <token>" no cabeçalho (o front manda pelo services/api.js).
// Se o token for válido, avisa o Spring Security quem é a pessoa e quais permissões ela tem.
// Se não tiver token, só deixa passar: quem barra (401/403) é a ConfiguracaoSeguranca.
@Component
public class JwtFiltroAutenticacao extends OncePerRequestFilter { // OncePerRequest = roda uma vez por requisição.

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtFiltroAutenticacao(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String cabecalho = request.getHeader("Authorization"); // Ex.: "Bearer eyJhbGciOi..."

        if (cabecalho != null && cabecalho.startsWith("Bearer ")) {
            String token = cabecalho.substring(7);       // Tira o "Bearer " (7 letras) e fica só o token.
            String email = jwtService.extrairEmail(token); // null se o token for falso ou vencido.

            if (email != null) {
                // Busca no banco de novo: se o usuário foi desativado depois do login, o token antigo para de valer.
                usuarioRepository.findByEmail(email)
                        .filter(u -> u.getSituacao() == SituacaoUsuario.ATIVO && u.getPapel() != null)
                        .ifPresent(usuario -> {
                            // As permissões do papel viram "authorities" (é o que hasAuthority(...) confere).
                            var permissoes = usuario.getPapel().getPermissoes().stream()
                                    .map(SimpleGrantedAuthority::new)
                                    .toList();
                            // Crachá aceito: guarda o usuário no contexto de segurança desta requisição.
                            var autenticacao = new UsernamePasswordAuthenticationToken(usuario, null, permissoes);
                            SecurityContextHolder.getContext().setAuthentication(autenticacao);
                        });
            }
        }

        chain.doFilter(request, response); // Segue para o próximo filtro / controller.
    }
}
