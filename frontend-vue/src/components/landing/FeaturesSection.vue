<!-- Seção "Recursos": as três etapas da plataforma. -->
<template>
  <section id="recursos" aria-labelledby="titulo-recursos" class="py-20">
    <div class="max-w-7xl mx-auto px-6">
      <h2 id="titulo-recursos" class="font-display font-bold text-3xl text-black-dark max-w-xl mb-12">
        Três etapas, uma planilha vira decisão.
      </h2>

      <ul class="grid md:grid-cols-3 gap-6">
        <li v-for="recurso in RECURSOS" :key="recurso.titulo">
          <article class="h-full bg-white/85 backdrop-blur-sm p-8 rounded-xl border border-blue-secondary shadow-sm hover:shadow-md transition-all">
            <span class="block w-8 h-1 bg-blue-primary rounded mb-5" aria-hidden="true"></span>
            <h3 class="font-display font-bold text-lg mb-2 text-black-dark">{{ recurso.titulo }}</h3>
            <p class="text-sm text-regular leading-relaxed">{{ recurso.descricao }}</p>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
const RECURSOS = [
  {
    titulo: 'Upload automático',
    descricao: 'Envie a planilha .xlsx ou .csv direto no sistema — sem preparar nada antes, sem formatar manualmente.'
  },
  {
    titulo: 'Tratamento e padronização',
    descricao: 'O sistema identifica e corrige inconsistências de segmento, nível e faturamento antes de qualquer análise.'
  },
  {
    titulo: 'Dashboards e insights',
    descricao: 'Gráficos interativos e recomendações estratégicas geradas a partir dos dados já limpos — prontos pra decisão.'
  }
]
</script>
