<!-- Etiqueta arredondada. A cor vem pronta de constants/validacao.js. -->
<template>
  <span class="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" :class="cor">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  cor: { type: String, default: 'bg-blue-secondary/50 text-regular' }
})
</script>
