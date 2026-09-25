<!-- Gráfico Chart.js reutilizável (barra, barra horizontal, linha ou dispersão) com tabela para leitores de tela. -->
<template>
  <figure class="relative" :style="{ height: altura }">
    <canvas ref="tela" role="img" :aria-label="descricao"></canvas>

    <table class="sr-only">
      <caption>{{ descricao }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ tituloX || 'Categoria' }}</th>
          <th scope="col">{{ nomeSerie }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, indice) in dados" :key="indice">
          <th scope="row">{{ tipo === 'dispersao' ? `${item.rotulo} (${formatarX(item.x)})` : item.rotulo }}</th>
          <td>{{ formatarValor(tipo === 'dispersao' ? item.y : item.valor) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  tipo: { type: String, default: 'barra' }, // barra | barraHorizontal | linha | dispersao
  dados: { type: Array, required: true }, // [{ rotulo, valor }] ou, na dispersão, [{ rotulo, x, y }]
  nomeSerie: { type: String, required: true }, // Ex.: "Clientes".
  descricao: { type: String, required: true }, // Texto lido pelos leitores de tela.
  tituloX: { type: String, default: '' },
  tituloY: { type: String, default: '' },
  formatarValor: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') }, // Tooltip e tabela.
  formatarEixo: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') }, // Números do eixo de valores.
  formatarX: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') },
  altura: { type: String, default: '18rem' }
})

// Cores da marca: uma série por gráfico, sempre no azul primário.
const AZUL = '#006EB7'
const AZUL_ESCURO = '#03558c'
const GRADE = 'rgba(205, 218, 223, 0.6)'
const TEXTO = '#637A84'

Chart.defaults.font.family = 'Inter, sans-serif'
Chart.defaults.color = TEXTO

const tela = ref(null)
let grafico = null // Fora do ref: o Chart.js não deve virar objeto reativo do Vue.
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function eixo(titulo, { grade, formatar, inteiro }) {
  const ticks = { padding: 8 }
  if (inteiro) ticks.precision = 0
  if (formatar) ticks.callback = formatar // Sem formatador, o Chart.js mostra os nomes das categorias.
  return {
    title: { display: Boolean(titulo), text: titulo },
    grid: { display: grade, color: GRADE, drawTicks: false },
    border: { display: false },
    ticks
  }
}

function montarConfiguracao() {
  const { tipo, dados, nomeSerie, formatarValor, formatarX } = props
  const horizontal = tipo === 'barraHorizontal'
  const dispersao = tipo === 'dispersao'

  const conjunto = {
    barra: {
      data: dados.map(d => d.valor),
      backgroundColor: AZUL,
      hoverBackgroundColor: AZUL_ESCURO,
      borderRadius: 4,
      borderSkipped: 'start', // Arredonda só a ponta da barra; a base fica reta no eixo.
      maxBarThickness: 32
    },
    linha: {
      data: dados.map(d => d.valor),
      borderColor: AZUL,
      backgroundColor: 'rgba(0, 110, 183, 0.08)',
      fill: true,
      borderWidth: 2,
      cubicInterpolationMode: 'monotone', // Curva suave que não passa abaixo de zero.
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: AZUL,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    },
    dispersao: {
      data: dados.map(d => ({ x: d.x, y: d.y })),
      backgroundColor: 'rgba(0, 110, 183, 0.55)',
      hoverBackgroundColor: AZUL_ESCURO,
      borderColor: '#fff', // Anel branco separa pontos sobrepostos.
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  }[dispersao ? 'dispersao' : tipo === 'linha' ? 'linha' : 'barra']

  const valorDoTooltip = contexto => {
    if (dispersao) {
      const item = dados[contexto.dataIndex]
      return `${item.rotulo}: ${formatarX(item.x)} · ${formatarValor(item.y)}`
    }
    return `${nomeSerie}: ${formatarValor(horizontal ? contexto.parsed.x : contexto.parsed.y)}`
  }

  const eixoCategoria = { grade: dispersao, formatar: dispersao ? formatarX : undefined, inteiro: dispersao }
  const eixoValor = { grade: true, formatar: props.formatarEixo, inteiro: true }

  return {
    type: dispersao ? 'scatter' : tipo === 'linha' ? 'line' : 'bar',
    data: {
      labels: dispersao ? undefined : dados.map(d => d.rotulo),
      datasets: [{ label: nomeSerie, ...conjunto }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      animation: reduzirMovimento ? false : { duration: 500 },
      // Área de toque maior que a barra. Na barra horizontal, as categorias ficam no eixo Y: sem axis 'y', o tooltip pegava a barra errada.
      interaction: dispersao ? { mode: 'nearest', intersect: true } : { mode: 'index', intersect: false, axis: horizontal ? 'y' : 'x' },
      plugins: {
        legend: { display: false }, // Uma série só: o título do cartão já diz o que é.
        tooltip: {
          backgroundColor: '#292930',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: itens => (dispersao ? '' : itens[0]?.label),
            label: valorDoTooltip
          }
        }
      },
      scales: horizontal
        ? { x: eixo(props.tituloY, eixoValor), y: eixo(props.tituloX, eixoCategoria) }
        : { x: eixo(props.tituloX, eixoCategoria), y: eixo(props.tituloY, eixoValor) }
    }
  }
}

onMounted(() => {
  grafico = new Chart(tela.value, montarConfiguracao())
})

watch(() => [props.dados, props.tipo], () => { // Atualiza quando os filtros mudam os dados.
  const configuracao = montarConfiguracao()
  grafico.data = configuracao.data
  grafico.options = configuracao.options
  grafico.update()
}, { deep: true })

onBeforeUnmount(() => grafico?.destroy())
</script>
