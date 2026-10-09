import { describe, it, expect } from 'vitest'
import { formatarDuracao } from './formatadores'

describe('formatarDuracao', () => {
  it('mostra segundos com uma casa decimal', () => {
    expect(formatarDuracao(1234)).toBe('1,2 s')
    expect(formatarDuracao(16000)).toBe('16,0 s')
  })

  it('não mostra "0,0 s" para conferências muito rápidas', () => {
    expect(formatarDuracao(40)).toBe('menos de 0,1 s')
  })
})
