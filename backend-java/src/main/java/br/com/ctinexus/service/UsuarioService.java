package br.com.ctinexus.service;

import br.com.ctinexus.dto.AlterarSituacaoRequest;
import br.com.ctinexus.dto.UsuarioResponse;
import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Regras da tela Usuários (só o administrador chega aqui; quem barra os outros é a ConfiguracaoSeguranca).
// Mesmas proteções do front (usuariosStore): ninguém altera a si mesmo e o sistema nunca fica sem administrador ativo.
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Todos os usuários, inclusive os pedidos pendentes (o front separa pela "situacao").
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByCriadoEmDesc().stream()
                .map(UsuarioResponse::de) // Converte cada Usuario em UsuarioResponse (sem a senha).
                .toList();
    }

    // Aprovar pedido, desativar, reativar ou trocar o papel.
    @Transactional // Ou faz tudo, ou não faz nada no banco.
    public UsuarioResponse alterarSituacao(Long id, AlterarSituacaoRequest dados, Usuario quemAltera) {
        Usuario usuario = buscar(id);

        if (usuario.getId().equals(quemAltera.getId())) { // Proteção 1: não mexe na própria conta.
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "Você não pode alterar a sua própria situação ou papel.");
        }

        Papel novoPapel = dados.papel() != null ? dados.papel() : usuario.getPapel(); // Sem papel no pedido = mantém.
        if (dados.situacao() == SituacaoUsuario.ATIVO && novoPapel == null) { // Aprovar exige escolher o papel.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Escolha o papel do usuário para aprovar o acesso.");
        }
        if (dados.situacao() == SituacaoUsuario.PENDENTE) { // Pendente é só para quem acabou de pedir.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Escolha ATIVO ou DESATIVADO.");
        }

        // Proteção 2: se este é o último administrador ativo, ele não pode deixar de ser.
        boolean eraAdminAtivo = usuario.getPapel() == Papel.ADMINISTRADOR && usuario.getSituacao() == SituacaoUsuario.ATIVO;
        boolean continuaAdminAtivo = novoPapel == Papel.ADMINISTRADOR && dados.situacao() == SituacaoUsuario.ATIVO;
        if (eraAdminAtivo && !continuaAdminAtivo
                && usuarioRepository.countByPapelAndSituacao(Papel.ADMINISTRADOR, SituacaoUsuario.ATIVO) <= 1) {
            throw new RegraDeNegocioException(HttpStatus.CONFLICT, "O sistema precisa de pelo menos um administrador ativo.");
        }

        usuario.setPapel(novoPapel);
        usuario.setSituacao(dados.situacao());
        return UsuarioResponse.de(usuarioRepository.save(usuario)); // UPDATE no banco.
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

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RegraDeNegocioException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
