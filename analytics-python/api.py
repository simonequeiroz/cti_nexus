"""Serviço Python do CTI Nexus (FastAPI): recebe as linhas válidas do Java, limpa, calcula e grava no banco.

Caminho de um envio (aula "Telas do Backend"):
    Front -> UploadController (Java) -> UploadService -> ClienteValidacaoService -> PythonEtlService -> POST /etl (aqui)
    -> main.py (pipeline: limpeza, análise, insights e gravação no Neon)

Ligar (dentro da pasta analytics-python):   python -m uvicorn api:app --port 8000
Teste rápido:                                http://localhost:8000/health  ->  {"status": "ok"}
"""
import os
import secrets

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

load_dotenv()  # Lê o arquivo .env desta pasta (DATABASE_URL e ETL_CHAVE). Ele não vai para o GitHub.

from main import processar_carga  # noqa: E402  (depois do load_dotenv de propósito)

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
    """Recebe a carga do Java, confere a chave e entrega para o pipeline (main.py). Responde 200 com o id do lote."""
    if ETL_CHAVE and not secrets.compare_digest(x_etl_key or "", ETL_CHAVE):
        raise HTTPException(status_code=401, detail="Chave do ETL inválida.")
    if not pedido.linhas:
        raise HTTPException(status_code=400, detail="Nenhuma linha para gravar.")

    return processar_carga(pedido)
