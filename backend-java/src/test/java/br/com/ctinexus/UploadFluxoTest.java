package br.com.ctinexus;

import br.com.ctinexus.service.PythonEtlService;
import br.com.ctinexus.service.RegraDeNegocioException;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Teste do envio da planilha (aula "Telas do Backend"): POST /api/uploads/validadas, GET /api/clientes e /api/health.
// O Python é trocado por um "dublê" (@MockitoBean): assim dá para testar o Java sem o Python ligado,
// e conferir exatamente o que o Java mandaria para ele.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:upload;MODE=PostgreSQL", // Banco temporário só para este teste.
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "jwt.segredo=Y2hhdmUtZGUtdGVzdGUtY3RpLW5leHVzLTMyYnl0ZXM=",
        "upload.max-linhas=3"                                        // Limite baixo para testar o 422.
})
@AutoConfigureMockMvc
class UploadFluxoTest {

    @Autowired
    MockMvc api;

    @Autowired
    JdbcTemplate jdbc;

    @MockitoBean
    PythonEtlService python; // Dublê do Python: não faz chamada de verdade.

    // Duas linhas aprovadas pelo front + uma com segmento fora da lista (o back-end tem que recusar).
    private static final String ENVIO = """
            {
              "arquivoNome": "C:\\\\temp\\\\teste-clientes.xlsx",
              "descartadas": 10,
              "linhas": [
                { "numeroLinha": 2, "codigoCliente": "CTI001", "nomeCliente": "Metalúrgica Alfa", "consultor": "Ana Souza",
                  "segmento": "Indústria", "nivelCliente": "A", "faturamentoAnual": "1850000", "servicosContratados": "MPLS;Firewall",
                  "dataContratacao": "05/03/2024", "cidade": "Campinas", "uf": "SP", "email": "" },
                { "numeroLinha": 3, "codigoCliente": "CTI002", "nomeCliente": "Clínica Vida", "consultor": "Carlos Lima",
                  "segmento": "saude", "nivelCliente": "b", "faturamentoAnual": "98000.5", "servicosContratados": "Link Dedicado",
                  "dataContratacao": "10/01/2023", "cidade": "", "uf": "", "email": "contato@vida.com.br" },
                { "numeroLinha": 4, "codigoCliente": "CTI003", "nomeCliente": "Fazenda Sol", "consultor": "Ana Souza",
                  "segmento": "Agro", "nivelCliente": "C", "faturamentoAnual": "50000", "servicosContratados": "MPLS",
                  "dataContratacao": "01/02/2022", "cidade": "", "uf": "", "email": "" }
              ],
              "alteracoes": [
                { "linha": 3, "codigo": "CTI002", "campo": "segmento", "valorAntigo": "Saude ", "valorNovo": "saude", "em": "2026-10-29T20:00:00Z" }
              ]
            }
            """;

