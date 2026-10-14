// Regras de validação e padronização da planilha (dicionário de dados da aula).
// Função pura: recebe as linhas lidas e devolve o resultado, sem depender do Vue nem da Pinia.
// As mesmas regras deverão existir no script Python e no back-end Spring Boot.
import {
  texto,
  capitalizar,
  normalizarUF,
  normalizarNivel,
  normalizarSegmento,
  normalizarCodigo,
  normalizarNomePessoa,
  normalizarMoeda,
  normalizarServicos,
  normalizarData,
  normalizarEmail
} from './normalizacao'
import { SEGMENTOS_VALIDOS, NIVEIS_VALIDOS } from '../constants/validacao'

// E-mail: algo@dominio.extensao, sem espaços e sem pontos seguidos. Ex.: contato@empresa.com.br.
const FORMATO_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/

export function emailValido(email) {
  return FORMATO_EMAIL.test(email) && !email.includes('..')
}

// Por que o valor foi ajustado automaticamente (motivos em constants/validacao.js, MOTIVOS_DE_AJUSTE).
export function motivoDoAjuste(campo, antes, depois) {
  const semEspacosExtras = texto(antes)
  if (semEspacosExtras === depois) return 'Espaços extras' // Ex.: "  Transportes Rápido  ".
  if (semEspacosExtras.toLowerCase() === depois.toLowerCase()) return 'Maiúsculas e minúsculas' // Ex.: CARLOS LIMA.
  if (['faturamento_anual', 'data_contratacao', 'servicos_contratados'].includes(campo)) return 'Formato do valor' // Ex.: "R$ 98.000,00".
  return 'Escrita padronizada' // Ex.: IND. vira Indústria, saude vira Saúde.
}

// Campos obrigatórios que só precisam estar preenchidos (os outros têm regras próprias abaixo).
const PREENCHIMENTO_OBRIGATORIO = [
  { campo: 'codigo_cliente', mensagem: 'Código do cliente está vazio' },
  { campo: 'nome_cliente', mensagem: 'Nome do cliente está vazio' },
  { campo: 'consultor', mensagem: 'Consultor está vazio' },
  { campo: 'servicos_contratados', mensagem: 'Serviços contratados está vazio' }
]

