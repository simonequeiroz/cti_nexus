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
// As faixas vêm prontas do Python (analise.py, regra de Sturges): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'

const props = defineProps({
  faixas: { type: Array, required: true } // [{ rotulo: '0,9–1,6', quantidade }]
})

const dados = computed(() => props.faixas.map(f => ({ rotulo: f.rotulo, valor: f.quantidade })))
</script>
