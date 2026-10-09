<!-- Cartão "Arquivo": escolha da planilha, dados do arquivo, status e botões das Actions. O resultado fica no ResultadoValidacao. -->
<template>
  <CartaoPainel titulo="Arquivo" class="h-fit">
    <div class="p-6">
      <AreaSoltarArquivo @selecionar="store.registrarArquivo" />

      <!-- Arquivo recusado (formato/tamanho) ou que não pôde ser lido (colunas faltando, aba vazia): avisa junto do envio. -->
      <p v-if="store.falhouLeitura" role="alert" class="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
        {{ store.erros[0] }}
      </p>

      <!-- Arquivos gerados por "npm run planilhas" (scripts/gerarPlanilhas.js). -->
      <ul class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <li>
          <a href="/modelo-clientes.xlsx" download class="block h-full rounded-lg border border-blue-secondary px-3 py-2 hover:border-blue-primary hover:bg-blue-primary/5 transition-colors">
            <span class="block font-semibold text-blue-primary">Baixar modelo</span>
            <span class="block text-regular">Colunas certas e dicionário, para preencher</span>
          </a>
        </li>
        <li>
          <a href="/teste-clientes.xlsx" download class="block h-full rounded-lg border border-blue-secondary px-3 py-2 hover:border-blue-primary hover:bg-blue-primary/5 transition-colors">
            <span class="block font-semibold text-blue-primary">Planilha de teste</span>
            <span class="block text-regular">Com erros de propósito, para ver a conferência</span>
          </a>
        </li>
      </ul>

      <DetalhesArquivo v-if="store.nomeArquivo" class="mt-6" />

      <p class="mt-5 flex items-center justify-between text-sm text-regular">
        Situação
        <EtiquetaBase :cor="corDoStatus(store.statusValidacao)" role="status">{{ store.statusValidacao }}</EtiquetaBase>
      </p>

      <div class="mt-6 flex gap-3">
        <BotaoBase class="flex-1" :disabled="semArquivo" @click="store.processarArquivo()">
          {{ store.carregando ? 'Conferindo…' : 'Conferir planilha' }}
        </BotaoBase>
        <BotaoBase variante="secundario" :disabled="!store.nomeArquivo || store.carregando" @click="store.limparUpload()">
          Limpar
        </BotaoBase>
      </div>
    </div>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import AreaSoltarArquivo from './AreaSoltarArquivo.vue'
import DetalhesArquivo from './DetalhesArquivo.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { corDoStatus } from '../../constants/validacao'

const store = useUploadStore()

const semArquivo = computed(() => !store.arquivo || store.carregando)
</script>
