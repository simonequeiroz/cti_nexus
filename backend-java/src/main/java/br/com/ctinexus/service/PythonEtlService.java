package br.com.ctinexus.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

// A ponte com o Python (slide "PythonEtlService"): faz POST /etl com as linhas válidas.
// O Java não grava nada da planilha: quem limpa, calcula e grava no banco é o analytics-python/api.py.
@Service
public class PythonEtlService {

    private static final Logger log = LoggerFactory.getLogger(PythonEtlService.class);

    private final RestClient http;   // Cliente HTTP do Spring (faz a chamada e converte o Map em JSON sozinho).
    private final String url;        // Ex.: http://localhost:8000/etl
    private final String chave;      // Chave combinada com o Python (cabeçalho X-ETL-Key).

    public PythonEtlService(@Value("${etl.url}") String url, @Value("${etl.chave}") String chave) {
        this.url = url;
        this.chave = chave == null ? "" : chave;
        var fabrica = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)) // Python desligado: desiste em 5 s.
                .build());
        fabrica.setReadTimeout(Duration.ofMinutes(5)); // Gravar 20 mil linhas no Neon pode demorar.
        this.http = RestClient.builder().requestFactory(fabrica).build();
    }

    /** Envia a carga ao Python e devolve a resposta dele (ex.: { "loteId": 12, "clientesGravados": 5 }). */
    public Map<String, Object> enviar(Map<String, Object> pedido) {
        try {
            RestClient.RequestBodySpec requisicao = http.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON);
            if (!chave.isBlank()) requisicao.header("X-ETL-Key", chave); // Só o nosso Java consegue gravar pelo Python.

            Map<String, Object> resposta = requisicao.body(pedido)
                    .retrieve()                                  // Resposta 4xx/5xx vira RestClientResponseException.
                    .body(new ParameterizedTypeReference<>() {});
            return resposta == null ? Map.of() : resposta;

        } catch (RestClientResponseException e) { // O Python respondeu, mas com erro -> 502.
            log.error("Python respondeu {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new RegraDeNegocioException(HttpStatus.BAD_GATEWAY,
                    "O serviço de análise não conseguiu gravar os clientes (erro " + e.getStatusCode().value() + "). Tente de novo.");
        } catch (ResourceAccessException e) {     // Não deu para falar com o Python (desligado) -> 503.
            log.error("Python fora do ar em {}: {}", url, e.getMessage());
            throw new RegraDeNegocioException(HttpStatus.SERVICE_UNAVAILABLE,
                    "O serviço de análise está desligado. Ligue o Python (python -m uvicorn api:app --port 8000) e tente de novo.");
        }
    }
}
