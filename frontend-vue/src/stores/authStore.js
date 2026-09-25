import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Usuário de demonstração enquanto o backend Java não tem a rota de login.
const USUARIO_DEMO = {
  nome: 'Administrador',
  email: 'admin@ctinexus.com',
  senha: '123456'
}

const CHAVE_SESSAO = 'cti-nexus-usuario'

function lerSessao() { // Recupera o usuário logado se a página for recarregada.
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // ===== STATE =====

  const usuario = ref(lerSessao()) // Guarda o usuário logado (ou null).
  const carregando = ref(false) // Informa se o login está sendo verificado.
  const erro = ref('') // Guarda a mensagem de erro do login.

  // ===== GETTERS =====

  const estaAutenticado = computed(() => usuario.value !== null) // Indica se existe alguém logado.

  const primeiroNome = computed(() => usuario.value?.nome.split(' ')[0] ?? '') // Usado no cabeçalho.

  // ===== ACTIONS =====

  async function login(email, senha) { // Confere e-mail e senha e guarda o usuário.
    erro.value = ''

    if (!email.trim() || !senha) {
      erro.value = 'Informe o e-mail e a senha.'
      return false
    }

    carregando.value = true
    await new Promise(resolve => setTimeout(resolve, 600)) // Simula o tempo de resposta do servidor.
    carregando.value = false

    // TODO: trocar pela chamada ao backend Java quando a rota de login existir.
    if (email.trim().toLowerCase() !== USUARIO_DEMO.email || senha !== USUARIO_DEMO.senha) {
      erro.value = 'E-mail ou senha incorretos.'
      return false
    }

    usuario.value = { nome: USUARIO_DEMO.nome, email: USUARIO_DEMO.email }
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario.value))
    } catch {
      // Sem sessionStorage o login continua valendo até recarregar a página.
    }
    return true
  }

  function logout() { // Remove o usuário logado.
    usuario.value = null
    try {
      sessionStorage.removeItem(CHAVE_SESSAO)
    } catch {
      // Nada a fazer.
    }
  }

  return {
    usuario, carregando, erro,
    estaAutenticado, primeiroNome,
    login, logout
  }
})
