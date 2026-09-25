// Gera e baixa um arquivo CSV que abre direto no Excel em português.

export function exportarCsv(nomeArquivo, cabecalho, linhas) {
  const csv = [cabecalho, ...linhas]
    .map(colunas => colunas.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';')) // ; é o separador do Excel pt-BR.
    .join('\r\n')

  const arquivo = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }) // ﻿ mantém os acentos no Excel.
  const link = document.createElement('a')
  link.href = URL.createObjectURL(arquivo)
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(link.href)
}
