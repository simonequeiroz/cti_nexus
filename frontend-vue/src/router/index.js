// Rotas do sistema (Vue Router): liga cada endereço a uma tela e confere login e permissão antes de abrir.
// Esconder a tela no front é conforto para o usuário; quem protege o dado de verdade é o Spring, em cada rota da API.
import { createRouter, createWebHashHistory } from 'vue-router' // Ferramentas do Vue Router.
import { useAutenticacaoStore } from '../stores/autenticacaoStore' // Store do login: quem entrou e o que pode fazer.
import PaginaInicial from '../views/PaginaInicial.vue'
import PaginaLogin from '../views/PaginaLogin.vue'
import PaginaCadastro from '../views/PaginaCadastro.vue'
import PaginaUpload from '../views/PaginaUpload.vue'
import PaginaValidacao from '../views/PaginaValidacao.vue'
import PaginaRelatorio from '../views/PaginaRelatorio.vue'
import PaginaDashboard from '../views/PaginaDashboard.vue'
import PaginaUsuarios from '../views/PaginaUsuarios.vue'
import PaginaTrocarSenha from '../views/PaginaTrocarSenha.vue'

const router = createRouter({
  // Endereços com # (ex.: #/upload): trocar de tela não recarrega a página, então a planilha carregada não se perde,
  // e a Vercel não precisa de configuração extra para abrir /upload direto.
  history: createWebHashHistory(),
  routes: [
    // publica: tela de quem ainda não entrou. permissao: o que o papel precisa ter para abrir (constants/permissoes.js).
    { path: '/', component: PaginaInicial }, // Página de apresentação, aberta para todos.
    { path: '/login', component: PaginaLogin, meta: { publica: true } },
    { path: '/cadastro', component: PaginaCadastro, meta: { publica: true } }, // Pedido de acesso.
    { path: '/trocar-senha', component: PaginaTrocarSenha, meta: { trocarSenha: true } }, // Depois de entrar com senha temporária.
    { path: '/upload', component: PaginaUpload, meta: { permissao: 'enviar_planilha' } },
    { path: '/validacao', component: PaginaValidacao, meta: { permissao: 'corrigir_dados' } },
    { path: '/relatorio', component: PaginaRelatorio, meta: { permissao: 'ver_relatorio' } },
    { path: '/dashboard', component: PaginaDashboard, meta: { permissao: 'ver_painel' } },
    { path: '/usuarios', component: PaginaUsuarios, meta: { permissao: 'gerenciar_usuarios' } }, // Só administrador.
    { path: '/:pathMatch(.*)*', redirect: '/' } // Endereço que não existe: volta para a página inicial.
  ]
})

// Roda antes de abrir qualquer tela. "to" é a tela que a pessoa quer abrir; sem return, a tela abre normalmente.
router.beforeEach((to) => {
  const auth = useAutenticacaoStore()
  const telaDeEntrada = auth.telaDeEntrada

  if (to.meta.permissao && !auth.estaAutenticado) return '/login' // Tela interna sem login: vai para o login.
  // "Crie sua nova senha": só para quem entrou com senha temporária. Quem já trocou vai para a tela de sempre.
  if (to.meta.trocarSenha) return auth.estaAutenticado ? (auth.precisaTrocarSenha ? undefined : telaDeEntrada) : '/login'
  // Com senha temporária, pode() responde não para tudo, então a linha de baixo manda para /trocar-senha.
  if (to.meta.permissao && !auth.pode(to.meta.permissao)) return telaDeEntrada // Ex.: gestor abrindo /usuarios.
  if (to.meta.publica && auth.estaAutenticado) return telaDeEntrada // Já entrou: não precisa de login nem de cadastro.
})

export default router // Usado no main.js com app.use(router).
