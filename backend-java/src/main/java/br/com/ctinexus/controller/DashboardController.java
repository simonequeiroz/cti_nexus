package br.com.ctinexus.controller;

// REMOVER ANTES DA ENTREGA ------------------------------------------------------------------
// Como testar: mvn test (DashboardRotaTest) ou, com o back-end ligado, faça login no testes-api.http e chame
// GET {{api}}/dashboard?segmento=&nivel=  -> { loteId, segmentos, painel }. painel null = carga antiga: libere a planilha de novo.
// ------------------------------------------------------------------------------------------

import br.com.ctinexus.dto.PainelResponse;
import br.com.ctinexus.service.ConsultaCargaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Painel da carteira (Dashboard). Permissão ver_painel (ConfiguracaoSeguranca): todos os papéis.
// O Java não calcula nada aqui: só entrega o que o Python (analise.py + insights.py) gravou na tabela painel_lote.
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ConsultaCargaService consulta;

    public DashboardController(ConsultaCargaService consulta) {
        this.consulta = consulta;
    }

    // GET /api/dashboard?segmento=Saúde&nivel=A  -> painel da última carga com esse filtro (vazio = todos).
    @GetMapping
    public PainelResponse painel(@RequestParam(defaultValue = "") String segmento,
                                 @RequestParam(defaultValue = "") String nivel) {
        return consulta.painelDaUltimaCarga(segmento.strip(), nivel.strip().toUpperCase());
    }
}
