import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import api from '../services/api'
import { useUsuariosStore } from './usuariosStore'
import { useAutenticacaoStore } from './autenticacaoStore'

// Troca a API de verdade pela de mentira (services/apiFalsa.js), que imita o back-end Spring.
vi.mock('../services/api', () => import('../services/apiFalsa'))

const PEDIDO = { nome: 'Carla Souza', email: ' Carla@CTInexus.com ', cargo: 'Diretoria', senha: '123456', confirmacao: '123456' }

beforeEach(() => {
  api.reiniciar()
  setActivePinia(createPinia())
})

async function entrarComoAdministrador() {
  await useAutenticacaoStore().login('admin@ctinexus.com', '123456')
  const store = useUsuariosStore()
  await store.carregar()
  return store
}

describe('pedido de acesso', () => {
  it('fica pendente, sem papel, e não entra antes da aprovação', async () => {
    expect(await useUsuariosStore().pedirAcesso(PEDIDO)).toEqual({})

    const auth = useAutenticacaoStore()
    expect(await auth.login('carla@ctinexus.com', '123456')).toBe(false)
    expect(auth.erro).toMatch(/não foi aprovado/)

    const store = await entrarComoAdministrador()
    const [pedido] = store.pedidosPendentes
    expect(pedido).toMatchObject({ email: 'carla@ctinexus.com', papel: null, ativo: false, pendente: true, cargo: 'Diretoria' })
    expect(store.cadastrados.some(u => u.id === pedido.id)).toBe(false) // Fora da lista de usuários.
  })

  it('e-mail repetido volta como erro do campo e-mail (resposta da API)', async () => {
    const store = useUsuariosStore()
    await store.pedirAcesso(PEDIDO)
    expect((await store.pedirAcesso(PEDIDO)).email).toMatch(/Já existe/)
  })

  it('o administrador aprova escolhendo o papel, e aí a pessoa entra', async () => {
    await useUsuariosStore().pedirAcesso(PEDIDO)
    const store = await entrarComoAdministrador()
    const { id } = store.pedidosPendentes[0]

    expect(await store.aprovarPedido(id, '')).toMatch(/Escolha o papel/)
    expect(await store.aprovarPedido(id, 'gestor')).toBe('')
    expect(store.pedidosPendentes).toHaveLength(0)

    const auth = useAutenticacaoStore()
    auth.logout()
    expect(await auth.login('CARLA@ctinexus.com ', '123456')).toBe(true)
    expect(auth.usuario).toMatchObject({ nome: 'Carla Souza', papel: 'gestor' })
    expect(auth.telaDeEntrada).toBe('/dashboard')
  })

  it('recusar remove o pedido e libera o e-mail para um novo pedido', async () => {
    await useUsuariosStore().pedirAcesso(PEDIDO)
    const store = await entrarComoAdministrador()

    expect(await store.recusarPedido(store.pedidosPendentes[0].id)).toBe('')
    expect(store.pedidosPendentes).toHaveLength(0)
    expect(await store.pedirAcesso(PEDIDO)).toEqual({})
  })
})

describe('tela Usuários', () => {
  it('cadastra já com papel e edita nome e papel', async () => {
    const store = await entrarComoAdministrador()
    expect(await store.cadastrar({ nome: 'Bruno Melo', email: 'bruno@ctinexus.com', senha: 'abc123', confirmacao: 'abc123', papel: 'gestor' })).toEqual({})

    const bruno = store.usuarios.find(u => u.email === 'bruno@ctinexus.com')
    expect(bruno).toMatchObject({ papel: 'gestor', ativo: true })

    expect(await store.editar(bruno.id, { nome: 'Bruno Melo Jr', email: 'bruno@ctinexus.com', senha: '', confirmacao: '', papel: 'analista' })).toEqual({})
    expect(bruno).toMatchObject({ nome: 'Bruno Melo Jr', papel: 'analista' }) // Mesmo objeto, dados novos.
  })

  it('não deixa o sistema sem administrador ativo', async () => {
    const store = await entrarComoAdministrador()
    expect(await store.alternarAtivo(1)).toMatch(/único administrador/)
    expect((await store.editar(1, { nome: 'Administrador', email: 'admin@ctinexus.com', senha: '', confirmacao: '', papel: 'gestor' })).papel).toMatch(/único administrador/)
  })

  it('desativado não entra mais', async () => {
    const store = await entrarComoAdministrador()
    expect(await store.alternarAtivo(3)).toBe('') // Gustavo Reis (gestor).

    const auth = useAutenticacaoStore()
    auth.logout()
    expect(await auth.loginDemonstracao('gestor@ctinexus.com')).toBe(false)
    expect(auth.erro).toMatch(/desativado/)
  })
})
