// Comunicação com a API do Spring Boot (pasta backend-java). O front nunca acessa o banco direto:
// Vue (tela) → store (Pinia) → service → axios → API Spring → PostgreSQL (Neon).
// Este arquivo só prepara o axios. As rotas de cada parte ficam nos outros services:
//   autenticacaoService.js  → /auth/login, /auth/cadastro, /auth/me   (AutenticacaoController.java)
//   usuariosService.js      → /admin/usuarios                         (AdminUsuarioController.java)
import axios from 'axios' // Biblioteca que faz as chamadas HTTP.

// Endereço do back-end: vem do arquivo .env (VITE_API_URL). O .env não vai para o GitHub,
// então, se ele não existir, usa o endereço do Spring rodando neste computador.
export const ENDERECO_API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({ // Cópia do axios já configurada, usada em todo o projeto.
  baseURL: ENDERECO_API, // Toda chamada começa com este endereço: api.post('/auth/login') → http://localhost:8080/api/auth/login
  headers: {
    'Content-Type': 'application/json' // Os dados vão para a API no formato JSON.
  }
})

// Roda antes de toda chamada: se a pessoa fez login, manda o token (o "crachá") para o back-end saber quem está pedindo.
// Quem confere o token do outro lado é o JwtFiltroAutenticacao.java.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') // sessionStorage, como a sessão do login: fechou a aba, saiu.
  if (token) {
    config.headers.Authorization = `Bearer ${token}` // Formato que o Spring Security espera.
  }
  return config // Deixa a chamada seguir.
})

export default api // Usado pelos outros services e pelo main.js.
