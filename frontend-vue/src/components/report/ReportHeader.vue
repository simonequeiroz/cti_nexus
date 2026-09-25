<!-- Abertura do relatório: nome do arquivo, data, tamanho e ações. -->
<template>
  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <PageIntro etapa="Etapa 2 — Relatório de validação" class="min-w-0">
      <template #titulo>
        <span class="sr-only">Relatório de validação do arquivo </span>
        <span class="block truncate" :title="store.nomeArquivo">{{ store.nomeArquivo }}</span>
      </template>
      <p class="text-sm font-mono">
        <time :datetime="dataISO(store.dataUpload)">{{ formatarData(store.dataUpload) }}</time>
        · {{ formatarTamanho(store.tamanhoArquivo) }}
      </p>
    </PageIntro>

    <div class="flex flex-wrap gap-3 print:hidden">
      <BaseButton variante="secundario" :disabled="!store.ocorrencias.length" @click="emit('exportar')">Exportar erros (CSV)</BaseButton>
      <BaseButton variante="secundario" @click="emit('imprimir')">Imprimir</BaseButton>
      <BaseButton href="#upload">Nova validação</BaseButton>
    </div>
  </div>
</template>

<script setup>
import PageIntro from '../layout/PageIntro.vue'
import BaseButton from '../ui/BaseButton.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { formatarData, formatarTamanho, dataISO } from '../../utils/formatadores'

const emit = defineEmits(['exportar', 'imprimir'])

const store = useUploadStore()
</script>
