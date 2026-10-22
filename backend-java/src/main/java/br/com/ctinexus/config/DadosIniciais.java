package br.com.ctinexus.config;

import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.repository.UsuarioRepository;
import br.com.ctinexus.service.AutenticacaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Cria o PRIMEIRO administrador quando o sistema sobe com o banco vazio.
// Sem isso ninguém conseguiria aprovar os pedidos de acesso (o cadastro público sempre entra como pendente).
// E-mail e senha vêm das variáveis ADMIN_EMAIL e ADMIN_SENHA (no Render, definir valores fortes!).
@Component
public class DadosIniciais implements CommandLineRunner { // CommandLineRunner = roda uma vez, logo depois de o sistema subir.

    private static final Logger log = LoggerFactory.getLogger(DadosIniciais.class); // Escreve mensagens no terminal.

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String senha;

    public DadosIniciais(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                         @Value("${admin.email}") String email, @Value("${admin.senha}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = AutenticacaoService.normalizarEmail(email);
        this.senha = senha;
    }

    @Override
    public void run(String... args) {
        // Já existe administrador ativo (ou esse e-mail já está em uso)? Não faz nada.
        if (usuarioRepository.countByPapelAndSituacao(Papel.ADMINISTRADOR, SituacaoUsuario.ATIVO) > 0
                || usuarioRepository.existsByEmail(email)) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setNome("Administrador");
        admin.setEmail(email);
        admin.setSenhaHash(passwordEncoder.encode(senha)); // Senha também vira hash BCrypt.
        admin.setPapel(Papel.ADMINISTRADOR);
        admin.setSituacao(SituacaoUsuario.ATIVO);
        usuarioRepository.save(admin);

        log.info("Primeiro administrador criado: {}", email); // Mostra só o e-mail, nunca a senha.
    }
}
