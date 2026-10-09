<!-- Abertura do relatório: nome do arquivo, quem enviou e liberou, datas, tamanho e ações. -->
<template>
  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
    <IntroducaoPagina etapa="Passo 3 de 4 — Relatório" class="min-w-0">
      <template #titulo>
        <span class="sr-only">Relatório da planilha </span>
        <span class="block truncate" :title="store.nomeArquivo">{{ store.nomeArquivo }}</span>
      </template>
      <p class="text-sm">
        Enviada por <strong class="text-black-dark">{{ store.enviadoPor?.nome ?? '—' }}</strong> em
        <time class="font-mono" :datetime="dataISO(store.dataUpload)">{{ formatarData(store.dataUpload) }}</time>
        · <span class="font-mono">{{ formatarTamanho(store.tamanhoArquivo) }}</span>
      </p>
      <p class="text-sm">
        <template v-if="store.liberada">
          Liberada para o painel por <strong class="text-black-dark">{{ store.liberacao.por?.nome ?? '—' }}</strong> em
          <time class="font-mono" :datetime="dataISO(store.liberacao.em)">{{ formatarData(store.liberacao.em) }}</time>
          <span v-if="store.mudouDesdeLiberacao" class="text-orange-dark"> (há correções mais novas, ainda não liberadas)</span>
        </template>
        <template v-else>Ainda não liberada para o painel.</template>
      </p>
    </IntroducaoPagina>

    <div class="flex flex-wrap gap-3 print:hidden">
      <BotaoBase variante="secundario" :disabled="!store.ocorrencias.length" @click="emit('exportar')">Baixar lista de erros</BotaoBase>
      <BotaoBase variante="secundario" @click="emit('imprimir')">Imprimir</BotaoBase>
      <BotaoBase v-if="auth.pode('enviar_planilha')" href="#upload">Enviar outra planilha</BotaoBase>
    </div>
  </div>
</template>

<script setup>
import IntroducaoPagina from '../layout/IntroducaoPagina.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { formatarData, formatarTamanho, dataISO } from '../../utils/formatadores'

const emit = defineEmits(['exportar', 'imprimir'])

const store = useUploadStore()
const auth = useAutenticacaoStore()
</script>
