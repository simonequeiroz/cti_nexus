<!-- Liberação para o painel (o "L" do ETL): só os clientes aprovados e liberados aparecem no Dashboard.
     Estados: aguardando liberação, liberada, ou liberada mas com correções mais novas. -->
<template>
  <section
    aria-labelledby="titulo-liberacao"
    class="rounded-2xl border p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4"
    :class="ESTILO[estado]"
  >
    <div class="flex-1">
      <h2 id="titulo-liberacao" class="font-display font-bold text-lg">{{ titulo }}</h2>
      <p class="mt-1 text-sm text-regular">
        <template v-if="estado === 'aguardando'">
          {{ textoClientes(store.quantidadeValidas) }} {{ store.quantidadeValidas === 1 ? 'aprovado ainda não aparece' : 'aprovados ainda não aparecem' }} no painel.
          <template v-if="store.quantidadeInvalidas">{{ textoLinhas(store.quantidadeInvalidas) }} com erro {{ store.quantidadeInvalidas === 1 ? 'fica' : 'ficam' }} de fora até {{ store.quantidadeInvalidas === 1 ? 'ser corrigida' : 'serem corrigidas' }}.</template>
        </template>
        <template v-else-if="estado === 'liberada'">
          Liberada por <strong class="text-black-dark">{{ store.liberacao.por?.nome ?? '—' }}</strong> em
          <time :datetime="dataISO(store.liberacao.em)">{{ formatarData(store.liberacao.em) }}</time> ·
          {{ textoClientes(store.liberacao.quantidade) }} no painel.
        </template>
        <template v-else>
          Houve correções depois da liberação de <time :datetime="dataISO(store.liberacao.em)">{{ formatarData(store.liberacao.em) }}</time>.
          O painel ainda mostra a versão anterior ({{ textoClientes(store.liberacao.quantidade) }}).
        </template>
      </p>
      <p v-if="podeLiberar && store.edicoesPendentes" class="mt-1 text-sm text-orange-dark">
        Clique em <strong>Conferir de novo</strong> antes de liberar, para as correções valerem.
      </p>
      <p v-if="mensagem" role="status" class="mt-1 text-sm text-green-dark font-medium">{{ mensagem }}</p>
    </div>

    <div class="flex flex-wrap gap-3 shrink-0">
      <BotaoBase
        v-if="estado !== 'liberada' && podeLiberar"
        :disabled="store.edicoesPendentes > 0"
        @click="liberar"
      >
        {{ estado === 'aguardando' ? 'Liberar' : 'Liberar de novo' }} {{ textoClientes(store.quantidadeValidas) }} →
      </BotaoBase>
      <BotaoBase v-if="store.liberada" href="#dashboard" variante="secundario">Ver painel</BotaoBase>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { formatarData, dataISO } from '../../utils/formatadores'

const store = useUploadStore()
const auth = useAutenticacaoStore()

const ESTILO = {
  aguardando: 'border-blue-primary/40 bg-blue-primary/5',
  liberada: 'border-green/40 bg-green/10',
  desatualizada: 'border-orange/40 bg-orange/10'
}

const mensagem = ref('') // Confirmação depois de liberar.

const podeLiberar = computed(() => auth.pode('aprovar_carga'))

const estado = computed(() => {
  if (!store.liberada) return 'aguardando'
  return store.mudouDesdeLiberacao ? 'desatualizada' : 'liberada'
})

const titulo = computed(() => ({
  aguardando: 'Liberar para o painel',
  liberada: 'Liberada para o painel',
  desatualizada: 'Há correções esperando liberação'
})[estado.value])

function textoClientes(quantidade) {
  return `${quantidade.toLocaleString('pt-BR')} ${quantidade === 1 ? 'cliente' : 'clientes'}`
}

function textoLinhas(quantidade) {
  return `${quantidade.toLocaleString('pt-BR')} ${quantidade === 1 ? 'linha' : 'linhas'}`
}

function liberar() {
  if (store.liberarParaPainel()) mensagem.value = 'Pronto: o painel já mostra estes clientes.'
}
</script>
