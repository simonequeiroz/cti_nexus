<!-- Cartão "Arquivo": escolha da planilha, dados do arquivo, status e botões das Actions. -->
<template>
  <PanelCard titulo="Arquivo" class="h-fit">
    <div class="p-6">
      <FileDropzone @selecionar="store.registrarArquivo" />

      <a href="/exemplo-clientes.xlsx" download class="block text-xs text-blue-primary hover:underline mt-3 text-center">
        Baixar planilha de exemplo
      </a>

      <FileDetails v-if="store.nomeArquivo" class="mt-6" />

      <p class="mt-5 flex items-center justify-between text-sm text-regular">
        Status
        <BaseBadge :cor="corDoStatus(store.statusValidacao)" role="status">{{ store.statusValidacao }}</BaseBadge>
      </p>

      <div class="mt-6 flex gap-3">
        <BaseButton class="flex-1" :disabled="semArquivo" @click="store.processarArquivo()">
          {{ store.carregando ? 'Processando…' : 'Processar arquivo' }}
        </BaseButton>
        <BaseButton variante="secundario" :disabled="semArquivo" @click="store.limparUpload()">
          Limpar
        </BaseButton>
      </div>

      <BaseButton v-if="store.quantidadeLinhas && !store.carregando" href="#relatorio" variante="contorno" class="mt-3 w-full">
        Ver relatório completo →
      </BaseButton>
    </div>
  </PanelCard>
</template>

<script setup>
import { computed } from 'vue'
import PanelCard from '../ui/PanelCard.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import FileDropzone from './FileDropzone.vue'
import FileDetails from './FileDetails.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { corDoStatus } from '../../constants/validacao'

const store = useUploadStore()

const semArquivo = computed(() => !store.arquivo || store.carregando)
</script>
