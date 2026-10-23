// Chamadas da tela Usuários à API do Spring (AdminUsuarioController.java, rotas /api/admin/usuarios).
// Só o administrador consegue: o Spring confere a permissão "gerenciar_usuarios" e devolve 403 para os outros.
// Quem usa: stores/usuariosStore.js.
import api from './api'

// GET /api/admin/usuarios  →  todos os usuários, inclusive pedidos pendentes
export async function listarUsuarios() {
  const { data } = await api.get('/admin/usuarios')
  return data
}

// POST /api/admin/usuarios  →  administrador cadastra já com papel (ativo)
export async function cadastrarUsuario(dados) {
  const { data } = await api.post('/admin/usuarios', dados)
  return data
}

// PUT /api/admin/usuarios/{id}  →  editar nome, e-mail, papel e (opcional) senha
export async function editarUsuario(id, dados) {
  const { data } = await api.put(`/admin/usuarios/${id}`, dados)
  return data
}

// PATCH /api/admin/usuarios/{id}/status  →  aprovar { situacao: 'ATIVO', papel }, desativar ou reativar
export async function alterarSituacao(id, situacao, papel = null) {
  const { data } = await api.patch(`/admin/usuarios/${id}/status`, { situacao, papel })
  return data
}

// PATCH /api/admin/usuarios/{id}/senha  →  senha temporária para quem pediu "Esqueci minha senha"
export async function definirSenhaTemporaria(id, senha) {
  const { data } = await api.patch(`/admin/usuarios/${id}/senha`, { senha })
  return data
}

// DELETE /api/admin/usuarios/{id}  →  recusar pedido de acesso (só pendentes)
export async function recusarPedido(id) {
  await api.delete(`/admin/usuarios/${id}`)
}
