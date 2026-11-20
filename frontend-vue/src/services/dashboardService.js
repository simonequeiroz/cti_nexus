// Chamadas do painel (Dashboard) à API do Spring: só leitura dos clientes já gravados no banco.
// Quem usa: stores/uploadStore.js (carregarDoBanco), chamado pela PaginaDashboard.vue ao abrir.
// Caminho: PaginaDashboard -> uploadStore -> dashboardService -> api.js (axios) -> ClienteController / UploadController
//          -> ConsultaCargaService -> PostgreSQL (Neon). Permissão no back-end: ver_painel.
import api from './api'

// GET /api/clientes  →  clientes da última carga gravada (mesmo formato das linhas da planilha)
export async function listarClientes() {
  const { data } = await api.get('/clientes')
  return data
}

// GET /api/uploads  →  cargas gravadas, a mais nova primeiro ({ id, arquivoNome, aprovadoPor, criadoEm, ... })
export async function listarCargas() {
  const { data } = await api.get('/uploads')
  return data
}
