// Testes das medidas usadas no dashboard (conferidas com os valores do Pandas). Rodar com: npm test
import { describe, it, expect } from 'vitest'
import { media, mediana, quartil, desvioPadrao, moda, contarPor } from './estatistica'

const valores = [2, 4, 4, 4, 5, 5, 7, 9]

describe('estatística descritiva', () => {
  it('calcula média e mediana', () => {
    expect(media(valores)).toBe(5)
    expect(mediana(valores)).toBe(4.5)
    expect(mediana([3, 1, 2])).toBe(2)
  })

  it('calcula quartis com interpolação linear, como o quantile() do Pandas', () => {
    expect(quartil(valores, 0.25)).toBe(4)
    expect(quartil(valores, 0.75)).toBe(5.5)
  })

  it('calcula o desvio padrão amostral (n - 1), como o std() do Pandas', () => {
    expect(desvioPadrao(valores)).toBeCloseTo(2.138, 3)
    expect(desvioPadrao([10])).toBe(0)
  })

  it('encontra a moda e conta por categoria', () => {
    expect(moda(['B', 'A', 'B', 'C'])).toBe('B')
    expect(contarPor(['A', 'B', 'B'], v => v)).toEqual([{ nome: 'B', quantidade: 2 }, { nome: 'A', quantidade: 1 }])
  })

  it('não quebra com lista vazia', () => {
    expect(media([])).toBe(0)
    expect(mediana([])).toBe(0)
  })
})
