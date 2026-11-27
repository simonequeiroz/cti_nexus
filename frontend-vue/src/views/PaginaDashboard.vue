<!-- REMOVER ANTES DA ENTREGA ----------------------------------------------------------------------
     O Dashboard não calcula nada: tudo vem de GET /api/dashboard (store.carregarPainel). Se ficar parado em
     "Carregando os números do painel…", aperte F12 > Console. "carregarPainel is not a function" = o Vite não
     percebeu a mudança da store: Ctrl+C no terminal do front e npm run dev de novo (um servidor só, porta 5173).
     -------------------------------------------------------------------------------------------------- -->
<!-- Tela de dashboard: destaques, indicadores, gráficos, estatísticas e insights dos clientes LIBERADOS (não basta estarem aprovados).
     O navegador não calcula nada: tudo vem pronto do Python (analise.py + insights.py), pelo Java (GET /api/dashboard). -->
<template>
  <LayoutSistema>
    <!-- Sem planilha nesta sessão: busca no banco a última carga liberada (carregarDoBanco). -->
    <p v-if="store.carregandoPainel" role="status" class="py-24 text-center text-regular">Carregando o painel…</p>

    <RelatorioVazio
      v-else-if="!store.quantidadeValidas && !store.liberada"
      titulo="Nenhum dado para o painel"
      texto="Envie e confira uma planilha com pelo menos uma linha aprovada para ver os gráficos e as conclusões."
    />

    <!-- Aprovada mas não liberada: o painel só mostra o que alguém com permissão liberou. -->
    <RelatorioVazio v-else-if="!store.liberada" titulo="Painel esperando liberação">
      <template v-if="auth.pode('aprovar_carga')">
        <p class="mt-2 text-sm text-regular">
          {{ store.quantidadeValidas }} {{ store.quantidadeValidas === 1 ? 'cliente aprovado' : 'clientes aprovados' }} de
          <strong class="text-black-dark">{{ store.nomeArquivo }}</strong> ainda não {{ store.quantidadeValidas === 1 ? 'foi liberado' : 'foram liberados' }}.
          Revise e libere para {{ store.quantidadeValidas === 1 ? 'ele aparecer' : 'eles aparecerem' }} aqui.
        </p>
        <BotaoBase href="#/validacao" tamanho="lg" class="mt-6">Revisar e liberar</BotaoBase>
      </template>
      <p v-else class="mt-2 text-sm text-regular">
        A planilha <strong class="text-black-dark">{{ store.nomeArquivo }}</strong> já foi conferida, mas a equipe de operações ainda não liberou os clientes para o painel.
      </p>
    </RelatorioVazio>

    <template v-else>
      <div class="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <IntroducaoPagina etapa="Passo 4 de 4 — Dashboard" titulo="Painel da carteira">
          <p>
            Análise dos {{ store.quantidadeLiberados }} clientes de <strong class="text-black-dark">{{ nomeDaPlanilha }}</strong>,
            liberados por {{ store.liberacao.por?.nome ?? '—' }} em {{ formatarData(store.liberacao.em) }}.
            <template v-if="foraDoPainel">
              {{ foraDoPainel }} {{ foraDoPainel === 1 ? 'linha ficou' : 'linhas ficaram' }} de fora
              (<a href="#/relatorio" class="text-blue-primary font-medium hover:underline">ver relatório</a>).
            </template>
          </p>
        </IntroducaoPagina>

        <FiltrosDashboard v-model:segmento="segmento" v-model:nivel="nivel" :segmentos="segmentos" />
      </div>

      <p v-if="store.mudouDesdeLiberacao" role="status" class="mt-6 rounded-lg border border-orange/30 bg-orange/10 px-4 py-2.5 text-sm text-orange-dark">
        Há correções feitas depois da liberação que ainda não aparecem aqui.
        <a v-if="auth.pode('aprovar_carga')" href="#/validacao" class="font-semibold underline">Liberar de novo</a>
      </p>

      <p v-if="store.erroPainel" role="alert" class="mt-10 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-center text-sm text-orange-dark">
        {{ store.erroPainel }}
      </p>

      <p v-else-if="!painel" role="status" class="mt-10 text-center text-regular">Carregando os números do painel…</p>

      <p v-else-if="!painel.quantidade" class="mt-10 text-center text-regular">Nenhum cliente com esses filtros.</p>

      <template v-else>
        <!-- Entrada do painel: as conclusões mais importantes antes dos gráficos. -->
        <DestaquesInsights v-if="destaques.length" :insights="destaques" class="mt-8" />

        <section aria-labelledby="titulo-indicadores" class="mt-8">
          <h2 id="titulo-indicadores" class="sr-only">Indicadores da carteira</h2>
          <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
        </section>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficoSegmento :segmentos="painel.porSegmento" />
          <GraficoNivel :niveis="painel.porNivel" :total="painel.quantidade" :qui-quadrado="painel.quiQuadrado" />
        </div>

        <GraficoContratacoes :meses="painel.contratacoesPorMes" class="mt-6" />

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ListaInsights v-if="outrasConclusoes.length" titulo="Outras conclusões" :insights="outrasConclusoes" />
          <!-- Sem outras conclusões, os dois gráficos ocupam a linha inteira, lado a lado. -->
          <div :class="outrasConclusoes.length ? 'flex flex-col gap-6' : 'lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6'">
            <GraficoServicos :servicos="painel.servicos" />
            <GraficoDispersao :pontos="painel.dispersao" :correlacao="painel.correlacao" />
          </div>
        </div>

        <!-- Carteira de cada consultor ao lado das faixas de faturamento. Cargas antigas (sem porConsultor): o histograma ocupa a linha toda. -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <GraficoConsultores v-if="painel.porConsultor?.length" :consultores="painel.porConsultor" />
          <GraficoFaturamento :faixas="painel.histograma" :class="{ 'lg:col-span-2': !painel.porConsultor?.length }" />
        </div>

        <ResumoEstatistico :resumo="painel.resumo" :normalidade="painel.normalidade" class="mt-6" />
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
            <template v-else-if="foraDoPainel">
              {{ foraDoPainel === 1 ? '1 linha da última planilha ficou' : `${foraDoPainel} linhas da última planilha ficaram` }} de fora.
              {{ auth.pode('enviar_planilha') ? 'Corrija a planilha e envie de novo para a análise ficar completa.' : 'A equipe de operações precisa corrigir para a análise ficar completa.' }}
            </template>
            <template v-else>
              Todos os clientes da planilha estão no painel. {{ auth.pode('enviar_planilha') ? 'Guarde o relatório ou envie outra planilha.' : 'Veja o relatório para guardar ou imprimir.' }}
            </template>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <BotaoBase v-if="store.quantidadeInvalidas && auth.pode('corrigir_dados')" href="#/validacao">
            Corrigir {{ store.quantidadeInvalidas }} {{ store.quantidadeInvalidas === 1 ? 'linha' : 'linhas' }} →
          </BotaoBase>
          <BotaoBase href="#/relatorio" :variante="store.quantidadeInvalidas && auth.pode('corrigir_dados') ? 'secundario' : 'primario'">Ver relatório</BotaoBase>
          <BotaoBase v-if="auth.pode('enviar_planilha')" href="#/upload" variante="secundario">Enviar outra planilha</BotaoBase>
        </div>
      </section>
    </template>
  </LayoutSistema>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
