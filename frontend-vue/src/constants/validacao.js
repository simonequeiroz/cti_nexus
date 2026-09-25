// Informações da validação compartilhadas entre as telas e as regras de utils/validacao.js.

// Regras do dicionário de dados da aula (aba upload_clientes).
export const ABA_PRINCIPAL = 'upload_clientes'

// Limites do upload: o arquivo é processado no navegador, então arquivos enormes travariam a tela.
// Quando existir o back-end, configurar o mesmo limite no Spring (spring.servlet.multipart.max-file-size=5MB).
export const EXTENSOES_ACEITAS = ['.xlsx', '.xls', '.csv']
export const TAMANHO_MAXIMO_MB = 5
export const LINHAS_MAXIMAS = 20000

export const COLUNAS_OBRIGATORIAS = [
  'codigo_cliente', 'nome_cliente', 'consultor', 'segmento', 'nivel_cliente',
  'faturamento_anual', 'servicos_contratados', 'data_contratacao'
] // cidade e uf são opcionais.

export const SEGMENTOS_VALIDOS = ['Indústria', 'Comércio', 'Serviços', 'Saúde', 'Educação', 'Tecnologia']

export const NIVEIS_VALIDOS = ['A', 'B', 'C']

// Tipos de erro gerados por validarLinhas(), com as cores usadas em cada um.
export const TIPOS_DE_ERRO = [
  { nome: 'Campo vazio', ponto: 'bg-orange', etiqueta: 'bg-orange/15 text-orange-dark' },
  { nome: 'Registro duplicado', ponto: 'bg-pink', etiqueta: 'bg-pink/10 text-pink' },
  { nome: 'Fora do padrão', ponto: 'bg-blue-primary', etiqueta: 'bg-blue-primary/10 text-blue-primary' },
  { nome: 'Valor inválido', ponto: 'bg-red-500', etiqueta: 'bg-red-100 text-red-700' }
]

// Nome amigável de cada coluna da planilha, na mesma ordem do dicionário de dados da aula.
const NOMES_DOS_CAMPOS = {
  codigo_cliente: 'Código do cliente',
  nome_cliente: 'Nome do cliente',
  consultor: 'Consultor',
  segmento: 'Segmento',
  nivel_cliente: 'Nível',
  faturamento_anual: 'Faturamento anual',
  servicos_contratados: 'Serviços contratados',
  data_contratacao: 'Data de contratação',
  cidade: 'Cidade',
  uf: 'UF'
}

export const CAMPOS_DA_PLANILHA = Object.keys(NOMES_DOS_CAMPOS) // Ordem das colunas no dicionário de dados.

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
  'Arquivo recusado': 'bg-red-100 text-red-700',
  'Aguardando arquivo': 'bg-blue-secondary/50 text-regular'
}

export function corDoStatus(status) {
  return CORES_DO_STATUS[status] ?? 'bg-blue-primary/10 text-blue-primary'
}
