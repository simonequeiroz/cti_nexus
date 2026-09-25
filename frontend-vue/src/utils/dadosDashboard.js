// Prepara os clientes válidos para os gráficos e gera os insights (no formato da classe Insight).
import { media, soma, quartil, desvioPadrao, contarPor, agruparPor } from './estatistica'
import { formatarMoeda } from './formatadores'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function listaDeServicos(cliente) { // "Internet Dedicada;Firewall" vira ['Internet Dedicada', 'Firewall'].
  return cliente.servicos_contratados ? cliente.servicos_contratados.split(';') : []
}

export function contratacoesPorMes(clientes) { // Conta contratações por mês, incluindo os meses sem nenhuma (valor 0).
  const porMes = {}
  for (const cliente of clientes) {
    const [, mes, ano] = cliente.data_contratacao.split('/')
    const chave = `${ano}-${mes}`
    porMes[chave] = (porMes[chave] ?? 0) + 1
  }

  const chaves = Object.keys(porMes).sort()
  if (!chaves.length) return []

  const resultado = []
  let [ano, mes] = chaves[0].split('-').map(Number)
  const [anoFinal, mesFinal] = chaves.at(-1).split('-').map(Number)

  while (ano < anoFinal || (ano === anoFinal && mes <= mesFinal)) {
    const chave = `${ano}-${String(mes).padStart(2, '0')}`
    resultado.push({ rotulo: `${MESES[mes - 1]}/${String(ano).slice(2)}`, quantidade: porMes[chave] ?? 0 })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return resultado
}

export function histograma(valores) { // Divide o faturamento em faixas de mesmo tamanho (regra de Sturges).
  if (!valores.length) return []
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const quantidadeFaixas = Math.max(1, Math.ceil(Math.log2(valores.length) + 1))
  const largura = (maximo - minimo) / quantidadeFaixas || 1

  const faixas = Array.from({ length: quantidadeFaixas }, (_, i) => ({
    inicio: minimo + i * largura,
    fim: minimo + (i + 1) * largura,
    quantidade: 0
  }))
  for (const valor of valores) {
    const indice = Math.min(Math.floor((valor - minimo) / largura), quantidadeFaixas - 1)
    faixas[indice].quantidade++
  }
  const emMilhoes = valor => (valor / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return faixas.map(faixa => ({
    rotulo: `${emMilhoes(faixa.inicio)}–${emMilhoes(faixa.fim)}`, // Curto para caber no eixo. Ex.: "0,9–1,6" (em R$ milhões).
    quantidade: faixa.quantidade
  }))
}

function percentual(parte, total) {
  return total ? Math.round((parte / total) * 100) : 0
}

// Insights em texto simples para o dashboard. Cada um segue a classe Insight: título, descrição, tipo e prioridade.
export function gerarInsights(clientes) {
  const total = clientes.length
  if (!total) return []

  const insights = []
  const faturamentos = clientes.map(c => c.faturamento_anual)
  const faturamentoTotal = soma(faturamentos)
  const mediaGeral = media(faturamentos)

  // 1. Segmento com mais clientes.
  const [segmentoLider] = contarPor(clientes, c => c.segmento)
  const fatiaSegmento = percentual(segmentoLider.quantidade, total)
  insights.push({
    titulo: `${segmentoLider.nome} lidera a carteira`,
    descricao: `${segmentoLider.nome} concentra ${fatiaSegmento}% dos clientes (${segmentoLider.quantidade} de ${total}).`,
    tipo: 'Segmento',
    prioridade: fatiaSegmento >= 30 ? 'Alta' : 'Média'
  })

  // 2. Segmento com maior faturamento médio.
  const porSegmento = Object.entries(agruparPor(clientes, c => c.segmento))
    .map(([nome, grupo]) => ({ nome, media: media(grupo.map(c => c.faturamento_anual)), grupo }))
    .sort((a, b) => b.media - a.media)
  const maisRentavel = porSegmento[0]
  const acimaDaMedia = mediaGeral ? Math.round(((maisRentavel.media - mediaGeral) / mediaGeral) * 100) : 0
  if (porSegmento.length > 1 && acimaDaMedia > 0) {
    insights.push({
      titulo: `${maisRentavel.nome} tem o maior faturamento médio`,
      descricao: `Média de ${formatarMoeda(maisRentavel.media, true)} por cliente, ${acimaDaMedia}% acima da média geral (${formatarMoeda(mediaGeral, true)}).`,
      tipo: 'Faturamento',
      prioridade: acimaDaMedia >= 30 ? 'Alta' : 'Média'
    })
  }

  // 3. Nível A: participação na carteira x participação no faturamento.
  const clientesA = clientes.filter(c => c.nivel_cliente === 'A')
  if (clientesA.length) {
    const fatiaClientesA = percentual(clientesA.length, total)
    const fatiaFaturamentoA = percentual(soma(clientesA.map(c => c.faturamento_anual)), faturamentoTotal)
    insights.push({
      titulo: 'Peso dos clientes nível A',
      descricao: `Clientes A são ${fatiaClientesA}% da carteira e respondem por ${fatiaFaturamentoA}% do faturamento.`,
      tipo: 'Nível',
      prioridade: fatiaFaturamentoA - fatiaClientesA >= 20 ? 'Alta' : 'Média'
    })
  }

  // 4. Serviço mais contratado.
  const [servicoLider] = contarPor(clientes.flatMap(listaDeServicos), s => s)
  if (servicoLider) {
    insights.push({
      titulo: `${servicoLider.nome} é o serviço mais contratado`,
      descricao: `Aparece em ${servicoLider.quantidade} de ${total} clientes (${percentual(servicoLider.quantidade, total)}%).`,
      tipo: 'Serviço',
      prioridade: 'Média'
    })
  }

  // 5. Oportunidade de venda cruzada: clientes com um único serviço.
  const comUmServico = clientes.filter(c => listaDeServicos(c).length === 1).length
  if (comUmServico) {
    insights.push({
      titulo: 'Oportunidade de venda cruzada',
      descricao: `${comUmServico} clientes (${percentual(comUmServico, total)}%) contratam apenas um serviço.`,
      tipo: 'Serviço',
      prioridade: percentual(comUmServico, total) >= 40 ? 'Alta' : 'Média'
    })
  }

  // 6. Concentração: quanto do faturamento está nos 25% maiores clientes (acima do Q3).
  const q3 = quartil(faturamentos, 0.75)
  const maiores = faturamentos.filter(valor => valor >= q3)
  if (total >= 4) {
    insights.push({
      titulo: 'Concentração do faturamento',
      descricao: `Os ${maiores.length} maiores clientes (acima de ${formatarMoeda(q3, true)}) somam ${percentual(soma(maiores), faturamentoTotal)}% do faturamento.`,
      tipo: 'Faturamento',
      prioridade: 'Média'
    })
  }

  // 7. Segmento mais heterogêneo (maior coeficiente de variação).
  const variacao = porSegmento
    .filter(s => s.grupo.length >= 3)
    .map(s => ({ nome: s.nome, cv: s.media ? desvioPadrao(s.grupo.map(c => c.faturamento_anual)) / s.media : 0 }))
    .sort((a, b) => b.cv - a.cv)[0]
  if (variacao && variacao.cv >= 0.5) {
    insights.push({
      titulo: `Clientes de ${variacao.nome} são muito diferentes entre si`,
      descricao: `O desvio padrão do faturamento é ${Math.round(variacao.cv * 100)}% da média do segmento: vale separar estratégias por porte.`,
      tipo: 'Faturamento',
      prioridade: 'Baixa'
    })
  }

  // Transparência: base pequena limita as conclusões (pedido no plano do projeto).
  if (total < 30) {
    insights.push({
      titulo: 'Base pequena',
      descricao: `Com ${total} clientes válidos, as conclusões têm alcance limitado. Use como indicação, não como regra.`,
      tipo: 'Qualidade dos dados',
      prioridade: 'Baixa'
    })
  }

  return insights
}
