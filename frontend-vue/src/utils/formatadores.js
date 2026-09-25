// Funções de formatação usadas pelas telas.

export function formatarTamanho(bytes) { // Ex.: 20966 vira "20.5 KB".
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatarData(data) { // Ex.: 24/09/2026, 22:06:10.
  return data ? data.toLocaleString('pt-BR') : '—'
}

export function dataISO(data) { // Valor para o atributo datetime da tag <time>.
  return data ? data.toISOString() : undefined
}

export function formatarMoeda(valor, compacto = false) { // Ex.: R$ 2.373.500,00 ou R$ 2,4 mi.
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: compacto ? 'compact' : 'standard',
    maximumFractionDigits: compacto ? 1 : 2
  })
}

export function porcentagem(parte, total) { // Largura das barras. Ex.: 3 de 6 vira "50%".
  return total ? `${(parte / total) * 100}%` : '0%'
}
