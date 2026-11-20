"""Testes dos cálculos do painel (analise.py e insights.py). Não precisa de banco nem do Java.

Rodar dentro da pasta analytics-python:   python -m unittest -v
"""
import datetime
import unittest

import pandas as pd

from analise import montar_painel, montar_paineis
from insights import contar, moeda_compacta, percentual


def clientes(*linhas) -> pd.DataFrame:
    """Monta clientes no formato do limpeza.py: (segmento, nível, faturamento, serviços, data aaaa-mm-dd)."""
    return pd.DataFrame([
        {"nome_cliente": f"Cliente {i}", "segmento": s, "nivel_cliente": n, "faturamento_anual": f,
         "servicos": serv.split(";"), "data_contratacao": datetime.date.fromisoformat(d)}
        for i, (s, n, f, serv, d) in enumerate(linhas)
    ])


# Os mesmos valores do antigo teste do front (estatistica.test.js), agora como faturamento.
VALORES = [2, 4, 4, 4, 5, 5, 7, 9]
CARTEIRA = clientes(*[("Saúde" if i < 4 else "Indústria", "A" if i % 2 else "B", v * 100_000, "MPLS", "2024-01-15")
                      for i, v in enumerate(VALORES)])


class TestEstatisticas(unittest.TestCase):
    def test_media_mediana_e_desvio_padrao_amostral(self):
        i = montar_painel(CARTEIRA)["indicadores"]
        self.assertEqual(i["faturamentoMedio"], 500_000)
        self.assertEqual(i["faturamentoMediana"], 450_000)
        self.assertAlmostEqual(i["desvioPadrao"], 213_808.99, places=2)  # std() amostral (n - 1)

    def test_grupo_com_um_cliente_tem_desvio_zero(self):
        painel = montar_painel(clientes(("Saúde", "A", 1000, "MPLS", "2024-01-01")))
        self.assertEqual(painel["resumo"]["total"]["desvioPadrao"], 0)

    def test_contagem_do_mais_frequente_para_o_menos(self):
        self.assertEqual(contar(pd.Series(["A", "B", "B"])),
                         [{"nome": "B", "quantidade": 2}, {"nome": "A", "quantidade": 1}])

    def test_percentual_arredonda_meio_para_cima(self):
        self.assertEqual(percentual(1, 8), 13)  # 12,5% -> 13 (como o Math.round do front)
        self.assertEqual(percentual(1, 0), 0)


class TestPainel(unittest.TestCase):
    def test_contratacoes_incluem_meses_sem_nenhuma(self):
        painel = montar_painel(clientes(("Saúde", "A", 1, "MPLS", "2024-01-10"),
                                        ("Saúde", "A", 1, "MPLS", "2024-03-05")))
        self.assertEqual(painel["contratacoesPorMes"], [
            {"rotulo": "jan/24", "quantidade": 1}, {"rotulo": "fev/24", "quantidade": 0},
            {"rotulo": "mar/24", "quantidade": 1}])

    def test_histograma_usa_regra_de_sturges_e_conta_todos(self):
        faixas = montar_painel(CARTEIRA)["histograma"]
        self.assertEqual(len(faixas), 4)  # ceil(log2(8) + 1) = 4
        self.assertEqual(sum(f["quantidade"] for f in faixas), len(VALORES))

    def test_nivel_sempre_tem_a_b_c(self):
        niveis = montar_painel(clientes(("Saúde", "A", 1, "MPLS", "2024-01-01")))["porNivel"]
        self.assertEqual([(n["nivel"], n["quantidade"], n["percentual"]) for n in niveis],
                         [("A", 1, 100), ("B", 0, 0), ("C", 0, 0)])

    def test_um_painel_por_filtro_so_com_clientes(self):
        paineis = montar_paineis(CARTEIRA)
        self.assertEqual(paineis[("", "")]["quantidade"], 8)
        self.assertEqual(paineis[("Saúde", "")]["quantidade"], 4)
        self.assertEqual(paineis[("Saúde", "A")]["quantidade"], 2)
        self.assertNotIn(("Saúde", "C"), paineis)  # Sem clientes nível C: o Java responde quantidade 0.


class TestInsights(unittest.TestCase):
    def test_moeda_compacta_igual_ao_front(self):
        self.assertEqual(moeda_compacta(2_373_500), "R$ 2,4 mi")
        self.assertEqual(moeda_compacta(350_000), "R$ 350,0 mil")
        self.assertEqual(moeda_compacta(1_000_000), "R$ 1,0 mi")

    def test_insights_em_ordem_de_prioridade(self):
        insights = montar_painel(CARTEIRA)["insights"]
        ordem = {"Alta": 0, "Média": 1, "Baixa": 2}
        prioridades = [ordem[i["prioridade"]] for i in insights]
        self.assertEqual(prioridades, sorted(prioridades))
        self.assertIn("Base pequena", [i["titulo"] for i in insights])  # Menos de 30 clientes.


if __name__ == "__main__":
    unittest.main()
