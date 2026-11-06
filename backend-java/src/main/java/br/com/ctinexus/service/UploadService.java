package br.com.ctinexus.service;

import br.com.ctinexus.dto.LinhaPlanilha;
import br.com.ctinexus.dto.UploadDtos.AlteracaoEnvio;
import br.com.ctinexus.dto.UploadDtos.EnvioValidadasRequest;
import br.com.ctinexus.dto.UploadDtos.LinhaEnvio;
import br.com.ctinexus.dto.UploadDtos.LinhaRejeitada;
import br.com.ctinexus.dto.UploadDtos.UploadResponse;
import br.com.ctinexus.model.Usuario;
import br.com.ctinexus.repository.UsuarioRepository;
import br.com.ctinexus.service.ClienteValidacaoService.ResultadoLinha;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static br.com.ctinexus.service.Colunas.*;

// O "cérebro" do envio da planilha (slide "UploadService"):
// 1) confere o pedido (tem linhas? passou do limite?), 2) monta um ClienteDTO por linha,
// 3) valida tudo de novo, 4) manda só as válidas ao Python, 5) devolve as contagens ao front.
@Service
public class UploadService {

    private final ClienteValidacaoService validacao;
    private final PythonEtlService python;
    private final UsuarioRepository usuarioRepository;

    public UploadService(ClienteValidacaoService validacao, PythonEtlService python,
                         UsuarioRepository usuarioRepository) {
        this.validacao = validacao;
        this.python = python;
        this.usuarioRepository = usuarioRepository;
    }

    public UploadResponse receberValidadas(EnvioValidadasRequest req, Usuario quemLibera) {
        validacao.conferirTamanho(req == null ? null : req.linhas()); // Vazia: 400. Acima do limite: 422.

        String nome = nomeSeguro(req.arquivoNome());
        int descartadas = req.descartadas() == null ? 0 : Math.max(0, req.descartadas());

        // Cada linha do JSON vira uma LinhaPlanilha (número da linha + texto de cada coluna).
        List<LinhaPlanilha> brutas = new ArrayList<>(req.linhas().size());
        int posicao = 2; // A linha 1 da planilha é o cabeçalho.
        for (LinhaEnvio e : req.linhas()) {
            Map<String, String> campos = new LinkedHashMap<>();
            campos.put(CODIGO, e.codigoCliente());
            campos.put(NOME, e.nomeCliente());
            campos.put(CONSULTOR, e.consultor());
            campos.put(SEGMENTO, e.segmento());
            campos.put(NIVEL, e.nivelCliente());
            campos.put(FATURAMENTO, e.faturamentoAnual());
            campos.put(SERVICOS, e.servicosContratados());
            campos.put(DATA, e.dataContratacao());
            campos.put(CIDADE, e.cidade());
            campos.put(UF, e.uf());
            campos.put(EMAIL, e.email());
            int numero = e.numeroLinha() == null ? posicao : e.numeroLinha();
            brutas.add(new LinhaPlanilha(numero, campos));
            posicao++;
        }

        return registrar(nome, brutas, descartadas, req, quemLibera);
    }

    // Valida de novo, separa válidas e rejeitadas, manda as válidas ao Python e monta a resposta.
    private UploadResponse registrar(String nome, List<LinhaPlanilha> brutas, int descartadas,
                                     EnvioValidadasRequest req, Usuario quemLibera) {
        List<ResultadoLinha> resultado = validacao.validar(brutas); // VALIDAÇÃO NO BACK-END.
        List<Map<String, String>> validas = new ArrayList<>();
        List<LinhaRejeitada> rejeitadas = new ArrayList<>();
        int comAjuste = 0;

        for (ResultadoLinha r : resultado) {
            if (!r.valida()) { // Linha com erro: não é gravada, só volta para o usuário ver.
                String codigo = r.valores().get(CODIGO);
                rejeitadas.add(new LinhaRejeitada(r.numero(), codigo.isEmpty() ? "(sem código)" : codigo, String.join("; ", r.erros())));
                continue;
            }
            if (!r.avisos().isEmpty()) comAjuste++;
            validas.add(paraPython(r));
        }

        if (validas.isEmpty()) { // Nada para gravar: 422.
            throw new RegraDeNegocioException(HttpStatus.UNPROCESSABLE_ENTITY, "Nenhuma linha válida para gravar.");
        }

        int total = resultado.size() + descartadas;
        int invalidas = rejeitadas.size() + descartadas;

        // Quem conferiu a planilha: o id que o front mandou, se existir; senão, quem está liberando.
        Long enviadoPor = req.enviadoPorId() != null && usuarioRepository.existsById(req.enviadoPorId())
                ? req.enviadoPorId() : quemLibera.getId();

        Map<String, Object> pedido = new LinkedHashMap<>();
        pedido.put("arquivoNome", nome);
        pedido.put("recebidas", total);
        pedido.put("invalidas", invalidas);
        pedido.put("comAviso", comAjuste);
        pedido.put("enviadoPorId", enviadoPor);
        pedido.put("aprovadoPorId", quemLibera.getId()); // Vem do token: o front não consegue mentir aqui.
        pedido.put("linhas", validas);
        pedido.put("alteracoes", alteracoes(req.alteracoes()));

        Map<String, Object> resposta = python.enviar(pedido); // O PYTHON GRAVA.

        Long loteId = resposta.get("loteId") instanceof Number n ? n.longValue() : null;
        return new UploadResponse(loteId, "PROCESSADO", nome, total, validas.size(), invalidas, comAjuste, rejeitadas);
    }

    // Linha no formato que o Python espera: as chaves são os nomes das colunas da planilha.
    private Map<String, String> paraPython(ResultadoLinha r) {
        Map<String, String> linha = new HashMap<>(r.valores());
        for (String opcional : List.of(CIDADE, UF, EMAIL)) {
            if (linha.get(opcional).isEmpty()) linha.put(opcional, null); // Vazio vira NULL no banco.
        }
        return linha;
    }

    // Correções feitas à mão na tela Validação (podem não existir).
    private List<Map<String, Object>> alteracoes(List<AlteracaoEnvio> lista) {
        if (lista == null) return List.of();
        List<Map<String, Object>> saida = new ArrayList<>();
        for (AlteracaoEnvio a : lista) {
            if (a == null || a.linha() == null || a.campo() == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("linha", a.linha());
            item.put("codigo", a.codigo());
            item.put("campo", a.campo());
            item.put("valorAntigo", a.valorAntigo());
            item.put("valorNovo", a.valorNovo());
            item.put("usuarioId", a.usuarioId());
            item.put("em", a.em());
            saida.add(item);
        }
        return saida;
    }

    // Nome do arquivo sem pastas e sem caracteres estranhos (ex.: "C:\\temp\\clientes.xlsx" -> "clientes.xlsx").
    private static String nomeSeguro(String nome) {
        String limpo = nome == null ? "" : nome.replaceAll(".*[\\\\/]", "").replaceAll("[\\p{Cntrl}]", "").strip();
        if (limpo.isEmpty()) return "planilha.xlsx";
        return limpo.length() > 255 ? limpo.substring(0, 255) : limpo;
    }
}
