package br.com.ctinexus.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;

import java.util.List;

// Resposta do GET /api/dashboard: o painel que o Python calculou para o filtro pedido.
// loteId: a carga que o painel mostra (null = nada gravado ainda).
// segmentos: opções do filtro (os segmentos da carga).
// painel: o JSON da tabela painel_lote, entregue do jeito que o Python gravou (@JsonRawValue: o Java não mexe nos números).
//         null = carga gravada antes do cálculo do painel existir (é só liberar de novo).
public record PainelResponse(Long loteId, List<String> segmentos, @JsonRawValue String painel) {
}
