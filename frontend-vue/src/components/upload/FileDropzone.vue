<!-- Área para arrastar ou escolher a planilha. Avisa o componente pai com o evento "selecionar". -->
<template>
  <label
    class="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl px-4 py-10 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-primary/30"
    :class="arrastando ? 'border-blue-primary bg-blue-primary/5' : 'border-blue-secondary hover:border-blue-primary hover:bg-blue-primary/5'"
    @dragover.prevent="arrastando = true"
    @dragleave.prevent="arrastando = false"
    @drop.prevent="soltarArquivo"
  >
    <svg class="w-10 h-10 text-blue-primary mb-3" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
    <span class="font-semibold text-sm">Arraste a planilha aqui</span>
    <span class="text-xs text-regular mt-1">ou clique para escolher (.xlsx, .xls, .csv)</span>

    <!-- sr-only (e não hidden) para o campo continuar acessível pelo teclado. -->
    <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="escolherArquivo" />
  </label>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['selecionar'])

const arrastando = ref(false) // Destaca a área enquanto o arquivo está sendo arrastado.

function escolherArquivo(evento) {
  const arquivo = evento.target.files[0]
  if (arquivo) emit('selecionar', arquivo)
  evento.target.value = '' // Permite escolher o mesmo arquivo de novo.
}

function soltarArquivo(evento) {
  arrastando.value = false
  const arquivo = evento.dataTransfer.files[0]
  if (arquivo) emit('selecionar', arquivo)
}
</script>
