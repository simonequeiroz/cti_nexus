<!-- Tela de relatório: resultado completo da última validação. -->
<template>
  <LayoutSistema>
    <RelatorioVazio v-if="!store.quantidadeLinhas" />

    <template v-else>
      <CabecalhoRelatorio @exportar="exportarErros" @imprimir="imprimir" />
      <AvisoStatusRelatorio class="mt-8" />

      <section aria-labelledby="titulo-indicadores" class="mt-6">
        <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
        <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
      </section>

      <BarraQualidade class="mt-6" />

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumoTiposErro />
        <ErrosPorCampo />
      </div>

      <TabelaDetalhesErros class="mt-6" />
      <TabelaPadronizacao v-model:ver-todas="verTodasPadronizacoes" class="mt-6" />
    </template>
  </LayoutSistema>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import GradeEstatisticas from '../components/ui/GradeEstatisticas.vue'
import RelatorioVazio from '../components/relatorio/RelatorioVazio.vue'
import CabecalhoRelatorio from '../components/relatorio/CabecalhoRelatorio.vue'
import AvisoStatusRelatorio from '../components/relatorio/AvisoStatusRelatorio.vue'
import BarraQualidade from '../components/relatorio/BarraQualidade.vue'
import ResumoTiposErro from '../components/relatorio/ResumoTiposErro.vue'
import ErrosPorCampo from '../components/relatorio/ErrosPorCampo.vue'
import TabelaDetalhesErros from '../components/relatorio/TabelaDetalhesErros.vue'
import TabelaPadronizacao from '../components/relatorio/TabelaPadronizacao.vue'
import { useUploadStore } from '../stores/uploadStore'
import { nomeDoCampo } from '../constants/validacao'
import { formatarMoeda } from '../utils/formatadores'
import { exportarCsv } from '../utils/exportarCsv'

const store = useUploadStore()

const verTodasPadronizacoes = ref(false)

// Valores calculados pelos Getters da store.
const indicadores = computed(() => [
  { rotulo: 'Total de registros', valor: store.quantidadeLinhas },
  { rotulo: 'Válidos', valor: store.quantidadeValidas, cor: 'text-green' },
  { rotulo: 'Com erro', valor: store.quantidadeInvalidas, cor: store.quantidadeInvalidas ? 'text-orange' : undefined },
  { rotulo: 'Clientes únicos', valor: store.quantidadeClientes },
  { rotulo: 'Faturamento válido', valor: formatarMoeda(store.faturamentoTotal, true) },
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
</script>
