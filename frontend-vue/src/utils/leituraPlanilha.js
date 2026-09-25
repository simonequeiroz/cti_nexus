// Leitura da planilha enviada (.xlsx, .xls ou .csv): escolhe a aba, trata a codificação do CSV e confere as colunas.
// Os erros imitam as exceções previstas para o back-end (ExcelInvalidoException e ColunaObrigatoriaException).
import * as XLSX from 'xlsx'
import { normalizarCabecalho } from './normalizacao'
import { formatarTamanho } from './formatadores'
import { ABA_PRINCIPAL, COLUNAS_OBRIGATORIAS, EXTENSOES_ACEITAS, TAMANHO_MAXIMO_MB, LINHAS_MAXIMAS } from '../constants/validacao'

// Confere o arquivo antes de ler (formato e tamanho). Devolve a mensagem do problema ou '' se estiver tudo certo.
// Vale para o seletor de arquivos e para o arrastar e soltar (que não respeita o "accept" do input).
export function verificarArquivo(arquivo) {
  const extensao = arquivo.name.slice(arquivo.name.lastIndexOf('.')).toLowerCase()
  if (!EXTENSOES_ACEITAS.includes(extensao)) {
    return `Formato não aceito: "${arquivo.name}". Envie uma planilha ${EXTENSOES_ACEITAS.join(', ')}.`
  }
  if (arquivo.size === 0) {
    return `O arquivo "${arquivo.name}" está vazio.`
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `O arquivo tem ${formatarTamanho(arquivo.size)}. O limite é ${TAMANHO_MAXIMO_MB} MB.`
  }
  return ''
}

export class ExcelInvalidoError extends Error { // Arquivo corrompido, vazio ou fora do formato.
  constructor(mensagem) {
    super(mensagem)
    this.name = 'ExcelInvalidoError'
  }
}

export class ColunaObrigatoriaError extends Error { // Falta alguma coluna do dicionário de dados.
  constructor(colunas, nomeAba) {
    super(`A aba "${nomeAba}" não segue o modelo: faltam as colunas ${colunas.join(', ')}. Use a planilha de exemplo como base.`)
    this.name = 'ColunaObrigatoriaError'
    this.colunas = colunas
  }
}

// CSV salvo pelo Excel costuma vir em ANSI (Windows-1252); CSV "UTF-8" vem em UTF-8. Tenta UTF-8 e, se falhar, usa ANSI.
function decodificarTexto(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

async function abrirPasta(arquivo) {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  if (/\.(csv|txt)$/i.test(arquivo.name)) {
    const conteudo = decodificarTexto(bytes).replace(/^﻿/, '') // Remove o BOM do "CSV UTF-8" do Excel.
    return XLSX.read(conteudo, { type: 'string', raw: true }) // raw: não deixa 03/02/2025 virar data americana (2 de março).
  }
  return XLSX.read(bytes, { raw: true })
}

export async function lerPlanilha(arquivo) { // Devolve { linhas, nomeAba } com os cabeçalhos já normalizados (ex.: "Código Cliente" vira codigo_cliente).
  let pasta
  try {
    pasta = await abrirPasta(arquivo)
  } catch {
    throw new ExcelInvalidoError('Não foi possível ler o arquivo. Verifique se é uma planilha .xlsx, .xls ou .csv.')
  }

  // Usa a aba upload_clientes (modelo da aula); se não existir, a primeira aba.
  const nomeAba = pasta.SheetNames.find(nome => nome.trim().toLowerCase() === ABA_PRINCIPAL) ?? pasta.SheetNames[0]
  const aba = pasta.Sheets[nomeAba]

  // Conta as linhas pela área usada da aba, antes de converter tudo (a conversão é a parte pesada).
  const linhasDeDados = aba['!ref'] ? XLSX.utils.decode_range(aba['!ref']).e.r : 0 // Última linha (base 0) = linhas sem o cabeçalho.
  if (linhasDeDados > LINHAS_MAXIMAS) {
    throw new ExcelInvalidoError(`A aba "${nomeAba}" tem ${linhasDeDados.toLocaleString('pt-BR')} linhas. O limite é ${LINHAS_MAXIMAS.toLocaleString('pt-BR')}; divida a planilha em partes.`)
  }

  const brutas = XLSX.utils.sheet_to_json(aba, { defval: '' }) // defval mantém as células vazias.
  if (!brutas.length) throw new ExcelInvalidoError(`A aba "${nomeAba}" está vazia.`)

  const linhas = brutas.map(linha => {
    const normalizada = {}
    for (const coluna in linha) normalizada[normalizarCabecalho(coluna)] = linha[coluna]
    return normalizada
  })

  const faltando = COLUNAS_OBRIGATORIAS.filter(coluna => !(coluna in linhas[0]))
  if (faltando.length) throw new ColunaObrigatoriaError(faltando, nomeAba)

  return { linhas, nomeAba }
}
