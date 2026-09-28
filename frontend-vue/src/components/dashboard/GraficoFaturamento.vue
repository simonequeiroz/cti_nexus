<!-- Histograma: quantos clientes há em cada faixa de faturamento anual. -->
<template>
  <CartaoPainel titulo="Distribuição do faturamento" descricao="Quantos clientes há em cada faixa de faturamento anual.">
    <div class="p-6">
      <GraficoBase
        :dados="dados"
        nome-serie="Clientes"
        descricao="Quantidade de clientes em cada faixa de faturamento anual"
        titulo-x="Faturamento anual (R$ milhões)"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { histograma } from '../../utils/dadosDashboard'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => histograma(props.clientes.map(c => c.faturamento_anual)).map(f => ({ rotulo: f.rotulo, valor: f.quantidade })))
</script>
