import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PAPEIS, temPermissao, telaInicial } from '../constants/permissoes'
import { entrar, buscarUsuarioLogado } from '../services/autenticacaoService' // Rotas /auth da API.
import { usuarioDaApi, mensagemDeErro } from '../utils/usuarioApi'

// Login pela API do Spring (services/autenticacaoService.js): POST /auth/login devolve o token (o "crachá") e os dados do usuário.
// O token fica no sessionStorage com a chave 'token', que é onde o services/api.js procura para mandar em toda chamada.
const CHAVE_SESSAO = 'cti-nexus-usuario'
const CHAVE_TOKEN = 'token'

// Usuários de demonstração (um por papel), criados pelo back-end quando DEMO_USUARIOS=true (config/DadosIniciais.java).
export const SENHA_DEMONSTRACAO = '123456'
export const USUARIOS_DEMO = [
  { email: 'admin@ctinexus.com', papel: 'administrador' },
  { email: 'analista@ctinexus.com', papel: 'analista' },
  { email: 'gestor@ctinexus.com', papel: 'gestor' }
]

function lerSessao() { // Recupera o usuário logado se a página for recarregada.
  try {
    const usuario = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO))
    const token = sessionStorage.getItem(CHAVE_TOKEN)
    return token && PAPEIS[usuario?.papel] ? usuario : null // Sem token ou sessão antiga: pede o login de novo.
  } catch {
    return null
  }
}

// Só o que as telas precisam saber de quem entrou (sem cargo, situação etc.).
function resumo(usuario) {
  const { id, nome, email, papel } = usuarioDaApi(usuario)
  return { id, nome, email, papel }
}

export const useAutenticacaoStore = defineStore('auth', () => {
  // ===== STATE =====

  const usuario = ref(lerSessao()) // Guarda o usuário logado (ou null).
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

  async function login(email, senha) { // Manda e-mail e senha para a API e guarda o token e o usuário.
    erro.value = ''

    if (!email.trim() || !senha) {
      erro.value = 'Informe o e-mail e a senha.'
      return false
    }

    carregando.value = true
    try {
      const resposta = await entrar(email.trim(), senha) // POST /auth/login → { token, tipo, usuario }
      guardarSessao(resposta.token, resumo(resposta.usuario))
      return true
    } catch (e) {
      erro.value = mensagemDeErro(e) // Ex.: "E-mail ou senha incorretos." ou "pedido ainda não foi aprovado".
      return false
    } finally {
      carregando.value = false // Roda sempre, tendo dado certo ou errado.
    }
  }

  // Botões "Usar acesso de demonstração": entram com os usuários que o back-end cria (config/DadosIniciais.java).
  async function loginDemonstracao(email) {
    return login(email, SENHA_DEMONSTRACAO)
  }

  // Ao abrir o sistema com alguém logado: pergunta à API quem é o dono do token (GET /auth/me).
  // Pega nome ou papel que o administrador tenha mudado; token vencido cai no aviso de 401 do main.js.
  async function conferirSessao() {
    if (!estaAutenticado.value) return
    try {
      const dados = await buscarUsuarioLogado() // GET /auth/me
      guardarSessao(sessionStorage.getItem(CHAVE_TOKEN), resumo(dados))
    } catch {
      // Sem resposta do servidor: continua com a sessão guardada.
    }
  }

  function guardarSessao(token, dados) {
    usuario.value = dados
    try {
      sessionStorage.setItem(CHAVE_TOKEN, token)
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados))
    } catch {
      // Sem sessionStorage o login continua valendo até recarregar a página.
    }
  }

  function atualizarSessao(dados) { // O usuário logado editou o próprio nome ou e-mail na tela Usuários.
    usuario.value = { ...usuario.value, nome: dados.nome, email: dados.email }
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario.value))
    } catch {
      // Nada a fazer.
    }
  }

  function logout() { // Remove o usuário logado e o token.
    usuario.value = null
    try {
      sessionStorage.removeItem(CHAVE_SESSAO)
      sessionStorage.removeItem(CHAVE_TOKEN)
    } catch {
      // Nada a fazer.
    }
  }

  return {
    usuario, carregando, erro,
    estaAutenticado, primeiroNome, nomeDoPapel, telaDeEntrada,
    pode, login, loginDemonstracao, conferirSessao, logout, atualizarSessao
  }
})
