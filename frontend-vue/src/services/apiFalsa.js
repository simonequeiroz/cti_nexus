// API de mentira, SÓ PARA OS TESTES (npm test): imita as respostas do back-end Spring sem precisar ligá-lo.
// Os testes trocam o services/api.js por este arquivo com: vi.mock('../services/api', () => import('../services/apiFalsa'))
// As regras imitam o AutenticacaoService e o UsuarioService do backend-java (mesmas mensagens e códigos HTTP).

let usuarios = []
let proximoId = 1
let logado = null // Quem fez o último login (no lugar de conferir o token).

function usuarioInicial(nome, email, papel) {
  return { id: proximoId++, nome, email, senha: '123456', cargo: null, papel, situacao: 'ATIVO', criadoEm: '2026-10-22T10:00:00', deveTrocarSenha: false, pediuNovaSenhaEm: null }
}

// Volta ao começo: os 3 usuários que o DadosIniciais.java cria. Chamar no beforeEach de cada teste.
function reiniciar() {
  proximoId = 1
  logado = null
  usuarios = [
    usuarioInicial('Administrador', 'admin@ctinexus.com', 'ADMINISTRADOR'),
    usuarioInicial('Ana Lima', 'analista@ctinexus.com', 'ANALISTA'),
    usuarioInicial('Gustavo Reis', 'gestor@ctinexus.com', 'GESTOR')
  ]
}
reiniciar()

// Igual ao UsuarioResponse.java: tudo menos a senha.
function resposta({ senha, ...semSenha }) {
  return semSenha
}

// Igual ao erro do axios quando a API responde com erro: erro.response.status e erro.response.data.
function falhar(status, mensagem, campo) {
  const erro = new Error(mensagem)
  erro.response = { status, data: { status, mensagem, campos: campo ? { [campo]: mensagem } : {} } }
  throw erro
}

const normalizar = email => email.trim().toLowerCase()
const buscar = id => usuarios.find(u => u.id === Number(id)) ?? falhar(404, 'Usuário não encontrado.')
const emailEmUso = (email, id) => usuarios.some(u => u.email === email && u.id !== id)
const adminsAtivos = () => usuarios.filter(u => u.papel === 'ADMINISTRADOR' && u.situacao === 'ATIVO').length
const ultimoAdmin = u => u.papel === 'ADMINISTRADOR' && u.situacao === 'ATIVO' && adminsAtivos() <= 1

