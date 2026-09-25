import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

// Navegação simples pelo endereço (#login, #upload, #relatorio). O resto abre a landing page.
const TELAS_PROTEGIDAS = ['#upload', '#relatorio'] // Só abrem para quem fez login.

const rotaAtual = ref(window.location.hash) // Compartilhada por todos os componentes.

function irPara(rota) {
  window.location.hash = rota
}

export function useRotas() {
  return { rotaAtual, irPara }
}

// Chamada uma única vez, no App.vue, para acompanhar as trocas de endereço.
export function iniciarRotas() {
  const auth = useAuthStore()

  function atualizarRota() {
    const rota = window.location.hash

    if (TELAS_PROTEGIDAS.includes(rota) && !auth.estaAutenticado) return irPara('#login')
    if (rota === '#login' && auth.estaAutenticado) return irPara('#upload') // Já logado não precisa do login.

    rotaAtual.value = rota
  }

  atualizarRota()
  onMounted(() => window.addEventListener('hashchange', atualizarRota))
  onUnmounted(() => window.removeEventListener('hashchange', atualizarRota))
}
