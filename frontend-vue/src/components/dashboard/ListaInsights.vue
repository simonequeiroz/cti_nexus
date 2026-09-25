<!-- Insights estratégicos gerados a partir dos dados (título, descrição, tipo e prioridade). -->
<template>
  <CartaoPainel titulo="Insights estratégicos" :descricao="`${insights.length} conclusões geradas automaticamente a partir dos clientes filtrados.`">
    <ul class="divide-y divide-blue-secondary/50">
      <li v-for="insight in insights" :key="insight.titulo" class="px-6 py-4 flex gap-4">
        <span class="mt-2 w-2 h-2 shrink-0 rounded-full" :class="COR_DA_PRIORIDADE[insight.prioridade]" aria-hidden="true"></span>
        <div class="min-w-0">
          <p class="font-semibold">{{ insight.titulo }}</p>
          <p class="text-sm text-regular mt-0.5">{{ insight.descricao }}</p>
          <p class="mt-2 flex flex-wrap gap-2">
            <EtiquetaBase>{{ insight.tipo }}</EtiquetaBase>
            <EtiquetaBase :cor="ETIQUETA_DA_PRIORIDADE[insight.prioridade]">Prioridade {{ insight.prioridade.toLowerCase() }}</EtiquetaBase>
          </p>
        </div>
      </li>
    </ul>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'

defineProps({
  insights: { type: Array, required: true } // [{ titulo, descricao, tipo, prioridade }]
})

const COR_DA_PRIORIDADE = {
  Alta: 'bg-orange',
  Média: 'bg-blue-primary',
  Baixa: 'bg-black-light'
}

const ETIQUETA_DA_PRIORIDADE = {
  Alta: 'bg-orange/15 text-orange-dark',
  Média: 'bg-blue-primary/10 text-blue-primary',
  Baixa: 'bg-surface text-regular border border-blue-secondary'
}
</script>
