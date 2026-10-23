<!-- Painel escuro ao lado do login, com a marca e os passos do sistema. Some no celular. -->
<template>
  <!-- Os tamanhos crescem com a tela (lg → xl): o painel ocupa metade da tela, então o texto acompanha. -->
  <aside class="relative hidden lg:flex flex-col justify-between bg-black-dark text-white p-12 xl:p-16 overflow-hidden">
    <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="grade-login" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" class="stroke-white" stroke-width="1" stroke-opacity="0.06" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grade-login)" />
    </svg>
    <div class="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-primary/30 blur-3xl rounded-full pointer-events-none" aria-hidden="true"></div>

    <LogoMarca claro class="relative xl:text-2xl" />

    <div class="relative">
      <RotuloSuperior claro class="mb-5 xl:text-sm">Tratamento e análise de dados comerciais</RotuloSuperior>
      <p class="font-display font-bold text-5xl xl:text-6xl leading-[1.1] tracking-tight max-w-xl xl:max-w-2xl">
        Do <del class="text-black-light decoration-orange decoration-4">Excel bagunçado</del> à decisão certa.
      </p>

      <ol class="mt-12 space-y-5 text-base xl:text-lg 2xl:text-xl text-blue-secondary max-w-lg 2xl:max-w-xl">
        <li v-for="(passo, indice) in PASSOS" :key="passo" class="flex gap-4">
          <span class="font-mono text-blue-primary font-semibold" aria-hidden="true">{{ String(indice + 1).padStart(2, '0') }}</span>
          {{ passo }}
        </li>
      </ol>
    </div>

    <!-- Rodapé: autoria do trabalho (o nome do sistema já está no logo, lá em cima). -->
    <p class="relative text-sm text-black-light">© 2026 · Projeto Integrador II · SENAI</p>
  </aside>
</template>

<script setup>
import LogoMarca from '../ui/LogoMarca.vue'
import RotuloSuperior from '../ui/RotuloSuperior.vue'

const PASSOS = [
  'Envie a planilha da carteira de clientes.',
  'O sistema corrige a escrita e aponta o que falta.',
  'Os dados corrigidos viram indicadores e conclusões.'
]
</script>
