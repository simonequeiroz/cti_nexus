"""Estatísticas da carteira calculadas com Pandas (Ciência de Dados do plano de ensino).

1) Para cada segmento (e para a carteira inteira, na linha "Todos"): quantidade de clientes,
   faturamento total, médio, mediana e desvio padrão. Vai para a tabela estatistica_lote.
2) O painel inteiro do Dashboard (montar_paineis), já calculado para cada filtro. Vai para a tabela painel_lote.
"""
import math

import pandas as pd
from scipy import stats  # Biblioteca de estatística: aqui usamos o teste de Shapiro-Wilk.

from insights import contar, gerar_insights, percentual


def estatisticas_por_segmento(clientes: pd.DataFrame) -> pd.DataFrame:
    """Devolve uma linha por segmento + a linha "Todos", com os números do faturamento."""
    por_segmento = clientes.groupby("segmento")["faturamento_anual"].agg(
        quantidade="count",
        faturamento_total="sum",
        faturamento_medio="mean",
        faturamento_mediana="median",
        faturamento_desvio_padrao="std",  # Desvio padrão da amostra (ddof=1). Com 1 cliente só, fica vazio (NaN).
    ).reset_index()

    faturamento = clientes["faturamento_anual"]
    todos = pd.DataFrame([{
        "segmento": "Todos",
        "quantidade": int(faturamento.count()),
        "faturamento_total": faturamento.sum(),
        "faturamento_medio": faturamento.mean(),
        "faturamento_mediana": faturamento.median(),
        "faturamento_desvio_padrao": faturamento.std(),
    }])

    resultado = pd.concat([por_segmento, todos], ignore_index=True)
    numeros = ["faturamento_total", "faturamento_medio", "faturamento_mediana", "faturamento_desvio_padrao"]
    resultado[numeros] = resultado[numeros].round(2)  # Centavos, como no banco (NUMERIC com 2 casas).
    return resultado


# ===== PAINEL DA CARTEIRA: todos os números que o Dashboard mostra =====
# O navegador não calcula nada: o Python calcula aqui, o banco.py grava (tabela painel_lote)
# e o Java entrega pronto (GET /api/dashboard). Cada combinação de filtro (segmento x nível) é calculada
# na hora da carga, assim o filtro do painel só escolhe qual resultado mostrar.
NIVEIS = ["A", "B", "C"]
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def _dinheiro(valor) -> float:
    return 0.0 if pd.isna(valor) else round(float(valor), 2)


def _resumo(faturamento: pd.Series) -> dict:
    """Quantidade, média, mediana e desvio padrão (amostral, como o std() do Pandas; com 1 cliente fica 0)."""
    return {
        "quantidade": int(faturamento.count()),
        "media": _dinheiro(faturamento.mean()),
        "mediana": _dinheiro(faturamento.median()),
        "desvioPadrao": _dinheiro(faturamento.std()),
    }


def _milhoes(valor: float) -> str:
    """1650000 -> "1,7" (rótulo curto do eixo do histograma, em R$ milhões)."""
    return f"{valor / 1_000_000:.1f}".rstrip("0").rstrip(".").replace(".", ",")


def _contratacoes_por_mes(datas: pd.Series) -> list[dict]:
    """Contratações em cada mês, do primeiro ao último, incluindo os meses sem nenhuma (0)."""
    meses = pd.to_datetime(datas).dt.to_period("M")
    contagem = meses.value_counts()
    return [
        {"rotulo": f"{MESES[mes.month - 1]}/{str(mes.year)[2:]}", "quantidade": int(contagem.get(mes, 0))}
        for mes in pd.period_range(meses.min(), meses.max(), freq="M")
    ]


