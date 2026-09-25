<!-- Abertura do relatório: nome do arquivo, data, tamanho e ações. -->
<template>
  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <IntroducaoPagina etapa="Etapa 2 — Relatório de validação" class="min-w-0">
      <template #titulo>
        <span class="sr-only">Relatório de validação do arquivo </span>
        <span class="block truncate" :title="store.nomeArquivo">{{ store.nomeArquivo }}</span>
      </template>
      <p class="text-sm font-mono">
        <time :datetime="dataISO(store.dataUpload)">{{ formatarData(store.dataUpload) }}</time>
        · {{ formatarTamanho(store.tamanhoArquivo) }}
      </p>
    </IntroducaoPagina>

    <div class="flex flex-wrap gap-3 print:hidden">
      <BotaoBase variante="secundario" :disabled="!store.ocorrencias.length" @click="emit('exportar')">Exportar erros (CSV)</BotaoBase>
      <BotaoBase variante="secundario" @click="emit('imprimir')">Imprimir</BotaoBase>
      <BotaoBase href="#upload">Nova validação</BotaoBase>
    </div>
  </div>
</template>

<script setup>
import IntroducaoPagina from '../layout/IntroducaoPagina.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { formatarData, formatarTamanho, dataISO } from '../../utils/formatadores'

const emit = defineEmits(['exportar', 'imprimir'])

const store = useUploadStore()
</script>
