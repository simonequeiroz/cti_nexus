<!-- Mostra a página de acordo com o endereço (#login, #upload, #validacao, #relatorio, #dashboard, #usuarios ou a landing page). -->
<template>
  <component :is="PAGINAS[rotaAtual] ?? PaginaInicial" />
</template>

<script setup>
import PaginaInicial from './pages/PaginaInicial.vue'
import PaginaLogin from './pages/PaginaLogin.vue'
import PaginaUpload from './pages/PaginaUpload.vue'
import PaginaValidacao from './pages/PaginaValidacao.vue'
import PaginaRelatorio from './pages/PaginaRelatorio.vue'
import PaginaDashboard from './pages/PaginaDashboard.vue'
import PaginaUsuarios from './pages/PaginaUsuarios.vue'
import { useRotas, iniciarRotas } from './composables/useRotas'

const PAGINAS = {
  '#login': PaginaLogin,
  '#upload': PaginaUpload,
  '#validacao': PaginaValidacao,
  '#relatorio': PaginaRelatorio,
  '#dashboard': PaginaDashboard,
  '#usuarios': PaginaUsuarios
}

iniciarRotas()
const { rotaAtual } = useRotas()
</script>
