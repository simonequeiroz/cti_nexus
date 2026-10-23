import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router' // Rotas do sistema (Vue Router).
import { useAutenticacaoStore } from './stores/autenticacaoStore'

const app = createApp(App)

app.use(createPinia()) // Ativa o Pinia na aplicação.
app.use(router) // Ativa o Vue Router na aplicação.

// Página recarregada com alguém logado: confere na API se o acesso ainda vale (GET /auth/me).
// Se o acesso venceu, a resposta 401 é tratada no services/api.js (sai e volta para o login).
useAutenticacaoStore().conferirSessao()

app.mount('#app')
