// Confere as planilhas oferecidas na tela de upload (geradas por npm run planilhas).
// Se as regras mudarem e o modelo ficar desatualizado, este teste falha.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { lerPlanilha } from './leituraPlanilha'
import { validarLinhas } from './validacao'

async function processar(nome) {
  const bytes = readFileSync(new URL(`../../public/${nome}`, import.meta.url))
  const { linhas, nomeAba } = await lerPlanilha(new File([bytes], nome))
  return { nomeAba, ...validarLinhas(linhas) }
}

describe('planilhas públicas', () => {
  it('o modelo passa inteiro na validação, sem precisar de padronização', async () => {
    const resultado = await processar('modelo-clientes.xlsx')
    expect(resultado.nomeAba).toBe('upload_clientes')
    expect(resultado.validos).toHaveLength(2)
    expect(resultado.erros).toEqual([])
    expect(resultado.padronizacoes).toEqual([]) // O modelo já vem no formato final.
  })

  it('a planilha de teste tem os erros plantados', async () => {
    const resultado = await processar('teste-clientes.xlsx')
    expect(resultado.nomeAba).toBe('upload_clientes')
    expect(resultado.validos).toHaveLength(5)
    expect(resultado.invalidos).toHaveLength(10)
    expect(new Set(resultado.ocorrencias.map(o => o.tipo))).toEqual(new Set(['Campo vazio', 'Fora do padrão', 'Registro duplicado', 'Valor inválido']))
    expect(resultado.padronizacoes.length).toBeGreaterThan(20) // Segmentos, nomes, níveis, UF, faturamento...
  })
})
