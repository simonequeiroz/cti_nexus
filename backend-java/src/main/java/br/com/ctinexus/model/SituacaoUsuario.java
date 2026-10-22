package br.com.ctinexus.model;

// Situação da conta (no front: pendente / ativo / desativado).
public enum SituacaoUsuario {
    PENDENTE,   // Pediu acesso e espera o administrador aprovar. Não entra no sistema.
    ATIVO,      // Pode entrar.
    DESATIVADO  // Perdeu o acesso. O usuário nunca é apagado, só desativado.
}
