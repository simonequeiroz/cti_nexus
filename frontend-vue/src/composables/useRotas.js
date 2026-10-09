import { ref, onMounted, onUnmounted } from 'vue'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'
import { PERMISSAO_DA_TELA } from '../constants/permissoes'

// Navegação simples pelo endereço (#login, #upload, #validacao, #relatorio, #dashboard, #usuarios). O resto abre a landing page.
// As telas internas só abrem para quem fez login e tem a permissão da tela (constants/permissoes.js).

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

    const permissao = PERMISSAO_DA_TELA[rota]
    if (permissao && !auth.estaAutenticado) return irPara('#login')
    if (permissao && !auth.pode(permissao)) return irPara(auth.telaDeEntrada) // Ex.: gestor tentando abrir #upload.
    if (rota === '#login' && auth.estaAutenticado) return irPara(auth.telaDeEntrada) // Já logado não precisa do login.

    rotaAtual.value = rota
  }

  atualizarRota()
  onMounted(() => window.addEventListener('hashchange', atualizarRota))
  onUnmounted(() => window.removeEventListener('hashchange', atualizarRota))
}
