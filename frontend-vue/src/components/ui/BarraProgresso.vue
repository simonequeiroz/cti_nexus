<!-- Barra horizontal proporcional. A largura é o único estilo calculado em tempo real. -->
<template>
  <div class="rounded-full bg-blue-secondary/30 overflow-hidden" :class="altura" aria-hidden="true">
    <div class="h-full rounded-full" :class="cor" :style="{ width: porcentagem(valor, maximo) }"></div>
  </div>
</template>

<script setup>
import { porcentagem } from '../../utils/formatadores'

defineProps({
  valor: { type: Number, required: true },
  maximo: { type: Number, required: true },
  cor: { type: String, default: 'bg-blue-primary' },
  altura: { type: String, default: 'h-2' }
})
</script>
