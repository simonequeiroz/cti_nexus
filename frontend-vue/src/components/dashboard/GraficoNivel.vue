<!-- Distribuição dos clientes por nível A, B e C (ordem fixa, pois o nível é ordinal). -->
<template>
  <CartaoPainel titulo="Clientes por nível" descricao="Proporção da carteira em cada nível A, B e C.">
    <div class="p-6">
      <GraficoBase
        :dados="dados"
        nome-serie="Clientes"
        descricao="Quantidade de clientes nos níveis A, B e C"
        :formatar-valor="comPercentual"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => ['A', 'B', 'C'].map(nivel => ({
  rotulo: `Nível ${nivel}`,
  valor: props.clientes.filter(c => c.nivel_cliente === nivel).length
})))

function comPercentual(valor) {
  const total = props.clientes.length
  return total ? `${valor} (${Math.round((valor / total) * 100)}%)` : String(valor)
}
</script>
