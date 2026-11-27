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
    <!-- Correlação de Pearson: responde em números a pergunta do gráfico. Some quando o grupo não permite medir. -->
    <ResultadoTeste v-if="correlacao" :resultado="correlacao" />
  </CartaoPainel>
</template>

<script setup>
// Os pontos vêm prontos do Python (analise.py): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import ResultadoTeste from './ResultadoTeste.vue'
import { formatarMoeda } from '../../utils/formatadores'
import { corDoSegmento } from '../../constants/cores'

const props = defineProps({
  pontos: { type: Array, required: true }, // [{ rotulo, servicos, faturamento, segmento }]
  correlacao: { type: Object, default: null } // Correlação de Pearson serviços x faturamento, ou null
})

const dados = computed(() => props.pontos.map(p => ({
  rotulo: p.rotulo,
  x: p.servicos,
  y: p.faturamento,
  grupo: p.segmento // Cada ponto na cor do seu segmento.
})))

function formatarServicos(valor) {
  return Number.isInteger(valor) ? `${valor} ${valor === 1 ? 'serviço' : 'serviços'}` : ''
}
</script>
