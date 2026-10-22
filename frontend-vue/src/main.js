import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router' // Rotas do sistema (Vue Router).
import api from './services/api' // Chamadas à API do Spring.
import { useAutenticacaoStore } from './stores/autenticacaoStore'

const app = createApp(App)

app.use(createPinia()) // Ativa o Pinia na aplicação.
app.use(router) // Ativa o Vue Router na aplicação.

const auth = useAutenticacaoStore()

// Roda depois de toda resposta da API. 401 com alguém logado = token vencido ou usuário desativado:
// sai do sistema e volta para o login. (No próprio login, 401 é só senha errada, e não há ninguém logado.)
api.interceptors.response.use(
  resposta => resposta,
  erro => {
    if (erro.response?.status === 401 && auth.estaAutenticado) {
      auth.logout()
      router.push('/login')
    }
    return Promise.reject(erro) // Deixa quem chamou tratar o erro também.
  }
)

auth.conferirSessao() // Página recarregada com alguém logado: confere na API se o acesso ainda vale.

app.mount('#app')