    @Test
    void healthEhPublico() throws Exception {
        api.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void analistaLiberaEOJavaMandaSoAsValidasParaOPython() throws Exception {
        when(python.enviar(any())).thenReturn(Map.of("loteId", 7));
        String token = login("analista@ctinexus.com");

        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ENVIO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.loteId").value(7))
                .andExpect(jsonPath("$.arquivoNome").value("teste-clientes.xlsx")) // Sem a pasta do computador.
                .andExpect(jsonPath("$.totalLinhas").value(13))                    // 3 enviadas + 10 que o front já descartou.
                .andExpect(jsonPath("$.linhasValidas").value(2))
                .andExpect(jsonPath("$.linhasInvalidas").value(11))
                .andExpect(jsonPath("$.linhasComAjuste").value(1))                 // "saude" virou "Saúde".
                .andExpect(jsonPath("$.rejeitadas[0].linha").value(4))
                .andExpect(jsonPath("$.rejeitadas[0].codigo").value("CTI003"));

        // O que o Java mandou para o Python: só as 2 válidas, já padronizadas, e quem liberou (do token).
        ArgumentCaptor<Map<String, Object>> pedido = ArgumentCaptor.forClass(Map.class);
        verify(python).enviar(pedido.capture());
        List<Map<String, String>> linhas = (List<Map<String, String>>) pedido.getValue().get("linhas");
        assertEquals(2, linhas.size());
        assertEquals("Saúde", linhas.get(1).get("segmento"));
        assertEquals("2023-01-10", linhas.get(1).get("data_contratacao"));
        assertEquals("98000.50", linhas.get(1).get("faturamento_anual"));
        assertEquals(null, linhas.get(1).get("cidade")); // Opcional vazio vira NULL no banco.
        Long idAnalista = jdbc.queryForObject("SELECT id FROM usuario WHERE email = 'analista@ctinexus.com'", Long.class);
        assertEquals(idAnalista, pedido.getValue().get("aprovadoPorId"));
        assertEquals(1, ((List<?>) pedido.getValue().get("alteracoes")).size());
    }

    @Test
    void gestorNaoPodeLiberar() throws Exception {
        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + login("gestor@ctinexus.com"))
                        .contentType(MediaType.APPLICATION_JSON).content(ENVIO))
                .andExpect(status().isForbidden());
        verify(python, never()).enviar(any());
    }

    @Test
    void semLinhasOuAcimaDoLimiteOuPythonDesligado() throws Exception {
        String token = login("analista@ctinexus.com");

        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{ \"arquivoNome\": \"x.xlsx\", \"linhas\": [] }"))
                .andExpect(status().isBadRequest());

        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{ isto não é JSON"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Os dados enviados não estão num formato válido (JSON)."));

        String quatroLinhas ="{ \"arquivoNome\": \"x.xlsx\", \"linhas\": [{},{},{},{}] }"; // Limite do teste: 3.
        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(quatroLinhas))
                .andExpect(status().isUnprocessableContent());

        when(python.enviar(any())).thenThrow(new RegraDeNegocioException(HttpStatus.SERVICE_UNAVAILABLE, "O serviço de análise está desligado."));
        api.perform(post("/api/uploads/validadas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ENVIO))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensagem").value("O serviço de análise está desligado."));
    }

    @Test
    void painelLeOsClientesDaUltimaCargaDoBanco() throws Exception {
        // Simula o que o Python grava (aqui não há Python: o teste escreve direto nas tabelas).
        Long admin = jdbc.queryForObject("SELECT id FROM usuario WHERE email = 'admin@ctinexus.com'", Long.class);
        jdbc.update("INSERT INTO upload_lote (id, arquivo_nome, total_linhas, linhas_validas, linhas_invalidas, aprovado_por) VALUES (100, 'antiga.xlsx', 1, 1, 0, ?)", admin);
        jdbc.update("INSERT INTO upload_lote (id, arquivo_nome, total_linhas, linhas_validas, linhas_invalidas, enviado_por, aprovado_por) VALUES (101, 'carteira.xlsx', 3, 1, 2, ?, ?)", admin, admin);
        jdbc.update("INSERT INTO consultor (id, nome) VALUES (100, 'Ana Souza')");
        jdbc.update("INSERT INTO segmento (id, nome) VALUES (100, 'Indústria')");
        jdbc.update("INSERT INTO servico (id, nome) VALUES (100, 'MPLS'), (101, 'Firewall')");
        jdbc.update("""
                INSERT INTO cliente (id, codigo, nome, consultor_id, segmento_id, nivel, faturamento_anual, data_contratacao, uf, lote_id)
                VALUES (100, 'OLD01', 'Cliente Antigo', 100, 100, 'B', 10, DATE '2020-01-01', 'SP', 100),
                       (101, 'CTI001', 'Metalúrgica Alfa', 100, 100, 'A', 1850000.00, DATE '2024-03-05', 'SP', 101)
                """);
        jdbc.update("INSERT INTO contrato (cliente_id, servico_id, ordem) VALUES (101, 101, 1), (101, 100, 0)");

        String token = login("gestor@ctinexus.com"); // Gestor só consulta: pode ver o painel.
        api.perform(get("/api/clientes").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))                       // Só a carga mais nova.
                .andExpect(jsonPath("$[0].codigo_cliente").value("CTI001"))
                .andExpect(jsonPath("$[0].faturamento_anual").value(1850000.0))
                .andExpect(jsonPath("$[0].servicos_contratados").value("MPLS;Firewall")) // Na ordem da planilha.
                .andExpect(jsonPath("$[0].data_contratacao").value("05/03/2024"))
                .andExpect(jsonPath("$[0].cidade").value(""));

        api.perform(get("/api/uploads").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].aprovadoPor.nome").value("Carla Mendes"))
                .andExpect(jsonPath("$[0].linhasInvalidas").value(2));

        api.perform(get("/api/clientes")).andExpect(status().isUnauthorized()); // Sem token: 401.
    }

    private String login(String email) throws Exception {
        String resposta = api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"senha\": \"123456\" }"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }
}
