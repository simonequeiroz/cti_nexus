<!-- Valores corrigidos automaticamente (antes → depois). -->
<template>
  <PanelCard titulo="Padronizações aplicadas" descricao="Textos corrigidos automaticamente. Não impedem o envio da linha.">
    <template #acoes>
      <ul class="flex flex-wrap gap-2">
        <li v-for="item in store.padronizacoesPorCampo" :key="item.nome">
          <BaseBadge cor="bg-blue-primary/10 text-blue-primary">{{ nomeDoCampo(item.nome) }}: {{ item.quantidade }}</BaseBadge>
        </li>
      </ul>
    </template>

    <template v-if="store.padronizacoes.length">
      <DataTable legenda="Valores padronizados automaticamente" :colunas="COLUNAS">
        <tr v-for="(item, i) in visiveis" :key="i">
          <th scope="row" class="pl-6 pr-4 py-2.5 font-mono font-semibold text-left">{{ item.linha }}</th>
          <td class="px-4 py-2.5 whitespace-nowrap">{{ nomeDoCampo(item.campo) }}</td>
          <td class="px-4 py-2.5 font-mono whitespace-pre text-orange-dark"><del class="no-underline">"{{ item.antes }}"</del></td>
          <td class="px-4 py-2.5 text-black-light" aria-hidden="true">→</td>
          <td class="px-4 py-2.5 font-mono text-green-dark"><ins class="no-underline">"{{ item.depois }}"</ins></td>
        </tr>
      </DataTable>

      <button
        v-if="store.padronizacoes.length > LIMITE"
        type="button"
        class="w-full px-6 py-3 border-t border-blue-secondary/60 text-sm font-semibold text-blue-primary hover:bg-blue-primary/5 transition-colors print:hidden"
        :aria-expanded="verTodas"
        @click="verTodas = !verTodas"
      >
        {{ verTodas ? 'Mostrar menos' : `Ver todas (${store.padronizacoes.length})` }}
      </button>
    </template>
    <EmptyMessage v-else>Nenhum texto precisou ser padronizado.</EmptyMessage>
  </PanelCard>
</template>

<script setup>
import { computed } from 'vue'
import PanelCard from '../ui/PanelCard.vue'
import DataTable from '../ui/DataTable.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import EmptyMessage from '../ui/EmptyMessage.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo } from '../../constants/validacao'

const LIMITE = 10

const COLUNAS = [
  { rotulo: 'Linha', classe: 'w-20' },
  { rotulo: 'Campo' },
  { rotulo: 'Antes' },
  { rotulo: 'Para', oculto: true, classe: 'w-8' },
  { rotulo: 'Depois' }
]

const store = useUploadStore()

const verTodas = defineModel('verTodas', { type: Boolean, default: false }) // A página abre tudo antes de imprimir.

const visiveis = computed(() => (verTodas.value ? store.padronizacoes : store.padronizacoes.slice(0, LIMITE)))
</script>