const rotas = {
  'POST /auth/login': ({ email, senha }) => {
    const u = usuarios.find(x => x.email === normalizar(email))
    if (!u || u.senha !== senha) falhar(401, 'E-mail ou senha incorretos.')
    if (u.situacao === 'PENDENTE') falhar(403, 'Seu pedido de acesso ainda não foi aprovado pelo administrador.')
    if (u.situacao === 'DESATIVADO') falhar(403, 'Este usuário foi desativado. Fale com o administrador.')
    logado = u
    u.pediuNovaSenhaEm = null // Lembrou a senha: o pedido de nova senha não precisa mais.
    return { token: `token-falso-${u.id}`, tipo: 'Bearer', usuario: resposta(u) }
  },
  'POST /auth/esqueci-senha': ({ email }) => {
    const u = usuarios.find(x => x.email === normalizar(email) && x.situacao === 'ATIVO')
    if (u) u.pediuNovaSenhaEm = new Date().toISOString()
    return { mensagem: 'Solicitação registrada. Se o e-mail estiver cadastrado, o administrador enviará uma senha temporária.' } // Igual, exista ou não.
  },
  'POST /auth/trocar-senha': ({ senhaAtual, senhaNova }) => {
    const u = logado ?? falhar(401, 'Sem login.')
    if (u.senha !== senhaAtual) falhar(400, 'A senha atual não confere.', 'senhaAtual')
    if (senhaNova === senhaAtual) falhar(400, 'A nova senha precisa ser diferente da atual.', 'senhaNova')
    Object.assign(u, { senha: senhaNova, deveTrocarSenha: false, pediuNovaSenhaEm: null })
    return resposta(u)
  },
  'POST /auth/cadastro': ({ nome, email, cargo, senha }) => {
    if (emailEmUso(normalizar(email))) falhar(409, 'Já existe um usuário ou pedido de acesso com esse e-mail.', 'email')
    const u = { id: proximoId++, nome: nome.trim(), email: normalizar(email), senha, cargo: cargo?.trim() || null, papel: null, situacao: 'PENDENTE', criadoEm: new Date().toISOString(), deveTrocarSenha: false, pediuNovaSenhaEm: null }
    usuarios.push(u)
    return resposta(u)
  },
  'GET /auth/me': () => resposta(logado ?? falhar(401, 'Sem login.')),
  'GET /admin/usuarios': () => usuarios.map(resposta),
  'POST /admin/usuarios': ({ nome, email, senha, papel }) => {
    if (emailEmUso(normalizar(email))) falhar(409, 'Já existe um usuário ou pedido de acesso com esse e-mail.', 'email')
    const u = { id: proximoId++, nome: nome.trim(), email: normalizar(email), senha, cargo: null, papel, situacao: 'ATIVO', criadoEm: new Date().toISOString(), deveTrocarSenha: true, pediuNovaSenhaEm: null }
    usuarios.push(u)
    return resposta(u)
  },
  'PUT /admin/usuarios/:id': ({ nome, email, senha, papel }, id) => {
    const u = buscar(id)
    if (emailEmUso(normalizar(email), u.id)) falhar(409, 'Já existe um usuário ou pedido de acesso com esse e-mail.', 'email')
    if (papel !== u.papel && u.id === logado?.id) falhar(409, 'Você não pode mudar o seu próprio papel.', 'papel')
    Object.assign(u, { nome: nome.trim(), email: normalizar(email), papel },
      senha ? { senha, deveTrocarSenha: u.id !== logado?.id, pediuNovaSenhaEm: null } : {}) // Senha de outra pessoa = temporária.
    return resposta(u)
  },
  'PATCH /admin/usuarios/:id/status': ({ situacao, papel }, id) => {
    const u = buscar(id)
    if (u.id === logado?.id) falhar(409, 'Você não pode alterar a sua própria situação ou papel.')
    const novoPapel = papel ?? u.papel
    if (novoPapel !== 'ADMINISTRADOR' || situacao !== 'ATIVO') {
      if (ultimoAdmin(u)) falhar(409, 'O único administrador ativo não pode ser desativado.')
    }
    Object.assign(u, { situacao, papel: novoPapel })
    return resposta(u)
  },
  'PATCH /admin/usuarios/:id/senha': ({ senha }, id) => {
    const u = buscar(id)
    if (u.id === logado?.id) falhar(409, 'Para mudar a sua própria senha, use Editar.')
    Object.assign(u, { senha, deveTrocarSenha: true, pediuNovaSenhaEm: null })
    return resposta(u)
  },
  'DELETE /admin/usuarios/:id': (_, id) => {
    const u = buscar(id)
    if (u.situacao !== 'PENDENTE') falhar(409, 'Só pedidos pendentes podem ser recusados.')
    usuarios = usuarios.filter(x => x !== u)
    return ''
  }
}

// Acha a rota: "/admin/usuarios/7/status" casa com "/admin/usuarios/:id/status" (id = 7).
async function chamar(metodo, endereco, corpo) {
  for (const [chave, executar] of Object.entries(rotas)) {
    const [m, modelo] = chave.split(' ')
    const padrao = new RegExp('^' + modelo.replace(':id', '(\\d+)') + '$')
    const achou = m === metodo && endereco.match(padrao)
    if (achou) return { data: structuredClone(executar(corpo ?? {}, achou[1])) } // Cópia, como se viesse pela rede.
  }
  falhar(404, `Rota não existe: ${metodo} ${endereco}`)
}

export default {
  get: endereco => chamar('GET', endereco),
  post: (endereco, corpo) => chamar('POST', endereco, corpo),
  put: (endereco, corpo) => chamar('PUT', endereco, corpo),
  patch: (endereco, corpo) => chamar('PATCH', endereco, corpo),
  delete: endereco => chamar('DELETE', endereco),
  interceptors: { request: { use() {} }, response: { use() {} } },
  reiniciar
}
