// Cores dos gráficos. Cada cor tem um significado fixo em todo o sistema.
//
// Segmento (categoria): uma cor por segmento, sempre a mesma em qualquer gráfico — filtrar não troca as cores.
// Paleta testada com o validador de daltonismo (todas as combinações de pares): passa em separação para
// daltônicos e em visão normal. Água-marinha e mostarda têm pouco contraste com o branco, por isso os gráficos
// nunca usam só a cor: sempre há o nome do segmento no eixo, na legenda ou na tabela.
// Laranja e verde-limão NÃO entram: no sistema eles significam "com erro" e "válido".
export const CORES_SEGMENTO = {
  Indústria: '#2a78d6', // azul
  Comércio: '#c2408a', // magenta
  Serviços: '#1baf7a', // água-marinha
  Saúde: '#4a3aa7', // violeta
  Educação: '#d99a00', // mostarda
  Tecnologia: '#8f4f10' // marrom
}

const COR_SEM_SEGMENTO = '#A5A5A5' // Cinza para um segmento fora da lista (não deveria acontecer: a validação barra).

export function corDoSegmento(segmento) {
  return CORES_SEGMENTO[segmento] ?? COR_SEM_SEGMENTO
}

// Nível (ordinal: A > B > C): um tom só, do escuro (A) ao claro (C), para a ordem aparecer na cor.
export const CORES_NIVEL = {
  A: '#184f95',
  B: '#3987e5',
  C: '#86b6ef'
}

// Medida única (contratações no tempo, histograma, serviços): o azul da marca.
export const COR_UNICA = '#006EB7'
