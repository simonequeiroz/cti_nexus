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

// Usuários criados sozinhos quando o sistema sobe (CommandLineRunner = roda uma vez, logo depois de ligar).
// 1) O PRIMEIRO administrador, se não houver nenhum ativo. Sem ele, ninguém aprovaria os pedidos de acesso.
// 2) Os usuários de demonstração (analista e gestor), para os botões "Usar acesso de demonstração" do login.
//    Desligar com DEMO_USUARIOS=false quando o sistema for usado de verdade.
@Component
public class DadosIniciais implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosIniciais.class); // Escreve mensagens no terminal.

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String emailAdmin;
    private final String senhaAdmin;
    private final boolean criarDemonstracao;
    private final String senhaDemonstracao;

    public DadosIniciais(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                         @Value("${admin.email}") String emailAdmin, @Value("${admin.senha}") String senhaAdmin,
                         @Value("${demo.usuarios}") boolean criarDemonstracao, @Value("${demo.senha}") String senhaDemonstracao) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailAdmin = AutenticacaoService.normalizarEmail(emailAdmin);
        this.senhaAdmin = senhaAdmin;
        this.criarDemonstracao = criarDemonstracao;
        this.senhaDemonstracao = senhaDemonstracao;
    }

    @Override
    public void run(String... args) {
        // 1) Primeiro administrador: só se não existir nenhum administrador ativo.
        if (usuarioRepository.countByPapelAndSituacao(Papel.ADMINISTRADOR, SituacaoUsuario.ATIVO) == 0) {
            criarSeNaoExistir("Administrador", emailAdmin, senhaAdmin, Papel.ADMINISTRADOR);
        }

        // 2) Demonstração: mesmos e-mails do front (FormularioLogin.vue).
        if (criarDemonstracao) {
            criarSeNaoExistir("Ana Lima", "analista@ctinexus.com", senhaDemonstracao, Papel.ANALISTA);
            criarSeNaoExistir("Gustavo Reis", "gestor@ctinexus.com", senhaDemonstracao, Papel.GESTOR);
        }
    }

    // Cria o usuário ativo, a não ser que o e-mail já exista (assim não duplica a cada vez que o sistema liga).
    private void criarSeNaoExistir(String nome, String email, String senha, Papel papel) {
        if (usuarioRepository.existsByEmail(email)) {
            return;
        }
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(senha)); // Senha também vira hash BCrypt.
        usuario.setPapel(papel);
        usuario.setSituacao(SituacaoUsuario.ATIVO);
        usuarioRepository.save(usuario);
        log.info("Usuário inicial criado: {} ({})", email, papel); // Mostra só o e-mail, nunca a senha.
    }
}
