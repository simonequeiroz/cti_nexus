<!-- Seção "Jornada": os passos do usuário no sistema, em ordem. -->
<template>
  <section id="jornada" aria-labelledby="titulo-jornada" class="pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <h2 id="titulo-jornada" class="text-xs font-mono font-bold tracking-widest uppercase text-regular mb-6">Jornada do usuário</h2>

      <ol class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <li
          v-for="(passo, indice) in PASSOS"
          :key="passo.titulo"
          class="bg-white/85 backdrop-blur-sm p-6 rounded-xl border border-blue-secondary shadow-sm"
        >
          <span class="font-mono text-xs font-bold text-blue-primary bg-blue-secondary/30 px-2.5 py-1 rounded" aria-hidden="true">
            {{ String(indice + 1).padStart(2, '0') }}
          </span>
          <h3 class="font-display font-bold text-base mt-3 mb-1 text-black-dark">{{ passo.titulo }}</h3>
          <p class="text-xs text-regular">{{ passo.descricao }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
const PASSOS = [
  { titulo: 'Apresentação', descricao: 'Página de apresentação do sistema.' },
  { titulo: 'Entrar', descricao: 'Acesso para funcionários autorizados.' },
  { titulo: 'Enviar', descricao: 'Envio e conferência da planilha.' },
  { titulo: 'Painel', descricao: 'Gráficos, indicadores e conclusões.' }
]
</script>
