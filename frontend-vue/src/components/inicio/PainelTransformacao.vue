<!-- Painel ilustrativo: a planilha como chega → o dashboard depois do tratamento. -->
<template>
  <figure
    class="border border-blue-secondary/80 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_60px_1fr] bg-white/90 backdrop-blur-md shadow-2xl"
    aria-label="Exemplo de uma planilha antes e depois do tratamento"
  >
    <PreviaPlanilha />

    <div class="hidden md:flex items-center justify-center bg-surface border-x border-blue-secondary/80" aria-hidden="true">
      <svg class="w-7 h-7 text-blue-primary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>

    <PreviaPainel />
  </figure>
</template>

<script setup>
import PreviaPlanilha from './PreviaPlanilha.vue'
import PreviaPainel from './PreviaPainel.vue'
</script>
