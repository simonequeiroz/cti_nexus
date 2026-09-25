<!-- Tela de dashboard: indicadores, gráficos, estatísticas e insights dos clientes válidos. -->
<template>
  <LayoutSistema>
    <RelatorioVazio
      v-if="!store.quantidadeValidas"
      titulo="Nenhum dado para o dashboard"
      texto="Envie e processe uma planilha com pelo menos uma linha válida para ver os gráficos e os insights."
    />

    <template v-else>
      <div class="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <IntroducaoPagina etapa="Etapa 3 — Insights" titulo="Dashboard da carteira">
          <p>
            Análise dos {{ store.quantidadeValidas }} clientes válidos de <strong class="text-black-dark">{{ store.nomeArquivo }}</strong>.
            <template v-if="store.quantidadeInvalidas">
              {{ store.quantidadeInvalidas }} {{ store.quantidadeInvalidas === 1 ? 'linha com erro ficou' : 'linhas com erro ficaram' }} de fora
              (<a href="#relatorio" class="text-blue-primary font-medium hover:underline">ver relatório</a>).
            </template>
          </p>
        </IntroducaoPagina>

        <FiltrosDashboard v-model:segmento="segmento" v-model:nivel="nivel" :segmentos="segmentos" />
      </div>

      <p v-if="!clientes.length" class="mt-10 text-center text-regular">Nenhum cliente com esses filtros.</p>

      <template v-else>
        <section aria-labelledby="titulo-indicadores" class="mt-8">
          <h2 id="titulo-indicadores" class="sr-only">Indicadores da carteira</h2>
          <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
        </section>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficoSegmento :clientes="clientes" />
          <GraficoNivel :clientes="clientes" />
        </div>

        <GraficoContratacoes :clientes="clientes" class="mt-6" />

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ListaInsights :insights="insights" />
          <div class="flex flex-col gap-6">
            <GraficoServicos :clientes="clientes" />
            <GraficoDispersao :clientes="clientes" />
          </div>
        </div>

        <GraficoFaturamento :clientes="clientes" class="mt-6" />

        <ResumoEstatistico :clientes="clientes" class="mt-6" />
      </template>
    </template>
  </LayoutSistema>
</template>

<script setup>
import { ref, computed } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import IntroducaoPagina from '../components/layout/IntroducaoPagina.vue'
import GradeEstatisticas from '../components/ui/GradeEstatisticas.vue'
import RelatorioVazio from '../components/relatorio/RelatorioVazio.vue'
import FiltrosDashboard from '../components/dashboard/FiltrosDashboard.vue'
import GraficoSegmento from '../components/dashboard/GraficoSegmento.vue'
import GraficoNivel from '../components/dashboard/GraficoNivel.vue'
import GraficoContratacoes from '../components/dashboard/GraficoContratacoes.vue'
import GraficoServicos from '../components/dashboard/GraficoServicos.vue'
import GraficoFaturamento from '../components/dashboard/GraficoFaturamento.vue'
import GraficoDispersao from '../components/dashboard/GraficoDispersao.vue'
import ResumoEstatistico from '../components/dashboard/ResumoEstatistico.vue'
import ListaInsights from '../components/dashboard/ListaInsights.vue'
import { useUploadStore } from '../stores/uploadStore'
import { soma, media, mediana, desvioPadrao } from '../utils/estatistica'
import { listaDeServicos, gerarInsights } from '../utils/dadosDashboard'
import { formatarMoeda } from '../utils/formatadores'

const store = useUploadStore()

// Estado local dos filtros.
const segmento = ref('')
const nivel = ref('')

const segmentos = computed(() => [...new Set(store.dadosValidos.map(c => c.segmento))].sort())

// Clientes válidos que passam pelos filtros: todos os gráficos usam esta lista.
const clientes = computed(() => store.dadosValidos.filter(c =>
  (!segmento.value || c.segmento === segmento.value) &&
  (!nivel.value || c.nivel_cliente === nivel.value)
))

const indicadores = computed(() => {
  const faturamentos = clientes.value.map(c => c.faturamento_anual)
  const servicos = clientes.value.map(c => listaDeServicos(c).length)
  return [
    { rotulo: 'Clientes', valor: clientes.value.length },
    { rotulo: 'Faturamento total', valor: formatarMoeda(soma(faturamentos), true) },
    { rotulo: 'Faturamento médio', valor: formatarMoeda(media(faturamentos), true) },
    { rotulo: 'Mediana', valor: formatarMoeda(mediana(faturamentos), true) },
    { rotulo: 'Desvio padrão', valor: formatarMoeda(desvioPadrao(faturamentos), true) },
    { rotulo: 'Serviços por cliente', valor: media(servicos).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }
  ]
})

const insights = computed(() => gerarInsights(clientes.value))
</script>
