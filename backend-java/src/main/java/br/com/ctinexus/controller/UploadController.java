package br.com.ctinexus.controller;

import br.com.ctinexus.dto.UploadDtos.EnvioValidadasRequest;
import br.com.ctinexus.dto.UploadDtos.UploadResponse;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.service.ConsultaCargaService;
import br.com.ctinexus.service.UploadService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// A porta de entrada do envio da planilha (slide "UploadController").
// Permissões (ConfiguracaoSeguranca): enviar = aprovar_carga (analista e administrador); consultar = ver_painel.
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadService service;
    private final ConsultaCargaService consulta;

    public UploadController(UploadService service, ConsultaCargaService consulta) {
        this.service = service; // O Spring entrega os serviços prontos.
        this.consulta = consulta;
    }

    // POST /api/uploads/validadas  -> recebe as linhas aprovadas pelo front, valida de novo e manda o Python gravar.
    @PostMapping("/validadas")
    @ResponseStatus(HttpStatus.CREATED) // 201: a carga foi gravada.
    public UploadResponse enviarValidadas(@RequestBody EnvioValidadasRequest pedido,
                                          @AuthenticationPrincipal Usuario quemLibera) { // Quem liberou vem do token.
        return service.receberValidadas(pedido, quemLibera);
    }

    // GET /api/uploads  -> histórico das cargas gravadas (a mais nova primeiro).
    @GetMapping
    public List<Map<String, Object>> listar() {
        return consulta.listarLotes(50);
    }
}
