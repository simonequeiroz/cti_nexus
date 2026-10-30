package br.com.ctinexus.controller;

import br.com.ctinexus.service.ConsultaCargaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

// Clientes gravados no banco, para o Painel da carteira (permissão ver_painel: todos os papéis).
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ConsultaCargaService consulta;

    public ClienteController(ConsultaCargaService consulta) {
        this.consulta = consulta;
    }

    // GET /api/clientes  -> clientes da última carga liberada, no mesmo formato das linhas da planilha.
    @GetMapping
    public List<Map<String, Object>> listar() {
        return consulta.clientesDaUltimaCarga();
    }
}
