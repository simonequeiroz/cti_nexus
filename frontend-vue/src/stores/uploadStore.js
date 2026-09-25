import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import {
  texto,
  normalizarUF,
  normalizarNivel,
  normalizarSegmento,
  normalizarCabecalho,
  normalizarCodigo,
  normalizarNomePessoa,
  normalizarMoeda,
  normalizarServicos,
  normalizarData
} from '../utils/normalizacao'

export const useUploadStore = defineStore('upload', () => {
  // ===== STATE =====

  const arquivo = ref(null) // Guarda temporariamente o arquivo selecionado.
  const nomeArquivo = ref('') // Guarda o nome do arquivo.
  const dataUpload = ref(null) // Guarda a data e a hora do upload.
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
  }

  function registrarArquivo(novoArquivo) { // Guarda as informações do arquivo escolhido.
    limparResultado()
    arquivo.value = novoArquivo
    nomeArquivo.value = novoArquivo.name
    tamanhoArquivo.value = novoArquivo.size
    dataUpload.value = new Date()
    statusValidacao.value = 'Arquivo selecionado'
  }

  async function lerPlanilha() { // Lê a primeira aba e transforma cada linha em um objeto JavaScript.
    const conteudo = await arquivo.value.arrayBuffer()
    const planilha = XLSX.read(conteudo, { raw: true }) // raw: no CSV, não deixa 03/02/2025 virar data americana (2 de março).
    const aba = planilha.Sheets[planilha.SheetNames[0]]
    const linhas = XLSX.utils.sheet_to_json(aba, { defval: '' }) // defval mantém as células vazias.

    dadosBrutos.value = linhas.map(linha => {
      const linhaNormalizada = {}
      for (const coluna in linha) {
        linhaNormalizada[normalizarCabecalho(coluna)] = linha[coluna]
      }
      return linhaNormalizada
    })
    statusValidacao.value = 'Dados lidos'
  }

  function validarDados() { // Inicia a validação de todas as linhas.
    dadosValidos.value = [] // Limpa os dados válidos anteriores.
    dadosInvalidos.value = [] // Limpa os dados inválidos anteriores.
    erros.value = [] // Limpa as mensagens de erro anteriores.
    ocorrencias.value = [] // Limpa o detalhamento dos erros anteriores.
    padronizacoes.value = [] // Limpa as padronizações anteriores.

    const codigosEncontrados = new Set() // Guarda os códigos já encontrados.

    dadosBrutos.value.forEach((linha, indice) => { // Percorre cada linha da planilha.
      const problemas = [] // Cria uma lista de problemas para a linha atual.
      const numeroLinha = indice + 2 // Soma 2 porque o Excel tem cabeçalho.

      const codigo = normalizarCodigo(linha.codigo_cliente) // Lê o código em maiúsculo. Ex.: Cti004 vira CTI004.
      const nome = texto(linha.nome_cliente) // Lê e limpa o nome.
      const consultor = normalizarNomePessoa(linha.consultor) // Ex.: ANA SOUZA vira Ana Souza.
      const segmento = normalizarSegmento(linha.segmento) // Padroniza o segmento.
      const nivel = normalizarNivel(linha.nivel_cliente) // Padroniza o nível.
      const servicos = normalizarServicos(linha.servicos_contratados) // Limpa a lista de serviços.
      const dataContratacao = normalizarData(linha.data_contratacao) // dd/mm/aaaa, '' se vazia ou null se inválida.
      const cidade = texto(linha.cidade) // Lê e limpa a cidade.
      const uf = normalizarUF(linha.uf) // Padroniza a UF.
      const faturamento = normalizarMoeda(linha.faturamento_anual) // Ex.: "R$ 1.850.000,00" vira 1850000.

      function registrarProblema(campo, tipo, descricao) { // Guarda o problema com linha, campo e tipo.
        problemas.push(descricao)
        ocorrencias.value.push({ linha: numeroLinha, codigo_cliente: codigo || '(sem código)', campo, tipo, descricao })
      }

      function registrarPadronizacao(campo, antes, depois) { // Guarda o que foi corrigido automaticamente.
        if (texto(antes) !== '' && String(antes) !== depois) {
          padronizacoes.value.push({ linha: numeroLinha, campo, antes: String(antes), depois })
        }
      }

      if (!codigo) {
        registrarProblema('codigo_cliente', 'Campo vazio', 'Código do cliente está vazio') // Valida campo obrigatório.
      }
      if (!nome) {
        registrarProblema('nome_cliente', 'Campo vazio', 'Nome do cliente está vazio') // Valida campo obrigatório.
      }
      if (!consultor) {
        registrarProblema('consultor', 'Campo vazio', 'Consultor está vazio') // Valida campo obrigatório.
      }
      if (!segmento) {
        registrarProblema('segmento', 'Campo vazio', 'Segmento está vazio') // Valida campo obrigatório.
      }
      if (!servicos) {
        registrarProblema('servicos_contratados', 'Campo vazio', 'Serviços contratados está vazio') // Valida campo obrigatório.
      }
      if (!cidade) {
        registrarProblema('cidade', 'Campo vazio', 'Cidade está vazia') // Valida campo obrigatório.
      }
      if (!uf) {
        registrarProblema('uf', 'Campo vazio', 'UF está vazia') // Valida campo obrigatório.
      }
      if (dataContratacao === '') {
        registrarProblema('data_contratacao', 'Campo vazio', 'Data de contratação está vazia') // Valida campo obrigatório.
      } else if (dataContratacao === null) {
        registrarProblema('data_contratacao', 'Valor inválido', 'Data de contratação deve estar no formato dd/mm/aaaa e existir no calendário') // Ex.: 31/02/2026.
      }
      if (!['A', 'B', 'C'].includes(nivel)) {
        registrarProblema('nivel_cliente', 'Fora do padrão', 'Nível deve ser A, B ou C') // Valida os valores permitidos.
      }

      if (
        faturamento === null ||
        faturamento === undefined ||
        faturamento === ''
      ) {
        registrarProblema('faturamento_anual', 'Campo vazio', 'Faturamento anual está vazio') // Verifica ausência de valor.
      } else if (Number.isNaN(Number(faturamento))) {
        registrarProblema('faturamento_anual', 'Valor inválido', 'Faturamento anual deve ser numérico') // Verifica se é número.
      } else if (Number(faturamento) < 0) {
        registrarProblema('faturamento_anual', 'Valor inválido', 'Faturamento anual não pode ser negativo') // Verifica valor negativo.
      }

      if (codigo && codigosEncontrados.has(codigo)) {
        registrarProblema('codigo_cliente', 'Registro duplicado', 'Código do cliente duplicado') // Verifica código repetido.
      }
      if (codigo) {
        codigosEncontrados.add(codigo) // Guarda o código para comparar com as próximas linhas.
      }

      registrarPadronizacao('nome_cliente', linha.nome_cliente, nome) // Ex.: espaços extras removidos.
      registrarPadronizacao('consultor', linha.consultor, consultor)
      registrarPadronizacao('segmento', linha.segmento, segmento) // Ex.: industria vira Indústria.
      registrarPadronizacao('nivel_cliente', linha.nivel_cliente, nivel) // Ex.: a vira A.
      registrarPadronizacao('codigo_cliente', linha.codigo_cliente, codigo) // Ex.: Cti004 vira CTI004.
      registrarPadronizacao('servicos_contratados', linha.servicos_contratados, servicos)
      registrarPadronizacao('cidade', linha.cidade, cidade)
      registrarPadronizacao('uf', linha.uf, uf) // Ex.: sp vira SP.
      if (dataContratacao) {
        registrarPadronizacao('data_contratacao', linha.data_contratacao, dataContratacao) // Ex.: 5/3/2025 vira 05/03/2025.
      }
      if (typeof linha.faturamento_anual === 'string' && !Number.isNaN(faturamento)) {
        registrarPadronizacao('faturamento_anual', linha.faturamento_anual, String(faturamento)) // Ex.: R$ 1.850.000,00 vira 1850000.
      }

      const linhaPadronizada = {
        ...linha, // Copia os campos originais.
        codigo_cliente: codigo, // Usa o código tratado.
        nome_cliente: nome, // Usa o nome tratado.
        consultor: consultor, // Usa o consultor tratado.
        segmento: segmento, // Usa o segmento padronizado.
        nivel_cliente: nivel, // Usa o nível padronizado.
        servicos_contratados: servicos, // Usa a lista de serviços tratada.
        data_contratacao: dataContratacao, // Usa a data padronizada.
        cidade: cidade, // Usa a cidade tratada.
        uf: uf, // Usa a UF padronizada.
        faturamento_anual:
          faturamento === '' ? null : Number(faturamento) // Converte o faturamento para número.
      }

      if (problemas.length === 0) {
        dadosValidos.value.push(linhaPadronizada) // Coloca a linha na lista de válidos.
      } else {
        dadosInvalidos.value.push({
          numeroLinha: numeroLinha, // Linha como aparece no Excel.
          codigo_cliente: codigo || '(sem código)', // Identifica a linha.
          problemas: problemas // Guarda todos os problemas encontrados.
        })

        erros.value.push(
          `Linha ${numeroLinha}: ${problemas.join('; ')}`
        ) // Cria uma mensagem pronta para mostrar ao usuário.
      }
    })

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
      await lerPlanilha()
      validarDados()
      registrarHistorico(statusValidacao.value)
    } catch (erro) {
      limparResultado()
      statusValidacao.value = 'Erro na leitura'
      erros.value = ['Não foi possível ler o arquivo. Verifique se é uma planilha .xlsx, .xls ou .csv.']
      registrarHistorico('Erro na leitura')
      console.error(erro)
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
    statusValidacao.value = 'Aguardando arquivo'
  }

  function limparHistorico() { // Apaga todos os registros do histórico.
    historico.value = []
  }

  return {
    arquivo, nomeArquivo, dataUpload, tamanhoArquivo,
    dadosBrutos, dadosValidos, dadosInvalidos, erros, ocorrencias, padronizacoes,
    statusValidacao, carregando, historico,
    quantidadeLinhas, quantidadeValidas, quantidadeInvalidas,
    quantidadeClientes, percentualValido, faturamentoTotal, faturamentoMedio,
    errosPorTipo, errosPorCampo, padronizacoesPorCampo,
    registrarArquivo, lerPlanilha, validarDados, processarArquivo,
    limparUpload, limparHistorico
  }
})
