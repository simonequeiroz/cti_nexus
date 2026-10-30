"""Gravação no PostgreSQL (Neon): o "L" do ETL.

Tudo numa transação só: ou grava a carga inteira (lote, clientes, contratos, estatísticas e alterações),
ou não grava nada. As tabelas são criadas pelo Spring (backend-java/src/main/resources/schema.sql).
"""
import math
import os

import pandas as pd
import psycopg


def conectar() -> psycopg.Connection:
    """Abre a conexão com o banco. DATABASE_URL vem do arquivo .env (Connection string do Neon)."""
    return psycopg.connect(os.environ["DATABASE_URL"])


def gravar_lote(pedido, clientes: pd.DataFrame, estatisticas: pd.DataFrame) -> int:
    """Grava a carga e devolve o id do lote criado."""
    # "with" = se der qualquer erro lá dentro, desfaz tudo (rollback); se der certo, confirma (commit).
    with conectar() as conexao, conexao.cursor() as cursor:
        # 1) O lote: a trilha de auditoria (quem enviou, quem liberou, quantas linhas).
        cursor.execute(
            """INSERT INTO upload_lote (arquivo_nome, total_linhas, linhas_validas, linhas_invalidas,
                                        linhas_com_ajuste, enviado_por, aprovado_por)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (pedido.arquivoNome, pedido.recebidas, len(clientes), pedido.invalidas,
             pedido.comAviso, pedido.enviadoPorId, pedido.aprovadoPorId),
        )
        lote_id = cursor.fetchone()[0]

        # 2) Cadastros auxiliares: cada nome uma vez só. Devolve {nome: id}.
        consultores = _ids_por_nome(cursor, "consultor", clientes["consultor"].unique())
        segmentos = _ids_por_nome(cursor, "segmento", clientes["segmento"].unique())
        servicos = _ids_por_nome(cursor, "servico", sorted({s for lista in clientes["servicos"] for s in lista}))

        # 3) Clientes: código novo é inserido; código que já existia é atualizado (ON CONFLICT ... DO UPDATE).
        cursor.executemany(
            """INSERT INTO cliente (codigo, nome, consultor_id, segmento_id, nivel, faturamento_anual,
                                    data_contratacao, cidade, uf, email, lote_id, atualizado_em)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
               ON CONFLICT (codigo) DO UPDATE SET
                   nome = EXCLUDED.nome, consultor_id = EXCLUDED.consultor_id, segmento_id = EXCLUDED.segmento_id,
                   nivel = EXCLUDED.nivel, faturamento_anual = EXCLUDED.faturamento_anual,
                   data_contratacao = EXCLUDED.data_contratacao, cidade = EXCLUDED.cidade, uf = EXCLUDED.uf,
                   email = EXCLUDED.email, lote_id = EXCLUDED.lote_id, atualizado_em = now()""",
            [
                (c.codigo_cliente, c.nome_cliente, consultores[c.consultor], segmentos[c.segmento], c.nivel_cliente,
                 float(c.faturamento_anual), c.data_contratacao, c.cidade, c.uf, c.email, lote_id)
                for c in clientes.itertuples()
            ],
        )

        # 4) Contratos (serviços de cada cliente): apaga os antigos dos clientes desta carga e grava os novos.
        cursor.execute("SELECT codigo, id FROM cliente WHERE lote_id = %s", (lote_id,))
        id_do_cliente = dict(cursor.fetchall())
        cursor.execute("DELETE FROM contrato WHERE cliente_id = ANY(%s)", (list(id_do_cliente.values()),))
        cursor.executemany(
            "INSERT INTO contrato (cliente_id, servico_id, ordem) VALUES (%s, %s, %s)",
            [
                (id_do_cliente[c.codigo_cliente], servicos[servico], ordem)
                for c in clientes.itertuples()
                for ordem, servico in enumerate(dict.fromkeys(c.servicos))  # dict.fromkeys: tira serviço repetido.
            ],
        )

        # 5) Estatísticas por segmento (calculadas no analise.py).
        cursor.executemany(
            """INSERT INTO estatistica_lote (lote_id, segmento, quantidade, faturamento_total, faturamento_medio,
                                             faturamento_mediana, faturamento_desvio_padrao)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            [
                (lote_id, e.segmento, int(e.quantidade), float(e.faturamento_total), float(e.faturamento_medio),
                 float(e.faturamento_mediana), _numero_ou_nulo(e.faturamento_desvio_padrao))
                for e in estatisticas.itertuples()
            ],
        )

        # 6) Alterações feitas à mão na tela Validação (quem corrigiu o quê).
        cursor.executemany(
            """INSERT INTO alteracao (lote_id, usuario_id, linha, codigo_cliente, campo, valor_antigo, valor_novo, alterado_em)
               VALUES (%s, %s, %s, %s, %s, %s, %s, COALESCE(%s::timestamptz, now()))""",
            [
                (lote_id, a.usuarioId, a.linha, a.codigo, a.campo, a.valorAntigo, a.valorNovo, a.em)
                for a in pedido.alteracoes
            ],
        )

    return lote_id


def _ids_por_nome(cursor, tabela: str, nomes) -> dict[str, int]:
    """Garante que cada nome existe na tabela (consultor, segmento ou servico) e devolve {nome: id}."""
    nomes = [str(n) for n in nomes]
    # O nome da tabela vem do nosso código (nunca do usuário), por isso pode entrar direto no SQL.
    cursor.executemany(f"INSERT INTO {tabela} (nome) VALUES (%s) ON CONFLICT (nome) DO NOTHING", [(n,) for n in nomes])
    cursor.execute(f"SELECT nome, id FROM {tabela} WHERE nome = ANY(%s)", (nomes,))
    return dict(cursor.fetchall())


def _numero_ou_nulo(valor):
    """NaN (desvio padrão de 1 cliente só) vira NULL no banco."""
    return None if valor is None or (isinstance(valor, float) and math.isnan(valor)) else float(valor)
