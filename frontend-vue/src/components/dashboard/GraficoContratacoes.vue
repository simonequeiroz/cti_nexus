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
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { contratacoesPorMes } from '../../utils/dadosDashboard'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => contratacoesPorMes(props.clientes).map(m => ({ rotulo: m.rotulo, valor: m.quantidade })))
</script>
