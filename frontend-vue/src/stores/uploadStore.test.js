import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { setActivePinia, createPinia } from 'pinia'
import { useUploadStore } from './uploadStore'
import { useAutenticacaoStore } from './autenticacaoStore'
import api from '../services/api'

// Login e liberação pela API de mentira (services/apiFalsa.js), sem precisar do back-end ligado.
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

beforeEach(() => {
  api.reiniciar() // Começa cada teste com a API de mentira vazia (sem cargas gravadas).
  setActivePinia(createPinia())
})

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

describe('código digitado na correção', () => {
  const clienteAntigo = { numeroLinha: 2, codigoCliente: 'ANTIGO1', nomeCliente: 'Empresa Antiga', consultor: 'Ana Souza', segmento: 'Indústria', nivelCliente: 'A', faturamentoAnual: '1000', servicosContratados: 'MPLS', dataContratacao: '01/01/2024', cidade: '', uf: '', email: '' }

  // Primeira linha com erro e o código de uma linha aprovada.
  function linhaEErroCodigoUsado(store) {
    return { linha: store.dadosInvalidos[0].numeroLinha, codigoUsado: store.dadosValidos[0].codigo_cliente }
  }

  it('avisa enquanto digita se o código está em outra linha, no banco ou livre', async () => {
    const store = await conferirPlanilhaDeTeste()
    await api.post('/uploads/validadas', { arquivoNome: 'antiga.xlsx', linhas: [clienteAntigo] })
    await store.carregarCodigosDoBanco()
    const { linha, codigoUsado } = linhaEErroCodigoUsado(store)

    expect(store.situacaoDoCodigo(linha, codigoUsado.toLowerCase())).toMatchObject({ livre: false })
    expect(store.situacaoDoCodigo(linha, codigoUsado).mensagem).toContain('já está na linha')
    expect(store.situacaoDoCodigo(linha, 'antigo1')).toEqual({ livre: false, mensagem: 'Este código já está cadastrado para Empresa Antiga' })
    expect(store.situacaoDoCodigo(linha, 'CODIGO-NOVO')).toMatchObject({ livre: true })
    expect(store.situacaoDoCodigo(linha, '   ')).toBeNull()
  })

  it('não aprova código que já existe no banco', async () => {
    const store = await conferirPlanilhaDeTeste()
    await api.post('/uploads/validadas', { arquivoNome: 'antiga.xlsx', linhas: [clienteAntigo] })
    await store.carregarCodigosDoBanco()
    const { linha } = linhaEErroCodigoUsado(store)

    store.corrigirCampo(linha, 'codigo_cliente', 'antigo1')
    store.revalidar()
    expect(store.ocorrencias.some(o => o.linha === linha && o.descricao.includes('já cadastrado para Empresa Antiga'))).toBe(true)
    expect(store.dadosValidos.some(c => c.codigo_cliente === 'ANTIGO1')).toBe(false)
  })

  it('avisa ao abrir a tela se o servidor não respondeu', async () => {
    const store = await conferirPlanilhaDeTeste('gestor@ctinexus.com') // A rota recusa o gestor: é como o servidor não responder.
    expect(await store.carregarCodigosDoBanco()).toBe(false)
    expect(store.situacaoDoCodigo(2, 'CODIGO-NOVO').mensagem).toContain('será conferido ao liberar')
  })

  it('depois de liberar, a linha não é acusada de repetir o próprio código', async () => {
    const store = await conferirPlanilhaDeTeste()
    corrigirTudo(store)
    store.revalidar()
    expect(store.quantidadeValidas).toBe(15)

    await store.liberarParaPainel()
    expect(store.codigosDoBanco.size).toBe(15) // Agora os códigos digitados também estão no banco.
    store.revalidar()
    expect(store.quantidadeValidas).toBe(15)
    expect((await store.liberarParaPainel()).ok).toBe(true)
  })

  it('marca para o servidor só as linhas com código digitado', async () => {
    const store = await conferirPlanilhaDeTeste()
    const espiao = vi.spyOn(api, 'post')
    const linha = store.dadosInvalidos[0].numeroLinha
    const correta = store.dadosBrutos.find((_, i) => !store.dadosInvalidos.some(item => item.numeroLinha === i + 2))
    for (const campo of Object.keys(correta)) store.corrigirCampo(linha, campo, campo === 'codigo_cliente' ? 'DIGITADO1' : correta[campo])
    store.revalidar()
    await store.liberarParaPainel()

    const enviadas = espiao.mock.calls.find(([rota]) => rota === '/uploads/validadas')[1].linhas
    expect(enviadas.filter(l => l.codigoEditado).map(l => l.codigoCliente)).toEqual(['DIGITADO1'])
    espiao.mockRestore()
  })
})

