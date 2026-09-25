<!-- Lista das mensagens de erro geradas pela validação. -->
<template>
  <PanelCard titulo="Inconsistências">
    <template #acoes>
      <p v-if="store.erros.length" class="text-xs font-semibold text-orange">{{ store.erros.length }} linha(s) com problema</p>
    </template>

    <ul v-if="store.erros.length" class="max-h-64 overflow-y-auto divide-y divide-blue-secondary/50 text-sm">
      <li v-for="erro in store.erros" :key="erro" class="px-6 py-2.5 flex gap-2">
        <span class="text-orange" aria-hidden="true">⚠</span>
        {{ erro }}
      </li>
    </ul>
    <EmptyMessage v-else>
      {{ store.quantidadeLinhas ? 'Nenhuma inconsistência encontrada.' : 'Processe um arquivo para ver as inconsistências.' }}
    </EmptyMessage>
  </PanelCard>
</template>

<script setup>
import PanelCard from '../ui/PanelCard.vue'
import EmptyMessage from '../ui/EmptyMessage.vue'
import { useUploadStore } from '../../stores/uploadStore'

const store = useUploadStore()
</script>
