// Regras do cadastro de usuário (tela Usuários). Função pura: recebe os dados e devolve os erros por campo.
import { PAPEIS } from '../constants/permissoes'

export const SENHA_MINIMA = 6

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// dados: { nome, email, senha, confirmacao, papel }. usuarios: lista já cadastrada (inclui os pedidos de acesso).
// idEditado: na edição, o id do próprio usuário (não conta como e-mail repetido e a senha pode ficar em branco).
export function validarUsuario(dados, usuarios, idEditado = null) {
  const erros = validarDadosPessoais(dados, usuarios, idEditado)
  if (!PAPEIS[dados.papel]) erros.papel = 'Escolha o papel do usuário.'
  return erros
}

// Pedido de acesso feito na tela de login: mesmas regras, mas sem papel (quem escolhe é o administrador, ao aprovar).
export function validarPedidoAcesso(dados, usuarios) {
  return validarDadosPessoais(dados, usuarios)
}

function validarDadosPessoais(dados, usuarios, idEditado = null) {
  const erros = {}
  const nome = dados.nome?.trim() ?? ''
  const email = dados.email?.trim().toLowerCase() ?? ''
  const editando = idEditado !== null

  if (nome.length < 3) erros.nome = 'Informe o nome completo (pelo menos 3 letras).'

  if (!email) erros.email = 'Informe o e-mail.'
  else if (!FORMATO_EMAIL.test(email)) erros.email = 'E-mail inválido. Ex.: nome@empresa.com'
  else if (usuarios.some(u => u.email === email && u.id !== idEditado)) erros.email = 'Já existe um usuário ou pedido de acesso com esse e-mail.'

  // Na edição, senha em branco = manter a atual.
  if (!editando || dados.senha) {
    if ((dados.senha ?? '').length < SENHA_MINIMA) erros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
    else if (dados.senha !== dados.confirmacao) erros.confirmacao = 'As senhas não são iguais.'
  }

  return erros
}

// O sistema nunca pode ficar sem um administrador ativo (senão ninguém mais cadastra usuários).
export function ultimoAdministrador(usuarios, id) {
  const adminsAtivos = usuarios.filter(u => u.papel === 'administrador' && u.ativo)
  return adminsAtivos.length === 1 && adminsAtivos[0].id === id
}
