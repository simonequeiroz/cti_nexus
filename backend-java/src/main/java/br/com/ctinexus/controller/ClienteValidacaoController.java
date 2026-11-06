package br.com.ctinexus.controller;

import br.com.ctinexus.dto.ClienteDTO;
import br.com.ctinexus.service.ClienteValidacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Aula "Validação de dados no Backend": recebe a lista, valida e devolve preparada. SEM banco e SEM Python.
// Por que validar de novo, se o Pinia já validou? Porque alguém pode chamar a API direto (REST Client, Postman)
// e pular a tela. Validar no front ajuda o usuário; validar no back-end protege o sistema.
// Permissão (ConfiguracaoSeguranca): enviar_planilha (analista e administrador). O gestor recebe 403.
@RestController
@RequestMapping("/api/clientes")
public class ClienteValidacaoController {

    private final ClienteValidacaoService service;

    public ClienteValidacaoController(ClienteValidacaoService service) { // Injeção de dependência: o Spring entrega o service.
        this.service = service;
    }

    // POST /api/clientes/validar
    // @RequestBody: transforma o JSON do corpo em Java.
    // List<@Valid ClienteDTO>: roda as anotações do DTO em CADA item da lista.
    // @NotNull: recusa um item null na lista, que o @Valid sozinho deixaria passar.
    // Tudo certo: 200 com a lista preparada. Algo errado: nem entra aqui; o TratadorDeErros devolve 400.
    @PostMapping("/validar")
    public List<ClienteDTO> validarClientes(@RequestBody List<@Valid @NotNull ClienteDTO> clientes) {
        return service.validarEPreparar(clientes); // Regras que olham a lista inteira + padronização.
    }
}
