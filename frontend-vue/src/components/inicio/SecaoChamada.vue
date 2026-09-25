<!-- Faixa final com chamada para acessar o sistema. -->
<template>
  <section aria-labelledby="titulo-cta" class="bg-black-dark text-white py-14">
    <div class="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
      <h2 id="titulo-cta" class="font-display font-bold text-xl md:text-2xl max-w-lg leading-tight">
        Pare de gerenciar clientes na planilha. Comece a decidir com dado tratado.
      </h2>
      <BotaoBase href="#login" tamanho="lg" class="shadow-lg">Acessar sistema →</BotaoBase>
    </div>
  </section>
</template>

<script setup>
import BotaoBase from '../ui/BotaoBase.vue'
</script>
