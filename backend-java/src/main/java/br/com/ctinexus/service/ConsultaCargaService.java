package br.com.ctinexus.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Leitura das tabelas que o Python grava, para o painel e o histórico de cargas.
// O Java NÃO grava nessas tabelas (regra da aula); por isso aqui é só SELECT, com JdbcTemplate (SQL direto, sem entidades).
@Service
public class ConsultaCargaService {

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JdbcTemplate jdbc; // Faz consultas SQL e devolve cada linha como um Map (coluna -> valor).

    public ConsultaCargaService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Histórico das cargas, a mais nova primeiro (com o nome de quem enviou e de quem liberou). */
    public List<Map<String, Object>> listarLotes(int limite) {
        String sql = """
                SELECT l.id, l.arquivo_nome, l.total_linhas, l.linhas_validas, l.linhas_invalidas, l.linhas_com_ajuste,
                       l.criado_em, l.enviado_por, ue.nome AS enviado_por_nome, l.aprovado_por, ua.nome AS aprovado_por_nome
                FROM upload_lote l
                LEFT JOIN usuario ue ON ue.id = l.enviado_por
                LEFT JOIN usuario ua ON ua.id = l.aprovado_por
                ORDER BY l.id DESC
                LIMIT ?
                """;
        return jdbc.queryForList(sql, limite).stream().map(this::lote).toList();
    }

    /**
     * Clientes da carga mais recente (o painel mostra a última planilha liberada, como no front).
     * Formato igual ao das linhas do front (codigo_cliente, nome_cliente...), para os gráficos usarem sem conversão.
     */
    public List<Map<String, Object>> clientesDaUltimaCarga() {
        String sql = """
                SELECT c.id, c.codigo, c.nome, co.nome AS consultor, s.nome AS segmento, c.nivel,
                       c.faturamento_anual, c.data_contratacao, c.cidade, c.uf, c.email
                FROM cliente c
                JOIN consultor co ON co.id = c.consultor_id
                JOIN segmento s ON s.id = c.segmento_id
                WHERE c.lote_id = (SELECT MAX(id) FROM upload_lote)
                ORDER BY c.codigo
                """;
        List<Map<String, Object>> linhas = jdbc.queryForList(sql);

        // Serviços de cada cliente (tabela contrato), juntados no formato da planilha: "MPLS;Firewall".
        Map<Long, List<String>> servicos = new HashMap<>();
        jdbc.query("""
                SELECT ct.cliente_id, sv.nome
                FROM contrato ct
                JOIN servico sv ON sv.id = ct.servico_id
                JOIN cliente c ON c.id = ct.cliente_id
                WHERE c.lote_id = (SELECT MAX(id) FROM upload_lote)
                ORDER BY ct.cliente_id, ct.ordem
                """, rs -> {
            servicos.computeIfAbsent(rs.getLong(1), k -> new ArrayList<>()).add(rs.getString(2));
        });

        List<Map<String, Object>> clientes = new ArrayList<>();
        for (Map<String, Object> l : linhas) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("codigo_cliente", l.get("codigo"));
            c.put("nome_cliente", l.get("nome"));
            c.put("consultor", l.get("consultor"));
            c.put("segmento", l.get("segmento"));
            c.put("nivel_cliente", l.get("nivel"));
            c.put("faturamento_anual", ((BigDecimal) l.get("faturamento_anual")).doubleValue()); // Número, como no front.
            c.put("servicos_contratados", String.join(";", servicos.getOrDefault(((Number) l.get("id")).longValue(), List.of())));
            c.put("data_contratacao", dataBr(l.get("data_contratacao")));                        // dd/mm/aaaa, como no front.
            c.put("cidade", textoOuVazio(l.get("cidade")));
            c.put("uf", textoOuVazio(l.get("uf")));
            c.put("email", textoOuVazio(l.get("email")));
            clientes.add(c);
        }
        return clientes;
    }

    // Uma linha de upload_lote no formato da API (camelCase, data em ISO com fuso).
    private Map<String, Object> lote(Map<String, Object> l) {
        Map<String, Object> saida = new LinkedHashMap<>();
        saida.put("id", ((Number) l.get("id")).longValue());
        saida.put("arquivoNome", l.get("arquivo_nome"));
        saida.put("totalLinhas", l.get("total_linhas"));
        saida.put("linhasValidas", l.get("linhas_validas"));
        saida.put("linhasInvalidas", l.get("linhas_invalidas"));
        saida.put("linhasComAjuste", l.get("linhas_com_ajuste"));
        saida.put("enviadoPor", pessoa(l.get("enviado_por"), l.get("enviado_por_nome")));
        saida.put("aprovadoPor", pessoa(l.get("aprovado_por"), l.get("aprovado_por_nome")));
        saida.put("criadoEm", instanteIso(l.get("criado_em")));
        return saida;
    }

    private static Map<String, Object> pessoa(Object id, Object nome) { // { id, nome } como no front (enviadoPor, liberacao.por).
        if (id == null) return null;
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", ((Number) id).longValue());
        p.put("nome", nome);
        return p;
    }

    // Data e hora com fuso, em texto ISO (ex.: 2026-10-29T22:15:03Z): o navegador converte para a hora local.
    private static String instanteIso(Object valor) {
        if (valor instanceof Timestamp t) return t.toInstant().toString();           // PostgreSQL (Neon).
        if (valor instanceof OffsetDateTime o) return o.toInstant().toString();      // H2 (testes).
        if (valor instanceof LocalDateTime d) return d.atZone(ZoneId.systemDefault()).toInstant().toString();
        return valor == null ? null : valor.toString();
    }

    private static String dataBr(Object valor) {
        if (valor instanceof java.sql.Date d) return d.toLocalDate().format(DATA_BR);
        if (valor instanceof LocalDate d) return d.format(DATA_BR);
        return valor == null ? "" : valor.toString();
    }

    private static String textoOuVazio(Object valor) {
        return valor == null ? "" : valor.toString();
    }
}
