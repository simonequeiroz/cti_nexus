import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PAPEIS, temPermissao, telaInicial } from '../constants/permissoes'
import { entrar, buscarUsuarioLogado, esqueciSenha, trocarSenha as trocarSenhaNaApi } from '../services/autenticacaoService' // Rotas /auth da API.
import { usuarioDaApi, mensagemDeErro, errosDeCampo } from '../utils/usuarioApi'
import { validarTrocaSenha } from '../utils/validacaoUsuario'

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
  const { id, nome, email, papel, deveTrocarSenha } = usuarioDaApi(usuario)
  return { id, nome, email, papel, deveTrocarSenha }
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

  // Entrou com senha temporária (dada pelo administrador): precisa criar a própria antes de usar o sistema.
  const precisaTrocarSenha = computed(() => usuario.value?.deveTrocarSenha === true)

  // Primeira tela depois do login. Com senha temporária, sempre a tela "Crie sua nova senha".
  const telaDeEntrada = computed(() => precisaTrocarSenha.value ? '/trocar-senha' : telaInicial(usuario.value?.papel))

  function pode(permissao) { // Ex.: pode('corrigir_dados'). Usado nas telas para mostrar ou esconder ações.
    if (precisaTrocarSenha.value) return false // Igual ao back-end: sem permissão até trocar a senha.
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
      atualizarUsuario(resumo(dados)) // O token continua o mesmo.
    } catch {
      // Sem resposta do servidor: continua com a sessão guardada.
    }
  }

  // "Esqueci minha senha" na tela de login: avisa o administrador, que vai passar uma senha temporária.
  // Devolve '' quando deu certo, ou a mensagem do problema.
  async function pedirNovaSenha(email) {
    if (!email.trim()) return 'Informe o seu e-mail.'
    try {
      await esqueciSenha(email.trim()) // POST /auth/esqueci-senha
      return ''
    } catch (e) {
      return mensagemDeErro(e)
    }
  }

  // Tela "Crie sua nova senha". dados: { senhaAtual, senhaNova, confirmacao }. Devolve os erros por campo ({} = deu certo).
  async function trocarSenha(dados) {
    const erros = validarTrocaSenha(dados)
    if (Object.keys(erros).length) return erros
    try {
      const atualizado = await trocarSenhaNaApi(dados.senhaAtual, dados.senhaNova) // POST /auth/trocar-senha
      atualizarUsuario(resumo(atualizado)) // Agora deveTrocarSenha = false; o token continua o mesmo.
      return {}
    } catch (e) {
      return errosDeCampo(e) // Ex.: { senhaAtual: 'A senha atual não confere.' }
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

  function atualizarUsuario(dados) { // Troca os dados de quem está logado, sem mexer no token.
    usuario.value = dados
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados))
    } catch {
      // Sem sessionStorage vale até recarregar a página.
    }
  }

  function atualizarSessao(dados) { // O usuário logado editou o próprio nome ou e-mail na tela Usuários.
    atualizarUsuario({ ...usuario.value, nome: dados.nome, email: dados.email })
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
    estaAutenticado, primeiroNome, nomeDoPapel, precisaTrocarSenha, telaDeEntrada,
    pode, login, loginDemonstracao, conferirSessao, pedirNovaSenha, trocarSenha, logout, atualizarSessao
  }
})
