<!-- Seção principal da landing page: título, chamada para ação e o painel antes/depois. -->
<template>
  <section id="hero" aria-labelledby="titulo-hero" class="pt-8 pb-12">
    <div class="max-w-7xl mx-auto px-6">
      <RotuloSuperior class="mb-4">Tratamento e análise de dados comerciais</RotuloSuperior>

      <h1 id="titulo-hero" class="font-display font-bold text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl text-black-dark">
        Do Cadastro <del class="text-black-light decoration-orange decoration-4">inconsistente</del> ao insight confiável.
      </h1>

      <p class="mt-5 text-base md:text-lg text-regular max-w-xl leading-relaxed">
        A carteira de clientes do provedor, padronizada e pronta para análise. Sem "IND." e "Industria" na mesma coluna, sem digitação duplicada.
      </p>

      <div class="flex gap-4 mt-8 flex-wrap">
        <BotaoBase href="#login" tamanho="lg" class="shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          Acessar sistema →
        </BotaoBase>
        <BotaoBase href="#recursos" variante="secundario" tamanho="lg" class="text-black-dark shadow-sm hover:-translate-y-0.5">
          Ver como funciona
        </BotaoBase>
      </div>

      <!-- Microcopy: orienta quem já tem acesso e quem está chegando agora. -->
      <p class="mt-4 text-sm text-regular">
        Já tem conta? <a href="#login" class="font-semibold text-blue-primary hover:underline focus-visible:outline-2 focus-visible:outline-blue-primary">Acesse</a>.
        Novo por aqui? Use o <a href="#login" class="font-semibold text-blue-primary hover:underline focus-visible:outline-2 focus-visible:outline-blue-primary">acesso de demonstração</a> e importe sua primeira planilha em minutos.
      </p>

      <PainelTransformacao class="mt-14" />
    </div>
  </section>
</template>

<script setup>
import RotuloSuperior from '../ui/RotuloSuperior.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import PainelTransformacao from './PainelTransformacao.vue'
</script>