export function validarLinhas(linhas) {
  const validos = [] // Linhas aprovadas, já padronizadas.
  const invalidos = [] // Resumo das linhas com problema: { numeroLinha, codigo_cliente, problemas }.
  const ocorrencias = [] // Cada problema separado: linha, código, campo, tipo e descrição.
  const padronizacoes = [] // Valores corrigidos automaticamente: antes, depois e motivo.
  const primeiraLinhaDoCodigo = new Map() // Código do cliente -> linha em que apareceu pela primeira vez.

  linhas.forEach((linha, indice) => {
    const numeroLinha = indice + 2 // Soma 2 porque o Excel começa em 1 e tem cabeçalho.
    const problemas = []

    // 1. Padroniza cada campo.
    const tratada = {
      codigo_cliente: normalizarCodigo(linha.codigo_cliente), // Ex.: Cti004 vira CTI004.
      nome_cliente: capitalizar(linha.nome_cliente), // Ex.: METALÚRGICA ALFA vira Metalúrgica Alfa.
      consultor: normalizarNomePessoa(linha.consultor), // Ex.: ANA SOUZA vira Ana Souza.
      segmento: normalizarSegmento(linha.segmento), // Ex.: IND. vira Indústria.
      nivel_cliente: normalizarNivel(linha.nivel_cliente), // Ex.: a vira A.
      servicos_contratados: normalizarServicos(linha.servicos_contratados), // Ex.: "MPLS ; Firewall" vira "MPLS;Firewall".
      data_contratacao: normalizarData(linha.data_contratacao), // dd/mm/aaaa, '' se vazia ou null se inválida.
      cidade: capitalizar(linha.cidade),
      uf: normalizarUF(linha.uf), // Ex.: sp vira SP.
      email: normalizarEmail(linha.email), // Ex.: " Contato@Empresa.com.BR " vira contato@empresa.com.br.
      faturamento_anual: normalizarMoeda(linha.faturamento_anual) // Ex.: "R$ 1.850.000,00" vira 1850000.
    }

    function registrarProblema(campo, tipo, descricao) {
      problemas.push(descricao)
      ocorrencias.push({ linha: numeroLinha, codigo_cliente: tratada.codigo_cliente || '(sem código)', campo, tipo, descricao })
    }

    // 2. Confere as regras do dicionário de dados.
    for (const { campo, mensagem } of PREENCHIMENTO_OBRIGATORIO) {
      if (!tratada[campo]) registrarProblema(campo, 'Campo vazio', mensagem)
    }

    if (!tratada.segmento) {
      registrarProblema('segmento', 'Campo vazio', 'Segmento está vazio')
    } else if (!SEGMENTOS_VALIDOS.includes(tratada.segmento)) {
      registrarProblema('segmento', 'Fora do padrão', `Segmento "${tratada.segmento}" não está na lista (${SEGMENTOS_VALIDOS.join(', ')})`)
    }

    if (!tratada.nivel_cliente) {
      registrarProblema('nivel_cliente', 'Campo vazio', 'Nível está vazio')
    } else if (!NIVEIS_VALIDOS.includes(tratada.nivel_cliente)) {
      registrarProblema('nivel_cliente', 'Fora do padrão', 'Nível deve ser A, B ou C')
    }

    if (tratada.data_contratacao === '') {
      registrarProblema('data_contratacao', 'Campo vazio', 'Data de contratação está vazia')
    } else if (tratada.data_contratacao === null) {
      registrarProblema('data_contratacao', 'Valor inválido', 'Data de contratação deve estar no formato dd/mm/aaaa e existir no calendário') // Ex.: 31/02/2026.
    }

    // Cidade e UF são opcionais, mas a UF preenchida precisa ter 2 letras.
    if (tratada.uf && !/^[A-Z]{2}$/.test(tratada.uf)) {
      registrarProblema('uf', 'Fora do padrão', 'UF deve ter 2 letras (ex.: SP)')
    }

    // E-mail é opcional, mas o preenchido precisa ter formato de e-mail.
    if (tratada.email && !emailValido(tratada.email)) {
      registrarProblema('email', 'E-mail inválido', `E-mail "${tratada.email}" não tem formato válido (ex.: contato@empresa.com.br)`)
    }

    const faturamento = tratada.faturamento_anual
    if (faturamento === '' || faturamento === null || faturamento === undefined) {
      registrarProblema('faturamento_anual', 'Campo vazio', 'Faturamento anual está vazio')
    } else if (Number.isNaN(faturamento)) {
      registrarProblema('faturamento_anual', 'Valor inválido', 'Faturamento anual deve ser numérico')
    } else if (faturamento < 0) {
      registrarProblema('faturamento_anual', 'Valor inválido', 'Faturamento anual não pode ser negativo')
    }

    // Registro duplicado: o mesmo código já apareceu numa linha anterior (a primeira ocorrência continua valendo).
    if (tratada.codigo_cliente && primeiraLinhaDoCodigo.has(tratada.codigo_cliente)) {
      registrarProblema('codigo_cliente', 'Código repetido', `Código do cliente repetido (já aparece na linha ${primeiraLinhaDoCodigo.get(tratada.codigo_cliente)})`)
    } else if (tratada.codigo_cliente) {
      primeiraLinhaDoCodigo.set(tratada.codigo_cliente, numeroLinha)
    }

    // 3. Registra o que foi corrigido automaticamente (só quando o valor original existia e mudou).
    for (const campo of Object.keys(tratada)) {
      const antes = linha[campo]
      const depois = tratada[campo]
      const mudou = texto(antes) !== '' && depois !== null && !Number.isNaN(depois) && String(antes) !== String(depois)
      if (mudou) padronizacoes.push({ linha: numeroLinha, campo, antes: String(antes), depois: String(depois), motivo: motivoDoAjuste(campo, antes, String(depois)) })
    }

    // 4. Separa válidas e inválidas.
    if (problemas.length) {
      invalidos.push({ numeroLinha, codigo_cliente: tratada.codigo_cliente || '(sem código)', problemas })
    } else {
      validos.push({ ...linha, ...tratada, faturamento_anual: Number(faturamento) })
    }
  })

  return {
    validos,
    invalidos,
    ocorrencias,
    padronizacoes,
    erros: invalidos.map(item => `Linha ${item.numeroLinha}: ${item.problemas.join('; ')}`) // Mensagens prontas para a tela.
  }
}
