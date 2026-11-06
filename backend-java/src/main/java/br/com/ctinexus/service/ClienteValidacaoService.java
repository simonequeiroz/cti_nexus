package br.com.ctinexus.service;

import br.com.ctinexus.dto.ClienteDTO;
import br.com.ctinexus.dto.LinhaPlanilha;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import static br.com.ctinexus.service.Colunas.*; // Permite escrever CODIGO em vez de Colunas.CODIGO.

// O validador do back-end (slide "ClienteValidacaoService"): confere cada linha DE NOVO, sem confiar no front.
// Mesmas regras, na mesma ordem e com as mesmas mensagens do front (frontend-vue/src/utils/validacao.js).
// Erro = a linha não é gravada. Aviso = a linha foi ajustada automaticamente, mas é gravada.
@Service
public class ClienteValidacaoService {

    private static final Pattern RE_UF = Pattern.compile("^[A-Z]{2}$");
    private static final Pattern RE_EMAIL = Pattern.compile("^[a-z0-9._%+-]+@[a-z0-9-]+(\\.[a-z0-9-]+)*\\.[a-z]{2,}$");

    private final int maxLinhas; // Limite de linhas por envio (upload.max-linhas no application.properties).

    public ClienteValidacaoService(@Value("${upload.max-linhas}") int maxLinhas) {
        this.maxLinhas = maxLinhas;
    }

    /**
     * Resultado de uma linha.
     * valores = os campos já padronizados, no formato que o Python grava (data aaaa-mm-dd, faturamento 1850000.00).
     */
    public record ResultadoLinha(int numero, Map<String, String> valores, List<String> erros, List<String> avisos) {
        public boolean valida() { return erros.isEmpty(); } // Válida = nenhum erro.
    }

