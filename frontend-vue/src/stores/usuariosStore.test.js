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

describe('esqueci minha senha', () => {
  it('pedido → senha temporária → troca obrigatória no próximo login', async () => {
    const auth = useAutenticacaoStore()
    expect(await auth.pedirNovaSenha('analista@ctinexus.com')).toBe('')
    expect(await auth.pedirNovaSenha('ninguem@ctinexus.com')).toBe('') // Mesma resposta: não revela quem existe.

    // Administrador vê o pedido (e o número ao lado de "Usuários") e define a senha temporária.
    const store = await entrarComoAdministrador()
    const [pedido] = store.pedidosNovaSenha
    expect(pedido.email).toBe('analista@ctinexus.com')
    expect(store.quantidadeAguardando).toBe(1)
    expect(await store.definirSenhaTemporaria(pedido.id, '123')).toMatch(/6 caracteres/)
    expect(await store.definirSenhaTemporaria(pedido.id, 'temp2026')).toBe('')
    expect(store.pedidosNovaSenha).toHaveLength(0)

    // Entra com a temporária: só a tela de troca, sem permissão nenhuma.
    auth.logout()
    expect(await auth.login('analista@ctinexus.com', 'temp2026')).toBe(true)
    expect(auth.precisaTrocarSenha).toBe(true)
    expect(auth.telaDeEntrada).toBe('/trocar-senha')
    expect(auth.pode('enviar_planilha')).toBe(false)

    expect((await auth.trocarSenha({ senhaAtual: 'errada', senhaNova: 'minha123', confirmacao: 'minha123' })).senhaAtual).toMatch(/não confere/)
    expect(await auth.trocarSenha({ senhaAtual: 'temp2026', senhaNova: 'minha123', confirmacao: 'minha123' })).toEqual({})
    expect(auth.precisaTrocarSenha).toBe(false)
    expect(auth.telaDeEntrada).toBe('/upload')
    expect(auth.pode('enviar_planilha')).toBe(true)
  })

  it('usuário cadastrado pelo administrador cria a própria senha no primeiro acesso', async () => {
    const store = await entrarComoAdministrador()
    await store.cadastrar({ nome: 'Bruno Melo', email: 'bruno@ctinexus.com', senha: 'abc123', confirmacao: 'abc123', papel: 'gestor' })

    const auth = useAutenticacaoStore()
    auth.logout()
    await auth.login('bruno@ctinexus.com', 'abc123')
    expect(auth.telaDeEntrada).toBe('/trocar-senha')
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