def _histograma(faturamento: pd.Series) -> list[dict]:
    """Faixas de faturamento do mesmo tamanho; quantidade de faixas pela regra de Sturges."""
    minimo, maximo = faturamento.min(), faturamento.max()
    faixas = max(1, math.ceil(math.log2(len(faturamento)) + 1))
    largura = (maximo - minimo) / faixas or 1
    indice = ((faturamento - minimo) // largura).clip(upper=faixas - 1).astype(int)
    contagem = indice.value_counts()
    return [
        {"rotulo": f"{_milhoes(minimo + i * largura)}–{_milhoes(minimo + (i + 1) * largura)}",
         "quantidade": int(contagem.get(i, 0))}
        for i in range(faixas)
    ]


def _por_consultor(clientes: pd.DataFrame, faturamento: pd.Series) -> list[dict]:
    """Carteira de cada consultor: quantos clientes ele atende e quanto eles faturam somados.

    Ordem: quem tem mais clientes primeiro (empate: maior faturamento). Pedido na aula "Dashboard Front e Back"
    (porConsultor, barras deitadas) e na planilha de Ciência de Dados ("quantidade de clientes por consultor").
    """
    total_por_consultor = faturamento.groupby(clientes["consultor"]).sum()  # Soma o faturamento de cada consultor.
    carteiras = [{**item, "faturamento": _dinheiro(total_por_consultor[item["nome"]])}
                 for item in contar(clientes["consultor"])]                # contar(): clientes de cada consultor.
    return sorted(carteiras, key=lambda c: (-c["quantidade"], -c["faturamento"]))


def _resumo_por(clientes: pd.DataFrame, coluna: str) -> list[dict]:
    grupos = clientes.groupby(coluna, sort=False)["faturamento_anual"]
    return [{"nome": str(nome), **_resumo(grupo.astype(float))} for nome, grupo in grupos]


# ===== TESTES ESTATÍSTICOS (plano de ensino e planilha "CTI Insights — Ciência de Dados") =====
# Os três devolvem o mesmo formato, para o front mostrar todos com um componente só (ResultadoTeste.vue):
#   pergunta, resposta (Sim/Não...), conclusao (em português simples), detalhe (os números do teste)
#   + os números soltos (estatistica, pValor...), para quem quiser conferir no banco.
# Todos usam a mesma ideia: p-valor menor que 0,05 = o resultado não é obra do acaso.
NIVEL_DE_SIGNIFICANCIA = 0.05  # 5%: o limite mais usado.


def _numero(valor: float, casas: int = 4) -> str:
    """0.40315 -> "0,4032" (número no formato brasileiro, para o texto do detalhe)."""
    return f"{valor:.{casas}f}".replace(".", ",")


def _p_valor(p: float) -> str:
    """p-valor em texto; muito pequeno vira "< 0,0001" (com 4 casas ele apareceria como 0)."""
    return "< 0,0001" if p < 0.0001 else _numero(p)


def teste_normalidade(faturamento: pd.Series) -> dict | None:
    """Shapiro-Wilk: o faturamento segue a curva normal (formato de sino)?

    Hipótese nula (H0): os dados são normais. Se o p-valor for menor que 0,05, rejeitamos H0.
    Serve para escolher o resumo certo: dados normais -> a média representa bem; não normais -> use a mediana.
    Acima de 5.000 valores o scipy avisa que o p-valor fica menos preciso; o resultado continua valendo como indicação.
    """
    if len(faturamento) < 3 or faturamento.nunique() == 1:
        return None  # O teste precisa de pelo menos 3 valores, e de valores diferentes entre si.

    estatistica, p_valor = stats.shapiro(faturamento)  # W perto de 1 = parecido com a curva normal.
    normal = bool(p_valor >= NIVEL_DE_SIGNIFICANCIA)

    if normal:
        conclusao = ("O faturamento dos clientes se distribui de forma equilibrada em torno da média. "
                     "A média representa bem um cliente típico.")
    else:
        conclusao = ("O faturamento não é equilibrado: alguns clientes faturam bem mais (ou bem menos) que os outros. "
                     "Para saber quanto fatura um cliente típico, a mediana é mais confiável que a média.")

    return {
        "teste": "Shapiro-Wilk",
        "pergunta": "O faturamento é equilibrado?",
        "resposta": "Sim" if normal else "Não",
        "conclusao": conclusao,
        "detalhe": f"Teste de Shapiro-Wilk: p-valor {_p_valor(p_valor)} (abaixo de 0,05 = não segue a curva normal)"
                   f" · W = {_numero(estatistica)}",
        "estatistica": round(float(estatistica), 4),  # W
        "pValor": round(float(p_valor), 4),
        "normal": normal,
    }


def teste_qui_quadrado(clientes: pd.DataFrame) -> dict | None:
    """Qui-quadrado: o nível do cliente (A/B/C) depende do segmento?

    Monta a tabela de contagem segmento x nível (pd.crosstab) e compara com o que se esperaria se os níveis
    se espalhassem igual em todos os segmentos. Hipótese nula (H0): segmento e nível são independentes.
    p-valor menor que 0,05 -> rejeitamos H0: o nível depende do segmento.
    """
    tabela = pd.crosstab(clientes["segmento"], clientes["nivel_cliente"])  # Linhas: segmentos; colunas: níveis.
    if tabela.shape[0] < 2 or tabela.shape[1] < 2:
        return None  # Precisa de pelo menos 2 segmentos e 2 níveis (ex.: com o filtro de um segmento só, não há o que comparar).

    qui2, p_valor, graus_liberdade, esperado = stats.chi2_contingency(tabela)
    depende = bool(p_valor < NIVEL_DE_SIGNIFICANCIA)
    # Regra do teste: cada casa da tabela deveria esperar pelo menos 5 clientes. Com menos, o resultado é só uma indicação.
    confiavel = bool((esperado >= 5).all())

    if depende:
        conclusao = "Sim: alguns segmentos têm, proporcionalmente, mais clientes de um nível (A, B ou C) que os outros."
    else:
        conclusao = "Não: os níveis A, B e C aparecem em proporções parecidas em todos os segmentos."
    if not confiavel:
        conclusao += " Atenção: há poucos clientes em alguns grupos, então o resultado é só uma indicação."

    return {
        "teste": "Qui-quadrado",
        "pergunta": "O nível do cliente depende do segmento?",
        "resposta": "Sim" if depende else "Não",
        "conclusao": conclusao,
        "detalhe": f"Teste Qui-quadrado: p-valor {_p_valor(p_valor)} (abaixo de 0,05 = depende)"
                   f" · χ² = {_numero(qui2, 2)} · {int(graus_liberdade)} graus de liberdade",
        "estatistica": round(float(qui2), 4),  # χ²: quanto maior, mais a tabela real foge da "esperada".
        "pValor": round(float(p_valor), 4),
        "grausLiberdade": int(graus_liberdade),  # (nº de segmentos - 1) x (nº de níveis - 1)
        "depende": depende,
        "confiavel": confiavel,
    }


def correlacao_servicos_faturamento(qtd_servicos: pd.Series, faturamento: pd.Series) -> dict | None:
    """Correlação de Pearson: quem contrata mais serviços fatura mais?

    r vai de -1 a 1: perto de 1 = os dois sobem juntos; perto de -1 = um sobe e o outro desce; perto de 0 = sem relação.
    Força (regra comum): abaixo de 0,3 fraca, até 0,7 moderada, acima forte.
    O p-valor diz se a relação é real ou pode ser acaso. Correlação não prova causa: só mostra que andam juntos.
    """
    if len(faturamento) < 3 or qtd_servicos.nunique() == 1 or faturamento.nunique() == 1:
        return None  # Com 2 clientes, ou todos com o mesmo valor, não dá para medir.

    r, p_valor = stats.pearsonr(qtd_servicos, faturamento)
    significativa = bool(p_valor < NIVEL_DE_SIGNIFICANCIA)
    forca = "fraca" if abs(r) < 0.3 else "moderada" if abs(r) < 0.7 else "forte"

    if not significativa:
        resposta = "Sem relação clara"
        conclusao = "Não dá para afirmar: a quantidade de serviços não ajuda a prever o faturamento destes clientes."
    elif r > 0:
        resposta = "Sim"
        conclusao = f"Sim, com relação {forca}: em geral, quem fatura mais contrata mais serviços."
    else:
        resposta = "Não, ao contrário"
        conclusao = f"Ao contrário, com relação {forca}: quem fatura mais tende a contratar menos serviços."

    return {
        "teste": "Correlação de Pearson",
        "pergunta": "Quem contrata mais serviços fatura mais?",
        "resposta": resposta,
        "conclusao": conclusao,
        "detalhe": f"Correlação de Pearson: r = {_numero(r, 2)} (de -1 a 1; perto de 0 = sem relação)"
                   f" · p-valor {_p_valor(p_valor)}",
        "r": round(float(r), 4),
        "pValor": round(float(p_valor), 4),
        "forca": forca,
        "significativa": significativa,
    }


def montar_painel(clientes: pd.DataFrame) -> dict:
    """Tudo o que o Dashboard desenha, já calculado, para um grupo de clientes."""
    total = len(clientes)
    if not total:
        return {"quantidade": 0}

    faturamento = clientes["faturamento_anual"].astype(float)
    qtd_servicos = clientes["servicos"].apply(len)
    servicos = pd.Series([s for lista in clientes["servicos"] for s in lista], dtype=object)

    por_segmento = [{**s, "percentual": percentual(s["quantidade"], total)} for s in contar(clientes["segmento"])]
    por_nivel = []
    for nivel in NIVEIS:
        quantidade = int((clientes["nivel_cliente"] == nivel).sum())
        por_nivel.append({"nivel": nivel, "quantidade": quantidade, "percentual": percentual(quantidade, total)})

    resumo_segmento = sorted(_resumo_por(clientes, "segmento"), key=lambda g: -g["media"])
    resumo_nivel = sorted(_resumo_por(clientes, "nivel_cliente"), key=lambda g: g["nome"])

    return {
        "quantidade": total,
        "indicadores": {
            "faturamentoTotal": _dinheiro(faturamento.sum()),
            "faturamentoMedio": _dinheiro(faturamento.mean()),
            "faturamentoMediana": _dinheiro(faturamento.median()),
            "desvioPadrao": _dinheiro(faturamento.std()),
            "servicosPorCliente": round(float(qtd_servicos.mean()), 1),
        },
        "porSegmento": por_segmento,
        "porConsultor": _por_consultor(clientes, faturamento),
        "porNivel": por_nivel,
        "contratacoesPorMes": _contratacoes_por_mes(clientes["data_contratacao"]),
        "servicos": contar(servicos) if len(servicos) else [],
        "dispersao": [
            {"rotulo": nome, "servicos": int(qtd), "faturamento": _dinheiro(fat), "segmento": segmento}
            for nome, qtd, fat, segmento in zip(clientes["nome_cliente"], qtd_servicos, faturamento, clientes["segmento"])
        ],
        "histograma": _histograma(faturamento),
        "resumo": {"segmento": resumo_segmento, "nivel": resumo_nivel, "total": _resumo(faturamento)},
        # Testes estatísticos interpretados (None quando o grupo filtrado não permite o teste).
        "normalidade": teste_normalidade(faturamento),                             # Shapiro-Wilk
        "quiQuadrado": teste_qui_quadrado(clientes),                               # segmento x nível
        "correlacao": correlacao_servicos_faturamento(qtd_servicos, faturamento),  # serviços x faturamento
        "insights": gerar_insights(clientes),
    }


def montar_paineis(clientes: pd.DataFrame) -> dict[tuple[str, str], dict]:
    """Um painel por combinação de filtro: (segmento, nível), com "" = todos. Só as combinações com clientes."""
    paineis = {}
    for segmento in [""] + sorted(clientes["segmento"].unique()):
        for nivel in [""] + NIVEIS:
            filtro = pd.Series(True, index=clientes.index)
            if segmento:
                filtro &= clientes["segmento"] == segmento
            if nivel:
                filtro &= clientes["nivel_cliente"] == nivel
            if filtro.any():
                paineis[(segmento, nivel)] = montar_painel(clientes[filtro])
    return paineis
