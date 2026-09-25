<!-- Colunas da planilha com mais erros, em ordem decrescente. -->
<template>
  <CartaoPainel titulo="Erros por campo" descricao="Colunas da planilha que mais precisam de atenção.">
    <dl v-if="store.errosPorCampo.length" class="px-6 py-4 space-y-4">
      <div v-for="item in store.errosPorCampo" :key="item.nome">
        <div class="flex justify-between text-sm mb-1.5">
          <dt>{{ nomeDoCampo(item.nome) }}</dt>
          <dd class="font-mono font-semibold">{{ item.quantidade }}</dd>
        </div>
        <BarraProgresso :valor="item.quantidade" :maximo="store.errosPorCampo[0].quantidade" />
      </div>
    </dl>
    <MensagemVazia v-else>Nenhum campo com erro.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import BarraProgresso from '../ui/BarraProgresso.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo } from '../../constants/validacao'

const store = useUploadStore()
</script>
