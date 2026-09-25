<!-- Estrutura comum das telas internas: trilha do dado (desktop) ou cabeçalho (celular) + conteúdo principal. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen lg:flex lg:items-start">
    <TrilhaDados class="hidden lg:flex" />

    <div class="flex-1 min-w-0">
      <CabecalhoSistema class="lg:hidden" />
      <main class="max-w-7xl mx-auto px-6 py-10">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import CabecalhoSistema from './CabecalhoSistema.vue'
import TrilhaDados from './TrilhaDados.vue'
</script>
