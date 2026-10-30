package br.com.ctinexus.dto;

import java.util.List;

// Formatos do JSON do envio da planilha (POST /api/uploads/validadas), como no slide "UploadDtos".
// Classe "final" que só agrupa os records: UploadDtos.EnvioValidadasRequest, UploadDtos.LinhaEnvio...
public final class UploadDtos {

    private UploadDtos() {}

    /**
     * O que o front manda ao clicar em "Liberar para o painel": só as linhas que a validação do front aprovou.
     * descartadas = linhas com erro que o front já deixou de fora (entram na contagem da carga).
     * enviadoPorId = quem conferiu a planilha (trilha de auditoria); quem libera é o dono do token.
     */
    public record EnvioValidadasRequest(
            String arquivoNome,
            Integer descartadas,
            Long enviadoPorId,
            List<LinhaEnvio> linhas,
            List<AlteracaoEnvio> alteracoes
    ) {}

    /** Uma linha já conferida pelo front (todos os campos como texto). */
    public record LinhaEnvio(
            Integer numeroLinha,
            String codigoCliente,
            String nomeCliente,
            String consultor,
            String segmento,
            String nivelCliente,
            String faturamentoAnual,
            String servicosContratados,
            String dataContratacao,
            String cidade,
            String uf,
            String email
    ) {}

    /** Uma correção feita à mão na tela Validação: quem, quando, linha, campo, valor antigo e novo. */
    public record AlteracaoEnvio(
            Integer linha,
            String codigo,
            String campo,
            String valorAntigo,
            String valorNovo,
            Long usuarioId,
            String em
    ) {}

    /** Uma linha recusada pelo back-end: não é gravada, só volta para o usuário ver. */
    public record LinhaRejeitada(int linha, String codigo, String motivo) {}

    /** Resposta do envio (201 Created): números da carga gravada pelo Python. */
    public record UploadResponse(
            Long loteId,
            String status,
            String arquivoNome,
            int totalLinhas,
            int linhasValidas,
            int linhasInvalidas,
            int linhasComAjuste,
            List<LinhaRejeitada> rejeitadas
    ) {}
}
