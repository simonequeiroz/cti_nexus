// Contagem por categoria, usada no relatório de qualidade da planilha (erros por tipo, por campo, ajustes...).
// As contas do Painel da carteira (média, mediana, desvio padrão, insights) NÃO ficam aqui:
// são feitas no Python (analytics-python/analise.py e insights.py) e chegam prontas pelo Java.

// Agrupa e conta. Ex.: contarPor(erros, e => e.tipo) vira [{ nome: 'Campo vazio', quantidade: 3 }, ...].
export function contarPor(lista, chave) {
  const grupos = agruparPor(lista, chave)
  return Object.entries(grupos)
    .map(([nome, itens]) => ({ nome, quantidade: itens.length }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

export function agruparPor(lista, chave) { // Ex.: { 'Campo vazio': [erro1, erro2], 'Código repetido': [erro3] }.
  const grupos = {}
  for (const item of lista) {
    const nome = chave(item)
    ;(grupos[nome] ??= []).push(item)
  }
  return grupos
}
