<!-- Faixa verde (tudo certo) ou laranja (há erros) com o resumo do resultado e a qualidade dos dados (válidos x com erro). -->
<template>
  <section
    aria-labelledby="titulo-status"
    class="rounded-2xl border px-6 py-5"
    :class="arquivoValido ? 'bg-green/10 border-green/40' : 'bg-orange/10 border-orange/40'"
  >
    <div class="flex flex-wrap items-start gap-4">
      <span
        class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
        :class="arquivoValido ? 'bg-green' : 'bg-orange'"
        aria-hidden="true"
      >
        {{ arquivoValido ? '✓' : '!' }}
      </span>
      <div class="flex-1 min-w-60">
        <h2 id="titulo-status" class="font-display font-bold text-lg" :class="arquivoValido ? 'text-green-dark' : 'text-orange-dark'">
          {{ store.statusValidacao }}
        </h2>
        <p class="text-sm text-black-regular mt-0.5">
          <template v-if="arquivoValido">
            Todas as {{ store.quantidadeLinhas }} linhas foram aprovadas e estão prontas para a análise.
          </template>
          <template v-else>
            {{ store.quantidadeInvalidas }} de {{ store.quantidadeLinhas }} linhas precisam de correção antes da análise.
            São {{ store.ocorrencias.length }} problema(s) no total.
          </template>
        </p>
      </div>
      <p class="font-display font-bold text-3xl" :class="arquivoValido ? 'text-green-dark' : 'text-orange-dark'">
        {{ store.percentualValido }}%
        <span class="block text-xs font-sans font-normal text-regular text-right">qualidade</span>
      </p>
    </div>

    <!-- Qualidade dos dados: proporção de registros válidos e com erro. -->
    <div class="mt-4 h-2.5 rounded-full bg-white/70 overflow-hidden flex gap-0.5" aria-hidden="true">
      <div class="bg-green h-full" :style="{ width: porcentagem(store.quantidadeValidas, store.quantidadeLinhas) }"></div>
      <div class="bg-orange h-full" :style="{ width: porcentagem(store.quantidadeInvalidas, store.quantidadeLinhas) }"></div>
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-regular">
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-green" aria-hidden="true"></span>Aprovados ({{ store.quantidadeValidas }})</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-orange" aria-hidden="true"></span>Com erro ({{ store.quantidadeInvalidas }})</span>
      <a v-if="!arquivoValido && auth.pode('corrigir_dados')" href="#validacao" class="ml-auto text-sm font-semibold text-blue-primary hover:underline print:hidden">
        Corrigir agora →
      </a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useUploadStore } from '../../stores/uploadStore'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { porcentagem } from '../../utils/formatadores'

const store = useUploadStore()
const auth = useAutenticacaoStore()

const arquivoValido = computed(() => store.quantidadeInvalidas === 0)
</script>
