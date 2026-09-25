<!-- Abertura das telas internas: etiqueta da etapa, título principal (h1) e descrição. -->
<template>
  <header>
    <RotuloSuperior class="mb-3">{{ etapa }}</RotuloSuperior>
    <h1 class="font-display font-bold text-3xl md:text-4xl tracking-tight">
      <slot name="titulo">{{ titulo }}</slot>
    </h1>
    <div class="mt-2 text-regular max-w-2xl">
      <slot />
    </div>
  </header>
</template>

<script setup>
import RotuloSuperior from '../ui/RotuloSuperior.vue'

defineProps({
  etapa: { type: String, required: true },
  titulo: { type: String, default: '' }
})
</script>
