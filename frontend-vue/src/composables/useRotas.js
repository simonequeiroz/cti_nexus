import { ref, onMounted, onUnmounted } from 'vue'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'

// Navegação simples pelo endereço (#login, #upload, #validacao, #relatorio, #dashboard). O resto abre a landing page.
const TELAS_PROTEGIDAS = ['#upload', '#validacao', '#relatorio', '#dashboard'] // Só abrem para quem fez login.

const rotaAtual = ref(window.location.hash) // Compartilhada por todos os componentes.

function irPara(rota) {
  window.location.hash = rota
}

export function useRotas() {
  return { rotaAtual, irPara }
}

// Chamada uma única vez, no App.vue, para acompanhar as trocas de endereço.
export function iniciarRotas() {
  const auth = useAutenticacaoStore()

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
