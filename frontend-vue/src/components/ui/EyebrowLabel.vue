<!-- Texto pequeno acima dos títulos, com o ponto laranja da identidade visual. -->
<template>
  <p class="text-xs font-bold tracking-widest uppercase flex items-center gap-2" :class="claro ? 'text-blue-secondary' : 'text-blue-primary'">
    <span class="w-2 h-2 bg-orange rounded-full" aria-hidden="true"></span>
    <slot />
  </p>
</template>

<script setup>
defineProps({
  claro: { type: Boolean, default: false } // true para fundos escuros.
})
</script>
