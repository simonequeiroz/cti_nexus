<!-- Tela de relatório: o documento do resultado (resumo para ler, exportar e imprimir).
     Corrigir é na tela de Validação; aqui os detalhes ficam recolhidos e aparecem completos na impressão. -->
<template>
  <LayoutSistema>
    <RelatorioVazio v-if="!store.quantidadeLinhas" />

    <template v-else>
      <CabecalhoRelatorio @exportar="exportarErros" @imprimir="imprimir" />
      <AvisoStatusRelatorio class="mt-8" />

      <section aria-labelledby="titulo-indicadores" class="mt-6">
        <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
        <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-4" />
      </section>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumoTiposErro />
        <ErrosPorCampo />
      </div>

      <!-- Detalhes: recolhidos na tela (a lista para corrigir está na Validação), sempre completos no papel. -->
      <section ref="secaoDetalhes" aria-labelledby="titulo-detalhes" class="mt-6 scroll-mt-4">
        <h2 id="titulo-detalhes" class="sr-only">Detalhes dos erros, alterações e ajustes automáticos</h2>
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 rounded-2xl border border-blue-secondary/80 bg-white px-6 py-4 text-left shadow-sm hover:border-blue-primary transition-colors print:hidden focus-visible:outline-2 focus-visible:outline-blue-primary"
          aria-controls="conteudo-detalhes"
          :aria-expanded="detalhesAbertos"
          @click="alternarDetalhes"
        >
          <span>
            <span class="block font-display font-bold">{{ detalhesAbertos ? 'Ocultar detalhes' : 'Ver detalhes' }}</span>
            <span class="block text-xs text-regular mt-0.5">
              {{ store.ocorrencias.length }} {{ store.ocorrencias.length === 1 ? 'erro' : 'erros' }} linha a linha ·
              {{ store.padronizacoes.length }} {{ store.padronizacoes.length === 1 ? 'ajuste automático' : 'ajustes automáticos' }} ·
              {{ store.alteracoes.length }} {{ store.alteracoes.length === 1 ? 'alteração à mão' : 'alterações à mão' }} · aparecem completos na impressão
            </span>
          </span>
          <svg class="w-5 h-5 shrink-0 text-regular transition-transform" :class="{ 'rotate-180': detalhesAbertos }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div id="conteudo-detalhes" class="flex-col gap-6 print:flex" :class="detalhesAbertos ? 'flex mt-6' : 'hidden'">
          <TabelaDetalhesErros />
          <RegistroAlteracoes />
          <TabelaPadronizacao v-model:ver-todas="verTodasPadronizacoes" />
        </div>
      </section>
    </template>
  </LayoutSistema>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import GradeEstatisticas from '../components/ui/GradeEstatisticas.vue'
import RelatorioVazio from '../components/relatorio/RelatorioVazio.vue'
import CabecalhoRelatorio from '../components/relatorio/CabecalhoRelatorio.vue'
import AvisoStatusRelatorio from '../components/relatorio/AvisoStatusRelatorio.vue'
import ResumoTiposErro from '../components/relatorio/ResumoTiposErro.vue'
import ErrosPorCampo from '../components/relatorio/ErrosPorCampo.vue'
import TabelaDetalhesErros from '../components/relatorio/TabelaDetalhesErros.vue'
import TabelaPadronizacao from '../components/relatorio/TabelaPadronizacao.vue'
import RegistroAlteracoes from '../components/validacao/RegistroAlteracoes.vue'
import { useUploadStore } from '../stores/uploadStore'
import { nomeDoCampo } from '../constants/validacao'
import { formatarMoeda } from '../utils/formatadores'
import { exportarCsv } from '../utils/exportarCsv'

const store = useUploadStore()

const verTodasPadronizacoes = ref(false)
const detalhesAbertos = ref(false) // Estado local: detalhes recolhidos na tela.
const secaoDetalhes = ref(null)

// O botão fica no fim da página: ao abrir, rola até ele (no topo da tela) com os detalhes logo abaixo.
async function alternarDetalhes() {
  detalhesAbertos.value = !detalhesAbertos.value
  if (!detalhesAbertos.value) return
  await nextTick()
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  secaoDetalhes.value?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
}

// Valores calculados pelos Getters da store. Válidos e com erro já estão no aviso de status acima.
const indicadores = computed(() => [
  { rotulo: 'Total de linhas', valor: store.quantidadeLinhas },
  { rotulo: 'Clientes únicos', valor: store.quantidadeClientes },
  { rotulo: 'Faturamento aprovado', valor: formatarMoeda(store.faturamentoTotal, true) },
  { rotulo: 'Faturamento médio', valor: formatarMoeda(store.faturamentoMedio, true) }
])

function exportarErros() {
  exportarCsv(
    `erros-${store.nomeArquivo.replace(/\.[^.]+$/, '')}.csv`,
    ['Linha', 'Código', 'Campo', 'Tipo', 'Descrição'],
    store.ocorrencias.map(o => [o.linha, o.codigo_cliente, nomeDoCampo(o.campo), o.tipo, o.descricao])
  )
}

async function imprimir() {
  verTodasPadronizacoes.value = true // Imprime a lista completa de padronizações.
  await nextTick()
  window.print()
}

// Ctrl+P também imprime a lista completa (os detalhes recolhidos já aparecem pelo print:flex).
function antesDeImprimir() {
  verTodasPadronizacoes.value = true
}
onMounted(() => window.addEventListener('beforeprint', antesDeImprimir))
onUnmounted(() => window.removeEventListener('beforeprint', antesDeImprimir))
</script>
