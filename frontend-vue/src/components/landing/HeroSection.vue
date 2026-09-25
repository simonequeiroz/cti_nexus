<!-- Seção principal da landing page: título, chamada para ação e o painel antes/depois. -->
<template>
  <section id="hero" aria-labelledby="titulo-hero" class="pt-8 pb-12">
    <div class="max-w-7xl mx-auto px-6">
      <EyebrowLabel class="mb-4">Tratamento e análise de dados comerciais</EyebrowLabel>

      <h1 id="titulo-hero" class="font-display font-bold text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl text-black-dark">
        Do <del class="text-black-light decoration-orange decoration-4">Excel bagunçado</del> à decisão certa.
      </h1>

      <p class="mt-5 text-base md:text-lg text-regular max-w-xl leading-relaxed">
        Organize a carteira de clientes, padronize os dados e transforme planilhas manuais em insights estratégicos — sem digitação duplicada, sem "IND." e "Industria" convivendo na mesma coluna.
      </p>

      <div class="flex gap-4 mt-8 flex-wrap">
        <BaseButton href="#login" tamanho="lg" class="shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          Acessar sistema →
        </BaseButton>
        <BaseButton href="#recursos" variante="secundario" tamanho="lg" class="text-black-dark shadow-sm hover:-translate-y-0.5">
          Ver como funciona
        </BaseButton>
      </div>

      <TransformPanel class="mt-14" />
    </div>
  </section>
</template>

<script setup>
import EyebrowLabel from '../ui/EyebrowLabel.vue'
import BaseButton from '../ui/BaseButton.vue'
import TransformPanel from './TransformPanel.vue'
</script>
