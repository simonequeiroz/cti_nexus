<!-- Barra com a proporção de registros válidos e com erro. -->
<template>
  <section aria-labelledby="titulo-qualidade" class="bg-white border border-blue-secondary/80 rounded-2xl p-6 shadow-sm">
    <header class="flex items-center justify-between mb-3">
      <h2 id="titulo-qualidade" class="font-display font-bold text-lg">Qualidade dos dados</h2>
      <p class="font-display font-bold text-2xl">{{ store.percentualValido }}%</p>
    </header>

    <div class="h-3 rounded-full bg-blue-secondary/40 overflow-hidden flex gap-0.5" aria-hidden="true">
      <div class="bg-green h-full" :style="{ width: porcentagem(store.quantidadeValidas, store.quantidadeLinhas) }"></div>
      <div class="bg-orange h-full" :style="{ width: porcentagem(store.quantidadeInvalidas, store.quantidadeLinhas) }"></div>
    </div>

    <ul class="mt-3 flex gap-6 text-xs text-regular">
      <li class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-green" aria-hidden="true"></span>Válidos ({{ store.quantidadeValidas }})</li>
      <li class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-orange" aria-hidden="true"></span>Com erro ({{ store.quantidadeInvalidas }})</li>
    </ul>
  </section>
</template>

<script setup>
import { useUploadStore } from '../../stores/uploadStore'
import { porcentagem } from '../../utils/formatadores'

const store = useUploadStore()
</script>
