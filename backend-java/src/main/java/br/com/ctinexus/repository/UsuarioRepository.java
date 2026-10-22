package br.com.ctinexus.repository;

import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import br.com.ctinexus.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Repository = quem conversa com o banco (slide 17).
// Só escrevemos a "pergunta"; o Spring Data JPA cria o SQL a partir do NOME do método.
// JpaRepository<Usuario, Long> já traz pronto: save, findById, findAll, delete...
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // SELECT * FROM usuario WHERE email = ?   (Optional = pode não achar ninguém)
    Optional<Usuario> findByEmail(String email);

    // Já existe alguém com este e-mail? (usado no cadastro)
    boolean existsByEmail(String email);

    // Quantos usuários têm este papel e esta situação? (para nunca ficar sem administrador ativo)
    long countByPapelAndSituacao(Papel papel, SituacaoUsuario situacao);

    // Lista de usuários, os mais novos primeiro (tela Usuários).
    List<Usuario> findAllByOrderByCriadoEmDesc();
}
