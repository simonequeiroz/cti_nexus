<!-- Mostra a página de acordo com o endereço (#login, #upload, #relatorio ou a landing page). -->
<template>
  <component :is="PAGINAS[rotaAtual] ?? LandingPage" />
</template>

<script setup>
import LandingPage from './pages/LandingPage.vue'
import LoginPage from './pages/LoginPage.vue'
import UploadPage from './pages/UploadPage.vue'
import ReportPage from './pages/ReportPage.vue'
import { useRotas, iniciarRotas } from './composables/useRotas'

const PAGINAS = {
  '#login': LoginPage,
  '#upload': UploadPage,
  '#relatorio': ReportPage
}

iniciarRotas()
const { rotaAtual } = useRotas()
</script>
