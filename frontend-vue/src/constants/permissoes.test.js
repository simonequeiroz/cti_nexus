import { describe, it, expect } from 'vitest'
import { PAPEIS, PERMISSOES, temPermissao, telaInicial } from './permissoes'

describe('níveis de acesso', () => {
  it('administrador tem todas as permissões', () => {
    for (const permissao of Object.keys(PERMISSOES)) expect(temPermissao('administrador', permissao)).toBe(true)
  })

  it('analista importa, corrige e aprova, mas não limpa o histórico nem configura o sistema', () => {
    expect(temPermissao('analista', 'enviar_planilha')).toBe(true)
    expect(temPermissao('analista', 'corrigir_dados')).toBe(true)
    expect(temPermissao('analista', 'aprovar_carga')).toBe(true)
    expect(temPermissao('analista', 'limpar_historico')).toBe(false)
    expect(temPermissao('analista', 'gerenciar_regras')).toBe(false)
  })

  it('gestor só consulta', () => {
    expect(PAPEIS.gestor.permissoes).toEqual(['ver_relatorio', 'ver_painel'])
    expect(temPermissao('gestor', 'enviar_planilha')).toBe(false)
    expect(temPermissao('gestor', 'corrigir_dados')).toBe(false)
  })

  it('cada papel começa na sua tela', () => {
    expect(telaInicial('administrador')).toBe('/upload')
    expect(telaInicial('analista')).toBe('/upload')
    expect(telaInicial('gestor')).toBe('/dashboard')
  })

  it('papel desconhecido não tem acesso a nada', () => {
    expect(temPermissao('visitante', 'ver_painel')).toBe(false)
    expect(temPermissao(undefined, 'ver_painel')).toBe(false)
    expect(telaInicial(undefined)).toBe('/login')
  })

  it('todas as permissões dos papéis existem na lista', () => {
    for (const papel of Object.values(PAPEIS)) {
      for (const permissao of papel.permissoes) expect(PERMISSOES).toHaveProperty(permissao)
    }
  })
})
