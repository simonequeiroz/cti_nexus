// Gera as duas planilhas oferecidas na tela de upload (em public/):
//   modelo-clientes.xlsx -> base para preencher: aba upload_clientes (2 linhas corretas) + aba dicionario.
//   teste-clientes.xlsx  -> planilha despadronizada de propósito, para demonstrar a validação.
// As colunas, segmentos, níveis e limites vêm de src/constants/validacao.js, então o modelo acompanha as regras.
// Rodar com: npm run planilhas
import * as XLSX from 'xlsx'
import { writeFileSync } from 'node:fs'
import {
  ABA_PRINCIPAL, CAMPOS_DA_PLANILHA, COLUNAS_OBRIGATORIAS, SEGMENTOS_VALIDOS, NIVEIS_VALIDOS,
  EXTENSOES_ACEITAS, TAMANHO_MAXIMO_MB, LINHAS_MAXIMAS, nomeDoCampo
} from '../src/constants/validacao.js'

const PASTA = new URL('../public/', import.meta.url)

// Descrição de cada coluna para a aba "dicionario" (tipo, exemplo e regra, como no material da aula).
const DICIONARIO = {
  codigo_cliente: ['texto', 'CTI001', 'Sem espaços nas pontas; maiúsculas; não pode repetir'],
  nome_cliente: ['texto', 'Metalúrgica Horizonte', 'Sem espaços extras; TUDO MAIÚSCULO ou minúsculo vira "Primeiras Maiúsculas"'],
  consultor: ['texto', 'Ana Souza', 'Nome padronizado (ANA SOUZA vira Ana Souza)'],
  segmento: ['categoria', 'Indústria', `Um destes: ${SEGMENTOS_VALIDOS.join(', ')} (IND., Industria e INDUSTRIA viram Indústria)`],
  nivel_cliente: ['categoria', 'A', `Somente ${NIVEIS_VALIDOS.join(', ')} (minúscula é corrigida)`],
  faturamento_anual: ['número', 'R$ 1.850.000,00', 'Número maior ou igual a zero; aceita "R$ 1.850.000,00" ou 1850000'],
  servicos_contratados: ['texto múltiplo', 'Internet Dedicada;Firewall', 'Vários serviços separados por ";"'],
  data_contratacao: ['data', '15/01/2025', 'Data válida no formato dd/mm/aaaa (ou célula de data do Excel)'],
  cidade: ['texto', 'Campinas', 'Opcional; capitalização corrigida'],
  uf: ['categoria', 'SP', 'Opcional; se preenchida, 2 letras (sp vira SP)']
}

const MODELO = [
  ['CTI001', 'Metalúrgica Horizonte', 'Ana Souza', 'Indústria', 'A', 1850000, 'Internet Dedicada;Firewall', '15/01/2025', 'Campinas', 'SP'],
  ['CTI002', 'Comercial Vitória', 'Carlos Lima', 'Comércio', 'B', 780000, 'Link Empresarial', '03/02/2025', 'Hortolândia', 'SP']
]

