package br.com.ctinexus.model;

import jakarta.persistence.*;   // Anotações do JPA (@Entity, @Id, @Column...).
import org.hibernate.annotations.ColumnDefault; // Valor padrão da coluna no banco.
import java.time.LocalDateTime; // Data e hora.

// Entidade = classe que vira tabela no PostgreSQL (slide 16). Cada objeto Usuario é uma linha.
@Entity
@Table(name = "usuario") // Nome da tabela (o slide usa "usuarios"; no nosso modelo é singular).
public class Usuario {

    @Id                                                 // Chave primária.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // O banco numera sozinho: 1, 2, 3...
    private Long id;

    @Column(nullable = false, length = 120) // Obrigatório.
    private String nome;

    @Column(nullable = false, unique = true, length = 160) // Não pode repetir e-mail.
    private String email;

    @Column(name = "senha_hash", nullable = false) // Hash do BCrypt, nunca a senha de verdade.
    private String senhaHash;

    @Column(length = 80)
    private String cargo; // Opcional, como no pedido de acesso do front.

    @Enumerated(EnumType.STRING) // Grava o texto "ANALISTA" no banco, não um número.
    @Column(length = 20)
    private Papel papel; // Fica vazio (null) até o administrador aprovar o pedido.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SituacaoUsuario situacao = SituacaoUsuario.PENDENTE; // Todo cadastro começa pendente.

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now(); // Quando o pedido foi feito.

    // ===== ESQUECI MINHA SENHA =====
    // true = a senha atual é temporária (definida pelo administrador): no próximo login a pessoa é obrigada a criar outra.
    @ColumnDefault("false") // Usuários que já existiam no banco ficam com false.
    @Column(name = "deve_trocar_senha", nullable = false)
    private boolean deveTrocarSenha = false;

    // Quando a pessoa clicou em "Esqueci minha senha" (null = não pediu). Aparece para o administrador na tela Usuários.
    @Column(name = "pediu_nova_senha_em")
    private LocalDateTime pediuNovaSenhaEm;

    // ===== GETTERS E SETTERS =====
    // O JPA usa estes métodos para ler e preencher os campos (o Lombok geraria isso sozinho com @Getter/@Setter).

    public Long getId() { return id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public Papel getPapel() { return papel; }
    public void setPapel(Papel papel) { this.papel = papel; }

    public SituacaoUsuario getSituacao() { return situacao; }
    public void setSituacao(SituacaoUsuario situacao) { this.situacao = situacao; }

    public LocalDateTime getCriadoEm() { return criadoEm; }

    public boolean isDeveTrocarSenha() { return deveTrocarSenha; } // Em boolean, o getter começa com "is".
    public void setDeveTrocarSenha(boolean deveTrocarSenha) { this.deveTrocarSenha = deveTrocarSenha; }

    public LocalDateTime getPediuNovaSenhaEm() { return pediuNovaSenhaEm; }
    public void setPediuNovaSenhaEm(LocalDateTime pediuNovaSenhaEm) { this.pediuNovaSenhaEm = pediuNovaSenhaEm; }
}
