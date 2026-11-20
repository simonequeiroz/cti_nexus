<!-- Serviços mais contratados (cada cliente pode ter vários, separados por ";"). -->
<template>
  <CartaoPainel titulo="Serviços mais contratados" descricao="Em quantos clientes cada serviço aparece.">
    <div class="p-6">
      <GraficoBase
        tipo="barraHorizontal"
        :dados="dados"
        nome-serie="Clientes"
        descricao="Quantidade de clientes que contratam cada serviço"
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
  servicos: { type: Array, required: true } // [{ nome, quantidade }]
})

const dados = computed(() => props.servicos.map(s => ({ rotulo: s.nome, valor: s.quantidade })))
</script>
