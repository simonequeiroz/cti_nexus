"""Serviço Python do CTI Nexus (FastAPI): recebe as linhas válidas do Java, limpa, calcula e grava no banco.

Caminho de um envio (aula "Telas do Backend"):
    Front -> UploadController (Java) -> UploadService -> ClienteValidacaoService -> PythonEtlService -> POST /etl (aqui)

Ligar (dentro da pasta analytics-python):   python -m uvicorn api:app --port 8000
Teste rápido:                                http://localhost:8000/health  ->  {"status": "ok"}
"""
import os
import secrets

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

load_dotenv()  # Lê o arquivo .env desta pasta (DATABASE_URL e ETL_CHAVE). Ele não vai para o GitHub.

from analise import estatisticas_por_segmento  # noqa: E402  (depois do load_dotenv de propósito)
from banco import gravar_lote                  # noqa: E402
from limpeza import preparar_clientes          # noqa: E402

ETL_CHAVE = os.getenv("ETL_CHAVE", "")  # Mesma chave do backend-java/.env: só o nosso Java consegue gravar.


# ===== Formato do JSON que o Java manda (o mesmo Map do UploadService.java) =====
class Linha(BaseModel):
    codigo_cliente: str
    nome_cliente: str
    consultor: str
    segmento: str
    nivel_cliente: str
    faturamento_anual: str     # Ex.: "1850000.00" (o Java já converteu)
    servicos_contratados: str  # Ex.: "MPLS;Firewall"
    data_contratacao: str      # Ex.: "2024-03-05" (aaaa-mm-dd)
    cidade: str | None = None
    uf: str | None = None
    email: str | None = None


class Alteracao(BaseModel):
    linha: int
    codigo: str | None = None
    campo: str
    valorAntigo: str | None = None
    valorNovo: str | None = None
    usuarioId: int | None = None
    em: str | None = None


class PedidoEtl(BaseModel):
    arquivoNome: str
    recebidas: int              # Linhas da planilha (válidas + com erro)
    invalidas: int              # Linhas que ficaram de fora
    comAviso: int = 0           # Linhas com ajuste automático
    enviadoPorId: int | None = None
    aprovadoPorId: int | None = None
    linhas: list[Linha]
    alteracoes: list[Alteracao] = []


app = FastAPI(title="CTI Nexus — ETL", description="Recebe os clientes válidos do Java e grava no PostgreSQL.")


@app.get("/health")
def saude():
    """Está ligado?"""
    return {"status": "ok"}


@app.post("/etl")
def etl(pedido: PedidoEtl, x_etl_key: str | None = Header(default=None)):
    """Limpa (Pandas), calcula as estatísticas e grava a carga no banco. Responde 200 com o id do lote."""
    if ETL_CHAVE and not secrets.compare_digest(x_etl_key or "", ETL_CHAVE):
        raise HTTPException(status_code=401, detail="Chave do ETL inválida.")
    if not pedido.linhas:
        raise HTTPException(status_code=400, detail="Nenhuma linha para gravar.")

    clientes = preparar_clientes([linha.model_dump() for linha in pedido.linhas])  # T: limpeza
    estatisticas = estatisticas_por_segmento(clientes)                             # Ciência de dados
    lote_id = gravar_lote(pedido, clientes, estatisticas)                          # L: gravação no Neon

    return {
        "loteId": lote_id,
        "clientesGravados": len(clientes),
        "segmentos": len(estatisticas) - 1,  # Sem contar a linha "Todos".
    }
