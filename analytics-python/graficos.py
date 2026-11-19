"""Gráficos da Ciência de Dados gerados em Python com Matplotlib (exigência do plano de ensino).

Boxplot do faturamento anual por segmento: mostra, para cada segmento, a mediana (linha do meio),
onde ficam os 50% centrais dos clientes (a caixa), o menor e o maior valor "normais" (as hastes)
e os clientes fora do padrão (os pontos soltos, chamados de outliers).

Dois jeitos de usar:
    1) Automático: o api.py chama gerar_boxplot_faturamento() depois de gravar cada carga.
    2) Sozinho (lê a última carga do Neon):   python graficos.py
O arquivo fica em output/graficos/boxplot_faturamento_segmento.png.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # Desenha direto no arquivo, sem abrir janela (o servidor não tem tela).
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.ticker import FuncFormatter  # noqa: E402

PASTA_GRAFICOS = Path(__file__).parent / "output" / "graficos"
ARQUIVO_BOXPLOT = PASTA_GRAFICOS / "boxplot_faturamento_segmento.png"

# Mesmas cores do front (frontend-vue/src/constants/cores.js): cada segmento tem sempre a mesma cor.
CORES_SEGMENTO = {
    "Indústria": "#2a78d6",
    "Comércio": "#c2408a",
    "Serviços": "#1baf7a",
    "Saúde": "#4a3aa7",
    "Educação": "#d99a00",
    "Tecnologia": "#8f4f10",
}
COR_SEM_SEGMENTO = "#A5A5A5"


def _em_reais(valor, _posicao=None) -> str:
    """1850000 -> "R$ 1,85 mi"; 350000 -> "R$ 350 mil" (eixo fácil de ler para o consultor)."""
    if abs(valor) >= 1_000_000:
        return f"R$ {valor / 1_000_000:.2f} mi".replace(".", ",")
    if abs(valor) >= 1_000:
        return f"R$ {valor / 1_000:.0f} mil"
    return f"R$ {valor:.0f}"


def gerar_boxplot_faturamento(clientes: pd.DataFrame, arquivo: Path = ARQUIVO_BOXPLOT) -> Path:
    """Desenha o boxplot do faturamento anual por segmento e salva em PNG. Devolve o caminho do arquivo.

    `clientes` precisa das colunas "segmento" e "faturamento_anual" (o mesmo DataFrame do limpeza.py).
    """
    if clientes.empty:
        raise ValueError("Sem clientes para desenhar o gráfico.")

    # Segmentos em ordem de mediana (do maior para o menor), para a comparação ficar fácil de ler.
    medianas = clientes.groupby("segmento")["faturamento_anual"].median().sort_values(ascending=False)
    segmentos = list(medianas.index)
    valores = [clientes.loc[clientes["segmento"] == s, "faturamento_anual"].astype(float).to_numpy() for s in segmentos]
    rotulos = [f"{s}\n({len(v)} cliente{'s' if len(v) != 1 else ''})" for s, v in zip(segmentos, valores)]

    figura, eixo = plt.subplots(figsize=(10, 6), dpi=120)
    caixas = eixo.boxplot(
        valores,
        tick_labels=rotulos,
        patch_artist=True,          # Caixa pintada (com cor de fundo).
        widths=0.55,
        medianprops={"color": "black", "linewidth": 2},
        flierprops={"marker": "o", "markersize": 6, "markerfacecolor": "white", "markeredgecolor": "#333333"},
        showmeans=True,             # Triângulo = média (para comparar com a mediana).
        meanprops={"marker": "^", "markerfacecolor": "white", "markeredgecolor": "black", "markersize": 7},
    )
    for caixa, segmento in zip(caixas["boxes"], segmentos):
        caixa.set_facecolor(CORES_SEGMENTO.get(segmento, COR_SEM_SEGMENTO))
        caixa.set_alpha(0.85)
        caixa.set_edgecolor("#333333")

    # Pontos de cada cliente por cima da caixa (com poucos clientes, a caixa sozinha engana).
    for posicao, v in enumerate(valores, start=1):
        deslocamento = [(i % 5 - 2) * 0.04 for i in range(len(v))]  # Espalha um pouco para os pontos não se cobrirem.
        eixo.scatter([posicao + d for d in deslocamento], v, s=14, color="#222222", alpha=0.55, zorder=3)

    eixo.set_title("Faturamento anual por segmento", fontsize=14, fontweight="bold", loc="left")
    eixo.set_ylabel("Faturamento anual")
    eixo.yaxis.set_major_formatter(FuncFormatter(_em_reais))
    eixo.grid(axis="y", linestyle="--", alpha=0.4)
    eixo.set_axisbelow(True)
    for lado in ("top", "right"):
        eixo.spines[lado].set_visible(False)
    figura.text(
        0.01, 0.01,
        "Linha preta = mediana · triângulo = média · caixa = 50% dos clientes do meio · "
        "círculos vazios = clientes fora do padrão",
        fontsize=8, color="#555555",
    )

    figura.tight_layout(rect=(0, 0.03, 1, 1))
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    figura.savefig(arquivo)
    plt.close(figura)  # Libera a memória (o servidor gera um gráfico a cada carga).
    return arquivo


def _clientes_da_ultima_carga() -> pd.DataFrame:
    """Lê do Neon os clientes da última carga (mesma consulta do ConsultaCargaService.java)."""
    from banco import conectar  # Só aqui: quem usa só o gerar_boxplot_faturamento() não precisa do banco.

    with conectar() as conexao, conexao.cursor() as cursor:
        cursor.execute(
            """SELECT s.nome, c.faturamento_anual
                 FROM cliente c
                 JOIN segmento s ON s.id = c.segmento_id
                WHERE c.lote_id = (SELECT MAX(id) FROM upload_lote)"""
        )
        linhas = cursor.fetchall()
    return pd.DataFrame(linhas, columns=["segmento", "faturamento_anual"])


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()  # DATABASE_URL do arquivo .env desta pasta.
    caminho = gerar_boxplot_faturamento(_clientes_da_ultima_carga())
    print(f"Gráfico salvo em {caminho}")
