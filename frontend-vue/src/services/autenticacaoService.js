// Chamadas de login e pedido de acesso à API do Spring (AutenticacaoController.java, rotas /api/auth/...).
// Cada função é uma rota. Quem usa: stores/autenticacaoStore.js e stores/usuariosStore.js.
// Se a API responder com erro (ex.: 401 senha errada), o axios lança o erro e quem chamou trata.
import api from './api'

// POST /api/auth/login  →  { token, tipo: 'Bearer', usuario }
export async function entrar(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha })
  return data
}

// POST /api/auth/cadastro  →  usuário criado como PENDENTE (espera o administrador aprovar)
export async function pedirAcesso({ nome, email, cargo, senha }) {
  const { data } = await api.post('/auth/cadastro', { nome, email, cargo, senha })
  return data
}

// GET /api/auth/me  →  dados de quem é dono do token (confere se o login ainda vale)
export async function buscarUsuarioLogado() {
  const { data } = await api.get('/auth/me')
  return data
}
