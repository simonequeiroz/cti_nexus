// Chamadas do painel (Dashboard) à API do Spring: só leitura. O navegador NÃO calcula nada do painel:
// os números, gráficos e insights vêm prontos do Python (analise.py + insights.py), gravados no banco (tabela painel_lote).
// Quem usa: stores/uploadStore.js (carregarDoBanco e carregarPainel), chamados pela PaginaDashboard.vue.
// Caminho: PaginaDashboard -> uploadStore -> dashboardService -> api.js (axios) -> DashboardController / UploadController
//          -> ConsultaCargaService -> PostgreSQL (Neon). Permissão no back-end: ver_painel.
import api from './api'

// GET /api/dashboard?segmento=&nivel=  →  { loteId, segmentos, painel } (painel já calculado pelo Python; vazio = todos)
export async function buscarPainel(segmento = '', nivel = '') {
  const { data } = await api.get('/dashboard', { params: { segmento, nivel } })
  return data
}

// GET /api/uploads  →  cargas gravadas, a mais nova primeiro ({ id, arquivoNome, aprovadoPor, criadoEm, ... })
export async function listarCargas() {
  const { data } = await api.get('/uploads')
  return data
}
