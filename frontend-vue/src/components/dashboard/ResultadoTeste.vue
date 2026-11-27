<!-- Resultado de um teste estatístico (Shapiro-Wilk, Qui-quadrado ou Correlação), calculado no Python (analise.py).
     Usado embaixo dos gráficos: pergunta + resposta, conclusão em português simples e, menor, os números do teste. -->
<template>
  <div class="px-6 py-4 border-t border-blue-secondary text-sm">
    <p class="font-semibold">
      {{ resultado.pergunta }}
      <span class="text-blue-primary">{{ resultado.resposta }}</span>
    </p>
    <p class="mt-1">{{ resultado.conclusao }}</p>
    <!-- Os números ficam menores: servem para quem quiser conferir (ex.: a professora). -->
    <p class="mt-1 text-xs text-regular">{{ resultado.detalhe }}</p>
  </div>
</template>

<script setup>
// O texto já vem pronto do Python (pergunta, resposta, conclusao, detalhe): o componente só mostra.
defineProps({
  resultado: { type: Object, required: true } // { teste, pergunta, resposta, conclusao, detalhe, ... }
})
</script>
