<!-- Distribuição dos clientes por segmento (barras horizontais, do maior para o menor). -->
<template>
  <CartaoPainel titulo="Clientes por segmento" descricao="Quais segmentos concentram mais clientes.">
    <div class="p-6">
      <GraficoBase
        tipo="barraHorizontal"
        :dados="dados"
        nome-serie="Clientes"
        descricao="Quantidade de clientes em cada segmento"
        :formatar-valor="comPercentual"
        :cores="dados.map(d => corDoSegmento(d.rotulo))"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
// Os números vêm prontos do Python (analise.py): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { corDoSegmento } from '../../constants/cores'

const props = defineProps({
  segmentos: { type: Array, required: true } // [{ nome, quantidade, percentual }]
})

const dados = computed(() => props.segmentos.map(s => ({ rotulo: s.nome, valor: s.quantidade })))

function comPercentual(valor) { // Ex.: "7 (35%)". Mesma quantidade = mesma porcentagem (o total é um só).
  return `${valor} (${props.segmentos.find(s => s.quantidade === valor)?.percentual ?? 0}%)`
}
</script>
