package br.com.ctinexus.service;

import java.util.List;

// Os nomes das colunas da planilha (dicionário de dados da aula, aba upload_clientes).
// Constantes para não escrever "codigo_cliente" espalhado pelo código (slide "Colunas").
// Mesma lista do front: frontend-vue/src/constants/validacao.js.
public final class Colunas {

    private Colunas() {} // Só guarda constantes: ninguém precisa criar um objeto Colunas.

    public static final String CODIGO = "codigo_cliente";
    public static final String NOME = "nome_cliente";
    public static final String CONSULTOR = "consultor";
    public static final String SEGMENTO = "segmento";
    public static final String NIVEL = "nivel_cliente";
    public static final String FATURAMENTO = "faturamento_anual";
    public static final String SERVICOS = "servicos_contratados";
    public static final String DATA = "data_contratacao";
    public static final String CIDADE = "cidade";   // Opcional.
    public static final String UF = "uf";           // Opcional.
    public static final String EMAIL = "email";     // Opcional (atividade "Pinia - Validação de Planilha").

    public static final List<String> TODAS =
            List.of(CODIGO, NOME, CONSULTOR, SEGMENTO, NIVEL, FATURAMENTO, SERVICOS, DATA, CIDADE, UF, EMAIL);

    // Valores aceitos (iguais ao SEGMENTOS_VALIDOS e NIVEIS_VALIDOS do front).
    public static final List<String> SEGMENTOS_VALIDOS =
            List.of("Indústria", "Comércio", "Serviços", "Saúde", "Educação", "Tecnologia");
    public static final List<String> NIVEIS_VALIDOS = List.of("A", "B", "C");
}
