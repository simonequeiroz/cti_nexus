import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { lerPlanilha, verificarArquivo, ExcelInvalidoError, ColunaObrigatoriaError } from '../utils/leituraPlanilha'
import { validarLinhas } from '../utils/validacao'
import { texto } from '../utils/normalizacao'
import { contarPor } from '../utils/estatistica'
import { useAutenticacaoStore } from './autenticacaoStore'

export const useUploadStore = defineStore('upload', () => {
  // ===== STATE =====

  const arquivo = ref(null) // Guarda temporariamente o arquivo selecionado.
  const nomeArquivo = ref('') // Guarda o nome do arquivo.
  const dataUpload = ref(null) // Guarda a data e a hora em que a planilha foi conferida.
  const enviadoPor = ref(null) // Quem conferiu a planilha: { id, nome }. O id é o que vai para o banco (importacao.enviado_por).
  const tamanhoArquivo = ref(0) // Guarda o tamanho do arquivo em bytes.
  const dadosBrutos = ref([]) // Guarda as linhas lidas diretamente da planilha.
  const dadosValidos = ref([]) // Guarda as linhas que passaram na validação.
  const dadosInvalidos = ref([]) // Guarda as linhas que apresentaram problemas.
  const erros = ref([]) // Guarda mensagens de erro para mostrar ao usuário.
  const ocorrencias = ref([]) // Guarda cada erro separado: linha, campo, tipo e descrição.
  const padronizacoes = ref([]) // Guarda os valores corrigidos automaticamente (antes e depois).
  const statusValidacao = ref('Aguardando arquivo') // Guarda o estado atual da validação.
  const carregando = ref(false) // Informa se o sistema está processando alguma etapa.
  const historico = ref([]) // Guarda o resumo de cada processamento feito nesta sessão.
  const idHistoricoAtual = ref(null) // Registro do histórico da planilha aberta agora (atualizado ao revalidar).
  const edicoesPendentes = ref(0) // Conta as correções feitas na tela de validação que ainda não foram revalidadas.
  const duracaoMs = ref(0) // Quanto tempo a última conferência levou (leitura + validação).
  const alteracoes = ref([]) // Correções feitas à mão: quem, quando, linha, campo, valor antigo e novo (vira tabela no banco).
  const rodadaCorrecao = ref(0) // Muda a cada "Conferir de novo"; edições do mesmo campo na mesma rodada viram um registro só.
  const dadosLiberados = ref([]) // Cópia dos clientes aprovados no momento da liberação: é o que o painel mostra.
  const liberacao = ref(null) // Quem liberou e quando: { por: { id, nome }, em, quantidade }. No banco: importacao.aprovado_por/aprovado_em.
  const mudouDesdeLiberacao = ref(false) // Houve correções depois da liberação (o painel mostra a versão antiga).

  // ===== GETTERS =====

  const quantidadeLinhas = computed(() => dadosBrutos.value.length) // Conta quantas linhas foram recebidas.

  const quantidadeValidas = computed(() => dadosValidos.value.length) // Conta quantas linhas passaram na validação.

  const quantidadeInvalidas = computed(() => dadosInvalidos.value.length) // Conta quantas linhas apresentaram erro.

  const quantidadeClientes = computed(() => {
    const codigos = dadosBrutos.value
      .map(linha => texto(linha.codigo_cliente)) // Pega o código de cada cliente.
      .filter(Boolean) // Remove códigos vazios.
    return new Set(codigos).size // Elimina duplicados e conta os clientes únicos.
  })

  const percentualValido = computed(() => {
    if (quantidadeLinhas.value === 0) return 0 // Evita divisão por zero.
    return (
      (quantidadeValidas.value / quantidadeLinhas.value) * 100
    ).toFixed(1) // Calcula a porcentagem de linhas válidas.
  })

  const faturamentoTotal = computed(() =>
    dadosValidos.value.reduce((soma, linha) => soma + linha.faturamento_anual, 0) // Soma o faturamento das linhas válidas.
  )

  const faturamentoMedio = computed(() => {
    if (quantidadeValidas.value === 0) return 0 // Evita divisão por zero.
    return faturamentoTotal.value / quantidadeValidas.value // Média por cliente válido.
  })

  const errosPorTipo = computed(() => contarPor(ocorrencias.value, item => item.tipo)) // Ex.: Campo vazio: 3.

  const errosPorCampo = computed(() => contarPor(ocorrencias.value, item => item.campo)) // Ex.: uf: 2.

  const padronizacoesPorCampo = computed(() => contarPor(padronizacoes.value, item => item.campo)) // Ex.: segmento: 5.

  const liberada = computed(() => liberacao.value !== null) // Os clientes aprovados já podem aparecer no painel.

  const quantidadeLiberados = computed(() => dadosLiberados.value.length)

  // O arquivo foi recusado (formato/tamanho) ou não pôde ser lido (colunas faltando, aba vazia).
  const falhouLeitura = computed(() => ['Arquivo recusado', 'Erro na leitura'].includes(statusValidacao.value))

  // ===== ACTIONS =====

  function limparResultado() { // Apaga os dados da última leitura.
    dadosBrutos.value = []
    dadosValidos.value = []
    dadosInvalidos.value = []
    erros.value = []
    ocorrencias.value = []
    padronizacoes.value = []
    edicoesPendentes.value = 0
    duracaoMs.value = 0
    alteracoes.value = []
    rodadaCorrecao.value = 0
    dadosLiberados.value = [] // Planilha nova: nada liberado até alguém liberar de novo.
    liberacao.value = null
    mudouDesdeLiberacao.value = false
    idHistoricoAtual.value = null // O registro antigo do histórico deixa de ser a planilha aberta.
  }

  function usuarioAtual() { // { id, nome } de quem está logado, para a trilha de auditoria.
    const usuario = useAutenticacaoStore().usuario
    return usuario ? { id: usuario.id, nome: usuario.nome } : null
  }

  function registrarArquivo(novoArquivo) { // Guarda as informações do arquivo escolhido (ou recusa se o formato/tamanho não servir).
    limparResultado()
    nomeArquivo.value = novoArquivo.name
    tamanhoArquivo.value = novoArquivo.size
    dataUpload.value = null // Só ganha data (e autor) quando a planilha for conferida.
    enviadoPor.value = null

    const problema = verificarArquivo(novoArquivo)
    if (problema) {
      arquivo.value = null // Sem arquivo guardado, o botão Conferir planilha fica desabilitado.
      statusValidacao.value = 'Arquivo recusado'
      erros.value = [problema]
      return
    }

    arquivo.value = novoArquivo
    statusValidacao.value = 'Arquivo selecionado'
  }

  async function lerArquivo() { // Lê a aba upload_clientes (ou a primeira) e confere as colunas do dicionário.
    const { linhas } = await lerPlanilha(arquivo.value)
    dadosBrutos.value = linhas
  }

  function validarDados() { // Aplica as regras de utils/validacao.js e guarda o resultado.
    const resultado = validarLinhas(dadosBrutos.value)
    dadosValidos.value = resultado.validos
    dadosInvalidos.value = resultado.invalidos
    ocorrencias.value = resultado.ocorrencias
    padronizacoes.value = resultado.padronizacoes
    erros.value = resultado.erros

    statusValidacao.value =
      dadosInvalidos.value.length === 0
        ? 'Planilha aprovada'
        : 'Há linhas para corrigir' // Atualiza o status final da validação.
  }

  function resumoAtual() { // Números da planilha aberta, no formato do histórico.
    return {
      totalLinhas: quantidadeLinhas.value,
      validas: quantidadeValidas.value,
      invalidas: quantidadeInvalidas.value,
      percentualValido: percentualValido.value,
      status: statusValidacao.value
    }
  }

  function registrarHistorico() { // Guarda um resumo do processamento no topo do histórico.
    const registro = {
      id: Date.now(),
      nomeArquivo: nomeArquivo.value,
      tamanhoArquivo: tamanhoArquivo.value,
      dataProcessamento: dataUpload.value,
      enviadoPor: enviadoPor.value,
      duracaoMs: duracaoMs.value,
      liberadoPor: null, // Preenchido ao liberar para o painel.
      ...resumoAtual(),
      motivo: falhouLeitura.value ? erros.value[0] : '' // Por que a leitura falhou (os erros linha a linha ficam na Validação).
    }
    historico.value.unshift(registro)
    idHistoricoAtual.value = registro.id
  }

  function atualizarHistorico() { // Depois de revalidar, o registro da planilha aberta mostra os números novos.
    const registro = historico.value.find(item => item.id === idHistoricoAtual.value)
    if (registro) Object.assign(registro, resumoAtual())
  }

  async function processarArquivo() { // Executa a leitura e a validação, nessa ordem.
    if (!arquivo.value) return

    limparResultado() // Conferir de novo relê o arquivo original: correções, alterações e liberação anteriores deixam de valer.
    carregando.value = true
    statusValidacao.value = 'Conferindo'
    dataUpload.value = new Date()
    enviadoPor.value = usuarioAtual() // Trilha de auditoria: quem enviou e quando.
    const inicio = performance.now()

    try {
      await lerArquivo()
      validarDados()
      duracaoMs.value = performance.now() - inicio
      registrarHistorico()
    } catch (erro) {
      limparResultado()
      statusValidacao.value = 'Erro na leitura'
      const conhecido = erro instanceof ExcelInvalidoError || erro instanceof ColunaObrigatoriaError
      erros.value = [conhecido ? erro.message : 'Não foi possível ler o arquivo. Verifique se é uma planilha .xlsx, .xls ou .csv.']
      duracaoMs.value = performance.now() - inicio
      registrarHistorico()
      if (!conhecido) console.error(erro) // Erros previstos (coluna faltando, aba vazia) já aparecem na tela.
    } finally {
      carregando.value = false
    }
  }

  function limparUpload() { // Volta a tela para o estado inicial (o histórico é mantido).
    limparResultado()
    arquivo.value = null
    nomeArquivo.value = ''
    dataUpload.value = null
    enviadoPor.value = null
    tamanhoArquivo.value = 0
    statusValidacao.value = 'Aguardando arquivo'
  }

  function limparHistorico() { // Apaga todos os registros do histórico.
    historico.value = []
    idHistoricoAtual.value = null
  }

  function corrigirCampo(numeroLinha, campo, valor) { // Altera um valor da planilha lida (linha como aparece no Excel).
    const linha = dadosBrutos.value[numeroLinha - 2]
    const anterior = linha[campo]
    if (String(anterior ?? '') === String(valor)) return // Nada mudou.
    linha[campo] = valor
    edicoesPendentes.value++
    registrarAlteracao(numeroLinha, linha.codigo_cliente, campo, anterior, valor)
  }

  function registrarAlteracao(numeroLinha, codigo, campo, anterior, valor) { // Log "quem alterou o quê".
    const mesmaEdicao = alteracoes.value.find(a => a.rodada === rodadaCorrecao.value && a.linha === numeroLinha && a.campo === campo)
    if (!mesmaEdicao) {
      alteracoes.value.unshift({
        id: Date.now() + Math.random(),
        rodada: rodadaCorrecao.value,
        linha: numeroLinha,
        codigo: String(codigo ?? ''),
        campo,
        valorAntigo: String(anterior ?? ''),
        valorNovo: String(valor),
        usuario: usuarioAtual(),
        em: new Date()
      })
      return
    }
    // Mexeu de novo no mesmo campo antes de conferir: guarda só o valor final (e some se voltou ao original).
    Object.assign(mesmaEdicao, { valorNovo: String(valor), em: new Date() })
    if (mesmaEdicao.valorNovo === mesmaEdicao.valorAntigo) alteracoes.value = alteracoes.value.filter(a => a !== mesmaEdicao)
  }

  function revalidar() { // Valida de novo com as correções. Devolve quantas linhas deixaram de ter erro.
    const invalidasAntes = quantidadeInvalidas.value
    validarDados()
    atualizarHistorico()
    edicoesPendentes.value = 0
    rodadaCorrecao.value++
    if (liberada.value) mudouDesdeLiberacao.value = true // O painel continua com a versão liberada até liberar de novo.
    return invalidasAntes - quantidadeInvalidas.value
  }

  // "L" do ETL: só os clientes aprovados e liberados entram no painel. Com o back-end, esta ação grava no banco.
  function liberarParaPainel() {
    if (!quantidadeValidas.value || !useAutenticacaoStore().pode('aprovar_carga')) return false
    dadosLiberados.value = [...dadosValidos.value]
    liberacao.value = { por: usuarioAtual(), em: new Date(), quantidade: dadosLiberados.value.length }
    mudouDesdeLiberacao.value = false
    const registro = historico.value.find(item => item.id === idHistoricoAtual.value)
    if (registro) registro.liberadoPor = liberacao.value.por
    return true
  }

  function baixarPlanilhaCorrigida() { // Gera um .xlsx com as correções, na aba upload_clientes.
    const pasta = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(pasta, XLSX.utils.json_to_sheet(dadosBrutos.value), 'upload_clientes')
    XLSX.writeFile(pasta, `${nomeArquivo.value.replace(/\.[^.]+$/, '')}-corrigida.xlsx`)
  }

  return {
    arquivo, nomeArquivo, dataUpload, enviadoPor, tamanhoArquivo,
    dadosBrutos, dadosValidos, dadosInvalidos, erros, ocorrencias, padronizacoes,
    statusValidacao, carregando, historico, idHistoricoAtual, edicoesPendentes,
    duracaoMs, alteracoes, dadosLiberados, liberacao, mudouDesdeLiberacao,
    quantidadeLinhas, quantidadeValidas, quantidadeInvalidas,
    quantidadeClientes, percentualValido, faturamentoTotal, faturamentoMedio,
    errosPorTipo, errosPorCampo, padronizacoesPorCampo, falhouLeitura, liberada, quantidadeLiberados,
    registrarArquivo, processarArquivo,
    limparUpload, limparHistorico, corrigirCampo, revalidar, liberarParaPainel, baixarPlanilhaCorrigida
  }
})
