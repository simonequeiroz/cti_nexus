<!-- Filtros do dashboard (segmento e nível), numa linha acima dos gráficos. -->
<template>
  <div class="flex flex-wrap items-end gap-4" role="search" aria-label="Filtros do dashboard">
    <label class="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-regular">
      Segmento
      <select v-model="segmento" :class="CLASSE_CAMPO" class="min-w-48">
        <option value="">Todos</option>
        <option v-for="opcao in segmentos" :key="opcao" :value="opcao">{{ opcao }}</option>
      </select>
    </label>

    <label class="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-regular">
      Nível
      <select v-model="nivel" :class="CLASSE_CAMPO" class="min-w-32">
        <option value="">Todos</option>
        <option v-for="opcao in ['A', 'B', 'C']" :key="opcao" :value="opcao">Nível {{ opcao }}</option>
      </select>
    </label>

    <button v-if="segmento || nivel" type="button" class="py-2 text-sm font-medium text-blue-primary hover:underline" @click="limpar">
      Limpar filtros
    </button>
  </div>
</template>

<script setup>
defineProps({
  segmentos: { type: Array, required: true } // Opções vindas dos próprios dados.
})

const segmento = defineModel('segmento', { type: String, default: '' })
const nivel = defineModel('nivel', { type: String, default: '' })

const CLASSE_CAMPO = 'rounded-lg border border-blue-secondary bg-white px-3 py-2 text-sm font-sans normal-case tracking-normal text-black-dark focus-visible:outline-2 focus-visible:outline-blue-primary'

function limpar() {
  segmento.value = ''
  nivel.value = ''
}
</script>
