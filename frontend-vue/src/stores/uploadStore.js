import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { lerPlanilha, verificarArquivo, ExcelInvalidoError, ColunaObrigatoriaError } from '../utils/leituraPlanilha'
import { validarLinhas } from '../utils/validacao'
import { texto } from '../utils/normalizacao'

export const useUploadStore = defineStore('upload', () => {
  // ===== STATE =====

  const arquivo = ref(null) // Guarda temporariamente o arquivo selecionado.
  const nomeArquivo = ref('') // Guarda o nome do arquivo.
  const dataUpload = ref(null) // Guarda a data e a hora do upload.
  const tamanhoArquivo = ref(0) // Guarda o tamanho do arquivo em bytes.
  const abaLida = ref('') // Nome da aba usada (upload_clientes ou a primeira).
  const dadosBrutos = ref([]) // Guarda as linhas lidas diretamente da planilha.
  const dadosValidos = ref([]) // Guarda as linhas que passaram na validação.
  const dadosInvalidos = ref([]) // Guarda as linhas que apresentaram problemas.
  const erros = ref([]) // Guarda mensagens de erro para mostrar ao usuário.
  const ocorrencias = ref([]) // Guarda cada erro separado: linha, campo, tipo e descrição.
  const padronizacoes = ref([]) // Guarda os valores corrigidos automaticamente (antes e depois).
  const statusValidacao = ref('Aguardando arquivo') // Guarda o estado atual da validação.
  const carregando = ref(false) // Informa se o sistema está processando alguma etapa.
  const historico = ref([]) // Guarda o resumo de cada processamento feito nesta sessão.
  const edicoesPendentes = ref(0) // Conta as correções feitas na tela de validação que ainda não foram revalidadas.

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

  function contarPor(lista, chave) { // Agrupa uma lista e conta quantos itens há em cada grupo.
    const contagem = {}
    for (const item of lista) {
      contagem[item[chave]] = (contagem[item[chave]] || 0) + 1
    }
    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade) // Do mais frequente para o menos frequente.
  }

  const errosPorTipo = computed(() => contarPor(ocorrencias.value, 'tipo')) // Ex.: Campo vazio: 3.

  const errosPorCampo = computed(() => contarPor(ocorrencias.value, 'campo')) // Ex.: uf: 2.

  const padronizacoesPorCampo = computed(() => contarPor(padronizacoes.value, 'campo')) // Ex.: segmento: 5.

  // ===== ACTIONS =====

  function limparResultado() { // Apaga os dados da última leitura.
    dadosBrutos.value = []
    dadosValidos.value = []
    dadosInvalidos.value = []
    erros.value = []
    ocorrencias.value = []
    padronizacoes.value = []
    edicoesPendentes.value = 0
  }

  function registrarArquivo(novoArquivo) { // Guarda as informações do arquivo escolhido (ou recusa se o formato/tamanho não servir).
    limparResultado()
    nomeArquivo.value = novoArquivo.name
    tamanhoArquivo.value = novoArquivo.size
    dataUpload.value = new Date()

    const problema = verificarArquivo(novoArquivo)
    if (problema) {
      arquivo.value = null // Sem arquivo guardado, o botão Processar fica desabilitado.
      statusValidacao.value = 'Arquivo recusado'
      erros.value = [problema]
      return
    }

    arquivo.value = novoArquivo
    statusValidacao.value = 'Arquivo selecionado'
  }

  async function lerArquivo() { // Lê a aba upload_clientes (ou a primeira) e confere as colunas do dicionário.
    const { linhas, nomeAba } = await lerPlanilha(arquivo.value)
    dadosBrutos.value = linhas
    abaLida.value = nomeAba
    statusValidacao.value = 'Dados lidos'
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
        ? 'Arquivo válido'
        : 'Arquivo possui inconsistências' // Atualiza o status final da validação.
  }

  function registrarHistorico(status) { // Guarda um resumo do processamento no topo do histórico.
    historico.value.unshift({
      id: Date.now(),
      nomeArquivo: nomeArquivo.value,
      tamanhoArquivo: tamanhoArquivo.value,
      dataProcessamento: new Date(),
      totalLinhas: quantidadeLinhas.value,
      validas: quantidadeValidas.value,
      invalidas: quantidadeInvalidas.value,
      percentualValido: percentualValido.value,
      status: status,
      erros: [...erros.value]
    })
  }

  async function processarArquivo() { // Executa a leitura e a validação, nessa ordem.
    if (!arquivo.value) return

    carregando.value = true
    statusValidacao.value = 'Processando'

    try {
      await lerArquivo()
      validarDados()
      registrarHistorico(statusValidacao.value)
    } catch (erro) {
      limparResultado()
      statusValidacao.value = 'Erro na leitura'
      const conhecido = erro instanceof ExcelInvalidoError || erro instanceof ColunaObrigatoriaError
      erros.value = [conhecido ? erro.message : 'Não foi possível ler o arquivo. Verifique se é uma planilha .xlsx, .xls ou .csv.']
      registrarHistorico('Erro na leitura')
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
    tamanhoArquivo.value = 0
    abaLida.value = ''
    statusValidacao.value = 'Aguardando arquivo'
  }

  function limparHistorico() { // Apaga todos os registros do histórico.
    historico.value = []
  }

  function corrigirCampo(numeroLinha, campo, valor) { // Altera um valor da planilha lida (linha como aparece no Excel).
    dadosBrutos.value[numeroLinha - 2][campo] = valor
    edicoesPendentes.value++
  }

  function revalidar() { // Valida de novo com as correções. Devolve quantas linhas deixaram de ter erro.
    const invalidasAntes = quantidadeInvalidas.value
    validarDados()
    edicoesPendentes.value = 0
    return invalidasAntes - quantidadeInvalidas.value
  }

  function baixarPlanilhaCorrigida() { // Gera um .xlsx com as correções, na aba upload_clientes.
    const pasta = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(pasta, XLSX.utils.json_to_sheet(dadosBrutos.value), 'upload_clientes')
    XLSX.writeFile(pasta, `${nomeArquivo.value.replace(/\.[^.]+$/, '')}-corrigida.xlsx`)
  }

  return {
    arquivo, nomeArquivo, dataUpload, tamanhoArquivo, abaLida,
    dadosBrutos, dadosValidos, dadosInvalidos, erros, ocorrencias, padronizacoes,
    statusValidacao, carregando, historico, edicoesPendentes,
    quantidadeLinhas, quantidadeValidas, quantidadeInvalidas,
    quantidadeClientes, percentualValido, faturamentoTotal, faturamentoMedio,
    errosPorTipo, errosPorCampo, padronizacoesPorCampo,
    registrarArquivo, lerArquivo, validarDados, processarArquivo,
    limparUpload, limparHistorico, corrigirCampo, revalidar, baixarPlanilhaCorrigida
  }
})