describe('liberação para o painel', () => {
  it('o painel só recebe os clientes depois de liberar', async () => {
    const store = await conferirPlanilhaDeTeste()
    expect(store.quantidadeValidas).toBe(5)
    expect(store.liberada).toBe(false)
    expect(store.dadosLiberados).toHaveLength(0)

    expect((await store.liberarParaPainel()).ok).toBe(true)
    expect(store.dadosLiberados).toHaveLength(5)
    expect(store.liberacao.por.nome).toBe('Ana Lima')
    expect(store.historico[0].liberadoPor.nome).toBe('Ana Lima')
    expect(store.cargaGravada).toMatchObject({ id: 1, totalLinhas: 15, linhasInvalidas: 10 })
  })

  it('manda para o servidor só as linhas aprovadas, com o número da linha e as correções', async () => {
    const store = await conferirPlanilhaDeTeste()
    store.corrigirCampo(store.dadosInvalidos[0].numeroLinha, 'consultor', 'Maria Silva')
    store.revalidar()
    await store.liberarParaPainel()

    const [carga] = await api.get('/uploads').then(r => r.data)
    expect(carga.linhasValidas).toBe(store.quantidadeValidas)
    const clientes = await api.get('/clientes').then(r => r.data)
    expect(clientes.map(c => c.codigo_cliente)).toEqual(store.dadosValidos.map(c => c.codigo_cliente))
    expect(typeof clientes[0].faturamento_anual).toBe('number')
  })

  it('outra sessão (ex.: gestor no dia seguinte) vê no painel a última carga gravada', async () => {
    await (await conferirPlanilhaDeTeste()).liberarParaPainel() // Analista libera...

    setActivePinia(createPinia()) // ...e outra pessoa abre o sistema depois (memória vazia).
    await useAutenticacaoStore().login('gestor@ctinexus.com', '123456')
    const store = useUploadStore()
    expect(store.liberada).toBe(false)
    await store.carregarDoBanco()
    expect(store.liberada).toBe(true)
    expect(store.dadosLiberados).toHaveLength(5)
    expect(store.liberacao.por.nome).toBe('Ana Lima')
    expect(store.cargaGravada.arquivoNome).toBe('teste-clientes.xlsx')
  })

  it('correções depois da liberação não mudam o painel até liberar de novo', async () => {
    const store = await conferirPlanilhaDeTeste()
    await store.liberarParaPainel()

    corrigirTudo(store)
    store.revalidar()
    expect(store.quantidadeValidas).toBe(15)
    expect(store.mudouDesdeLiberacao).toBe(true)
    expect(store.dadosLiberados).toHaveLength(5) // O painel continua com a versão liberada.

    await store.liberarParaPainel()
    expect(store.dadosLiberados).toHaveLength(15)
    expect(store.mudouDesdeLiberacao).toBe(false)
  })

  it('gestor não pode liberar', async () => {
    const store = await conferirPlanilhaDeTeste('gestor@ctinexus.com')
    expect((await store.liberarParaPainel()).ok).toBe(false)
    expect(store.liberada).toBe(false)
  })

  it('conferir a planilha de novo desfaz liberação e alterações', async () => {
    const store = await conferirPlanilhaDeTeste()
    store.corrigirCampo(store.dadosInvalidos[0].numeroLinha, 'consultor', 'Maria Silva')
    await store.liberarParaPainel()

    await store.processarArquivo()
    expect(store.liberada).toBe(false)
    expect(store.alteracoes).toHaveLength(0)
  })
})
