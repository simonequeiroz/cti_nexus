<!-- Faturamento por segmento ou por nível: barras (Chart.js) com a média de cada grupo e tabela com média, mediana e desvio padrão. -->
<template>
  <CartaoPainel titulo="Estatísticas do faturamento" descricao="Quanto fatura, em média, um cliente de cada grupo. Mediana: o valor do meio. Desvio padrão: o quanto os clientes variam entre si (quanto maior, mais diferentes).">
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

    <div class="p-6">
      <GraficoBase
        :dados="dados"
        nome-serie="Faturamento médio"
        :descricao="`Faturamento médio anual por ${agrupamento === 'nivel_cliente' ? 'nível' : 'segmento'}`"
        titulo-y="Faturamento médio"
        :formatar-valor="valor => formatarMoeda(valor, true)"
        :formatar-eixo="valor => formatarMoeda(valor, true)"
        :cores="linhas.map(l => l.cor)"
      />
    </div>

    <TabelaDados legenda="Estatísticas do faturamento anual por grupo" :colunas="COLUNAS">
      <tr v-for="linha in [...linhas, total]" :key="linha.nome" :class="{ 'bg-surface font-semibold': linha === total }">
        <th scope="row" class="px-4 py-3 pl-6 text-left font-medium whitespace-nowrap">
          <span class="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" :style="{ backgroundColor: linha.cor }" aria-hidden="true"></span>{{ linha.nome }}
        </th>
        <td class="px-4 py-3 text-right font-mono">{{ linha.quantidade }}</td>
        <td class="px-4 py-3 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.media, true) }}</td>
        <td class="px-4 py-3 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.mediana, true) }}</td>
        <td class="px-4 py-3 pr-6 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.desvioPadrao, true) }}</td>
      </tr>
    </TabelaDados>
  </CartaoPainel>
</template>

<script setup>
import { ref, computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import GraficoBase from './GraficoBase.vue'
import { agruparPor, resumoEstatistico } from '../../utils/estatistica'
import { formatarMoeda } from '../../utils/formatadores'
import { corDoSegmento, CORES_NIVEL } from '../../constants/cores'

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
  { rotulo: 'Desvio padrão', classe: 'text-right pr-6' }
]

const agrupamento = ref('segmento') // Estado local: por qual campo agrupar.

const linhas = computed(() => {
  const porNivel = agrupamento.value === 'nivel_cliente'
  return Object.entries(agruparPor(props.clientes, c => c[agrupamento.value]))
    .map(([nome, grupo]) => ({
      nome: porNivel ? `Nível ${nome}` : nome,
      cor: porNivel ? CORES_NIVEL[nome] : corDoSegmento(nome), // Mesma cor do grupo nos gráficos.
      ...resumoEstatistico(grupo.map(c => c.faturamento_anual))
    }))
    .sort((a, b) => (porNivel ? a.nome.localeCompare(b.nome) : b.media - a.media))
})

const total = computed(() => ({ nome: 'Carteira toda', cor: '#707070', ...resumoEstatistico(props.clientes.map(c => c.faturamento_anual)) }))

const dados = computed(() => linhas.value.map(l => ({ rotulo: l.nome, valor: l.media })))
</script>
