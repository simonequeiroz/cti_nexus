import { describe, it, expect } from 'vitest'
import { validarUsuario, ultimoAdministrador } from './validacaoUsuario'

const USUARIOS = [
  { id: 1, nome: 'Rita Andrade', email: 'admin@ctinexus.com', papel: 'administrador', ativo: true },
  { id: 2, nome: 'Ana Lima', email: 'analista@ctinexus.com', papel: 'analista', ativo: true }
]

const NOVO = { nome: 'Carla Souza', email: 'carla@ctinexus.com', senha: '123456', confirmacao: '123456', papel: 'gestor' }

describe('validarUsuario', () => {
  it('aceita um cadastro completo', () => {
    expect(validarUsuario(NOVO, USUARIOS)).toEqual({})
  })

  it('exige nome, e-mail, senha e papel', () => {
    const erros = validarUsuario({}, USUARIOS)
    expect(Object.keys(erros).sort()).toEqual(['email', 'nome', 'papel', 'senha'])
  })

  it('recusa e-mail inválido ou já cadastrado (sem diferenciar maiúsculas)', () => {
    expect(validarUsuario({ ...NOVO, email: 'carla@' }, USUARIOS).email).toMatch(/inválido/)
    expect(validarUsuario({ ...NOVO, email: ' ANALISTA@ctinexus.com ' }, USUARIOS).email).toMatch(/Já existe/)
  })

  it('confere tamanho e confirmação da senha', () => {
    expect(validarUsuario({ ...NOVO, senha: '123', confirmacao: '123' }, USUARIOS).senha).toBeDefined()
    expect(validarUsuario({ ...NOVO, confirmacao: '654321' }, USUARIOS).confirmacao).toBeDefined()
  })

  it('recusa papel que não existe', () => {
    expect(validarUsuario({ ...NOVO, papel: 'dono' }, USUARIOS).papel).toBeDefined()
  })

  it('na edição, o próprio e-mail não conta como repetido e a senha pode ficar em branco', () => {
    const edicao = { nome: 'Ana Lima', email: 'analista@ctinexus.com', senha: '', confirmacao: '', papel: 'analista' }
    expect(validarUsuario(edicao, USUARIOS, 2)).toEqual({})
  })
})

describe('ultimoAdministrador', () => {
  it('identifica o único administrador ativo', () => {
    expect(ultimoAdministrador(USUARIOS, 1)).toBe(true)
    expect(ultimoAdministrador(USUARIOS, 2)).toBe(false)
    expect(ultimoAdministrador([...USUARIOS, { id: 3, papel: 'administrador', ativo: true }], 1)).toBe(false)
  })
})
