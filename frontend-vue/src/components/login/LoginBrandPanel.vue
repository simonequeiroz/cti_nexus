<!-- Painel escuro ao lado do login, com a marca e os passos do sistema. Some no celular. -->
<template>
  <aside class="relative hidden lg:flex flex-col justify-between bg-black-dark text-white p-12 overflow-hidden">
    <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="grade-login" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" class="stroke-white" stroke-width="1" stroke-opacity="0.06" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grade-login)" />
    </svg>
    <div class="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-primary/30 blur-3xl rounded-full pointer-events-none" aria-hidden="true"></div>

    <BrandLogo claro class="relative" />

    <div class="relative">
      <EyebrowLabel claro class="mb-4">Tratamento e análise de dados comerciais</EyebrowLabel>
      <p class="font-display font-bold text-4xl leading-[1.15] tracking-tight max-w-md">
        Do <del class="text-black-light decoration-orange decoration-4">Excel bagunçado</del> à decisão certa.
      </p>

      <ol class="mt-10 space-y-4 text-sm text-blue-secondary max-w-sm">
        <li v-for="(passo, indice) in PASSOS" :key="passo" class="flex gap-3">
          <span class="font-mono text-blue-primary font-semibold" aria-hidden="true">{{ String(indice + 1).padStart(2, '0') }}</span>
          {{ passo }}
        </li>
      </ol>
    </div>

    <p class="relative text-xs text-black-light font-mono">CTI Provedor · CTI Insights</p>
  </aside>
</template>

<script setup>
import BrandLogo from '../ui/BrandLogo.vue'
import EyebrowLabel from '../ui/EyebrowLabel.vue'

const PASSOS = [
  'Envie a planilha da carteira de clientes.',
  'O sistema padroniza e aponta as inconsistências.',
  'Os dados tratados viram indicadores e insights.'
]
</script>
