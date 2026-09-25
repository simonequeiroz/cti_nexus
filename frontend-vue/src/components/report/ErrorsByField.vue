<!-- Colunas da planilha com mais erros, em ordem decrescente. -->
<template>
  <PanelCard titulo="Erros por campo" descricao="Colunas da planilha que mais precisam de atenção.">
    <dl v-if="store.errosPorCampo.length" class="px-6 py-4 space-y-4">
      <div v-for="item in store.errosPorCampo" :key="item.nome">
        <div class="flex justify-between text-sm mb-1.5">
          <dt>{{ nomeDoCampo(item.nome) }}</dt>
          <dd class="font-mono font-semibold">{{ item.quantidade }}</dd>
        </div>
        <ProgressBar :valor="item.quantidade" :maximo="store.errosPorCampo[0].quantidade" />
      </div>
    </dl>
    <EmptyMessage v-else>Nenhum campo com erro.</EmptyMessage>
  </PanelCard>
</template>

<script setup>
import PanelCard from '../ui/PanelCard.vue'
import ProgressBar from '../ui/ProgressBar.vue'
import EmptyMessage from '../ui/EmptyMessage.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo } from '../../constants/validacao'

const store = useUploadStore()
</script>
