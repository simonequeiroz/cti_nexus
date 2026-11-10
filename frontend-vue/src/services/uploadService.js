// Chamadas da planilha à API do Spring (UploadController.java e ClienteController.java).
// Quem usa: stores/uploadStore.js.
// Caminho do envio: Front -> UploadController -> UploadService -> ClienteValidacaoService -> PythonEtlService -> Python grava no banco.
import api from './api'

// POST /api/uploads/validadas  →  manda os clientes aprovados; o back-end confere de novo e o Python grava.
// Resposta: { loteId, status, arquivoNome, totalLinhas, linhasValidas, linhasInvalidas, linhasComAjuste, rejeitadas }
export async function enviarClientesValidados(pedido) {
  const { data } = await api.post('/uploads/validadas', pedido)
  return data
}

// GET /api/clientes  →  clientes da última carga gravada (mesmo formato das linhas da planilha)
export async function listarClientes() {
  const { data } = await api.get('/clientes')
  return data
}

// GET /api/clientes/codigos  →  todos os clientes já cadastrados: [{ codigo, nome }]
export async function listarCodigosCadastrados() {
  const { data } = await api.get('/clientes/codigos')
  return data
}

// GET /api/uploads  →  cargas gravadas, a mais nova primeiro ({ id, arquivoNome, aprovadoPor, criadoEm, ... })
export async function listarCargas() {
  const { data } = await api.get('/uploads')
  return data
}
