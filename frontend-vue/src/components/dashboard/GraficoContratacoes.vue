<!-- Evolução das contratações ao longo do tempo (série temporal por mês). -->
<template>
  <CartaoPainel titulo="Evolução das contratações" descricao="Novos clientes por mês, pela data de contratação.">
    <div class="p-6">
      <GraficoBase
        tipo="linha"
        :dados="dados"
        nome-serie="Contratações"
        descricao="Quantidade de contratações em cada mês"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
// Os números vêm prontos do Python (analise.py): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'

const props = defineProps({
  meses: { type: Array, required: true } // [{ rotulo: 'jan/24', quantidade }]
})

const dados = computed(() => props.meses.map(m => ({ rotulo: m.rotulo, valor: m.quantidade })))
</script>
