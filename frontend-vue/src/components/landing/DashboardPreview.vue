<!-- Exemplo de dashboard depois do tratamento: indicadores e gráfico de segmentos. -->
<template>
  <figure class="p-8 bg-black-dark text-white">
    <figcaption class="text-[11px] font-mono tracking-wider uppercase text-black-light mb-4 font-semibold">Dashboard — depois do tratamento</figcaption>

    <StatGrid :itens="INDICADORES" escuro class="grid-cols-2 mb-5 [&_dd]:text-lg" />

    <figure class="flex items-center gap-5 bg-white/5 p-3.5 rounded-lg border border-white/10">
      <svg class="w-16 h-16 shrink-0" viewBox="0 0 36 36" role="img" aria-labelledby="legenda-segmentos">
        <circle cx="18" cy="18" r="15.5" fill="none" class="stroke-black-color" stroke-width="4" />
        <circle cx="18" cy="18" r="15.5" fill="none" class="stroke-blue-primary" stroke-width="4" stroke-dasharray="65 100" stroke-dashoffset="25" stroke-linecap="round" />
        <circle cx="18" cy="18" r="15.5" fill="none" class="stroke-green" stroke-width="4" stroke-dasharray="18 100" stroke-dashoffset="-40" stroke-linecap="round" />
      </svg>
      <figcaption id="legenda-segmentos">
        <ul class="text-xs text-blue-secondary space-y-1 font-medium">
          <li v-for="segmento in SEGMENTOS" :key="segmento.nome" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="segmento.cor" aria-hidden="true"></span>
            {{ segmento.nome }} — {{ segmento.percentual }}
          </li>
        </ul>
      </figcaption>
    </figure>
  </figure>
</template>

<script setup>
import StatGrid from '../ui/StatGrid.vue'

const INDICADORES = [
  { rotulo: 'Clientes', valor: '1.248' },
  { rotulo: 'Faturamento', valor: 'R$ 2,4M' },
  { rotulo: 'Ticket médio', valor: 'R$ 1.971' },
  { rotulo: 'Classe A', valor: '72%' }
]

const SEGMENTOS = [
  { nome: 'Indústria', percentual: '65%', cor: 'bg-blue-primary' },
  { nome: 'Comércio', percentual: '18%', cor: 'bg-green' },
  { nome: 'Serviços', percentual: '17%', cor: 'bg-orange' }
]
</script>
