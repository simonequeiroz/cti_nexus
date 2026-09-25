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
          <th scope="row">{{ tipo === 'dispersao' ? `${item.rotulo}${item.grupo ? ` — ${item.grupo}` : ''} (${formatarX(item.x)})` : item.rotulo }}</th>
          <td>{{ formatarValor(tipo === 'dispersao' ? item.y : item.valor) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'
import { COR_UNICA } from '../../constants/cores'

const props = defineProps({
  tipo: { type: String, default: 'barra' }, // barra | barraHorizontal | linha | dispersao | rosca
  dados: { type: Array, required: true }, // [{ rotulo, valor }] ou, na dispersão, [{ rotulo, x, y }]
  nomeSerie: { type: String, required: true }, // Ex.: "Clientes".
  descricao: { type: String, required: true }, // Texto lido pelos leitores de tela.
  tituloX: { type: String, default: '' },
  tituloY: { type: String, default: '' },
  formatarValor: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') }, // Tooltip e tabela.
  formatarEixo: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') }, // Números do eixo de valores.
  formatarX: { type: Function, default: valor => Number(valor).toLocaleString('pt-BR') },
  altura: { type: String, default: '18rem' },
  cores: { type: Array, default: null }, // Barras: uma cor por barra (ex.: cor do segmento). Sem isso, azul da marca.
  corDoGrupo: { type: Function, default: null } // Dispersão: pinta cada ponto pelo campo "grupo" e mostra a legenda.
})

// Sem cor definida: uma série só, no azul primário da marca.
const AZUL = COR_UNICA
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
  const { tipo, dados, nomeSerie, formatarValor, formatarX, cores, corDoGrupo } = props
  const horizontal = tipo === 'barraHorizontal'
  const dispersao = tipo === 'dispersao'
  const rosca = tipo === 'rosca' // Partes de um todo (ex.: níveis A/B/C).
  const agrupado = dispersao && Boolean(corDoGrupo)

  const conjunto = {
    barra: {
      data: dados.map(d => d.valor),
      backgroundColor: cores ?? AZUL,
      hoverBackgroundColor: cores ?? AZUL_ESCURO,
      hoverBorderColor: '#292930', // Com várias cores, o destaque do mouse é uma borda escura.
      hoverBorderWidth: cores ? 2 : 0,
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
    rosca: {
      data: dados.map(d => d.valor),
      backgroundColor: cores ?? AZUL,
      hoverBackgroundColor: cores ?? AZUL, // No mouse a fatia só se destaca (hoverOffset), sem mudar de cor.
      borderColor: '#fff', // Anel branco de 2px separa as fatias.
      borderWidth: 2,
      hoverOffset: 6
    },
    dispersao: {
      data: dados,
      backgroundColor: 'rgba(0, 110, 183, 0.55)',
      hoverBackgroundColor: AZUL_ESCURO,
      borderColor: '#fff', // Anel branco separa pontos sobrepostos.
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  }[dispersao ? 'dispersao' : rosca ? 'rosca' : tipo === 'linha' ? 'linha' : 'barra']

  // Dispersão agrupada: um conjunto por grupo (ex.: segmento), cada um com a sua cor e item na legenda.
  const conjuntos = agrupado
    ? [...new Set(dados.map(d => d.grupo))].sort().map(grupo => ({
        ...conjunto,
        label: grupo,
        data: dados.filter(d => d.grupo === grupo),
        backgroundColor: corDoGrupo(grupo),
        hoverBackgroundColor: corDoGrupo(grupo)
      }))
    : [{ label: nomeSerie, ...conjunto }]

  const valorDoTooltip = contexto => {
    if (dispersao) {
      const item = contexto.raw // { rotulo, x, y, grupo? }
      return `${item.rotulo}${item.grupo ? ` (${item.grupo})` : ''}: ${formatarX(item.x)} · ${formatarValor(item.y)}`
    }
    if (rosca) return `${nomeSerie}: ${formatarValor(contexto.parsed)}`
    return `${nomeSerie}: ${formatarValor(horizontal ? contexto.parsed.x : contexto.parsed.y)}`
  }

  const eixoCategoria = { grade: dispersao, formatar: dispersao ? formatarX : undefined, inteiro: dispersao }
  const eixoValor = { grade: true, formatar: props.formatarEixo, inteiro: true }

  return {
    type: dispersao ? 'scatter' : rosca ? 'doughnut' : tipo === 'linha' ? 'line' : 'bar',
    data: {
      labels: dispersao ? undefined : dados.map(d => d.rotulo),
      datasets: conjuntos
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      animation: reduzirMovimento ? false : { duration: 500 },
      cutout: rosca ? '68%' : undefined, // Miolo da rosca: espaço para o total.
      // Área de toque maior que a barra. Na barra horizontal, as categorias ficam no eixo Y: sem axis 'y', o tooltip pegava a barra errada.
      interaction: dispersao || rosca ? { mode: 'nearest', intersect: true } : { mode: 'index', intersect: false, axis: horizontal ? 'y' : 'x' },
      plugins: {
        // Uma série só: o título do cartão já diz o que é. Com grupos, a legenda identifica cada cor.
        legend: {
          display: agrupado,
          position: 'top',
          align: 'start',
          labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14, color: TEXTO }
        },
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
      scales: rosca
        ? {} // Rosca não tem eixos.
        : horizontal
        ? { x: eixo(props.tituloY, eixoValor), y: eixo(props.tituloX, eixoCategoria) }
        : { x: eixo(props.tituloX, eixoCategoria), y: eixo(props.tituloY, eixoValor) }
    }
  }
}

onMounted(() => {
  grafico = new Chart(tela.value, montarConfiguracao())
})

watch(() => [props.dados, props.tipo, props.cores], () => { // Atualiza quando os filtros mudam os dados.
  const configuracao = montarConfiguracao()
  grafico.data = configuracao.data
  grafico.options = configuracao.options
  grafico.update()
}, { deep: true })

onBeforeUnmount(() => grafico?.destroy())
</script>
