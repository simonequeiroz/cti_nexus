// Informações da validação compartilhadas entre as telas.

// Tipos de erro gerados pelo validarDados(), com as cores usadas em cada um.
export const TIPOS_DE_ERRO = [
  { nome: 'Campo vazio', ponto: 'bg-orange', etiqueta: 'bg-orange/15 text-orange-dark' },
  { nome: 'Registro duplicado', ponto: 'bg-pink', etiqueta: 'bg-pink/10 text-pink' },
  { nome: 'Fora do padrão', ponto: 'bg-blue-primary', etiqueta: 'bg-blue-primary/10 text-blue-primary' },
  { nome: 'Valor inválido', ponto: 'bg-red-500', etiqueta: 'bg-red-100 text-red-700' }
]

// Nome amigável de cada coluna da planilha.
const NOMES_DOS_CAMPOS = {
  codigo_cliente: 'Código do cliente',
  nome_cliente: 'Nome do cliente',
  consultor: 'Consultor',
  segmento: 'Segmento',
  nivel_cliente: 'Nível',
  servicos_contratados: 'Serviços contratados',
  data_contratacao: 'Data de contratação',
  cidade: 'Cidade',
  uf: 'UF',
  faturamento_anual: 'Faturamento anual'
}

export function nomeDoCampo(campo) {
  return NOMES_DOS_CAMPOS[campo] ?? campo
}

export function corDoTipo(tipo) {
  return TIPOS_DE_ERRO.find(item => item.nome === tipo)?.etiqueta ?? 'bg-blue-secondary/50 text-regular'
}

// Cor da etiqueta de cada status da validação.
const CORES_DO_STATUS = {
  'Arquivo válido': 'bg-green/15 text-green-dark',
  'Arquivo possui inconsistências': 'bg-orange/15 text-orange-dark',
  'Erro na leitura': 'bg-red-100 text-red-700',
  'Aguardando arquivo': 'bg-blue-secondary/50 text-regular'
}

export function corDoStatus(status) {
  return CORES_DO_STATUS[status] ?? 'bg-blue-primary/10 text-blue-primary'
}
