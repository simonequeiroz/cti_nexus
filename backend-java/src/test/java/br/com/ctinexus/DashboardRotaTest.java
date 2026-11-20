package br.com.ctinexus;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// GET /api/dashboard: o Java só entrega o painel que o Python calculou e gravou na tabela painel_lote.
// Aqui o "Python" é simulado com INSERTs direto no banco temporário.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dashboard;MODE=PostgreSQL",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "jwt.segredo=Y2hhdmUtZGUtdGVzdGUtY3RpLW5leHVzLTMyYnl0ZXM="
})
@AutoConfigureMockMvc
class DashboardRotaTest {

    @Autowired
    MockMvc api;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void entregaOPainelCalculadoPeloPythonConformeOFiltro() throws Exception {
        // Sem token: 401.
        api.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());

        // Nada gravado ainda: loteId e painel nulos.
        String gestor = login("gestor@ctinexus.com"); // O gestor só vê o painel (ver_painel).
        painel(gestor, "", "").andExpect(status().isOk())
                .andExpect(jsonPath("$.loteId").value(nullValue()))
                .andExpect(jsonPath("$.painel").value(nullValue()));

        // Carga antiga, de antes do painel ser calculado no Python: loteId sim, painel não.
        jdbc.update("INSERT INTO upload_lote (arquivo_nome, total_linhas, linhas_validas, linhas_invalidas) VALUES ('antiga.xlsx', 1, 1, 0)");
        painel(gestor, "", "").andExpect(jsonPath("$.loteId").isNumber())
                .andExpect(jsonPath("$.painel").value(nullValue()));

        // Carga nova, com o painel que o Python gravou (um JSON por filtro).
        jdbc.update("INSERT INTO upload_lote (arquivo_nome, total_linhas, linhas_validas, linhas_invalidas) VALUES ('nova.xlsx', 3, 3, 0)");
        Long lote = jdbc.queryForObject("SELECT MAX(id) FROM upload_lote", Long.class);
        for (Object[] linha : List.of(
                new Object[]{"", "", "{\"quantidade\":3,\"indicadores\":{\"faturamentoMedio\":1000.5}}"},
                new Object[]{"Saúde", "", "{\"quantidade\":2}"},
                new Object[]{"Indústria", "", "{\"quantidade\":1}"},
                new Object[]{"Saúde", "A", "{\"quantidade\":2}"})) {
            jdbc.update("INSERT INTO painel_lote (lote_id, segmento, nivel, dados) VALUES (?, ?, ?, ?)", lote, linha[0], linha[1], linha[2]);
        }

        painel(gestor, "", "").andExpect(status().isOk())
                .andExpect(jsonPath("$.loteId").value(lote))
                .andExpect(jsonPath("$.segmentos.length()").value(2))
                .andExpect(jsonPath("$.painel.quantidade").value(3))
                .andExpect(jsonPath("$.painel.indicadores.faturamentoMedio").value(1000.5)); // Número do Python, sem mudança.
        painel(gestor, "Saúde", "a").andExpect(jsonPath("$.painel.quantidade").value(2));    // Nível minúsculo também vale.
        painel(gestor, "Indústria", "C").andExpect(jsonPath("$.painel.quantidade").value(0)); // Filtro sem clientes.
    }

    private ResultActions painel(String token, String segmento, String nivel) throws Exception {
        return api.perform(get("/api/dashboard").param("segmento", segmento).param("nivel", nivel)
                .header("Authorization", "Bearer " + token));
    }

    private String login(String email) throws Exception {
        String resposta = api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"senha\": \"123456\" }"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }
}
