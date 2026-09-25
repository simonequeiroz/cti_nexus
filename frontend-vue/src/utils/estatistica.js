// Estatística descritiva usada no dashboard (tendência central, dispersão e agrupamentos).

export function soma(valores) {
  return valores.reduce((total, valor) => total + valor, 0)
}

export function media(valores) {
  return valores.length ? soma(valores) / valores.length : 0
}

export function mediana(valores) {
  return quartil(valores, 0.5)
}

export function quartil(valores, p) { // p = 0.25 (Q1), 0.5 (mediana), 0.75 (Q3). Interpolação linear, como no Pandas.
  if (!valores.length) return 0
  const ordenados = [...valores].sort((a, b) => a - b)
  const posicao = (ordenados.length - 1) * p
  const abaixo = Math.floor(posicao)
  const acima = Math.ceil(posicao)
  return ordenados[abaixo] + (ordenados[acima] - ordenados[abaixo]) * (posicao - abaixo)
}

export function desvioPadrao(valores) { // Desvio padrão amostral (divide por n - 1), igual ao std() do Pandas.
  if (valores.length < 2) return 0
  const m = media(valores)
  return Math.sqrt(soma(valores.map(valor => (valor - m) ** 2)) / (valores.length - 1))
}

export function moda(valores) { // Valor que mais se repete. Ex.: ['A', 'B', 'B'] vira 'B'.
  const contagem = contarPor(valores, valor => valor)
  return contagem[0]?.nome ?? ''
}

// Agrupa e conta. Ex.: contarPor(clientes, c => c.segmento) vira [{ nome: 'Indústria', quantidade: 7 }, ...].
export function contarPor(lista, chave) {
  const grupos = agruparPor(lista, chave)
  return Object.entries(grupos)
    .map(([nome, itens]) => ({ nome, quantidade: itens.length }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

export function agruparPor(lista, chave) { // Ex.: { Indústria: [cliente1, cliente2], Saúde: [cliente3] }.
  const grupos = {}
  for (const item of lista) {
    const nome = chave(item)
    ;(grupos[nome] ??= []).push(item)
  }
  return grupos
}

export function resumoEstatistico(valores) { // Todas as medidas de uma vez, para as tabelas do dashboard.
  return {
    quantidade: valores.length,
    media: media(valores),
    mediana: mediana(valores),
    desvioPadrao: desvioPadrao(valores),
    minimo: valores.length ? Math.min(...valores) : 0,
    maximo: valores.length ? Math.max(...valores) : 0,
    q1: quartil(valores, 0.25),
    q3: quartil(valores, 0.75)
  }
}
