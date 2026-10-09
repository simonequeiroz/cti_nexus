<!-- Tela de dashboard: indicadores, gráficos, estatísticas e insights dos clientes válidos. -->
<template>
  <LayoutSistema>
    <RelatorioVazio
      v-if="!store.quantidadeValidas"
      titulo="Nenhum dado para o painel"
      texto="Envie e confira uma planilha com pelo menos uma linha aprovada para ver os gráficos e as conclusões."
    />

    <template v-else>
      <div class="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <IntroducaoPagina etapa="Passo 4 de 4 — Dashboard" titulo="Painel da carteira">
          <p>
            Análise dos {{ store.quantidadeValidas }} clientes aprovados de <strong class="text-black-dark">{{ store.nomeArquivo }}</strong>.
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

      <!-- Fim do fluxo: responde "o que faço agora?" em vez de terminar sem saída. -->
      <section aria-labelledby="titulo-proximos-passos" class="mt-10 rounded-2xl bg-black-dark text-white px-6 py-6 md:px-8 flex flex-col md:flex-row md:items-center gap-5 print:hidden">
        <div class="flex-1">
          <h2 id="titulo-proximos-passos" class="font-display font-bold text-xl">O que fazer agora</h2>
          <p class="mt-1 text-sm text-black-light">
            <template v-if="store.quantidadeInvalidas">
              Ainda {{ store.quantidadeInvalidas === 1 ? 'há 1 linha' : `há ${store.quantidadeInvalidas} linhas` }} fora do painel.
              {{ auth.pode('corrigir_dados') ? 'Corrija para a análise ficar completa.' : 'A equipe de operações precisa corrigir para a análise ficar completa.' }}
            </template>
            <template v-else>
              Todos os clientes da planilha estão no painel. {{ auth.pode('enviar_planilha') ? 'Guarde o relatório ou envie outra planilha.' : 'Veja o relatório para guardar ou imprimir.' }}
            </template>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <BotaoBase v-if="store.quantidadeInvalidas && auth.pode('corrigir_dados')" href="#validacao">
            Corrigir {{ store.quantidadeInvalidas }} {{ store.quantidadeInvalidas === 1 ? 'linha' : 'linhas' }} →
          </BotaoBase>
          <BotaoBase href="#relatorio" :variante="store.quantidadeInvalidas && auth.pode('corrigir_dados') ? 'secundario' : 'primario'">Ver relatório</BotaoBase>
          <BotaoBase v-if="auth.pode('enviar_planilha')" href="#upload" variante="secundario">Enviar outra planilha</BotaoBase>
        </div>
      </section>
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
import BotaoBase from '../components/ui/BotaoBase.vue'
import { useUploadStore } from '../stores/uploadStore'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'
import { soma, media, mediana, desvioPadrao } from '../utils/estatistica'
import { listaDeServicos, gerarInsights } from '../utils/dadosDashboard'
import { formatarMoeda } from '../utils/formatadores'

const store = useUploadStore()
const auth = useAutenticacaoStore()

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
