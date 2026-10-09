<!-- Entrada do painel: as conclusões mais importantes antes dos gráficos (o resto fica na ListaInsights, mais abaixo). -->
<template>
  <section aria-labelledby="titulo-destaques">
    <h2 id="titulo-destaques" class="text-xs font-mono uppercase tracking-wider text-regular">Destaques da carteira</h2>
    <ul class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
      <li
        v-for="insight in insights"
        :key="insight.titulo"
        class="rounded-2xl border bg-white p-5 shadow-sm border-l-4"
        :class="BORDA_DA_PRIORIDADE[insight.prioridade]"
      >
        <p class="flex flex-wrap gap-2">
          <EtiquetaBase :cor="ETIQUETA_DA_PRIORIDADE[insight.prioridade]">Prioridade {{ insight.prioridade.toLowerCase() }}</EtiquetaBase>
          <EtiquetaBase>{{ insight.tipo }}</EtiquetaBase>
        </p>
        <p class="mt-3 font-display font-bold">{{ insight.titulo }}</p>
        <p class="mt-1 text-sm text-regular">{{ insight.descricao }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup>
import EtiquetaBase from '../ui/EtiquetaBase.vue'

defineProps({
  insights: { type: Array, required: true } // Já ordenados por prioridade: [{ titulo, descricao, tipo, prioridade }]
})

// Mesmas cores da ListaInsights. A prioridade também está escrita na etiqueta (cor nunca sozinha).
const BORDA_DA_PRIORIDADE = {
  Alta: 'border-blue-secondary/80 border-l-orange',
  Média: 'border-blue-secondary/80 border-l-blue-primary',
  Baixa: 'border-blue-secondary/80 border-l-black-light'
}

const ETIQUETA_DA_PRIORIDADE = {
  Alta: 'bg-orange/15 text-orange-dark',
  Média: 'bg-blue-primary/10 text-blue-primary',
  Baixa: 'bg-surface text-regular border border-blue-secondary'
}
</script>
