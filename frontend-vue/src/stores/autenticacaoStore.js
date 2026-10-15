import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PAPEIS, temPermissao, telaInicial } from '../constants/permissoes'
import { useUsuariosStore } from './usuariosStore'

const CHAVE_SESSAO = 'cti-nexus-usuario'

function lerSessao() { // Recupera o usuário logado se a página for recarregada.
  try {
    const usuario = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO))
    return PAPEIS[usuario?.papel] ? usuario : null // Sessão antiga, sem papel: pede o login de novo.
  } catch {
    return null
  }
}

// A sessão guarda uma cópia do usuário; o cadastro é a fonte certa (nome ou papel podem ter mudado na tela Usuários).
// Usuário desativado ou que não existe mais perde a sessão.
function sincronizar(sessao) {
  const cadastrado = sessao && useUsuariosStore().usuarios.find(u => u.id === sessao.id && u.ativo)
  if (!cadastrado) return null
  const { id, nome, email, papel } = cadastrado
  return { id, nome, email, papel }
}

export const useAutenticacaoStore = defineStore('auth', () => {
  // ===== STATE =====

  const usuario = ref(sincronizar(lerSessao())) // Guarda o usuário logado (ou null).
  const carregando = ref(false) // Informa se o login está sendo verificado.
  const erro = ref('') // Guarda a mensagem de erro do login.

  // ===== GETTERS =====

  const estaAutenticado = computed(() => usuario.value !== null) // Indica se existe alguém logado.

  const primeiroNome = computed(() => usuario.value?.nome.split(' ')[0] ?? '') // Usado no cabeçalho.

  const nomeDoPapel = computed(() => PAPEIS[usuario.value?.papel]?.nome ?? '') // Ex.: "Analista de Operações".

  const telaDeEntrada = computed(() => telaInicial(usuario.value?.papel)) // Primeira tela depois do login.

  function pode(permissao) { // Ex.: pode('corrigir_dados'). Usado nas telas para mostrar ou esconder ações.
    return temPermissao(usuario.value?.papel, permissao)
  }

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

    // TODO: trocar pela chamada ao backend Java quando a rota de login existir (o papel virá do banco).
    const resposta = useUsuariosStore().autenticar(email, senha)
    if (resposta.erro) {
      erro.value = resposta.erro
      return false
    }

    const { id, nome, email: emailCadastrado, papel } = resposta.usuario
    usuario.value = { id, nome, email: emailCadastrado, papel } // Sem a senha.
    guardarSessao()
    return true
  }

  async function loginDemonstracao(id) { // Botões de demonstração do login: entra pelo id, sem e-mail e senha.
    // TODO: some junto com o login de demonstração quando o backend existir.
    erro.value = ''
    carregando.value = true
    await new Promise(resolve => setTimeout(resolve, 600))
    carregando.value = false

    usuario.value = sincronizar({ id })
    if (!usuario.value) {
      erro.value = 'Este acesso de demonstração foi desativado na tela Usuários.'
      return false
    }
    guardarSessao()
    return true
  }

  function guardarSessao() {
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario.value))
    } catch {
      // Sem sessionStorage o login continua valendo até recarregar a página.
    }
  }

  function atualizarSessao(dados) { // O usuário logado editou o próprio nome ou e-mail na tela Usuários.
    usuario.value = { ...usuario.value, nome: dados.nome, email: dados.email }
    guardarSessao()
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
    estaAutenticado, primeiroNome, nomeDoPapel, telaDeEntrada,
    pode, login, loginDemonstracao, logout, atualizarSessao
  }
})
