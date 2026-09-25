<!-- Tela de upload: envio da planilha, resultado da validação e histórico. -->
<template>
  <SystemLayout>
    <PageIntro etapa="Etapa 1 — Validação inicial" titulo="Upload de planilha">
      <p>Envie a carteira de clientes em Excel. Antes do ETL, o sistema padroniza os textos e aponta as linhas com problemas para você corrigir.</p>
    </PageIntro>

    <div class="mt-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <UploadPanel />

      <div class="flex flex-col gap-6 min-w-0">
        <section aria-labelledby="titulo-indicadores">
          <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
          <StatGrid :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
        </section>
        <ValidationIssues />
        <ValidDataPreview />
      </div>
    </div>

    <ProcessingHistory class="mt-10" />
  </SystemLayout>
</template>

<script setup>
import { computed } from 'vue'
import SystemLayout from '../components/layout/SystemLayout.vue'
import PageIntro from '../components/layout/PageIntro.vue'
import StatGrid from '../components/ui/StatGrid.vue'
import UploadPanel from '../components/upload/UploadPanel.vue'
import ValidationIssues from '../components/upload/ValidationIssues.vue'
import ValidDataPreview from '../components/upload/ValidDataPreview.vue'
import ProcessingHistory from '../components/upload/ProcessingHistory.vue'
import { useUploadStore } from '../stores/uploadStore'
import { formatarMoeda } from '../utils/formatadores'

const store = useUploadStore()

// Valores calculados pelos Getters da store.
const indicadores = computed(() => [
  { rotulo: 'Linhas', valor: store.quantidadeLinhas },
  { rotulo: 'Válidas', valor: store.quantidadeValidas, cor: 'text-green' },
  { rotulo: 'Inválidas', valor: store.quantidadeInvalidas, cor: store.quantidadeInvalidas ? 'text-orange' : undefined },
  { rotulo: 'Clientes únicos', valor: store.quantidadeClientes },
  { rotulo: '% válido', valor: `${store.percentualValido}%` },
  { rotulo: 'Faturamento', valor: formatarMoeda(store.faturamentoTotal, true) }
])
</script>
