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
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { contarPor } from '../../utils/estatistica'
import { listaDeServicos } from '../../utils/dadosDashboard'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => contarPor(props.clientes.flatMap(listaDeServicos), s => s).map(s => ({ rotulo: s.nome, valor: s.quantidade })))
</script>
