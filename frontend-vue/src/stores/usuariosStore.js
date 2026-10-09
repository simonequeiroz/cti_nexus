import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validarUsuario, ultimoAdministrador } from '../utils/validacaoUsuario'

// Usuários de demonstração (um por papel) enquanto o backend Java não existe.
// Nome de pessoa, não de papel: a tela mostra os dois juntos ("Rita Andrade · Administrador").
export const USUARIOS_DEMO = [
  { id: 1, nome: 'Rita Andrade', email: 'admin@ctinexus.com', senha: '123456', papel: 'administrador', ativo: true },
  { id: 2, nome: 'Ana Lima', email: 'analista@ctinexus.com', senha: '123456', papel: 'analista', ativo: true },
  { id: 3, nome: 'Gustavo Reis', email: 'gestor@ctinexus.com', senha: '123456', papel: 'gestor', ativo: true }
]

// Nomes antigos dos usuários de demonstração (eram iguais ao papel). Quem já tinha a lista salva recebe os nomes novos.
const NOMES_ANTIGOS = { 1: 'Administrador', 2: 'Ana Operações', 3: 'Gustavo Gestão' }

// Só para a demonstração: guarda a lista no navegador para o usuário cadastrado conseguir entrar depois de recarregar.
// TODO: trocar pela API do Spring (tabela usuario, senha com BCrypt). Senha nunca deve ficar guardada no navegador de verdade.
const CHAVE = 'cti-nexus-usuarios'

function lerUsuarios() {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE))
    if (Array.isArray(salvos) && salvos.length) {
      return salvos.map(u => (NOMES_ANTIGOS[u.id] === u.nome ? { ...u, nome: USUARIOS_DEMO.find(d => d.id === u.id).nome } : u))
    }
  } catch {
    // Sem localStorage: começa com os usuários de demonstração.
  }
  return USUARIOS_DEMO.map(usuario => ({ ...usuario, criadoEm: null }))
}

export const useUsuariosStore = defineStore('usuarios', () => {
  // ===== STATE =====

  const usuarios = ref(lerUsuarios()) // Todos os usuários cadastrados.

  // ===== GETTERS =====

  const usuariosOrdenados = computed(() => [...usuarios.value].sort((a, b) => a.nome.localeCompare(b.nome)))

  const quantidadeAtivos = computed(() => usuarios.value.filter(u => u.ativo).length)

  // ===== ACTIONS =====

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(usuarios.value))
    } catch {
      // Sem localStorage o cadastro vale até recarregar a página.
    }
  }

  function autenticar(email, senha) { // Usado pelo login. Devolve o usuário ou o motivo da recusa.
    const usuario = usuarios.value.find(u => u.email === email.trim().toLowerCase() && u.senha === senha)
    if (!usuario) return { erro: 'E-mail ou senha incorretos.' }
    if (!usuario.ativo) return { erro: 'Este acesso foi desativado. Fale com o administrador.' }
    return { usuario }
  }

  function cadastrar(dados) { // Devolve os erros por campo ({} quando deu certo).
    const erros = validarUsuario(dados, usuarios.value)
    if (Object.keys(erros).length) return erros

    usuarios.value.push({
      id: Math.max(0, ...usuarios.value.map(u => u.id)) + 1,
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha,
      papel: dados.papel,
      ativo: true,
      criadoEm: new Date().toISOString()
    })
    salvar()
    return {}
  }

  function editar(id, dados) { // Muda nome, e-mail, papel e (se preenchida) a senha.
    const erros = validarUsuario(dados, usuarios.value, id)
    const usuario = usuarios.value.find(u => u.id === id)
    if (dados.papel !== 'administrador' && ultimoAdministrador(usuarios.value, id)) {
      erros.papel = 'Este é o único administrador ativo. Cadastre outro antes de mudar o papel dele.'
    }
    if (Object.keys(erros).length) return erros

    Object.assign(usuario, { nome: dados.nome.trim(), email: dados.email.trim().toLowerCase(), papel: dados.papel })
    if (dados.senha) usuario.senha = dados.senha
    salvar()
    return {}
  }

  function alternarAtivo(id) { // Desativa (ou reativa) o acesso. Não apaga: o histórico de quem fez o quê continua.
    const usuario = usuarios.value.find(u => u.id === id)
    if (usuario.ativo && ultimoAdministrador(usuarios.value, id)) return 'O único administrador ativo não pode ser desativado.'
    usuario.ativo = !usuario.ativo
    salvar()
    return ''
  }

  return {
    usuarios,
    usuariosOrdenados, quantidadeAtivos,
    autenticar, cadastrar, editar, alternarAtivo
  }
})
