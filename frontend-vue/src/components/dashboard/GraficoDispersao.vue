<!-- Dispersão: faturamento anual x quantidade de serviços contratados por cliente. -->
<template>
  <CartaoPainel titulo="Faturamento × nº de serviços" descricao="Cada ponto é um cliente, na cor do seu segmento. Clientes maiores contratam mais serviços?">
    <div class="p-6">
      <GraficoBase
        tipo="dispersao"
        :dados="dados"
        nome-serie="Faturamento anual"
        descricao="Faturamento anual de cada cliente em relação à quantidade de serviços contratados"
        titulo-x="Serviços contratados"
        titulo-y="Faturamento anual"
        :formatar-valor="valor => formatarMoeda(valor, true)"
        :formatar-eixo="valor => formatarMoeda(valor, true)"
        :formatar-x="formatarServicos"
        :cor-do-grupo="corDoSegmento"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { listaDeServicos } from '../../utils/dadosDashboard'
import { formatarMoeda } from '../../utils/formatadores'
import { corDoSegmento } from '../../constants/cores'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const dados = computed(() => props.clientes.map(c => ({
  rotulo: c.nome_cliente,
  x: listaDeServicos(c).length,
  y: c.faturamento_anual,
  grupo: c.segmento // Cada ponto na cor do seu segmento.
})))

function formatarServicos(valor) {
  return Number.isInteger(valor) ? `${valor} ${valor === 1 ? 'serviço' : 'serviços'}` : ''
}
</script>
