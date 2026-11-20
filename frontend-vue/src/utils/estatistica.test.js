// Testes da contagem usada no relatório de qualidade. Rodar com: npm test
// (As medidas do painel — média, mediana, desvio padrão — são testadas no Python: analytics-python/test_analise.py.)
import { describe, it, expect } from 'vitest'
import { contarPor, agruparPor } from './estatistica'

describe('contagem por categoria', () => {
  it('conta e ordena do mais frequente para o menos', () => {
    expect(contarPor(['A', 'B', 'B'], v => v)).toEqual([{ nome: 'B', quantidade: 2 }, { nome: 'A', quantidade: 1 }])
  })

  it('agrupa pela chave', () => {
    expect(agruparPor([{ t: 'x' }, { t: 'y' }, { t: 'x' }], i => i.t)).toEqual({ x: [{ t: 'x' }, { t: 'x' }], y: [{ t: 'y' }] })
  })

  it('não quebra com lista vazia', () => {
    expect(contarPor([], v => v)).toEqual([])
  })
})
