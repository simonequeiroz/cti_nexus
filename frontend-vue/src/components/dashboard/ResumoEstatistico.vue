<!-- Medidas de tendência central e dispersão do faturamento, por segmento ou por nível, com boxplot. -->
<template>
  <CartaoPainel titulo="Estatísticas do faturamento" descricao="Média, mediana e desvio padrão do faturamento anual. O boxplot mostra mínimo, quartis (Q1–Q3) e máximo.">
    <template #acoes>
      <div class="inline-flex self-start rounded-lg border border-blue-secondary p-0.5 text-sm" role="group" aria-label="Agrupar estatísticas por">
        <button
          v-for="opcao in OPCOES"
          :key="opcao.valor"
          type="button"
          class="px-3 py-1.5 rounded-md font-medium transition-colors"
          :class="agrupamento === opcao.valor ? 'bg-blue-primary text-white' : 'text-regular hover:text-blue-primary'"
          :aria-pressed="agrupamento === opcao.valor"
          @click="agrupamento = opcao.valor"
        >
          {{ opcao.rotulo }}
        </button>
      </div>
    </template>

    <TabelaDados legenda="Estatísticas do faturamento anual por grupo" :colunas="COLUNAS">
      <tr v-for="linha in linhas" :key="linha.nome" :class="{ 'bg-surface font-semibold': linha.total }">
        <th scope="row" class="px-4 py-3 pl-6 text-left font-medium whitespace-nowrap">{{ linha.nome }}</th>
        <td class="px-4 py-3 text-right font-mono">{{ linha.quantidade }}</td>
        <td class="px-4 py-3 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.media, true) }}</td>
        <td class="px-4 py-3 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.mediana, true) }}</td>
        <td class="px-4 py-3 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.desvioPadrao, true) }}</td>
        <td class="px-4 py-3 pr-6 min-w-48">
          <div class="relative h-5" :title="textoBoxplot(linha)">
            <span class="absolute top-1/2 h-px bg-black-light" :style="faixa(linha.minimo, linha.maximo)"></span>
            <span class="absolute inset-y-0.5 rounded bg-blue-primary/20 border border-blue-primary" :style="faixa(linha.q1, linha.q3)"></span>
            <span class="absolute inset-y-0 w-0.5 bg-blue-primary-hover" :style="{ left: posicao(linha.mediana) }"></span>
            <span class="sr-only">{{ textoBoxplot(linha) }}</span>
          </div>
        </td>
      </tr>
    </TabelaDados>
  </CartaoPainel>
</template>

<script setup>
import { ref, computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import { agruparPor, resumoEstatistico } from '../../utils/estatistica'
import { formatarMoeda } from '../../utils/formatadores'

const props = defineProps({
  clientes: { type: Array, required: true }
})

const OPCOES = [
  { rotulo: 'Segmento', valor: 'segmento' },
  { rotulo: 'Nível', valor: 'nivel_cliente' }
]

const COLUNAS = [
  { rotulo: 'Grupo' },
  { rotulo: 'Clientes', classe: 'text-right' },
  { rotulo: 'Média', classe: 'text-right' },
  { rotulo: 'Mediana', classe: 'text-right' },
  { rotulo: 'Desvio padrão', classe: 'text-right' },
  { rotulo: 'Distribuição', classe: 'pr-6' }
]

const agrupamento = ref('segmento') // Estado local: por qual campo agrupar.

const linhas = computed(() => {
  const porNivel = agrupamento.value === 'nivel_cliente'
  const grupos = Object.entries(agruparPor(props.clientes, c => c[agrupamento.value]))
    .map(([nome, grupo]) => ({ nome: porNivel ? `Nível ${nome}` : nome, ...resumoEstatistico(grupo.map(c => c.faturamento_anual)) }))
    .sort((a, b) => (porNivel ? a.nome.localeCompare(b.nome) : b.media - a.media))

  const total = { nome: 'Carteira toda', total: true, ...resumoEstatistico(props.clientes.map(c => c.faturamento_anual)) }
  return [...grupos, total]
})

// Escala comum a todos os boxplots: do menor ao maior faturamento da carteira.
const escala = computed(() => {
  const valores = props.clientes.map(c => c.faturamento_anual)
  return { minimo: Math.min(...valores), maximo: Math.max(...valores) }
})

function posicao(valor) {
  const { minimo, maximo } = escala.value
  return `${maximo > minimo ? ((valor - minimo) / (maximo - minimo)) * 100 : 50}%`
}

function faixa(inicio, fim) {
  return { left: posicao(inicio), width: `calc(${posicao(fim)} - ${posicao(inicio)})` }
}

function textoBoxplot(linha) {
  return `Mínimo ${formatarMoeda(linha.minimo, true)}, Q1 ${formatarMoeda(linha.q1, true)}, mediana ${formatarMoeda(linha.mediana, true)}, Q3 ${formatarMoeda(linha.q3, true)}, máximo ${formatarMoeda(linha.maximo, true)}`
}
</script>
