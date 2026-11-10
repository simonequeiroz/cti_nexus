import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import * as XLSX from 'xlsx'
import { lerPlanilha, verificarArquivo, ExcelInvalidoError, ColunaObrigatoriaError } from '../utils/leituraPlanilha'
import { validarLinhas } from '../utils/validacao'
import { texto, normalizarCodigo } from '../utils/normalizacao'
import { contarPor } from '../utils/estatistica'
import { mensagemDeErro } from '../utils/usuarioApi'
import { enviarClientesValidados, listarClientes, listarCargas, listarCodigosCadastrados } from '../services/uploadService' // Rotas /uploads e /clientes da API.
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
  const padronizacoes = ref([]) // Guarda os valores corrigidos automaticamente (antes, depois e motivo).
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
  const enviando = ref(false) // Esperando o back-end gravar a liberação (Java confere de novo e o Python grava no banco).
  const cargaGravada = ref(null) // Última carga gravada no banco, que é o que o painel mostra: { id, arquivoNome, totalLinhas, linhasInvalidas, ... }.
  const carregandoPainel = ref(false) // Buscando no banco os clientes da última carga (Dashboard aberto sem planilha nesta sessão).
  const codigoOriginal = ref(new Map()) // Linha -> código que ela tinha antes de ser corrigida à mão.
  const codigosDoBanco = shallowRef(new Map()) // Clientes já cadastrados: código -> nome.
  const codigosConsultados = ref(false) // A lista acima veio mesmo do servidor?

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

  const padronizacoesPorMotivo = computed(() => contarPor(padronizacoes.value, item => item.motivo)) // Ex.: Espaços extras: 2.

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
    codigoOriginal.value = new Map()
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
    const resultado = validarLinhas(dadosBrutos.value, { linhasComCodigoEditado: linhasComCodigoEditado(), codigosDoBanco: codigosDoBanco.value })
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
    if (campo === 'codigo_cliente' && !codigoOriginal.value.has(numeroLinha)) codigoOriginal.value.set(numeroLinha, anterior)
    linha[campo] = valor
    edicoesPendentes.value++
    registrarAlteracao(numeroLinha, linha.codigo_cliente, campo, anterior, valor)
  }

  function linhasComCodigoEditado() { // Linhas cujo código hoje é diferente do que veio na planilha.
    const editadas = new Set()
    for (const [numeroLinha, original] of codigoOriginal.value) {
      if (normalizarCodigo(dadosBrutos.value[numeroLinha - 2].codigo_cliente) !== normalizarCodigo(original)) editadas.add(numeroLinha)
    }
    return editadas
  }

  // Busca os códigos já cadastrados, para o código digitado à mão não repetir nenhum. Devolve false se o servidor não respondeu.
  async function carregarCodigosDoBanco() {
    try {
      const clientes = await listarCodigosCadastrados()
      codigosDoBanco.value = new Map(clientes.map(cliente => [cliente.codigo, cliente.nome]))
      codigosConsultados.value = true
      if (linhasComCodigoEditado().size) { // A lista pode ter mudado: confere de novo o que foi digitado.
        validarDados()
        atualizarHistorico()
      }
      return true
    } catch {
      codigosConsultados.value = false
      return false
    }
  }

  // Enquanto a pessoa digita: o código está livre? Devolve { livre, mensagem }, ou null se o campo estiver vazio.
  function situacaoDoCodigo(numeroLinha, valor) {
    const codigo = normalizarCodigo(valor)
    if (!codigo) return null

    const indice = dadosBrutos.value.findIndex((linha, i) => i !== numeroLinha - 2 && normalizarCodigo(linha.codigo_cliente) === codigo)
    if (indice >= 0) {
      const nome = texto(dadosBrutos.value[indice].nome_cliente)
      return { livre: false, mensagem: `Este código já está na linha ${indice + 2}${nome ? ` (${nome})` : ''}` }
    }
    if (codigosDoBanco.value.has(codigo)) {
      return { livre: false, mensagem: `Este código já está cadastrado para ${codigosDoBanco.value.get(codigo)}` }
    }
    return {
      livre: true,
      mensagem: codigosConsultados.value
        ? 'Código livre: não está em outra linha nem no cadastro'
        : 'Não está em outra linha. O cadastro será conferido ao liberar'
    }
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

  // "L" do ETL: manda os clientes aprovados para o back-end (POST /api/uploads/validadas).
  // O Java confere tudo de novo e pede ao Python para gravar no banco; só então o painel mostra os clientes.
  // Devolve { ok, mensagem, rejeitadas } para a tela mostrar o resultado.
  async function liberarParaPainel() {
    if (!quantidadeValidas.value || !useAutenticacaoStore().pode('aprovar_carga')) {
      return { ok: false, mensagem: 'Você não tem permissão para liberar clientes para o painel.', rejeitadas: [] }
    }

    enviando.value = true
    try {
      const resposta = await enviarClientesValidados(montarEnvio())
      // Recusados na conferência do servidor (normalmente nenhum: o front e o back-end usam as mesmas regras).
      const recusados = new Set(resposta.rejeitadas.map(item => item.codigo))
      dadosLiberados.value = dadosValidos.value.filter(cliente => !recusados.has(cliente.codigo_cliente))
      liberacao.value = { por: usuarioAtual(), em: new Date(), quantidade: dadosLiberados.value.length }
      cargaGravada.value = { id: resposta.loteId, arquivoNome: resposta.arquivoNome, totalLinhas: resposta.totalLinhas, linhasInvalidas: resposta.linhasInvalidas }
      mudouDesdeLiberacao.value = false
      const registro = historico.value.find(item => item.id === idHistoricoAtual.value)
      if (registro) registro.liberadoPor = liberacao.value.por

      // O código que acabou de ser gravado agora é desta linha: ao liberar de novo, ela não pode ser acusada de repetir a si mesma.
      const comErro = new Set(dadosInvalidos.value.map(item => item.numeroLinha))
      for (const numeroLinha of [...codigoOriginal.value.keys()]) {
        const codigo = normalizarCodigo(dadosBrutos.value[numeroLinha - 2].codigo_cliente)
        if (!comErro.has(numeroLinha) && !recusados.has(codigo)) codigoOriginal.value.delete(numeroLinha)
      }
      await carregarCodigosDoBanco()

      return { ok: true, mensagem: '', rejeitadas: resposta.rejeitadas }
    } catch (erro) {
      return { ok: false, mensagem: mensagemDeErro(erro), rejeitadas: [] } // Ex.: "O serviço de análise está desligado..."
    } finally {
      enviando.value = false
    }
  }

  // Formato do POST /api/uploads/validadas (UploadDtos.java): só as linhas aprovadas, com o número da linha no Excel.
  function montarEnvio() {
    const comErro = new Set(dadosInvalidos.value.map(item => item.numeroLinha))
    const editadas = linhasComCodigoEditado()
    const linhaDoCodigo = new Map() // Código -> linha aprovada com esse código.
    dadosBrutos.value.forEach((linha, indice) => {
      const codigo = normalizarCodigo(linha.codigo_cliente)
      if (codigo && !comErro.has(indice + 2)) linhaDoCodigo.set(codigo, indice + 2)
    })

    return {
      arquivoNome: nomeArquivo.value,
      descartadas: quantidadeInvalidas.value, // Linhas com erro que ficam de fora (entram na contagem da carga).
      enviadoPorId: enviadoPor.value?.id ?? null, // Quem conferiu a planilha. Quem liberou o servidor descobre pelo token.
      linhas: dadosValidos.value.map(cliente => ({
        numeroLinha: linhaDoCodigo.get(cliente.codigo_cliente) ?? null,
        codigoEditado: editadas.has(linhaDoCodigo.get(cliente.codigo_cliente)), // O servidor confere no banco se o código digitado é novo.
        codigoCliente: cliente.codigo_cliente,
        nomeCliente: cliente.nome_cliente,
        consultor: cliente.consultor,
        segmento: cliente.segmento,
        nivelCliente: cliente.nivel_cliente,
        faturamentoAnual: String(cliente.faturamento_anual),
        servicosContratados: cliente.servicos_contratados,
        dataContratacao: cliente.data_contratacao,
        cidade: cliente.cidade ?? '',
        uf: cliente.uf ?? '',
        email: cliente.email ?? ''
      })),
      alteracoes: alteracoes.value.map(alteracao => ({ // Log "quem alterou o quê", gravado junto com a carga.
        linha: alteracao.linha,
        codigo: alteracao.codigo,
        campo: alteracao.campo,
        valorAntigo: alteracao.valorAntigo,
        valorNovo: alteracao.valorNovo,
        usuarioId: alteracao.usuario?.id ?? null,
        em: new Date(alteracao.em).toISOString()
      }))
    }
  }

  // Dashboard aberto sem planilha nesta sessão (ex.: o gestor entrando no dia seguinte):
  // busca no banco a última carga liberada (GET /api/uploads e GET /api/clientes).
  async function carregarDoBanco() {
    if (dadosBrutos.value.length || liberada.value) return // Há planilha aberta nesta sessão: o painel segue a sessão.

    carregandoPainel.value = true
    try {
      const [cargas, clientes] = await Promise.all([listarCargas(), listarClientes()])
      const ultima = cargas[0]
      if (!ultima || !clientes.length) return // Nada gravado ainda.
      dadosLiberados.value = clientes
      liberacao.value = { por: ultima.aprovadoPor, em: new Date(ultima.criadoEm), quantidade: clientes.length }
      cargaGravada.value = ultima
    } catch {
      // Sem resposta do servidor: o painel mostra o aviso de "nenhum dado".
    } finally {
      carregandoPainel.value = false
    }
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
    duracaoMs, alteracoes, dadosLiberados, liberacao, mudouDesdeLiberacao, enviando, cargaGravada, carregandoPainel,
    codigoOriginal, codigosDoBanco, codigosConsultados,
    quantidadeLinhas, quantidadeValidas, quantidadeInvalidas,
    quantidadeClientes, percentualValido, faturamentoTotal, faturamentoMedio,
    errosPorTipo, errosPorCampo, padronizacoesPorCampo, padronizacoesPorMotivo, falhouLeitura, liberada, quantidadeLiberados,
    registrarArquivo, processarArquivo,
    limparUpload, limparHistorico, corrigirCampo, revalidar, liberarParaPainel, carregarDoBanco, baixarPlanilhaCorrigida,
    carregarCodigosDoBanco, situacaoDoCodigo
  }
})
