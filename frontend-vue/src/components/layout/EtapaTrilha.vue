<!-- Uma etapa da trilha do dado: nó com ícone de status, nome, detalhe e a ligação até a próxima etapa. -->
<template>
  <li class="relative">
    <component
      :is="link ? 'a' : 'div'"
      :href="link"
      class="relative flex items-center gap-3 rounded-2xl p-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-primary"
      :class="ativa ? 'bg-white/10' : link ? 'hover:bg-white/5' : ''"
      :aria-current="ativa ? 'page' : undefined"
      :title="recolhida ? `${rotulo}: ${detalhe}` : undefined"
    >
      <span
        class="relative z-10 grid place-items-center w-10 h-10 shrink-0 rounded-full border-2 transition-all duration-500"
        :class="ESTILO_DO_NO[estado]"
      >
        <span
          v-if="estado === 'processando'"
          class="absolute inset-0 rounded-full bg-blue-primary/60 motion-safe:animate-ping"
          aria-hidden="true"
        ></span>
        <svg class="relative w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="ICONES[ICONE_DO_ESTADO[estado] ?? icone]" />
        </svg>
      </span>

      <!-- Recolhida, o texto continua para leitores de tela (sr-only) e aparece no title ao passar o mouse. -->
      <span class="min-w-0" :class="{ 'sr-only': recolhida }">
        <span class="block font-display font-semibold whitespace-nowrap" :class="ativa ? 'text-white' : 'text-white/80'">{{ rotulo }}</span>
        <span class="block text-xs font-mono truncate" :class="COR_DO_DETALHE[estado] ?? 'text-white/50'">{{ detalhe }}</span>
      </span>

      <span v-if="ativa && !recolhida" class="ml-auto w-1.5 h-1.5 shrink-0 rounded-full bg-orange shadow-[0_0_8px_#FF8F00]" aria-hidden="true"></span>
    </component>

    <!-- Ligação com a próxima etapa: acende quando o dado já passou por aqui. Fica no centro do nó (8px de padding + 20px). -->
    <span v-if="!ultima" class="absolute left-6.5 top-12 -bottom-5 w-1 rounded-full bg-white/10" aria-hidden="true">
      <span class="ligacao absolute inset-0 transition-transform duration-700 origin-top" :class="[ligacaoAcesa ? 'scale-y-100' : 'scale-y-0', { 'ligacao-alerta': estado === 'alerta' }]"></span>
    </span>
  </li>
</template>

<script setup>
defineProps({
  rotulo: { type: String, required: true },
  detalhe: { type: String, default: '' },
  icone: { type: String, required: true }, // upload | validacao | relatorio | dashboard
  estado: { type: String, default: 'pendente' }, // pendente | processando | concluida | alerta | erro
  link: { type: String, default: null }, // Sem link a etapa só mostra o status.
  ativa: { type: Boolean, default: false }, // Tela aberta no momento.
  ultima: { type: Boolean, default: false },
  ligacaoAcesa: { type: Boolean, default: false },
  recolhida: { type: Boolean, default: false } // Sidebar fina: mostra só o nó.
})

const ICONES = {
  upload: 'M12 16V4m0 0-4 4m4-4 4 4M4 20h16',
  validacao: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z',
  relatorio: 'M4 20h16M7 16v-5m5 5V6m5 10v-3',
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  concluida: 'M5 13l4 4L19 7',
  alerta: 'M12 7v6m0 4v.01',
  erro: 'M7 7l10 10M17 7 7 17'
}

// Quando a etapa termina (ou dá problema), o ícone dela vira o do status.
const ICONE_DO_ESTADO = {
  concluida: 'concluida',
  alerta: 'alerta',
  erro: 'erro'
}

const ESTILO_DO_NO = {
  pendente: 'border-white/20 bg-white/5 text-white/40',
  processando: 'border-blue-primary bg-blue-primary/20 text-white',
  concluida: 'border-blue-primary bg-blue-primary text-white shadow-glow',
  alerta: 'border-orange bg-orange/15 text-orange shadow-[0_0_10px_#FF8F00]',
  erro: 'border-red-400 bg-red-500/15 text-red-300'
}

const COR_DO_DETALHE = {
  pendente: 'text-white/40',
  alerta: 'text-orange',
  erro: 'text-red-300'
}
</script>

<style scoped>
/* "Pacotes de dados" correndo pela ligação acesa. */
.ligacao {
  background-image: repeating-linear-gradient(to bottom, #006EB7 0 10px, #7cc4ff 10px 14px);
  background-size: 100% 28px;
  border-radius: 9999px;
  box-shadow: 0 0 10px #006EB7;
  animation: fluxo-dados 1.2s linear infinite;
}

/* Depois de uma etapa com erros, o dado segue em laranja. */
.ligacao-alerta {
  background-image: repeating-linear-gradient(to bottom, #FF8F00 0 10px, #ffd08a 10px 14px);
  box-shadow: 0 0 10px #FF8F00;
}

@keyframes fluxo-dados {
  to { background-position: 0 28px; }
}

@media (prefers-reduced-motion: reduce) {
  .ligacao { animation: none; }
}
</style>