import GraficoConsultores from '../components/dashboard/GraficoConsultores.vue'
import ListaInsights from '../components/dashboard/ListaInsights.vue'
import DestaquesInsights from '../components/dashboard/DestaquesInsights.vue'
import BotaoBase from '../components/ui/BotaoBase.vue'
import { useUploadStore } from '../stores/uploadStore'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'
import { formatarMoeda, formatarData } from '../utils/formatadores'

const store = useUploadStore()
const auth = useAutenticacaoStore()

// Estado local dos filtros.
const segmento = ref('')
const nivel = ref('')

const segmentos = computed(() => store.segmentosDoPainel) // Opções do filtro: os segmentos da carga (vêm da API).

// Painel já calculado pelo Python para o filtro escolhido. Trocar o filtro só busca outro resultado pronto.
const painel = computed(() => store.painel)

const indicadores = computed(() => {
  const i = painel.value.indicadores
  return [
    { rotulo: 'Clientes', valor: painel.value.quantidade },
    { rotulo: 'Faturamento total', valor: formatarMoeda(i.faturamentoTotal, true) },
    { rotulo: 'Faturamento médio', valor: formatarMoeda(i.faturamentoMedio, true) },
    { rotulo: 'Mediana', valor: formatarMoeda(i.faturamentoMediana, true) },
    { rotulo: 'Desvio padrão', valor: formatarMoeda(i.desvioPadrao, true) },
    { rotulo: 'Serviços por cliente', valor: i.servicosPorCliente.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }
  ]
})

// Ao abrir: sem planilha nesta sessão (ex.: o gestor no dia seguinte), descobre a última carga gravada no banco;
// depois busca o painel calculado no Python.
onMounted(async () => {
  await store.carregarDoBanco()
  if (store.liberada) store.carregarPainel(segmento.value, nivel.value)
})

watch([segmento, nivel], ([s, n]) => store.carregarPainel(s, n)) // Filtro mudou: busca o resultado pronto desse filtro.

const nomeDaPlanilha = computed(() => store.nomeArquivo || store.cargaGravada?.arquivoNome || '')

// Linhas fora do painel: as com erro (ou corrigidas e ainda não liberadas) da planilha aberta; sem planilha, as da última carga.
const foraDoPainel = computed(() => store.quantidadeLinhas
  ? store.quantidadeLinhas - store.quantidadeLiberados
  : (store.cargaGravada?.linhasInvalidas ?? 0))

// Insights já vêm do Python em ordem de importância: os 3 primeiros vão para o topo, o resto fica na lista (sem repetir).
const destaques = computed(() => painel.value?.insights?.slice(0, 3) ?? [])
const outrasConclusoes = computed(() => painel.value?.insights?.slice(3) ?? [])
</script>
