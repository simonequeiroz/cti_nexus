package br.com.ctinexus.service;

import br.com.ctinexus.dto.AlterarSituacaoRequest;
import br.com.ctinexus.dto.SenhaTemporariaRequest;
import br.com.ctinexus.dto.UsuarioAdminRequest;
import br.com.ctinexus.dto.UsuarioResponse;
import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Regras da tela Usuários (só o administrador chega aqui; quem barra os outros é a ConfiguracaoSeguranca).
// Mesmas proteções do front (usuariosStore): ninguém altera o próprio papel ou situação,
// e o sistema nunca fica sem administrador ativo.
@Service
public class UsuarioService {

    private static final int SENHA_MINIMA = 6; // Igual ao front (utils/validacaoUsuario.js).

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Todos os usuários, inclusive os pedidos pendentes (o front separa pela "situacao").
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByCriadoEmDesc().stream()
                .map(UsuarioResponse::de) // Converte cada Usuario em UsuarioResponse (sem a senha).
                .toList();
    }

    // Administrador cadastra alguém direto, já com papel e ativo (botão "+ Novo usuário").
    @Transactional
    public UsuarioResponse criar(UsuarioAdminRequest dados) {
        String email = AutenticacaoService.normalizarEmail(dados.email());
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Já existe um usuário ou pedido de acesso com esse e-mail.", "email");
        }
        conferirSenha(dados.senha()); // No cadastro a senha é obrigatória.

        Usuario usuario = new Usuario();
        usuario.setNome(dados.nome().trim());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(dados.senha())); // Hash BCrypt.
        usuario.setPapel(dados.papel());
        usuario.setSituacao(SituacaoUsuario.ATIVO); // Cadastrado pelo administrador = já pode entrar.
        usuario.setDeveTrocarSenha(true);           // O administrador sabe esta senha: no 1º login a pessoa cria a dela.
        return UsuarioResponse.de(usuarioRepository.save(usuario));
    }

    // Editar nome, e-mail, papel e (se vier preenchida) a senha (botão "Editar").
    @Transactional
    public UsuarioResponse editar(Long id, UsuarioAdminRequest dados, Usuario quemAltera) {
        Usuario usuario = buscar(id);
        String email = AutenticacaoService.normalizarEmail(dados.email());

        // E-mail novo não pode ser de outra pessoa (o próprio e-mail pode continuar igual).
        if (!email.equals(usuario.getEmail()) && usuarioRepository.existsByEmail(email)) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Já existe um usuário ou pedido de acesso com esse e-mail.", "email");
        }
        if (dados.papel() != usuario.getPapel()) { // Quer mudar o papel?
            if (usuario.getId().equals(quemAltera.getId())) {
                throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Você não pode mudar o seu próprio papel.", "papel");
            }
            if (ehUltimoAdministrador(usuario)) {
                throw new RegraDeNegocioException(HttpStatus.CONFLICT,
                        "Este é o único administrador ativo. Cadastre outro antes de mudar o papel dele.", "papel");
            }
        }

        usuario.setNome(dados.nome().trim());
        usuario.setEmail(email);
        usuario.setPapel(dados.papel());
        if (dados.senha() != null && !dados.senha().isEmpty()) { // Senha em branco = manter a atual.
            conferirSenha(dados.senha());
            usuario.setSenhaHash(passwordEncoder.encode(dados.senha()));
            // Senha de outra pessoa digitada pelo administrador vale como temporária. A própria senha, não.
            usuario.setDeveTrocarSenha(!usuario.getId().equals(quemAltera.getId()));
            usuario.setPediuNovaSenhaEm(null);
        }
        return UsuarioResponse.de(usuarioRepository.save(usuario)); // UPDATE no banco.
    }

    // Aprovar pedido, desativar ou reativar (e, se vier, trocar o papel).
    @Transactional // Ou faz tudo, ou não faz nada no banco.
    public UsuarioResponse alterarSituacao(Long id, AlterarSituacaoRequest dados, Usuario quemAltera) {
        Usuario usuario = buscar(id);

        if (usuario.getId().equals(quemAltera.getId())) { // Proteção 1: não mexe na própria conta.
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Você não pode alterar a sua própria situação ou papel.");
        }

        Papel novoPapel = dados.papel() != null ? dados.papel() : usuario.getPapel(); // Sem papel no pedido = mantém.
        if (dados.situacao() == SituacaoUsuario.ATIVO && novoPapel == null) { // Aprovar exige escolher o papel.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Escolha o papel antes de aprovar.", "papel");
        }
        if (dados.situacao() == SituacaoUsuario.PENDENTE) { // Pendente é só para quem acabou de pedir.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Escolha ATIVO ou DESATIVADO.");
        }

        // Proteção 2: o último administrador ativo não pode deixar de ser.
        boolean continuaAdminAtivo = novoPapel == Papel.ADMINISTRADOR && dados.situacao() == SituacaoUsuario.ATIVO;
        if (!continuaAdminAtivo && ehUltimoAdministrador(usuario)) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "O único administrador ativo não pode ser desativado.");
        }

        usuario.setPapel(novoPapel);
        usuario.setSituacao(dados.situacao());
        return UsuarioResponse.de(usuarioRepository.save(usuario));
    }

    // Responde a um "Esqueci minha senha": define a senha temporária. No próximo login a pessoa é obrigada a trocar.
    @Transactional
    public UsuarioResponse definirSenhaTemporaria(Long id, SenhaTemporariaRequest dados, Usuario quemAltera) {
        Usuario usuario = buscar(id);
        if (usuario.getId().equals(quemAltera.getId())) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Para mudar a sua própria senha, use Editar.");
        }
        if (usuario.getSituacao() != SituacaoUsuario.ATIVO) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Só usuários ativos podem receber senha temporária.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(dados.senha())); // Também vira hash BCrypt.
        usuario.setDeveTrocarSenha(true);   // Obriga a trocar no próximo login.
        usuario.setPediuNovaSenhaEm(null);  // Pedido atendido.
        return UsuarioResponse.de(usuarioRepository.save(usuario));
    }

    // Recusar pedido de acesso: apaga, porque a pessoa nunca teve acesso. Usuário já aprovado só é desativado.
    @Transactional
    public void recusarPedido(Long id) {
        Usuario usuario = buscar(id);
        if (usuario.getSituacao() != SituacaoUsuario.PENDENTE) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Só pedidos pendentes podem ser recusados. Para tirar o acesso, desative o usuário.");
        }
        usuarioRepository.delete(usuario);
    }

    // ===== AJUDANTES (private = só usados aqui dentro) =====

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RegraDeNegocioException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    // Este usuário é o único administrador ativo do sistema?
    private boolean ehUltimoAdministrador(Usuario usuario) {
        return usuario.getPapel() == Papel.ADMINISTRADOR
                && usuario.getSituacao() == SituacaoUsuario.ATIVO
                && usuarioRepository.countByPapelAndSituacao(Papel.ADMINISTRADOR, SituacaoUsuario.ATIVO) <= 1;
    }

    private void conferirSenha(String senha) {
        if (senha == null || senha.length() < SENHA_MINIMA) {
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST,
                    "A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres.", "senha");
        }
    }
}
