<!-- Aviso mostrado quando ainda não há planilha processada. -->
<template>
  <section class="max-w-lg mx-auto text-center bg-white border border-blue-secondary/80 rounded-2xl p-10 shadow-sm mt-10">
    <div class="w-12 h-12 mx-auto rounded-full bg-blue-primary/10 text-blue-primary flex items-center justify-center mb-4" aria-hidden="true">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-6m3 6V7m3 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
    <h1 class="font-display font-bold text-2xl">Nenhum relatório disponível</h1>
    <p class="mt-2 text-sm text-regular">Envie e processe uma planilha na tela de upload para gerar o relatório de validação.</p>
    <BaseButton href="#upload" tamanho="lg" class="mt-6">Ir para o upload</BaseButton>
  </section>
</template>

<script setup>
import BaseButton from '../ui/BaseButton.vue'
</script>
