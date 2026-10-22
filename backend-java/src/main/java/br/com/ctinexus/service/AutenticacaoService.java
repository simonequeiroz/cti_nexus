package br.com.ctinexus.service;

import br.com.ctinexus.dto.CadastroRequest;
import br.com.ctinexus.dto.LoginRequest;
import br.com.ctinexus.dto.LoginResponse;
import br.com.ctinexus.dto.UsuarioResponse;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.repository.UsuarioRepository;
import br.com.ctinexus.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// Regras de cadastro e login (slide 20). O controller só recebe e repassa; quem decide é o service.
@Service // Avisa o Spring: "crie um objeto desta classe e entregue para quem pedir".
public class AutenticacaoService {

    private final UsuarioRepository usuarioRepository; // Fala com o banco.
    private final PasswordEncoder passwordEncoder;     // BCrypt (configurado em ConfiguracaoSeguranca).
    private final JwtService jwtService;               // Gera o token.

    // Injeção de dependência: o Spring entrega estes 3 objetos prontos pelo construtor.
    public AutenticacaoService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Passo 3 do slide 13: cadastro com BCrypt.
    // No CTI Nexus o cadastro é um PEDIDO de acesso: entra pendente e sem papel (quem escolhe o papel é o administrador).
    public UsuarioResponse cadastrar(CadastroRequest dados) {
        String email = normalizarEmail(dados.email());

        if (usuarioRepository.existsByEmail(email)) { // 1) E-mail repetido? Para aqui.
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Já existe um usuário ou pedido de acesso com esse e-mail.", "email");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dados.nome().trim());
        usuario.setEmail(email);
        usuario.setCargo(dados.cargo() == null || dados.cargo().isBlank() ? null : dados.cargo().trim());
        usuario.setSenhaHash(passwordEncoder.encode(dados.senha())); // 2) Guarda o HASH, nunca a senha.
        usuario.setSituacao(SituacaoUsuario.PENDENTE);               //    Espera a aprovação.

        return UsuarioResponse.de(usuarioRepository.save(usuario)); // 3) INSERT no banco e devolve sem a senha.
    }

    // Passos 4 e 5 do slide 13: confere e-mail e senha com matches() e gera o token.
    public LoginResponse login(LoginRequest dados) {
        // Mesma mensagem para "e-mail não existe" e "senha errada": assim ninguém descobre quais e-mails existem.
        Usuario usuario = usuarioRepository.findByEmail(normalizarEmail(dados.email()))
                .orElseThrow(() -> new RegraDeNegocioException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));

        // matches() criptografa a senha digitada do mesmo jeito e compara com o hash guardado.
        if (!passwordEncoder.matches(dados.senha(), usuario.getSenhaHash())) {
            throw new RegraDeNegocioException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        }

        // Senha certa, mas a conta pode não estar liberada (mesmas mensagens do front).
        if (usuario.getSituacao() == SituacaoUsuario.PENDENTE) {
            throw new RegraDeNegocioException(HttpStatus.FORBIDDEN, "Seu pedido de acesso ainda não foi aprovado pelo administrador.");
        }
        if (usuario.getSituacao() == SituacaoUsuario.DESATIVADO) {
            throw new RegraDeNegocioException(HttpStatus.FORBIDDEN, "Este usuário foi desativado. Fale com o administrador.");
        }

        String token = jwtService.gerarToken(usuario); // Tudo certo: emite o "crachá".
        return new LoginResponse(token, UsuarioResponse.de(usuario));
    }

    // " Ana@Empresa.com " vira "ana@empresa.com" (igual ao front).
    public static String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
