"""Limpeza dos clientes que chegam do Java (o "T" do ETL, do lado do Python).

O Java já validou e padronizou cada linha (mesmas regras do front). Aqui o Pandas confere de novo
e deixa cada coluna no tipo certo para o banco: texto limpo, número, data e "vazio" virando nulo.
"""
import pandas as pd

# Colunas que chegam do Java (nomes do dicionário de dados da aula, aba upload_clientes).
COLUNAS = [
    "codigo_cliente", "nome_cliente", "consultor", "segmento", "nivel_cliente", "faturamento_anual",
    "servicos_contratados", "data_contratacao", "cidade", "uf", "email",
]
OPCIONAIS = ["cidade", "uf", "email"]  # Podem ficar vazias: no banco viram NULL.


def preparar_clientes(linhas: list[dict]) -> pd.DataFrame:
    """Recebe a lista de linhas (cada uma um dicionário) e devolve um DataFrame pronto para gravar."""
    tabela = pd.DataFrame(linhas, columns=COLUNAS)  # Cada dicionário vira uma linha da tabela.

    # Texto: tira espaços das pontas e espaços repetidos no meio ("Ana   Souza" -> "Ana Souza").
    for coluna in COLUNAS:
        if coluna not in ("faturamento_anual", "data_contratacao"):
            tabela[coluna] = tabela[coluna].fillna("").astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

    tabela["codigo_cliente"] = tabela["codigo_cliente"].str.upper()
    tabela["nivel_cliente"] = tabela["nivel_cliente"].str.upper()
    tabela["uf"] = tabela["uf"].str.upper()
    tabela["email"] = tabela["email"].str.lower()

    # Número e data no tipo certo. errors="raise": se vier algo estranho, a carga inteira é recusada (o Java recebe 502).
    tabela["faturamento_anual"] = pd.to_numeric(tabela["faturamento_anual"], errors="raise").round(2)
    tabela["data_contratacao"] = pd.to_datetime(tabela["data_contratacao"], format="%Y-%m-%d", errors="raise").dt.date

    # Serviços: "MPLS;Firewall" vira a lista ["MPLS", "Firewall"] (cada um vira uma linha na tabela contrato).
    tabela["servicos"] = tabela["servicos_contratados"].apply(
        lambda texto: [s.strip() for s in texto.split(";") if s.strip()]
    )

    # Opcionais vazios viram None (NULL no PostgreSQL).
    for coluna in OPCIONAIS:
        tabela[coluna] = tabela[coluna].where(tabela[coluna] != "", None)

    return tabela
