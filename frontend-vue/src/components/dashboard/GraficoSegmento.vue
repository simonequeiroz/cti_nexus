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
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { contarPor } from '../../utils/estatistica'
import { corDoSegmento } from '../../constants/cores'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => contarPor(props.clientes, c => c.segmento).map(s => ({ rotulo: s.nome, valor: s.quantidade })))

function comPercentual(valor) { // Ex.: "7 (35%)".
  const total = props.clientes.length
  return total ? `${valor} (${Math.round((valor / total) * 100)}%)` : String(valor)
}
</script>
