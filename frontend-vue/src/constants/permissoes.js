// Níveis de acesso (RBAC): cada papel tem uma lista de permissões.
// Telas e botões conferem a permissão (ex.: 'corrigir_dados'), nunca o nome do papel: assim dá para mudar um papel sem mexer nas telas.
// Quando existir o back-end, estas listas viram as tabelas papel, permissao e papel_permissao (database/schema.sql),
// e o Spring confere a permissão de novo em cada rota — esconder botão no front não protege o dado sozinho.

export const PERMISSOES = {
  enviar_planilha: 'Enviar planilhas',
  corrigir_dados: 'Ver erros e corrigir linhas',
  aprovar_carga: 'Liberar os clientes aprovados para o painel', // O "L" do ETL; com o back-end, também grava no banco.
  ver_relatorio: 'Ver relatórios',
  ver_painel: 'Ver o painel da carteira',
  limpar_historico: 'Limpar o histórico de envios',
  configurar_conexoes: 'Configurar conexões', // Sem tela ainda.
  gerenciar_regras: 'Criar regras de correção', // Sem tela ainda.
  gerenciar_usuarios: 'Cadastrar usuários e definir o papel de cada um'
}

export const PAPEIS = {
  administrador: {
    nome: 'Administrador',
    descricao: 'Acesso total: cadastra usuários, configura conexões, cria regras de correção e limpa o histórico.',
    permissoes: Object.keys(PERMISSOES)
  },
  analista: {
    nome: 'Analista de Operações',
    descricao: 'Envia planilhas, vê os erros, corrige linhas e aprova a carga dos dados.',
    permissoes: ['enviar_planilha', 'corrigir_dados', 'aprovar_carga', 'ver_relatorio', 'ver_painel']
  },
  gestor: {
    nome: 'Gestor',
    descricao: 'Só consulta: vê o painel e os relatórios, sem alterar dados.',
    permissoes: ['ver_relatorio', 'ver_painel']
  }
}

// Permissão exigida por cada tela interna, na ordem da trilha do dado.
export const PERMISSAO_DA_TELA = {
  '#upload': 'enviar_planilha',
  '#validacao': 'corrigir_dados',
  '#relatorio': 'ver_relatorio',
  '#dashboard': 'ver_painel',
  '#usuarios': 'gerenciar_usuarios' // Fora da trilha do dado: aparece separado no menu.
}

export function temPermissao(papel, permissao) {
  return PAPEIS[papel]?.permissoes.includes(permissao) ?? false
}

// Para onde vai depois do login: quem envia planilha começa pelo Upload; quem só consulta, pelo painel.
export function telaInicial(papel) {
  const ordem = ['#upload', '#dashboard', '#relatorio']
  return ordem.find(tela => temPermissao(papel, PERMISSAO_DA_TELA[tela])) ?? '#login'
}
