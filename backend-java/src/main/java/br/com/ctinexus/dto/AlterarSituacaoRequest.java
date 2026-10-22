package br.com.ctinexus.dto;

import br.com.ctinexus.model.Papel;
import br.com.ctinexus.model.SituacaoUsuario;
import jakarta.validation.constraints.NotNull;

// O que o administrador manda em PATCH /api/admin/usuarios/{id}/status.
// Ex. aprovar pedido: { "situacao": "ATIVO", "papel": "ANALISTA" }
// Ex. desativar:      { "situacao": "DESATIVADO" }
// Diferença para a aula de front: lá só ia o status; aqui o papel vai junto, porque quem escolhe o papel é o administrador.
public record AlterarSituacaoRequest(
        @NotNull(message = "Informe a situação.") SituacaoUsuario situacao,
        Papel papel // Opcional: só muda o papel se vier preenchido. Obrigatório ao aprovar um pedido.
) {}
