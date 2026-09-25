<!-- Página institucional do CTI Nexus. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen relative isolate overflow-x-hidden">

    <!-- Efeitos de fundo: brilho azul no topo e rede neural (pontos ligados por linhas). -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-blue-primary/15 via-blue-primary/5 to-transparent blur-3xl pointer-events-none -z-10" aria-hidden="true"></div>
    <div
      class="absolute inset-x-0 top-55 h-300 -z-10 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_0%,#000_25%,#000_70%,transparent_100%)]"
      aria-hidden="true"
    >
      <FundoNeural />
    </div>

    <CabecalhoInicio />

    <main>
      <SecaoDestaque />
      <SecaoImpacto />
      <SecaoRecursos />
      <SecaoJornada />
      <SecaoChamada />
    </main>

    <RodapeInicio />
  </div>
</template>

<script setup>
import FundoNeural from '../components/ui/FundoNeural.vue'
import CabecalhoInicio from '../components/inicio/CabecalhoInicio.vue'
import SecaoDestaque from '../components/inicio/SecaoDestaque.vue'
import SecaoImpacto from '../components/inicio/SecaoImpacto.vue'
import SecaoRecursos from '../components/inicio/SecaoRecursos.vue'
import SecaoJornada from '../components/inicio/SecaoJornada.vue'
import SecaoChamada from '../components/inicio/SecaoChamada.vue'
import RodapeInicio from '../components/inicio/RodapeInicio.vue'
</script>
