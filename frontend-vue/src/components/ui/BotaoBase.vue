<!-- Botão padrão do sistema. Vira <a> quando recebe href e <button> nos outros casos. -->
<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : tipo"
    class="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-primary"
    :class="[VARIANTES[variante], TAMANHOS[tamanho]]"
  >
    <slot />
  </component>
</template>

<script setup>
defineProps({
  href: { type: String, default: null },
  tipo: { type: String, default: 'button' },
  variante: { type: String, default: 'primario' }, // primario | secundario | contorno
  tamanho: { type: String, default: 'md' } // md | lg
})

const VARIANTES = {
  primario: 'bg-blue-primary hover:bg-blue-primary-hover text-white shadow-md hover:shadow-lg disabled:bg-black-light disabled:shadow-none',
  secundario: 'bg-white border border-blue-secondary text-regular hover:text-blue-primary hover:border-blue-primary disabled:opacity-50',
  contorno: 'border border-blue-primary text-blue-primary hover:bg-blue-primary hover:text-white'
}

const TAMANHOS = {
  md: 'px-4 py-2.5',
  lg: 'px-7 py-3.5'
}
</script>
