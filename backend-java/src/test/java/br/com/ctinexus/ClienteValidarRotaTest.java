package br.com.ctinexus;

import br.com.ctinexus.service.PythonEtlService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Teste da aula "Validação de dados no Backend": POST /api/clientes/validar (DTO + @Valid + Service + erros).
// Os testes 1 e 2 são os JSONs dos slides 26 e 27.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:validar;MODE=PostgreSQL", // Banco temporário só para o login funcionar.
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "jwt.segredo=Y2hhdmUtZGUtdGVzdGUtY3RpLW5leHVzLTMyYnl0ZXM=",
        "upload.max-linhas=3"                                        // Limite baixo para testar o 422.
})
@AutoConfigureMockMvc
class ClienteValidarRotaTest {

    @Autowired
    MockMvc api;

    @MockitoBean
    PythonEtlService python; // Dublê: serve para provar que esta rota NÃO chama o Python.

    // Linha correta do slide 26; cada teste troca só um pedaço do texto.
    private static final String CLIENTE = """
            { "codigoCliente": "CTI001", "nomeCliente": "Metalúrgica Horizonte", "consultor": "ANA SOUZA",
              "segmento": "IND.", "nivelCliente": "A", "faturamentoAnual": 1850000,
              "servicosContratados": "Internet Dedicada ; Firewall", "dataContratacao": "2025-01-15",
              "cidade": "Campinas", "uf": "sp" }
            """;

    private ResultActions enviar(String quem, String corpo) throws Exception {
        return api.perform(post("/api/clientes/validar").header("Authorization", "Bearer " + login(quem))
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private ResultActions enviarComoAnalista(String corpo) throws Exception {
        return enviar("analista@ctinexus.com", corpo);
    }

    @Test
    void teste1JsonValidoVoltaPadronizadoESemChamarOPython() throws Exception {
        enviarComoAnalista("[" + CLIENTE + "]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].segmento").value("Indústria"))    // "IND." foi padronizado.
                .andExpect(jsonPath("$[0].consultor").value("Ana Souza"))   // As duas palavras com maiúscula.
                .andExpect(jsonPath("$[0].servicosContratados").value("Internet Dedicada;Firewall"))
                .andExpect(jsonPath("$[0].uf").value("SP"))
                .andExpect(jsonPath("$[0].dataContratacao").value("2025-01-15"));
        verify(python, never()).enviar(any()); // Sem Python nesta etapa.
    }

    @Test
    void teste2JsonInvalidoApontaCadaCampoComErro() throws Exception {
        String invalido = """
                [{ "codigoCliente": "CTI002", "nomeCliente": "", "consultor": "Carlos Lima", "segmento": "Comercio",
                   "nivelCliente": "D", "faturamentoAnual": -10, "servicosContratados": "",
                   "dataContratacao": "2025-01-30", "cidade": "Hortolândia", "uf": "SPP" }]
                """;
        enviarComoAnalista(invalido)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['[0].nomeCliente']").value("O nome do cliente é obrigatório"))
                .andExpect(jsonPath("$.campos['[0].nivelCliente']").value("O nível deve ser A, B ou C"))
                .andExpect(jsonPath("$.campos['[0].faturamentoAnual']").value("O faturamento anual deve ser maior que zero"))
                .andExpect(jsonPath("$.campos['[0].servicosContratados']").value("Os serviços contratados são obrigatórios"))
                .andExpect(jsonPath("$.campos['[0].uf']").value("A UF deve possuir duas letras"));
    }

    @Test
    void faturamentoZeroEEmailErradoSaoRecusados() throws Exception {
        String zero = CLIENTE.replace("1850000", "0").replace("\"uf\": \"sp\"", "\"uf\": \"sp\", \"email\": \"ana..souza@empresa.com\"");
        enviarComoAnalista("[" + zero + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['[0].faturamentoAnual']").value("O faturamento anual deve ser maior que zero"))
                .andExpect(jsonPath("$.campos['[0].email']", containsString("não tem formato válido")));
    }

    @Test
    void nivelMinusculoViraMaiusculoETextoLongoEhRecusado() throws Exception { // Regras do guia técnico do DTO.
        enviarComoAnalista("[" + CLIENTE.replace("\"nivelCliente\": \"A\"", "\"nivelCliente\": \"b\"") + "]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nivelCliente").value("B"));

        enviarComoAnalista("[" + CLIENTE.replace("CTI001", "C".repeat(31)) + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['[0].codigoCliente']").value("O código do cliente deve ter no máximo 30 caracteres"));
    }

    @Test
    void dataQueNaoExisteApontaOCampo() throws Exception {
        enviarComoAnalista("[" + CLIENTE.replace("2025-01-15", "2025-02-31") + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['[0].dataContratacao']", containsString("formato inválido")));
    }

    @Test
    void codigoRepetidoMesmoEscritoDiferenteEhRecusadoPeloService() throws Exception {
        enviarComoAnalista("[" + CLIENTE + "," + CLIENTE.replace("CTI001", " cti001 ") + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Código repetido na planilha: CTI001"));
    }

    @Test
    void segmentoForaDaListaOuServicoSemNomeSaoRecusados() throws Exception {
        enviarComoAnalista("[" + CLIENTE.replace("IND.", "Agro") + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.segmento", containsString("não está na lista")));

        enviarComoAnalista("[" + CLIENTE.replace("Internet Dedicada ; Firewall", ";") + "]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.servicosContratados").value("Os serviços contratados são obrigatórios"));
    }

    @Test
    void listaVaziaItemNuloEAcimaDoLimite() throws Exception {
        enviarComoAnalista("[]").andExpect(status().isBadRequest());
        enviarComoAnalista("[null]").andExpect(status().isBadRequest());

        String quatro = "[" + CLIENTE + "," + CLIENTE.replace("CTI001", "CTI002") + ","
                + CLIENTE.replace("CTI001", "CTI003") + "," + CLIENTE.replace("CTI001", "CTI004") + "]"; // Limite do teste: 3.
        enviarComoAnalista(quatro).andExpect(status().isUnprocessableContent());
    }

    @Test
    void semTokenDa401EGestorDa403() throws Exception {
        api.perform(post("/api/clientes/validar").contentType(MediaType.APPLICATION_JSON).content("[" + CLIENTE + "]"))
                .andExpect(status().isUnauthorized());
        enviar("gestor@ctinexus.com", "[" + CLIENTE + "]").andExpect(status().isForbidden());
    }

    private String login(String email) throws Exception {
        String resposta = api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"senha\": \"123456\" }"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }
}