// Erros plantados: variações de segmento, maiúsculas/minúsculas, espaços extras, nível D, código repetido,
// campos vazios, faturamento em texto e negativo, data que não existe e serviço vazio.
const TESTE = [
  ['CTI001', 'Metalúrgica Paulista', 'Ana Souza', 'industria', 'a', 'R$ 250.000,00', 'Internet Dedicada;Firewall', '15/01/2025', 'Campinas', 'sp'],
  ['CTI002', 'Mercado Bom Preço', 'CARLOS LIMA', 'COMERCIO', 'B', 'R$ 98.000,00', 'Link Empresarial', '03/02/2025', 'Santos', 'SP'],
  ['CTI003', 'Clínica Vida', 'Ana Souza', 'saude', 'c', 120000, 'Internet Dedicada ; Backup', '18/02/2025', 'Sorocaba', 'sp'],
  ['CTI004', '  Transportes Rápido  ', 'Bruno Alves', 'servicos', 'B', 'R$ 175.500,00', 'MPLS', '05/03/2025', 'Jundiaí', 'SP'],
  ['cti005', 'PLÁSTICOS NORTE', 'Carlos Lima', 'ind.', 'A', 'R$ 410.000,00', 'MPLS;Firewall;Cloud', '14/03/2025', 'MANAUS', 'am'],
  ['CTI006', '', 'Bruno Alves', 'Comércio', 'B', 'R$ 64.000,00', 'Link Empresarial', '02/04/2025', 'Campinas', 'SP'],
  ['CTI007', 'Padaria Central', 'Ana Souza', 'comércio', 'D', 'R$ 38.000,00', 'Link Empresarial', '21/04/2025', 'Santos', 'SP'],
  ['CTI002', 'Mercado Bom Preço Filial', 'Carlos Lima', 'Comercio', 'B', 'R$ 52.000,00', 'Link Empresarial', '09/05/2025', 'Santos', 'SP'],
  ['CTI008', 'Hospital São Lucas', '', 'Saúde', 'A', 'R$ 890.000,00', 'Internet Dedicada;Firewall;Backup', '28/05/2025', 'Ribeirão Preto', 'SP'],
  ['CTI009', 'Auto Peças Silva', 'Bruno Alves', 'Comércio', 'C', 'cem mil', 'Internet Dedicada', '11/06/2025', 'Bauru', 'sp'],
  ['CTI010', 'Têxtil Aurora', 'Ana Souza', 'INDÚSTRIA', 'b', '-R$ 5.000,00', 'MPLS', '25/06/2025', 'Americana', ''],
  ['', 'Loja Sem Código', 'Carlos Lima', 'Comércio', 'C', 'R$ 21.000,00', 'Link Empresarial', '07/07/2025', 'Campinas', 'SP'],
  ['CTI011', 'Laboratório Alfa', 'Ana Souza', 'Saude', 'B', '', 'Internet Dedicada', '19/07/2025', 'Campinas', 'SP'],
  ['CTI012', 'Software Nova Geração', 'Bruno Alves', 'tecnologia', 'A', 'R$ 1.320.000,00', 'Cloud;Firewall', '31/02/2026', 'São Paulo', 'SP'],
  ['CTI013', 'Escola Saber Mais', 'Carla Mendes', 'educacao', 'B', 'R$ 890.000,00', '', '09/05/2026', 'Sumaré', 'SP']
]

function abaDeDados(linhas) {
  const aba = XLSX.utils.aoa_to_sheet([CAMPOS_DA_PLANILHA, ...linhas])
  aba['!cols'] = CAMPOS_DA_PLANILHA.map(campo => ({ wch: Math.max(campo.length, 14) + 4 })) // Largura das colunas.

  // Faturamento numérico aparece como moeda no Excel (o valor continua sendo número).
  const coluna = CAMPOS_DA_PLANILHA.indexOf('faturamento_anual')
  linhas.forEach((_, i) => {
    const celula = aba[XLSX.utils.encode_cell({ r: i + 1, c: coluna })]
    if (celula?.t === 'n') celula.z = '"R$" #,##0.00'
  })
  return aba
}

function abaDicionario() {
  const linhas = [
    ['Coluna', 'Descrição', 'Tipo', 'Obrigatório?', 'Exemplo', 'Regra aplicada pelo sistema'],
    ...CAMPOS_DA_PLANILHA.map(campo => {
      const [tipo, exemplo, regra] = DICIONARIO[campo]
      return [campo, nomeDoCampo(campo), tipo, COLUNAS_OBRIGATORIAS.includes(campo) ? 'Sim' : 'Não', exemplo, regra]
    }),
    [],
    ['Como usar'],
    [`Preencha a aba "${ABA_PRINCIPAL}" a partir da linha 2, sem mudar os nomes das colunas.`],
    [`Formatos aceitos: ${EXTENSOES_ACEITAS.join(', ')}. Limite: ${TAMANHO_MAXIMO_MB} MB e ${LINHAS_MAXIMAS.toLocaleString('pt-BR')} linhas.`],
    ['Use apenas dados fictícios ou autorizados.']
  ]
  const aba = XLSX.utils.aoa_to_sheet(linhas)
  aba['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 13 }, { wch: 28 }, { wch: 90 }]
  return aba
}

function salvar(nome, abas) {
  const pasta = XLSX.utils.book_new()
  for (const [nomeAba, aba] of abas) XLSX.utils.book_append_sheet(pasta, aba, nomeAba)
  writeFileSync(new URL(nome, PASTA), XLSX.write(pasta, { type: 'buffer', bookType: 'xlsx', compression: true }))
  console.log(`public/${nome} gerado`)
}

salvar('modelo-clientes.xlsx', [[ABA_PRINCIPAL, abaDeDados(MODELO)], ['dicionario', abaDicionario()]])
salvar('teste-clientes.xlsx', [[ABA_PRINCIPAL, abaDeDados(TESTE)]])
