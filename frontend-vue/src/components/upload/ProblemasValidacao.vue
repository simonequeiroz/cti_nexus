<!-- Lista das mensagens de erro geradas pela validação. -->
<template>
  <CartaoPainel titulo="Inconsistências">
    <template #acoes>
      <p v-if="['Erro na leitura', 'Arquivo recusado'].includes(store.statusValidacao)" class="text-xs font-semibold text-red-700">Arquivo não pôde ser lido</p>
      <p v-else-if="store.erros.length" class="text-xs font-semibold text-orange">{{ store.erros.length }} linha(s) com problema</p>
    </template>

    <!-- No celular a lista tem altura máxima; no desktop ela ocupa a altura que sobrar no cartão. -->
    <ul v-if="store.erros.length" class="max-h-64 lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto divide-y divide-blue-secondary/50 text-sm">
      <li v-for="erro in store.erros" :key="erro" class="px-6 py-2.5 flex gap-2">
        <span class="text-orange" aria-hidden="true">⚠</span>
        {{ erro }}
      </li>
    </ul>
    <MensagemVazia v-else>
      {{ store.quantidadeLinhas ? 'Nenhuma inconsistência encontrada.' : 'Processe um arquivo para ver as inconsistências.' }}
    </MensagemVazia>

    <!-- Regras aplicadas por validarLinhas() (utils/validacao.js). Fica no rodapé e ocupa o espaço que sobra. -->
    <footer class="lg:mt-auto border-t border-blue-secondary/60 bg-surface/60 px-6 py-4">
      <h3 class="text-xs font-mono uppercase tracking-wider text-regular">O que é verificado</h3>
      <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <li v-for="regra in REGRAS" :key="regra" class="flex gap-2">
          <svg class="w-4 h-4 mt-0.5 shrink-0 text-blue-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
          {{ regra }}
        </li>
      </ul>
    </footer>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'

const store = useUploadStore()

// Resumo das regras de utils/validacao.js (dicionário de dados da aula).
const REGRAS = [
  'Colunas do modelo e campos obrigatórios',
  'Código do cliente sem duplicidade',
  'Segmento da lista e nível A, B ou C',
  'Faturamento numérico e não negativo',
  'Data de contratação válida (dd/mm/aaaa)',
  'Cidade e UF opcionais; UF com 2 letras'
]
</script>
