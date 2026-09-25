<!-- Logo do CTI Nexus com link para a página inicial. -->
<template>
  <a
    href="#"
    class="flex items-center gap-2 font-display font-bold text-xl tracking-tight"
    :class="claro ? 'text-white' : 'text-black-dark'"
    aria-label="CTI Nexus — página inicial"
  >
    <span class="w-2.5 h-2.5 bg-blue-primary rounded-full inline-block shadow-glow" aria-hidden="true"></span>
    CTI <span class="text-blue-primary">Nexus</span>
  </a>
</template>

<script setup>
defineProps({
  claro: { type: Boolean, default: false } // true para fundos escuros.
})
</script>
