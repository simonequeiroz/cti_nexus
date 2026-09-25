// Testes das regras do dicionário de dados. Rodar com: npm test
import { describe, it, expect } from 'vitest'
import { validarLinhas } from './validacao'

// Linha válida de base; cada teste muda só o que precisa.
function linha(alteracoes = {}) {
  return {
    codigo_cliente: 'CTI001',
    nome_cliente: 'Metalúrgica Horizonte',
    consultor: 'Ana Souza',
    segmento: 'Indústria',
    nivel_cliente: 'A',
    faturamento_anual: 1850000,
    servicos_contratados: 'Internet Dedicada;Firewall',
    data_contratacao: '15/01/2025',
    cidade: 'Campinas',
    uf: 'SP',
    ...alteracoes
  }
}

function problemasDe(alteracoes) {
  return validarLinhas([linha(alteracoes)]).ocorrencias.map(o => `${o.campo}: ${o.tipo}`)
}

describe('padronização', () => {
  it('unifica as variações de segmento', () => {
    const { validos } = validarLinhas(['IND.', 'Industria', 'INDUSTRIA', ' indústria '].map((segmento, i) => linha({ codigo_cliente: `CTI00${i}`, segmento })))
    expect(validos.map(v => v.segmento)).toEqual(['Indústria', 'Indústria', 'Indústria', 'Indústria'])
  })

  it('corrige maiúsculas, espaços extras, nível, UF e serviços', () => {
    const [cliente] = validarLinhas([linha({
      nome_cliente: 'METALÚRGICA  HORIZONTE', consultor: 'ANA SOUZA', nivel_cliente: 'a',
      uf: 'sp', cidade: 'campinas', servicos_contratados: 'MPLS ; Firewall', codigo_cliente: 'cti001'
    })]).validos
    expect(cliente).toMatchObject({
      nome_cliente: 'Metalúrgica Horizonte', consultor: 'Ana Souza', nivel_cliente: 'A',
      uf: 'SP', cidade: 'Campinas', servicos_contratados: 'MPLS;Firewall', codigo_cliente: 'CTI001'
    })
  })

  it('não estraga nome de empresa já escrito certo (com sigla)', () => {
    expect(validarLinhas([linha({ nome_cliente: 'Tech CTI Brasil' })]).validos[0].nome_cliente).toBe('Tech CTI Brasil')
  })

  it('converte faturamento em texto brasileiro para número', () => {
    expect(validarLinhas([linha({ faturamento_anual: 'R$ 1.850.000,00' })]).validos[0].faturamento_anual).toBe(1850000)
  })

  it('registra o antes e depois de cada padronização', () => {
    const { padronizacoes } = validarLinhas([linha({ segmento: 'IND.' })])
    expect(padronizacoes).toEqual([{ linha: 2, campo: 'segmento', antes: 'IND.', depois: 'Indústria' }])
  })
})

describe('regras do dicionário de dados', () => {
  it('aceita uma linha correta', () => {
    expect(problemasDe({})).toEqual([])
  })

  it('aponta campos obrigatórios vazios', () => {
    expect(problemasDe({ nome_cliente: '' })).toEqual(['nome_cliente: Campo vazio'])
    expect(problemasDe({ consultor: '   ' })).toEqual(['consultor: Campo vazio'])
    expect(problemasDe({ servicos_contratados: '' })).toEqual(['servicos_contratados: Campo vazio'])
    expect(problemasDe({ faturamento_anual: '' })).toEqual(['faturamento_anual: Campo vazio'])
  })

  it('deixa cidade e UF opcionais', () => {
    expect(problemasDe({ cidade: '', uf: '' })).toEqual([])
  })

  it('exige UF com 2 letras quando preenchida', () => {
    expect(problemasDe({ uf: 'São Paulo' })).toEqual(['uf: Fora do padrão'])
  })

  it('aceita só os segmentos da lista', () => {
    expect(problemasDe({ segmento: 'Tech' })).toEqual(['segmento: Fora do padrão'])
  })

  it('aceita só os níveis A, B e C', () => {
    expect(problemasDe({ nivel_cliente: 'E' })).toEqual(['nivel_cliente: Fora do padrão'])
    expect(problemasDe({ nivel_cliente: '' })).toEqual(['nivel_cliente: Campo vazio'])
  })

  it('recusa faturamento negativo ou não numérico', () => {
    expect(problemasDe({ faturamento_anual: -1000 })).toEqual(['faturamento_anual: Valor inválido'])
    expect(problemasDe({ faturamento_anual: 'mil reais' })).toEqual(['faturamento_anual: Valor inválido'])
  })

  it('recusa data que não existe no calendário', () => {
    expect(problemasDe({ data_contratacao: '31/02/2026' })).toEqual(['data_contratacao: Valor inválido'])
    expect(problemasDe({ data_contratacao: '2026-13-40' })).toEqual(['data_contratacao: Valor inválido'])
  })

  it('aceita data no formato do Excel (número de dias)', () => {
    expect(validarLinhas([linha({ data_contratacao: 45672 })]).validos[0].data_contratacao).toBe('15/01/2025')
  })

  it('aponta código duplicado a partir da segunda ocorrência', () => {
    const resultado = validarLinhas([linha(), linha({ nome_cliente: 'Outra Empresa' })])
    expect(resultado.validos).toHaveLength(1)
    expect(resultado.erros).toEqual(['Linha 3: Código do cliente duplicado'])
  })

  it('numera as linhas como no Excel (cabeçalho na linha 1)', () => {
    const { ocorrencias } = validarLinhas([linha(), linha({ codigo_cliente: 'CTI002', nivel_cliente: 'X' })])
    expect(ocorrencias[0].linha).toBe(3)
  })
})
