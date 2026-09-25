<!-- Nome, tamanho e data do arquivo escolhido (vindos do State). -->
<template>
  <dl class="text-sm divide-y divide-blue-secondary/60 border-y border-blue-secondary/60">
    <div class="flex justify-between gap-4 py-2.5">
      <dt class="text-regular">Nome</dt>
      <dd class="font-medium truncate" :title="store.nomeArquivo">{{ store.nomeArquivo }}</dd>
    </div>
    <div class="flex justify-between gap-4 py-2.5">
      <dt class="text-regular">Tamanho</dt>
      <dd class="font-mono">{{ formatarTamanho(store.tamanhoArquivo) }}</dd>
    </div>
    <div class="flex justify-between gap-4 py-2.5">
      <dt class="text-regular">Upload</dt>
      <dd class="font-mono"><time :datetime="dataISO(store.dataUpload)">{{ formatarData(store.dataUpload) }}</time></dd>
    </div>
  </dl>
</template>

<script setup>
import { useUploadStore } from '../../stores/uploadStore'
import { formatarTamanho, formatarData, dataISO } from '../../utils/formatadores'

const store = useUploadStore()
</script>
