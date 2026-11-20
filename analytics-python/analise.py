"""Estatísticas da carteira calculadas com Pandas (Ciência de Dados do plano de ensino).

1) Para cada segmento (e para a carteira inteira, na linha "Todos"): quantidade de clientes,
   faturamento total, médio, mediana e desvio padrão. Vai para a tabela estatistica_lote.
2) O painel inteiro do Dashboard (montar_paineis), já calculado para cada filtro. Vai para a tabela painel_lote.
"""
import math

import pandas as pd

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


def _resumo_por(clientes: pd.DataFrame, coluna: str) -> list[dict]:
    grupos = clientes.groupby(coluna, sort=False)["faturamento_anual"]
    return [{"nome": str(nome), **_resumo(grupo.astype(float))} for nome, grupo in grupos]


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
        "porNivel": por_nivel,
        "contratacoesPorMes": _contratacoes_por_mes(clientes["data_contratacao"]),
        "servicos": contar(servicos) if len(servicos) else [],
        "dispersao": [
            {"rotulo": nome, "servicos": int(qtd), "faturamento": _dinheiro(fat), "segmento": segmento}
            for nome, qtd, fat, segmento in zip(clientes["nome_cliente"], qtd_servicos, faturamento, clientes["segmento"])
        ],
        "histograma": _histograma(faturamento),
        "resumo": {"segmento": resumo_segmento, "nivel": resumo_nivel, "total": _resumo(faturamento)},
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
