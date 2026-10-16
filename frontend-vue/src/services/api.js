// Comunicação com a API do Spring Boot. O front nunca acessa o banco direto: Vue → axios → API → PostgreSQL.
// As telas e stores usam assim: import api from '../services/api' e depois api.post('/auth/login', { ... }).
import axios from 'axios' // Biblioteca que faz as chamadas HTTP.

const api = axios.create({ // Cópia do axios já configurada, usada em todo o projeto.
  baseURL: import.meta.env.VITE_API_URL, // Endereço do back-end, lido do arquivo .env (ex.: http://localhost:8080).
  headers: {
    'Content-Type': 'application/json' // Os dados vão para a API no formato JSON.
  }
})

// Roda antes de toda chamada: se a pessoa fez login, manda o token (o "crachá") para o back-end saber quem está pedindo.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') // sessionStorage, como a sessão do login: fechou a aba, saiu.
  if (token) {
    config.headers.Authorization = `Bearer ${token}` // Formato que o Spring Security espera.
  }
  return config // Deixa a chamada seguir.
})

export default api // Permite importar o api nas outras partes do sistema.
