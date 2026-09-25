<!-- Tela de relatório: resultado completo da última validação. -->
<template>
  <SystemLayout>
    <ReportEmptyState v-if="!store.quantidadeLinhas" />

    <template v-else>
      <ReportHeader @exportar="exportarErros" @imprimir="imprimir" />
      <ReportStatusBanner class="mt-8" />

      <section aria-labelledby="titulo-indicadores" class="mt-6">
        <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
        <StatGrid :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
      </section>

      <QualityBar class="mt-6" />

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorTypeSummary />
        <ErrorsByField />
      </div>

      <ErrorDetailsTable class="mt-6" />
      <StandardizationTable v-model:ver-todas="verTodasPadronizacoes" class="mt-6" />
    </template>
  </SystemLayout>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import SystemLayout from '../components/layout/SystemLayout.vue'
import StatGrid from '../components/ui/StatGrid.vue'
import ReportEmptyState from '../components/report/ReportEmptyState.vue'
import ReportHeader from '../components/report/ReportHeader.vue'
import ReportStatusBanner from '../components/report/ReportStatusBanner.vue'
import QualityBar from '../components/report/QualityBar.vue'
import ErrorTypeSummary from '../components/report/ErrorTypeSummary.vue'
import ErrorsByField from '../components/report/ErrorsByField.vue'
import ErrorDetailsTable from '../components/report/ErrorDetailsTable.vue'
import StandardizationTable from '../components/report/StandardizationTable.vue'
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
