// Comunicação com a API do Spring Boot (pasta backend-java). O front nunca acessa o banco direto:
// Vue (tela) → store (Pinia) → service → axios → API Spring → PostgreSQL (Neon).
// Este arquivo só prepara o axios. As rotas de cada parte ficam nos outros services:
//   autenticacaoService.js  → /auth/login, /auth/cadastro, /auth/me, /auth/esqueci-senha, /auth/trocar-senha   (AutenticacaoController.java)
//   usuariosService.js      → /admin/usuarios                         (AdminUsuarioController.java)
import axios from 'axios' // Biblioteca que faz as chamadas HTTP.
import router from '../router' // Para voltar ao login quando o acesso vencer.
import { useAutenticacaoStore } from '../stores/autenticacaoStore' // Para sair da conta quando o acesso vencer.

// Endereço do back-end: vem do arquivo .env (VITE_API_URL). O .env não vai para o GitHub,
// então, se ele não existir, usa o endereço do Spring rodando neste computador.
export const ENDERECO_API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({ // Cópia do axios já configurada, usada em todo o projeto.
  baseURL: ENDERECO_API, // Toda chamada começa com este endereço: api.post('/auth/login') → http://localhost:8080/api/auth/login
  timeout: 30000, // 30 segundos: se o back-end não responder (travou ou o Render está "acordando"), mostra erro em vez de esperar para sempre.
  headers: {
    'Content-Type': 'application/json' // Os dados vão para a API no formato JSON.
  }
})

// ===== IDA: roda antes de toda chamada =====
// Se a pessoa fez login, manda o token (o "crachá") para o back-end saber quem está pedindo.
// Quem confere o token do outro lado é o JwtFiltroAutenticacao.java.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') // sessionStorage, como a sessão do login: fechou a aba, saiu.
  if (token) {
    config.headers.Authorization = `Bearer ${token}` // Formato que o Spring Security espera.
  }
  return config // Deixa a chamada seguir.
})

// ===== VOLTA: roda depois de toda resposta =====
// 401 com alguém logado = token vencido ou usuário desativado pelo administrador: sai da conta e volta para o login.
// (No próprio login, 401 é só senha errada, e ainda não há ninguém logado, então não entra aqui.)
api.interceptors.response.use(
  resposta => resposta, // Deu certo: entrega a resposta para quem chamou.
  erro => {
    const auth = useAutenticacaoStore()
    if (erro.response?.status === 401 && auth.estaAutenticado) {
      auth.logout()
      router.push('/login')
    }
    return Promise.reject(erro) // Deixa quem chamou tratar o erro também (ex.: mostrar a mensagem na tela).
  }
)

export default api // Usado pelos outros services (autenticacaoService.js e usuariosService.js).
