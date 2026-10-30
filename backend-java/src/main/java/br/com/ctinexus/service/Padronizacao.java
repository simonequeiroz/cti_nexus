package br.com.ctinexus.service;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

// Padronização dos valores da planilha: "IND." vira "Indústria", "ANA SOUZA" vira "Ana Souza"...
// É a MESMA regra do front (frontend-vue/src/utils/normalizacao.js), para o front e o back-end nunca discordarem.
// Funções estáticas: não guardam nada, só recebem um texto e devolvem o texto arrumado.
public final class Padronizacao {

    private Padronizacao() {}

    private static final Pattern ESPACOS = Pattern.compile("[\\s\\u00A0]+");             // Espaço, tab, quebra de linha e o espaço "duro" do Excel.
    private static final Pattern DATA_BR = Pattern.compile("^(\\d{1,2})/(\\d{1,2})/(\\d{4})$"); // dd/mm/aaaa
    private static final Pattern DATA_ISO = Pattern.compile("^(\\d{4})-(\\d{2})-(\\d{2})$");    // aaaa-mm-dd
    private static final Pattern SO_MILHAR = Pattern.compile("^-?\\d{1,3}(\\.\\d{3})+$");       // 1.850.000
    private static final List<String> PALAVRAS_MINUSCULAS = List.of("da", "das", "de", "do", "dos", "e");

    // Variações aceitas de cada segmento (minúsculas) -> nome oficial.
    private static final Map<String, String> SEGMENTOS = Map.ofEntries(
            Map.entry("ind.", "Indústria"), Map.entry("industria", "Indústria"), Map.entry("indústria", "Indústria"),
            Map.entry("comercio", "Comércio"), Map.entry("comércio", "Comércio"),
            Map.entry("servicos", "Serviços"), Map.entry("serviços", "Serviços"),
            Map.entry("saude", "Saúde"), Map.entry("saúde", "Saúde"),
            Map.entry("tecnologia", "Tecnologia"), Map.entry("tec.", "Tecnologia"),
            Map.entry("educacao", "Educação"), Map.entry("educação", "Educação"));

    /** "  Ana   Souza " -> "Ana Souza" (sem espaços nas pontas nem repetidos). null vira "". */
    public static String texto(String valor) {
        return valor == null ? "" : ESPACOS.matcher(valor).replaceAll(" ").strip();
    }

    /** "Cti004" -> "CTI004" */
    public static String codigo(String valor) {
        return texto(valor).toUpperCase(Locale.ROOT);
    }

    /** "ANA SOUZA" -> "Ana Souza"; "maria da silva" -> "Maria da Silva" */
    public static String nomePessoa(String valor) {
        return primeirasMaiusculas(texto(valor));
    }

    /** Nome de empresa ou cidade: só arruma o que está TODO em maiúsculas ou todo em minúsculas ("Tech CTI" fica igual). */
    public static String capitalizar(String valor) {
        String limpo = texto(valor);
        boolean tudoIgual = limpo.equals(limpo.toUpperCase(Locale.ROOT)) || limpo.equals(limpo.toLowerCase(Locale.ROOT));
        return tudoIgual ? primeirasMaiusculas(limpo) : limpo;
    }

    /** "IND." -> "Indústria", "saude" -> "Saúde". Sem regra, devolve o texto limpo (e a validação aponta "fora do padrão"). */
    public static String segmento(String valor) {
        String limpo = texto(valor);
        return SEGMENTOS.getOrDefault(limpo.toLowerCase(Locale.ROOT), limpo);
    }

    /** "a" -> "A" (também serve para UF: "sp" -> "SP") */
    public static String maiusculas(String valor) {
        return texto(valor).toUpperCase(Locale.ROOT);
    }

    /** " Contato@Empresa.com.BR " -> "contato@empresa.com.br" */
    public static String email(String valor) {
        return texto(valor).toLowerCase(Locale.ROOT);
    }

    /** "MPLS ; Firewall" -> "MPLS;Firewall" */
    public static String servicos(String valor) {
        return Arrays.stream(texto(valor).split(";"))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(";"));
    }

    /** "R$ 1.850.000,00" -> 1850000.00. Vazio ou texto que não é número -> Optional vazio. */
    public static Optional<BigDecimal> moeda(String valor) {
        String numero = texto(valor).replaceAll("(?i)R\\$", "").replace(" ", "");
        if (numero.isEmpty()) return Optional.empty();
        if (numero.contains(",")) {
            numero = numero.replace(".", "").replace(",", ".");  // Formato brasileiro: 1.850.000,00
        } else if (SO_MILHAR.matcher(numero).matches()) {
            numero = numero.replace(".", "");                    // Só separador de milhar: 1.850.000
        }
        try {
            return Optional.of(new BigDecimal(numero));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /** "05/03/2024" ou "2024-03-05" -> data. Data que não existe (31/02) -> Optional vazio. */
    public static Optional<LocalDate> data(String valor) {
        String limpo = texto(valor);
        try {
            Matcher br = DATA_BR.matcher(limpo);
            if (br.matches()) {
                return Optional.of(LocalDate.of(Integer.parseInt(br.group(3)), Integer.parseInt(br.group(2)), Integer.parseInt(br.group(1))));
            }
            Matcher iso = DATA_ISO.matcher(limpo);
            if (iso.matches()) {
                return Optional.of(LocalDate.of(Integer.parseInt(iso.group(1)), Integer.parseInt(iso.group(2)), Integer.parseInt(iso.group(3))));
            }
        } catch (DateTimeException e) {
            // Dia ou mês fora do calendário: cai no "vazio" abaixo.
        }
        return Optional.empty();
    }

    // "clínica de saúde" -> "Clínica de Saúde": primeira letra de cada palavra maiúscula, menos "de", "da"... no meio.
    private static String primeirasMaiusculas(String valor) {
        String[] palavras = valor.toLowerCase(Locale.ROOT).split(" ");
        StringBuilder resultado = new StringBuilder();
        for (int i = 0; i < palavras.length; i++) {
            String palavra = palavras[i];
            if (i > 0) resultado.append(' ');
            if (palavra.isEmpty() || (i > 0 && PALAVRAS_MINUSCULAS.contains(palavra))) {
                resultado.append(palavra);
            } else {
                resultado.append(Character.toUpperCase(palavra.charAt(0))).append(palavra.substring(1));
            }
        }
        return resultado.toString();
    }
}
