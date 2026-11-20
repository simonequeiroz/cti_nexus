# REMOVER ANTES DA ENTREGA ---------------------------------------------------------------
# Como testar o pipeline: (1) python -m unittest -v  (10 testes, sem banco);
# (2) com Python + Java + front ligados, libere uma planilha na tela Validação e confira no Neon:
#     SELECT segmento, nivel FROM painel_lote WHERE lote_id = (SELECT MAX(id) FROM upload_lote);
# Os gráficos analíticos (graficos.py / Matplotlib) foram tirados a pedido da professora: os gráficos são Chart.js no Dashboard.
# ---------------------------------------------------------------------------------------
"""Pipeline de análise do CTI Nexus: o que acontece com uma carga depois que o Java manda as linhas válidas.

O api.py só recebe o pedido HTTP (POST /etl) e confere a chave; quem faz o trabalho é este arquivo:

    limpeza.py   -> T: limpa e converte cada coluna (Pandas)
    analise.py   -> estatísticas por segmento + o painel inteiro do Dashboard (cada filtro)
    insights.py  -> conclusões em texto (usado pelo analise.py)
    banco.py     -> L: grava tudo no PostgreSQL (Neon), numa transação só

Os gráficos são desenhados no Dashboard (Chart.js) com os números que este pipeline calcula.
"""
from analise import estatisticas_por_segmento, montar_paineis
from banco import gravar_lote
from limpeza import preparar_clientes


def processar_carga(pedido) -> dict:
    """Roda o pipeline de uma carga e devolve o resumo que o Java recebe (ex.: { "loteId": 12, ... })."""
    clientes = preparar_clientes([linha.model_dump() for linha in pedido.linhas])  # T: limpeza
    estatisticas = estatisticas_por_segmento(clientes)                             # Ciência de dados
    paineis = montar_paineis(clientes)                                             # Números do Dashboard
    lote_id = gravar_lote(pedido, clientes, estatisticas, paineis)                 # L: gravação no Neon

    return {
        "loteId": lote_id,
        "clientesGravados": len(clientes),
        "segmentos": len(estatisticas) - 1,  # Sem contar a linha "Todos".
        "paineis": len(paineis),             # Combinações de filtro calculadas (segmento x nível).
    }
