"""Insights (conclusões em texto simples) do Painel da carteira, calculados com Pandas.

Cada insight segue a classe Insight do plano: titulo, descricao, tipo e prioridade (Alta, Média, Baixa).
O front só mostra: os 3 primeiros vão para o topo do painel e o resto para a lista "Outras conclusões".
"""
import pandas as pd

ORDEM_DA_PRIORIDADE = {"Alta": 0, "Média": 1, "Baixa": 2}


def percentual(parte: float, total: float) -> int:
    """Porcentagem inteira, arredondando 0,5 para cima (como o Math.round do JavaScript)."""
    return int(parte / total * 100 + 0.5) if total else 0


def moeda_compacta(valor: float) -> str:
    """Valor em reais curto, sempre com 1 casa: 2373500 -> "R$ 2,4 mi"; 350000 -> "R$ 350,0 mil"."""
    for limite, sufixo in ((1e9, " bi"), (1e6, " mi"), (1e3, " mil")):
        if abs(valor) >= limite:
            return f"R$ {valor / limite:.1f}{sufixo}".replace(".", ",")
    return f"R$ {valor:.1f}".replace(".", ",")


def contar(serie: pd.Series) -> list[dict]:
    """Conta quantas vezes cada valor aparece, do mais frequente para o menos (empate: quem apareceu primeiro)."""
    contagem = serie.value_counts(sort=False)  # Ordem em que cada valor apareceu.
    itens = [{"nome": str(nome), "quantidade": int(qtd)} for nome, qtd in contagem.items()]
    return sorted(itens, key=lambda item: -item["quantidade"])  # sorted() mantém a ordem dos empates.


def gerar_insights(clientes: pd.DataFrame) -> list[dict]:
    """Conclusões sobre os clientes (já filtrados por segmento/nível), da mais para a menos importante."""
    total = len(clientes)
    if not total:
        return []

    insights = []
    faturamento = clientes["faturamento_anual"].astype(float)
    faturamento_total = faturamento.sum()
    media_geral = faturamento.mean()
    qtd_servicos = clientes["servicos"].apply(len)

    # 1. Segmento com mais clientes.
    lider = contar(clientes["segmento"])[0]
    fatia = percentual(lider["quantidade"], total)
    insights.append({
        "titulo": f"{lider['nome']} lidera a carteira",
        "descricao": f"{lider['nome']} concentra {fatia}% dos clientes ({lider['quantidade']} de {total}).",
        "tipo": "Segmento",
        "prioridade": "Alta" if fatia >= 30 else "Média",
    })

    # 2. Segmento com maior faturamento médio.
    por_segmento = (clientes.assign(fat=faturamento).groupby("segmento", sort=False)["fat"]
                    .agg(["mean", "std", "count"]).sort_values("mean", ascending=False, kind="stable"))
    mais_rentavel = por_segmento.index[0]
    media_rentavel = por_segmento["mean"].iloc[0]
    acima = round((media_rentavel - media_geral) / media_geral * 100) if media_geral else 0
    if len(por_segmento) > 1 and acima > 0:
        insights.append({
            "titulo": f"{mais_rentavel} tem o maior faturamento médio",
            "descricao": (f"Média de {moeda_compacta(media_rentavel)} por cliente, {acima}% acima da média geral "
                          f"({moeda_compacta(media_geral)})."),
            "tipo": "Faturamento",
            "prioridade": "Alta" if acima >= 30 else "Média",
        })

    # 3. Nível A: participação na carteira x participação no faturamento.
    nivel_a = clientes["nivel_cliente"] == "A"
    if nivel_a.any():
        fatia_clientes = percentual(int(nivel_a.sum()), total)
        fatia_faturamento = percentual(faturamento[nivel_a].sum(), faturamento_total)
        insights.append({
            "titulo": "Peso dos clientes nível A",
            "descricao": (f"Clientes A são {fatia_clientes}% da carteira e respondem por "
                          f"{fatia_faturamento}% do faturamento."),
            "tipo": "Nível",
            "prioridade": "Alta" if fatia_faturamento - fatia_clientes >= 20 else "Média",
        })

    # 4. Serviço mais contratado.
    servicos = contar(pd.Series([s for lista in clientes["servicos"] for s in lista], dtype=object))
    if servicos:
        servico = servicos[0]
        insights.append({
            "titulo": f"{servico['nome']} é o serviço mais contratado",
            "descricao": (f"Aparece em {servico['quantidade']} de {total} clientes "
                          f"({percentual(servico['quantidade'], total)}%)."),
            "tipo": "Serviço",
            "prioridade": "Média",
        })

    # 5. Oportunidade de venda cruzada: clientes com um único serviço.
    com_um = int((qtd_servicos == 1).sum())
    if com_um:
        insights.append({
            "titulo": "Oportunidade de venda cruzada",
            "descricao": f"{com_um} clientes ({percentual(com_um, total)}%) contratam apenas um serviço.",
            "tipo": "Serviço",
            "prioridade": "Alta" if percentual(com_um, total) >= 40 else "Média",
        })

    # 6. Concentração: quanto do faturamento está nos 25% maiores clientes (acima do 3º quartil).
    if total >= 4:
        q3 = faturamento.quantile(0.75)
        maiores = faturamento[faturamento >= q3]
        insights.append({
            "titulo": "Concentração do faturamento",
            "descricao": (f"Os {len(maiores)} maiores clientes (acima de {moeda_compacta(q3)}) somam "
                          f"{percentual(maiores.sum(), faturamento_total)}% do faturamento."),
            "tipo": "Faturamento",
            "prioridade": "Média",
        })

    # 7. Segmento mais heterogêneo (maior coeficiente de variação = desvio padrão / média).
    grupos = por_segmento[por_segmento["count"] >= 3]
    if len(grupos):
        cv = (grupos["std"] / grupos["mean"]).fillna(0).sort_values(ascending=False, kind="stable")
        if cv.iloc[0] >= 0.5:
            insights.append({
                "titulo": f"Clientes de {cv.index[0]} são muito diferentes entre si",
                "descricao": (f"O desvio padrão do faturamento é {round(cv.iloc[0] * 100)}% da média do segmento: "
                              "vale separar estratégias por porte."),
                "tipo": "Faturamento",
                "prioridade": "Baixa",
            })

    # Transparência: base pequena limita as conclusões (pedido no plano do projeto).
    if total < 30:
        insights.append({
            "titulo": "Base pequena",
            "descricao": (f"Com {total} clientes válidos, as conclusões têm alcance limitado. "
                          "Use como indicação, não como regra."),
            "tipo": "Qualidade dos dados",
            "prioridade": "Baixa",
        })

    return sorted(insights, key=lambda i: ORDEM_DA_PRIORIDADE[i["prioridade"]])  # Mais importante primeiro.
