// Funções auxiliares usadas pela validação da planilha.

export function texto(valor) { // Cria uma função auxiliar para tratar textos.
  return String(valor ?? '').trim().replace(/\s+/g, ' ') // Converte em texto e remove espaços extras (nas pontas e repetidos no meio).
}

export function normalizarUF(valor) { // Cria uma função para padronizar a UF.
  return texto(valor).toUpperCase() // Ex.: sp vira SP.
}

export function normalizarNivel(valor) { // Cria uma função para padronizar o nível.
  return texto(valor).toUpperCase() // Ex.: a vira A.
}

export function normalizarSegmento(valor) { // Cria uma função para padronizar o segmento.
  const original = texto(valor).toLowerCase() // Converte para minúsculo para facilitar a comparação.

  if (['ind.', 'industria', 'indústria'].includes(original)) {
    return 'Indústria' // Todas essas variações passam a ser Indústria.
  }
  if (['comercio', 'comércio'].includes(original)) {
    return 'Comércio' // Padroniza para Comércio.
  }
  if (['servicos', 'serviços'].includes(original)) {
    return 'Serviços' // Padroniza para Serviços.
  }
  if (['saude', 'saúde'].includes(original)) {
    return 'Saúde' // Padroniza para Saúde.
  }
  if (['tecnologia', 'tec.'].includes(original)) {
    return 'Tecnologia' // Padroniza para Tecnologia.
  }
  if (['educacao', 'educação'].includes(original)) {
    return 'Educação' // Padroniza para Educação.
  }

  return texto(valor) // Se não houver regra, mantém o valor tratado.
}

export function normalizarCodigo(valor) { // Ex.: Cti004 vira CTI004.
  return texto(valor).toUpperCase()
}

const PALAVRAS_MINUSCULAS = ['da', 'das', 'de', 'do', 'dos', 'e']

function primeirasMaiusculas(valor) { // Ex.: "clínica de saúde" vira "Clínica de Saúde".
  return valor
    .toLowerCase()
    .split(' ')
    .map((palavra, indice) =>
      indice > 0 && PALAVRAS_MINUSCULAS.includes(palavra)
        ? palavra // "de", "da"... ficam minúsculas no meio do nome.
        : palavra.charAt(0).toUpperCase() + palavra.slice(1)
    )
    .join(' ')
}

export function normalizarNomePessoa(valor) { // Ex.: ANA SOUZA vira Ana Souza.
  return primeirasMaiusculas(texto(valor))
}

// Nome de empresa ou cidade: só corrige o que está TODO em maiúsculas ou todo em minúsculas.
// Assim "METALÚRGICA ALFA" vira "Metalúrgica Alfa", mas "Tech CTI Brasil" (já escrito certo) não perde a sigla.
export function capitalizar(valor) {
  const limpo = texto(valor)
  const tudoIgual = limpo === limpo.toUpperCase() || limpo === limpo.toLowerCase()
  return tudoIgual ? primeirasMaiusculas(limpo) : limpo
}

export function normalizarMoeda(valor) { // Ex.: "R$ 1.850.000,00" vira 1850000.
  if (typeof valor === 'number') return valor // Célula numérica do Excel já vem pronta.

  let numero = texto(valor).replace(/R\$/i, '').replace(/\s/g, '') // Remove o R$ e os espaços.
  if (numero === '') return '' // Vazio continua vazio para a validação de campo obrigatório.

  if (numero.includes(',')) {
    numero = numero.replace(/\./g, '').replace(',', '.') // Formato brasileiro: 1.850.000,00
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(numero)) {
    numero = numero.replace(/\./g, '') // Só separador de milhar: 1.850.000
  }

  return Number(numero) // Texto que não é número vira NaN e é apontado na validação.
}

export function normalizarServicos(valor) { // Ex.: "MPLS ; Firewall" vira "MPLS;Firewall".
  return texto(valor)
    .split(';')
    .map(servico => servico.trim())
    .filter(Boolean)
    .join(';')
}

export function normalizarData(valor) { // Aceita dd/mm/aaaa ou data do Excel. Devolve dd/mm/aaaa ou null se for inválida.
  if (valor === null || valor === undefined || texto(valor) === '') return ''

  let dia, mes, ano

  if (typeof valor === 'number') { // O Excel guarda datas como número de dias desde 1900.
    const data = new Date(Math.round((valor - 25569) * 86400 * 1000))
    dia = data.getUTCDate()
    mes = data.getUTCMonth() + 1
    ano = data.getUTCFullYear()
  } else {
    const partes = texto(valor).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!partes) return null
    dia = Number(partes[1])
    mes = Number(partes[2])
    ano = Number(partes[3])
  }

  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const existe = data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia // Recusa 31/02, por exemplo.
  if (!existe) return null

  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
}

export function normalizarCabecalho(valor) { // Ex.: "Código Cliente" vira codigo_cliente.
  return texto(valor)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // Remove acentos.
    .replace(/\s+/g, '_') // Troca espaços por _.
}
