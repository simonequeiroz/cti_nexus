<!-- Seção "Sobre": os problemas de hoje e a pergunta que o sistema responde. -->
<template>
  <section id="sobre" aria-labelledby="titulo-impacto" class="py-20 bg-black-dark text-white relative">
    <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-[1fr_1.3fr] gap-12 items-center">
      <div>
        <h2 id="titulo-impacto" class="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-4">O impacto hoje</h2>
        <ul class="text-sm text-black-light divide-y divide-white/10">
          <li v-for="problema in PROBLEMAS" :key="problema" class="py-3 first:pt-0">{{ problema }}</li>
        </ul>
      </div>

      <div>
        <blockquote class="font-display font-semibold text-2xl md:text-4xl leading-snug">
          "Qual segmento traz <mark class="text-green bg-green/10 px-2 py-0.5 rounded">mais retorno</mark> para a empresa?"
        </blockquote>
        <p class="mt-4 text-sm text-black-light leading-relaxed">
          Hoje, essa pergunta não tem resposta rápida. O CTI Nexus existe pra mudar isso.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
const PROBLEMAS = [
  'Dados preenchidos manualmente, planilha por planilha',
  'Erros de digitação e inconsistências entre colunas',
  'Nenhuma análise automática ou cruzamento de dados'
]
</script>