    // A lista veio vazia ou passou do limite? Vale para as duas rotas que recebem clientes.
    public void conferirTamanho(List<?> linhas) {
        if (linhas == null || linhas.isEmpty()) {  // Sem linhas: 400.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Não há clientes aprovados para enviar.");
        }
        if (linhas.size() > maxLinhas) {           // Acima do limite: 422.
            throw new RegraDeNegocioException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "A planilha passou do limite de " + maxLinhas + " linhas. Divida em arquivos menores.");
        }
    }

    // ===== Aula "Validação de dados no Backend": POST /api/clientes/validar =====
    // O DTO valida UMA linha de cada vez. Só o Service consegue olhar a lista INTEIRA.
    // Aqui, se uma linha tem problema, a lista toda volta com erro (no envio real, abaixo, só a linha é recusada).
    public List<ClienteDTO> validarEPreparar(List<ClienteDTO> clientes) {
        conferirTamanho(clientes);

        Set<String> codigos = new HashSet<>(); // Set não guarda repetidos: add() devolve false se o código já está lá.
        for (ClienteDTO cliente : clientes) {
            // Padroniza ANTES de comparar: "cti001" e " CTI001 " são o mesmo cliente.
            String codigo = Padronizacao.codigo(cliente.codigoCliente());
            if (!codigos.add(codigo)) {
                throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Código repetido na planilha: " + codigo, "codigoCliente");
            }
        }

        return clientes.stream()         // Passa por cada cliente da lista...
                .map(this::padronizar)   // ...troca pelo cliente já arrumado...
                .toList();               // ...e junta tudo numa lista nova.
    }

    // Um record não muda depois de criado: por isso "arrumar" é criar outro ClienteDTO, com os valores limpos.
    // Usa a classe Padronizacao, a mesma do envio real, para as duas rotas padronizarem do mesmo jeito.
    private ClienteDTO padronizar(ClienteDTO c) {
        String segmento = Padronizacao.segmento(c.segmento()); // "IND." vira "Indústria".
        if (!SEGMENTOS_VALIDOS.contains(segmento)) {           // Segmento desconhecido não entra no painel.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST,
                    "Segmento \"" + segmento + "\" não está na lista (" + String.join(", ", SEGMENTOS_VALIDOS) + ")", "segmento");
        }

        String servicos = Padronizacao.servicos(c.servicosContratados()); // "MPLS ; Firewall" vira "MPLS;Firewall".
        if (servicos.isEmpty()) { // O @NotBlank deixa passar ";", que não tem serviço nenhum.
            throw new RegraDeNegocioException(HttpStatus.BAD_REQUEST, "Os serviços contratados são obrigatórios", "servicosContratados");
        }

        return new ClienteDTO(
                Padronizacao.codigo(c.codigoCliente()),     // " cti001 " vira "CTI001".
                Padronizacao.capitalizar(c.nomeCliente()),  // "METALÚRGICA ALFA" vira "Metalúrgica Alfa".
                Padronizacao.nomePessoa(c.consultor()),     // "ANA SOUZA" vira "Ana Souza".
                segmento,
                Padronizacao.maiusculas(c.nivelCliente()),  // "b" vira "B".
                c.faturamentoAnual(),                       // Já validado pelo DTO: fica como veio.
                servicos,
                c.dataContratacao(),                        // Já validada pelo DTO: fica como veio.
                Padronizacao.capitalizar(c.cidade()),       // Opcionais: null vira "".
                Padronizacao.maiusculas(c.uf()),            // "sp" vira "SP".
                Padronizacao.email(c.email()));             // Tudo em minúsculas.
    }

    // ===== Envio real: POST /api/uploads/validadas (aula "Telas do Backend") =====
    public List<ResultadoLinha> validar(List<LinhaPlanilha> linhas) {
        List<ResultadoLinha> saida = new ArrayList<>();
        Map<String, Integer> primeiraLinhaDoCodigo = new HashMap<>(); // Código -> linha em que apareceu primeiro.

        for (LinhaPlanilha linha : linhas) {
            Map<String, String> bruto = linha.campos();
            List<String> erros = new ArrayList<>();
            List<String> avisos = new ArrayList<>();

            // 1) Padroniza cada campo (igual ao passo 1 do validacao.js).
            Map<String, String> tratada = new LinkedHashMap<>();
            tratada.put(CODIGO, Padronizacao.codigo(bruto.get(CODIGO)));
            tratada.put(NOME, Padronizacao.capitalizar(bruto.get(NOME)));
            tratada.put(CONSULTOR, Padronizacao.nomePessoa(bruto.get(CONSULTOR)));
            tratada.put(SEGMENTO, Padronizacao.segmento(bruto.get(SEGMENTO)));
            tratada.put(NIVEL, Padronizacao.maiusculas(bruto.get(NIVEL)));
            tratada.put(SERVICOS, Padronizacao.servicos(bruto.get(SERVICOS)));
            tratada.put(CIDADE, Padronizacao.capitalizar(bruto.get(CIDADE)));
            tratada.put(UF, Padronizacao.maiusculas(bruto.get(UF)));
            tratada.put(EMAIL, Padronizacao.email(bruto.get(EMAIL)));
            Optional<LocalDate> data = Padronizacao.data(bruto.get(DATA));
            Optional<BigDecimal> faturamento = Padronizacao.moeda(bruto.get(FATURAMENTO));

            // 2) Obrigatórios que só precisam estar preenchidos.
            if (tratada.get(CODIGO).isEmpty()) erros.add("Código do cliente está vazio");
            if (tratada.get(NOME).isEmpty()) erros.add("Nome do cliente está vazio");
            if (tratada.get(CONSULTOR).isEmpty()) erros.add("Consultor está vazio");
            if (tratada.get(SERVICOS).isEmpty()) erros.add("Serviços contratados está vazio");

            // 3) Segmento da lista.
            String segmento = tratada.get(SEGMENTO);
            if (segmento.isEmpty()) erros.add("Segmento está vazio");
            else if (!SEGMENTOS_VALIDOS.contains(segmento))
                erros.add("Segmento \"" + segmento + "\" não está na lista (" + String.join(", ", SEGMENTOS_VALIDOS) + ")");

            // 4) Nível A, B ou C.
            String nivel = tratada.get(NIVEL);
            if (nivel.isEmpty()) erros.add("Nível está vazio");
            else if (!NIVEIS_VALIDOS.contains(nivel)) erros.add("Nível deve ser A, B ou C");

            // 5) Data de contratação que existe no calendário.
            if (Padronizacao.texto(bruto.get(DATA)).isEmpty()) erros.add("Data de contratação está vazia");
            else if (data.isEmpty()) erros.add("Data de contratação deve estar no formato dd/mm/aaaa e existir no calendário");

            // 6) UF opcional, mas preenchida tem 2 letras.
            if (!tratada.get(UF).isEmpty() && !RE_UF.matcher(tratada.get(UF)).matches()) erros.add("UF deve ter 2 letras (ex.: SP)");

            // 7) E-mail opcional, mas preenchido tem formato de e-mail.
            String email = tratada.get(EMAIL);
            if (!email.isEmpty() && (!RE_EMAIL.matcher(email).matches() || email.contains("..")))
                erros.add("E-mail \"" + email + "\" não tem formato válido (ex.: contato@empresa.com.br)");

            // 8) Faturamento numérico e maior que zero.
            if (Padronizacao.texto(bruto.get(FATURAMENTO)).isEmpty()) erros.add("Faturamento anual está vazio");
            else if (faturamento.isEmpty()) erros.add("Faturamento anual deve ser numérico");
            else if (faturamento.get().signum() <= 0) erros.add("Faturamento anual deve ser maior que zero");

            // 9) Código repetido: a primeira linha com o código continua valendo; as outras são recusadas.
            String codigo = tratada.get(CODIGO);
            if (!codigo.isEmpty()) {
                Integer primeira = primeiraLinhaDoCodigo.putIfAbsent(codigo, linha.numero());
                if (primeira != null) erros.add("Código do cliente repetido (já aparece na linha " + primeira + ")");
            }

            // Formato que o Python grava: data aaaa-mm-dd e faturamento com 2 casas.
            tratada.put(DATA, data.map(LocalDate::toString).orElse(""));
            tratada.put(FATURAMENTO, faturamento.map(v -> v.setScale(2, RoundingMode.HALF_UP).toPlainString()).orElse(""));

            // Avisos: o que foi ajustado automaticamente (texto ou escrita diferente do que veio).
            for (String campo : List.of(CODIGO, NOME, CONSULTOR, SEGMENTO, NIVEL, SERVICOS, CIDADE, UF, EMAIL)) {
                String antes = bruto.get(campo);
                if (antes != null && !antes.isBlank() && !Objects.equals(antes, tratada.get(campo))) {
                    avisos.add(campo + ": \"" + antes + "\" virou \"" + tratada.get(campo) + "\"");
                }
            }

            saida.add(new ResultadoLinha(linha.numero(), tratada, erros, avisos));
        }
        return saida;
    }
}
