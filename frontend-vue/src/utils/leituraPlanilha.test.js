// Testes da leitura de arquivos: aba certa, codificação do CSV e colunas obrigatórias. Rodar com: npm test
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { lerPlanilha, verificarArquivo, ExcelInvalidoError, ColunaObrigatoriaError } from './leituraPlanilha'

const CABECALHO = 'codigo_cliente;nome_cliente;consultor;segmento;nivel_cliente;faturamento_anual;servicos_contratados;data_contratacao;cidade;uf'
const LINHA = 'CTI001;Clínica São Lucas;Ana Souza;Saúde;A;1850000;Backup;15/01/2025;Hortolândia;SP'

function arquivoXlsx(abas) { // abas: { nome: [[linha1], [linha2]] }
  const pasta = XLSX.utils.book_new()
  for (const [nome, linhas] of Object.entries(abas)) XLSX.utils.book_append_sheet(pasta, XLSX.utils.aoa_to_sheet(linhas), nome)
  return new File([XLSX.write(pasta, { type: 'array', bookType: 'xlsx' })], 'teste.xlsx')
}

describe('lerPlanilha', () => {
  it('usa a aba upload_clientes mesmo quando ela não é a primeira', async () => {
    const arquivo = arquivoXlsx({
      instrucoes: [['Objetivo', 'Usar esta planilha na aula']],
      upload_clientes: [CABECALHO.split(';'), LINHA.split(';')]
    })
    const { linhas, nomeAba } = await lerPlanilha(arquivo)
    expect(nomeAba).toBe('upload_clientes')
    expect(linhas[0].codigo_cliente).toBe('CTI001')
  })

  it('normaliza os cabeçalhos (acentos, maiúsculas e espaços)', async () => {
    const cabecalho = ['Código Cliente', 'Nome Cliente', 'Consultor', 'Segmento', 'Nível Cliente', 'Faturamento Anual', 'Serviços Contratados', 'Data Contratação']
    const { linhas } = await lerPlanilha(arquivoXlsx({ upload_clientes: [cabecalho, LINHA.split(';').slice(0, 8)] }))
    expect(Object.keys(linhas[0])).toContain('servicos_contratados')
  })

  it('lê CSV em UTF-8 com BOM (CSV UTF-8 do Excel) sem estragar os acentos', async () => {
    const arquivo = new File(['﻿' + CABECALHO + '\r\n' + LINHA], 'teste.csv')
    const { linhas } = await lerPlanilha(arquivo)
    expect(linhas[0]).toMatchObject({ nome_cliente: 'Clínica São Lucas', segmento: 'Saúde', cidade: 'Hortolândia' })
  })

  it('lê CSV em ANSI/Windows-1252 (CSV padrão do Excel no Windows)', async () => {
    const bytes = Uint8Array.from(CABECALHO + '\r\n' + LINHA, letra => letra.charCodeAt(0)) // Latin-1: um byte por letra.
    const { linhas } = await lerPlanilha(new File([bytes], 'teste.csv'))
    expect(linhas[0]).toMatchObject({ nome_cliente: 'Clínica São Lucas', segmento: 'Saúde' })
  })

  it('mantém a data do CSV como dd/mm/aaaa (não vira data americana)', async () => {
    const { linhas } = await lerPlanilha(new File([CABECALHO + '\n' + LINHA.replace('15/01/2025', '03/02/2025')], 'teste.csv'))
    expect(linhas[0].data_contratacao).toBe('03/02/2025')
  })

  it('avisa quais colunas obrigatórias estão faltando', async () => {
    const arquivo = new File(['codigo_cliente;cliente;consultor;segmento\nCLI0001;Tech;Ana;Serviços'], 'outro-formato.csv')
    await expect(lerPlanilha(arquivo)).rejects.toThrow(ColunaObrigatoriaError)
    await expect(lerPlanilha(arquivo)).rejects.toThrow(/nome_cliente, nivel_cliente, faturamento_anual, servicos_contratados, data_contratacao/)
  })

  it('recusa aba vazia', async () => {
    await expect(lerPlanilha(arquivoXlsx({ upload_clientes: [[]] }))).rejects.toThrow(ExcelInvalidoError)
  })

  it('aceita até 20.000 linhas e recusa acima disso', async () => {
    const cabecalho = CABECALHO.split(';')
    const linhas = quantidade => [cabecalho, ...Array.from({ length: quantidade }, () => LINHA.split(';'))]
    await expect(lerPlanilha(arquivoXlsx({ upload_clientes: linhas(20000) }))).resolves.toBeTruthy()
    await expect(lerPlanilha(arquivoXlsx({ upload_clientes: linhas(20001) }))).rejects.toThrow(/20\.001 linhas\. O limite é 20\.000/)
  }, 30000) // Monta e lê duas planilhas grandes: leva alguns segundos.
})

describe('verificarArquivo (antes de ler)', () => {
  const arquivo = (nome, bytes) => ({ name: nome, size: bytes }) // Só nome e tamanho importam aqui.
  const MB = 1024 * 1024

  it('aceita .xlsx, .xls e .csv (maiúsculas também) até 5 MB', () => {
    expect(verificarArquivo(arquivo('clientes.xlsx', 5 * MB))).toBe('')
    expect(verificarArquivo(arquivo('CLIENTES.XLS', 1000))).toBe('')
    expect(verificarArquivo(arquivo('base.csv', 1000))).toBe('')
  })

  it('recusa outros formatos (ex.: arrastar um PDF)', () => {
    expect(verificarArquivo(arquivo('relatorio.pdf', 1000))).toMatch(/Formato não aceito/)
    expect(verificarArquivo(arquivo('sem-extensao', 1000))).toMatch(/Formato não aceito/)
  })

  it('recusa arquivo vazio e acima de 5 MB', () => {
    expect(verificarArquivo(arquivo('vazio.xlsx', 0))).toMatch(/está vazio/)
    expect(verificarArquivo(arquivo('grande.xlsx', 5 * MB + 1))).toMatch(/O limite é 5 MB/)
  })
})
