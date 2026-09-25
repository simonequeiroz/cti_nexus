<!-- Faixa verde (tudo certo) ou laranja (há erros) com o resumo do resultado. -->
<template>
  <section
    aria-labelledby="titulo-status"
    class="rounded-2xl border px-6 py-5 flex items-start gap-4"
    :class="arquivoValido ? 'bg-green/10 border-green/40' : 'bg-orange/10 border-orange/40'"
  >
    <span
      class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
      :class="arquivoValido ? 'bg-green' : 'bg-orange'"
      aria-hidden="true"
    >
      {{ arquivoValido ? '✓' : '!' }}
    </span>
    <div>
      <h2 id="titulo-status" class="font-display font-bold text-lg" :class="arquivoValido ? 'text-green-dark' : 'text-orange-dark'">
        {{ store.statusValidacao }}
      </h2>
      <p class="text-sm text-black-regular mt-0.5">
        <template v-if="arquivoValido">
          Todos os {{ store.quantidadeLinhas }} registros passaram na validação e estão prontos para o ETL.
        </template>
        <template v-else>
          {{ store.quantidadeInvalidas }} de {{ store.quantidadeLinhas }} registros precisam de correção antes do ETL.
          Foram encontrados {{ store.ocorrencias.length }} problema(s) no total.
        </template>
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useUploadStore } from '../../stores/uploadStore'

const store = useUploadStore()

const arquivoValido = computed(() => store.quantidadeInvalidas === 0)
</script>
