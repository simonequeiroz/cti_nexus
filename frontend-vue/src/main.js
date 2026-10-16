import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router' // Rotas do sistema (Vue Router).

const app = createApp(App)

app.use(createPinia()) // Ativa o Pinia na aplicação.
app.use(router) // Ativa o Vue Router na aplicação.
app.mount('#app')
