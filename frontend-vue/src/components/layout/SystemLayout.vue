<!-- Estrutura comum das telas internas: cabeçalho + conteúdo principal. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-6 py-10">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
</script>
