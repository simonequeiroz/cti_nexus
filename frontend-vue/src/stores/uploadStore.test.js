import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { setActivePinia, createPinia } from 'pinia'
import { useUploadStore } from './uploadStore'
import { useAutenticacaoStore } from './autenticacaoStore'

// Login pela API de mentira (services/apiFalsa.js), sem precisar do back-end ligado.
vi.mock('../services/api', () => import('../services/apiFalsa'))

// Fluxo completo com a planilha de teste da tela (15 linhas: 5 corretas e 10 com erro).
async function conferirPlanilhaDeTeste(email = 'analista@ctinexus.com') {
  await useAutenticacaoStore().login(email, '123456')
  const store = useUploadStore()
  store.registrarArquivo(new File([readFileSync('public/teste-clientes.xlsx')], 'teste-clientes.xlsx'))
  await store.processarArquivo()
  return store
}

// Corrige todas as linhas com erro copiando os valores de uma linha correta (com código novo).
function corrigirTudo(store) {
  const comErro = new Set(store.dadosInvalidos.map(item => item.numeroLinha))
  const correta = { ...store.dadosBrutos.find((_, indice) => !comErro.has(indice + 2)) }
  for (const linha of comErro) {
    for (const campo of Object.keys(correta)) {
      store.corrigirCampo(linha, campo, campo === 'codigo_cliente' ? `NOVO${linha}` : correta[campo])
    }
  }
}

beforeEach(() => setActivePinia(createPinia()))

describe('conferência', () => {
  it('guarda quem enviou e quanto tempo levou', async () => {
    const store = await conferirPlanilhaDeTeste()
    expect(store.historico[0].enviadoPor.nome).toBe('Ana Lima')
    expect(store.duracaoMs).toBeGreaterThan(0)
    expect(store.historico[0].duracaoMs).toBe(store.duracaoMs)
  })
})

describe('registro de alterações', () => {
  it('guarda quem mudou, o valor antigo e o novo', async () => {
    const store = await conferirPlanilhaDeTeste()
    const linha = store.dadosInvalidos[0].numeroLinha
    const antes = String(store.dadosBrutos[linha - 2].consultor ?? '')
    store.corrigirCampo(linha, 'consultor', 'Maria Silva')

    expect(store.alteracoes).toHaveLength(1)
    expect(store.alteracoes[0]).toMatchObject({ linha, campo: 'consultor', valorAntigo: antes, valorNovo: 'Maria Silva' })
    expect(store.alteracoes[0].usuario.nome).toBe('Ana Lima')
  })

  it('junta edições do mesmo campo antes de conferir de novo, e descarta se voltou ao original', async () => {
    const store = await conferirPlanilhaDeTeste()
    const linha = store.dadosInvalidos[0].numeroLinha
    const original = String(store.dadosBrutos[linha - 2].consultor ?? '')

    store.corrigirCampo(linha, 'consultor', 'Mari')
    store.corrigirCampo(linha, 'consultor', 'Maria Silva')
    expect(store.alteracoes).toHaveLength(1)
    expect(store.alteracoes[0].valorNovo).toBe('Maria Silva')

    store.corrigirCampo(linha, 'consultor', original)
    expect(store.alteracoes).toHaveLength(0)
  })

  it('ignora "correção" que não muda o valor', async () => {
    const store = await conferirPlanilhaDeTeste()
    const linha = store.dadosInvalidos[0].numeroLinha
    store.corrigirCampo(linha, 'consultor', store.dadosBrutos[linha - 2].consultor)
    expect(store.alteracoes).toHaveLength(0)
    expect(store.edicoesPendentes).toBe(0)
  })
})

describe('liberação para o painel', () => {
  it('o painel só recebe os clientes depois de liberar', async () => {
    const store = await conferirPlanilhaDeTeste()
    expect(store.quantidadeValidas).toBe(5)
    expect(store.liberada).toBe(false)
    expect(store.dadosLiberados).toHaveLength(0)

    expect(store.liberarParaPainel()).toBe(true)
    expect(store.dadosLiberados).toHaveLength(5)
    expect(store.liberacao.por.nome).toBe('Ana Lima')
    expect(store.historico[0].liberadoPor.nome).toBe('Ana Lima')
  })

  it('correções depois da liberação não mudam o painel até liberar de novo', async () => {
    const store = await conferirPlanilhaDeTeste()
    store.liberarParaPainel()

    corrigirTudo(store)
    store.revalidar()
    expect(store.quantidadeValidas).toBe(15)
    expect(store.mudouDesdeLiberacao).toBe(true)
    expect(store.dadosLiberados).toHaveLength(5) // O painel continua com a versão liberada.

    store.liberarParaPainel()
    expect(store.dadosLiberados).toHaveLength(15)
    expect(store.mudouDesdeLiberacao).toBe(false)
  })

  it('gestor não pode liberar', async () => {
    const store = await conferirPlanilhaDeTeste('gestor@ctinexus.com')
    expect(store.liberarParaPainel()).toBe(false)
    expect(store.liberada).toBe(false)
  })

  it('conferir a planilha de novo desfaz liberação e alterações', async () => {
    const store = await conferirPlanilhaDeTeste()
    store.corrigirCampo(store.dadosInvalidos[0].numeroLinha, 'consultor', 'Maria Silva')
    store.liberarParaPainel()

    await store.processarArquivo()
    expect(store.liberada).toBe(false)
    expect(store.alteracoes).toHaveLength(0)
  })
})
