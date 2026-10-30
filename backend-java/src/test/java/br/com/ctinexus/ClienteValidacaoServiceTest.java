package br.com.ctinexus;

import br.com.ctinexus.dto.ClienteDTO;
import br.com.ctinexus.service.ClienteValidacaoService;
import br.com.ctinexus.service.ClienteValidacaoService.ResultadoLinha;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

// Teste das regras de validação do back-end, sem Spring e sem banco (é só uma classe Java).
// Os casos imitam a planilha de teste do front, para provar que o front e o back-end concordam.
class ClienteValidacaoServiceTest {

    private final ClienteValidacaoService validacao = new ClienteValidacaoService();

    // Uma linha correta; cada teste muda só o campo que quer testar.
    private static Map<String, String> linhaCorreta() {
        Map<String, String> campos = new HashMap<>();
        campos.put("codigo_cliente", "CTI001");
        campos.put("nome_cliente", "Metalúrgica Alfa");
        campos.put("consultor", "Ana Souza");
        campos.put("segmento", "Indústria");
        campos.put("nivel_cliente", "A");
        campos.put("faturamento_anual", "1850000");
        campos.put("servicos_contratados", "MPLS;Firewall");
        campos.put("data_contratacao", "05/03/2024");
        campos.put("cidade", "Campinas");
        campos.put("uf", "SP");
        campos.put("email", "contato@alfa.com.br");
        return campos;
    }

    private ResultadoLinha validarUma(Map<String, String> campos) {
        return validacao.validar(List.of(new ClienteDTO(2, campos))).getFirst();
    }

    @Test
    void linhaCorretaPassaEJaVemNoFormatoDoBanco() {
        ResultadoLinha r = validarUma(linhaCorreta());
        assertTrue(r.valida());
        assertEquals("2024-03-05", r.valores().get("data_contratacao")); // aaaa-mm-dd para o PostgreSQL.
        assertEquals("1850000.00", r.valores().get("faturamento_anual"));
        assertTrue(r.avisos().isEmpty());
    }

    @Test
    void padronizaComoOFront() {
        Map<String, String> campos = linhaCorreta();
        campos.put("codigo_cliente", " cti002 ");
        campos.put("nome_cliente", "METALÚRGICA BETA");
        campos.put("consultor", "CARLOS DA SILVA");
        campos.put("segmento", "IND.");
        campos.put("nivel_cliente", "b");
        campos.put("faturamento_anual", "R$ 1.234.567,89");
        campos.put("servicos_contratados", "MPLS ; Firewall");
        campos.put("uf", "sp");
        campos.put("email", " Contato@Beta.COM.br ");

        ResultadoLinha r = validarUma(campos);
        assertTrue(r.valida(), () -> r.erros().toString());
        assertEquals("CTI002", r.valores().get("codigo_cliente"));
        assertEquals("Metalúrgica Beta", r.valores().get("nome_cliente"));
        assertEquals("Carlos da Silva", r.valores().get("consultor"));
        assertEquals("Indústria", r.valores().get("segmento"));
        assertEquals("B", r.valores().get("nivel_cliente"));
        assertEquals("1234567.89", r.valores().get("faturamento_anual"));
        assertEquals("MPLS;Firewall", r.valores().get("servicos_contratados"));
        assertEquals("contato@beta.com.br", r.valores().get("email"));
        assertFalse(r.avisos().isEmpty()); // Foi ajustada: conta como "com ajuste automático".
    }

    @Test
    void apontaOsErrosComAsMesmasMensagensDoFront() {
        Map<String, String> campos = linhaCorreta();
        campos.put("consultor", "");
        campos.put("segmento", "Agro");
        campos.put("nivel_cliente", "D");
        campos.put("faturamento_anual", "-10");
        campos.put("data_contratacao", "31/02/2024");
        campos.put("uf", "São Paulo");
        campos.put("email", "contato@@alfa");

        List<String> erros = validarUma(campos).erros();
        assertEquals(List.of(
                "Consultor está vazio",
                "Segmento \"Agro\" não está na lista (Indústria, Comércio, Serviços, Saúde, Educação, Tecnologia)",
                "Nível deve ser A, B ou C",
                "Data de contratação deve estar no formato dd/mm/aaaa e existir no calendário",
                "UF deve ter 2 letras (ex.: SP)",
                "E-mail \"contato@@alfa\" não tem formato válido (ex.: contato@empresa.com.br)",
                "Faturamento anual não pode ser negativo"
        ), erros);
    }

    @Test
    void codigoRepetidoRecusaASegundaLinha() {
        Map<String, String> outra = linhaCorreta();
        outra.put("codigo_cliente", "cti001"); // Mesmo código, escrito diferente.
        List<ResultadoLinha> r = validacao.validar(List.of(new ClienteDTO(2, linhaCorreta()), new ClienteDTO(5, outra)));
        assertTrue(r.get(0).valida());
        assertEquals(List.of("Código do cliente repetido (já aparece na linha 2)"), r.get(1).erros());
    }

    @Test
    void cidadeUfEEmailSaoOpcionais() {
        Map<String, String> campos = linhaCorreta();
        campos.put("cidade", null);
        campos.put("uf", "");
        campos.put("email", null);
        assertTrue(validarUma(campos).valida());
    }
}
