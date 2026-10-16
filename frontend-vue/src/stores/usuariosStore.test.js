import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsuariosStore } from './usuariosStore'
import { useAutenticacaoStore } from './autenticacaoStore'

const PEDIDO = { nome: 'Carla Souza', email: ' Carla@CTInexus.com ', cargo: 'Diretoria', senha: '123456', confirmacao: '123456' }

beforeEach(() => setActivePinia(createPinia()))

describe('pedido de acesso', () => {
  it('fica pendente, sem papel, e não entra antes da aprovação', () => {
    const store = useUsuariosStore()
    expect(store.pedirAcesso(PEDIDO)).toEqual({})

    const [pedido] = store.pedidosPendentes
    expect(pedido).toMatchObject({ email: 'carla@ctinexus.com', papel: null, ativo: false, pendente: true })
    expect(store.cadastrados.some(u => u.id === pedido.id)).toBe(false) // Fora da lista de usuários.
    expect(store.autenticar('carla@ctinexus.com', '123456').erro).toMatch(/não foi aprovado/)
  })

  it('o administrador aprova escolhendo o papel, e aí a pessoa entra', () => {
    const store = useUsuariosStore()
    store.pedirAcesso(PEDIDO)
    const { id } = store.pedidosPendentes[0]

    expect(store.aprovarPedido(id, '')).toMatch(/Escolha o papel/)
    expect(store.aprovarPedido(id, 'gestor')).toBe('')
    expect(store.pedidosPendentes).toHaveLength(0)
    expect(store.autenticar('carla@ctinexus.com', '123456').usuario.papel).toBe('gestor')
  })

  it('recusar remove o pedido e libera o e-mail para um novo pedido', () => {
    const store = useUsuariosStore()
    store.pedirAcesso(PEDIDO)
    expect(store.pedirAcesso(PEDIDO).email).toMatch(/Já existe/) // Não duplica o pedido.

    store.recusarPedido(store.pedidosPendentes[0].id)
    expect(store.pedidosPendentes).toHaveLength(0)
    expect(store.pedirAcesso(PEDIDO)).toEqual({})
  })
})

describe('acesso de demonstração', () => {
  it('entra pelo id mesmo depois de mudarem o e-mail do usuário', async () => {
    useUsuariosStore().editar(1, { nome: 'Rita Andrade', email: 'rita@empresa.com', senha: '', confirmacao: '', papel: 'administrador' })
    const auth = useAutenticacaoStore()
    expect(await auth.loginDemonstracao(1)).toBe(true)
    expect(auth.usuario.email).toBe('rita@empresa.com')
  })

  it('não entra com usuário de demonstração desativado', async () => {
    useUsuariosStore().alternarAtivo(3)
    const auth = useAutenticacaoStore()
    expect(await auth.loginDemonstracao(3)).toBe(false)
    expect(auth.erro).toMatch(/desativado/)
  })
})

// Roteiro da apresentação: pedir acesso → administrador aprova → sair → entrar com o usuário novo.
// Recarrega a página no meio (Pinia nova lendo o localStorage) para conferir que o pedido não se perde.
describe('roteiro da apresentação', () => {
  it('pedido aprovado pelo administrador vira um login que funciona', async () => {
    const guardado = new Map()
    globalThis.localStorage = { getItem: k => guardado.get(k) ?? null, setItem: (k, v) => guardado.set(k, v) }
    try {
      useUsuariosStore().pedirAcesso({ nome: 'Professora Teste', email: 'prof@senai.br', senha: 'senai2026', confirmacao: 'senai2026' })
      expect(await useAutenticacaoStore().login('prof@senai.br', 'senai2026')).toBe(false) // Ainda não aprovado.

      setActivePinia(createPinia()) // Recarregou a página.
      const auth = useAutenticacaoStore()
      await auth.loginDemonstracao(1) // Entra como administrador.
      const usuarios = useUsuariosStore()
      expect(usuarios.aprovarPedido(usuarios.pedidosPendentes[0].id, 'analista')).toBe('')
      auth.logout()

      expect(await auth.login('PROF@senai.br ', 'senai2026')).toBe(true)
      expect(auth.usuario).toMatchObject({ nome: 'Professora Teste', papel: 'analista' })
      expect(auth.telaDeEntrada).toBe('/upload')
    } finally {
      delete globalThis.localStorage
    }
  })
})
