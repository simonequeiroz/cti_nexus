"""Estatísticas da carteira calculadas com Pandas (Ciência de Dados do plano de ensino).

Para cada segmento (e para a carteira inteira, na linha "Todos"): quantidade de clientes,
faturamento total, médio, mediana e desvio padrão. Vai para a tabela estatistica_lote.
"""
import pandas as pd


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
