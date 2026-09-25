<!-- Paginação de tabelas: linhas por página, faixa mostrada ("11–20 de 32") e botões Anterior/Próxima. -->
<template>
  <nav class="px-6 py-3 border-t border-blue-secondary/60 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-regular" :aria-label="rotulo">
    <label class="flex items-center gap-2">
      Linhas por página
      <select
        :value="porPagina"
        class="rounded-lg border border-blue-secondary bg-white px-2 py-1 text-black-dark focus-visible:outline-2 focus-visible:outline-blue-primary"
        @change="mudarTamanho(Number($event.target.value))"
      >
        <option v-for="opcao in OPCOES" :key="opcao" :value="opcao">{{ opcao }}</option>
      </select>
    </label>

    <p aria-live="polite" class="font-mono">{{ inicio }}–{{ fim }} de {{ total.toLocaleString('pt-BR') }}</p>

    <div class="w-full sm:w-auto sm:ml-auto flex items-center justify-between gap-2">
      <button type="button" :class="CLASSE_BOTAO" :disabled="pagina <= 1" @click="pagina--">‹ Anterior</button>
      <span class="px-1 whitespace-nowrap">Página {{ pagina }} de {{ totalPaginas }}</span>
      <button type="button" :class="CLASSE_BOTAO" :disabled="pagina >= totalPaginas" @click="pagina++">Próxima ›</button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true }, // Quantidade total de linhas.
  rotulo: { type: String, default: 'Paginação da tabela' }
})

const pagina = defineModel('pagina', { type: Number, default: 1 }) // Começa em 1.
const porPagina = defineModel('porPagina', { type: Number, default: 10 })

const OPCOES = [10, 25, 50, 100]
const CLASSE_BOTAO = 'whitespace-nowrap rounded-lg border border-blue-secondary bg-white px-3 py-1.5 font-medium text-black-dark hover:border-blue-primary hover:text-blue-primary disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-blue-primary'

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.total / porPagina.value)))
const inicio = computed(() => (props.total ? (pagina.value - 1) * porPagina.value + 1 : 0))
const fim = computed(() => Math.min(pagina.value * porPagina.value, props.total))

function mudarTamanho(tamanho) {
  porPagina.value = tamanho
  pagina.value = 1 // Volta para o início para não cair numa página que não existe mais.
}
</script>
