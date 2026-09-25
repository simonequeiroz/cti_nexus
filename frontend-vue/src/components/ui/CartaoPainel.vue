<!-- Cartão branco com título (h2), descrição opcional e espaço para ações no cabeçalho. -->
<template>
  <section :aria-labelledby="idTitulo" class="bg-white border border-blue-secondary/80 rounded-2xl shadow-sm overflow-hidden">
    <header class="px-6 py-4 border-b border-blue-secondary/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h2 :id="idTitulo" class="font-display font-bold text-lg">{{ titulo }}</h2>
        <p v-if="descricao" class="text-xs text-regular mt-0.5">{{ descricao }}</p>
      </div>
      <slot name="acoes" />
    </header>
    <slot />
  </section>
</template>

<script setup>
import { useId } from 'vue'

defineProps({
  titulo: { type: String, required: true },
  descricao: { type: String, default: '' }
})

const idTitulo = useId() // Liga a <section> ao seu título para leitores de tela.
</script>
