import { ref, watch } from 'vue'

// Guarda se a sidebar está recolhida. Fica fora do componente para valer em todas as telas.
const CHAVE = 'cti-nexus-menu-recolhido'

function lerPreferencia() {
  try {
    return localStorage.getItem(CHAVE) === 'sim'
  } catch {
    return false // Sem localStorage (ex.: janela anônima bloqueada) a sidebar começa aberta.
  }
}

const recolhida = ref(lerPreferencia())

watch(recolhida, valor => {
  try {
    localStorage.setItem(CHAVE, valor ? 'sim' : 'nao')
  } catch {
    // Sem localStorage a escolha vale só até recarregar a página.
  }
})

export function useMenuLateral() {
  function alternar() {
    recolhida.value = !recolhida.value
  }
  return { recolhida, alternar }
}
