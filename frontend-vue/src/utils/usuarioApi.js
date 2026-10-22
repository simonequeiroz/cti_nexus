// Conversões entre o formato da API (Spring Boot) e o formato que as telas já usavam.
// A API manda papel e situação em MAIÚSCULAS (ex.: "ANALISTA", "PENDENTE"); as telas usam
// papel em minúsculas ('analista', igual ao constants/permissoes.js) e ativo/pendente como verdadeiro ou falso.

export function usuarioDaApi(u) { // Um usuário que veio da API -> formato das telas.
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    cargo: u.cargo ?? '',
    papel: u.papel ? u.papel.toLowerCase() : null, // null = pedido de acesso ainda sem papel.
    ativo: u.situacao === 'ATIVO',
    pendente: u.situacao === 'PENDENTE',
    criadoEm: u.criadoEm
  }
}

export function papelParaApi(papel) { // 'analista' -> 'ANALISTA'
  return papel ? papel.toUpperCase() : null
}

// Mensagem para mostrar na tela quando uma chamada à API dá errado.
export function mensagemDeErro(erro) {
  if (!erro.response) return 'Não foi possível falar com o servidor. Confira se o back-end está ligado e tente de novo.' // API desligada ou sem internet.
  return erro.response.data?.mensagem ?? 'Algo deu errado no servidor. Tente de novo.'
}

// Erros por campo para os formulários (ex.: { email: 'Já existe...' }), no mesmo formato do utils/validacaoUsuario.js.
// Se o erro não é de um campo, vem em "geral" (o formulário mostra acima do botão).
export function errosDeCampo(erro) {
  const campos = erro.response?.data?.campos
  return campos && Object.keys(campos).length ? { ...campos } : { geral: mensagemDeErro(erro) }
}
