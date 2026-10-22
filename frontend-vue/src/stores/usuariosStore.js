import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PAPEIS } from '../constants/permissoes'
import api from '../services/api'
import { validarUsuario, validarPedidoAcesso, ultimoAdministrador } from '../utils/validacaoUsuario'
import { usuarioDaApi, papelParaApi, mensagemDeErro, errosDeCampo } from '../utils/usuarioApi'

// Usuários e pedidos de acesso, guardados no banco pelo back-end (tabela usuario, senha com BCrypt).
// Rotas usadas (só o administrador, menos o pedido de acesso, que é público):
//   POST /auth/cadastro                 pedido de acesso (tela #/cadastro)
//   GET /admin/usuarios                 lista
//   POST /admin/usuarios                cadastrar   |  PUT /admin/usuarios/{id}  editar
//   PATCH /admin/usuarios/{id}/status   aprovar, desativar, reativar
//   DELETE /admin/usuarios/{id}         recusar pedido
// As regras do formulário (utils/validacaoUsuario.js) rodam antes, para avisar na hora; a API confere tudo de novo.

export const useUsuariosStore = defineStore('usuarios', () => {
  // ===== STATE =====

  // Todos os usuários, incluindo os pedidos de acesso (pendente: true, sem papel, sem acesso).
  const usuarios = ref([])
  const carregando = ref(false)
  const erro = ref('') // Mensagem se a lista não carregou (ex.: back-end desligado).

  // ===== GETTERS =====

  const cadastrados = computed(() => usuarios.value.filter(u => !u.pendente))

  const usuariosOrdenados = computed(() => [...cadastrados.value].sort((a, b) => a.nome.localeCompare(b.nome)))

  const pedidosPendentes = computed(() => usuarios.value
    .filter(u => u.pendente)
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))) // Mais antigo primeiro.

  const quantidadeAtivos = computed(() => usuarios.value.filter(u => u.ativo).length)

  // ===== ACTIONS =====

  async function carregar() { // Busca a lista no banco. Chamado pelo LayoutSistema quando quem entrou é administrador.
    carregando.value = true
    erro.value = ''
    try {
      const { data } = await api.get('/admin/usuarios')
      usuarios.value = data.map(usuarioDaApi)
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  // Troca o usuário da lista pela versão que a API devolveu. Object.assign mantém o mesmo objeto,
  // então quem já estava mostrando esse usuário (ex.: o formulário de edição) vê os dados novos.
  function atualizarNaLista(dadosDaApi) {
    const novo = usuarioDaApi(dadosDaApi)
    const atual = usuarios.value.find(u => u.id === novo.id)
    if (atual) Object.assign(atual, novo)
    else usuarios.value.push(novo)
  }

  // Feito na tela de pedido de acesso, sem estar logado. Devolve os erros por campo ({} quando deu certo).
  async function pedirAcesso(dados) {
    const erros = validarPedidoAcesso(dados, usuarios.value)
    if (Object.keys(erros).length) return erros

    try {
      await api.post('/auth/cadastro', { nome: dados.nome, email: dados.email, cargo: dados.cargo, senha: dados.senha })
      return {}
    } catch (e) {
      return errosDeCampo(e) // Ex.: { email: 'Já existe um usuário ou pedido de acesso com esse e-mail.' }
    }
  }

  async function cadastrar(dados) { // Administrador cadastra direto, já com papel. Devolve os erros por campo.
    const erros = validarUsuario(dados, usuarios.value)
    if (Object.keys(erros).length) return erros

    try {
      const { data } = await api.post('/admin/usuarios', paraApi(dados))
      atualizarNaLista(data)
      return {}
    } catch (e) {
      return errosDeCampo(e)
    }
  }

  async function editar(id, dados) { // Muda nome, e-mail, papel e (se preenchida) a senha.
    const erros = validarUsuario(dados, usuarios.value, id)
    if (dados.papel !== 'administrador' && ultimoAdministrador(usuarios.value, id)) {
      erros.papel = 'Este é o único administrador ativo. Cadastre outro antes de mudar o papel dele.'
    }
    if (Object.keys(erros).length) return erros

    try {
      const { data } = await api.put(`/admin/usuarios/${id}`, paraApi(dados))
      atualizarNaLista(data)
      return {}
    } catch (e) {
      return errosDeCampo(e)
    }
  }

  async function aprovarPedido(id, papel) { // O administrador escolhe o papel e libera a entrada. Devolve '' ou o problema.
    if (!PAPEIS[papel]) return 'Escolha o papel antes de aprovar.'
    return mudarSituacao(id, { situacao: 'ATIVO', papel: papelParaApi(papel) })
  }

  async function alternarAtivo(id) { // Desativa (ou reativa) o acesso. Não apaga: o histórico de quem fez o quê continua.
    const usuario = usuarios.value.find(u => u.id === id)
    if (usuario.ativo && ultimoAdministrador(usuarios.value, id)) return 'O único administrador ativo não pode ser desativado.'
    return mudarSituacao(id, { situacao: usuario.ativo ? 'DESATIVADO' : 'ATIVO' })
  }

  async function recusarPedido(id) { // Apaga o pedido: a pessoa nunca teve acesso, então não há histórico a guardar.
    try {
      await api.delete(`/admin/usuarios/${id}`)
      usuarios.value = usuarios.value.filter(u => u.id !== id)
      return ''
    } catch (e) {
      return mensagemDeErro(e)
    }
  }

  async function mudarSituacao(id, corpo) {
    try {
      const { data } = await api.patch(`/admin/usuarios/${id}/status`, corpo)
      atualizarNaLista(data)
      return ''
    } catch (e) {
      return mensagemDeErro(e)
    }
  }

  // Formato que a API espera (UsuarioAdminRequest.java). Senha vazia na edição = manter a atual.
  function paraApi(dados) {
    return { nome: dados.nome, email: dados.email, senha: dados.senha || null, papel: papelParaApi(dados.papel) }
  }

  return {
    usuarios, carregando, erro,
    cadastrados, usuariosOrdenados, pedidosPendentes, quantidadeAtivos,
    carregar, pedirAcesso, cadastrar, editar, aprovarPedido, recusarPedido, alternarAtivo
  }
})
