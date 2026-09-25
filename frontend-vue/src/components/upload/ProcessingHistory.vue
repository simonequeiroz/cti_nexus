<!-- Histórico dos arquivos processados nesta sessão, com os erros de cada um. -->
<template>
  <PanelCard titulo="Histórico de processamento" descricao="Fica guardado só nesta sessão (Pinia). Ao recarregar a página, o histórico é apagado.">
    <template #acoes>
      <button
        v-if="store.historico.length"
        type="button"
        class="text-xs font-semibold text-regular hover:text-orange transition-colors"
        @click="store.limparHistorico()"
      >
        Limpar histórico
      </button>
    </template>

    <DataTable v-if="store.historico.length" legenda="Arquivos processados nesta sessão" :colunas="COLUNAS">
      <template v-for="registro in store.historico" :key="registro.id">
        <tr>
          <td class="pl-6 pr-4 py-2.5 font-mono whitespace-nowrap">
            <time :datetime="dataISO(registro.dataProcessamento)">{{ formatarData(registro.dataProcessamento) }}</time>
          </td>
          <th scope="row" class="px-4 py-2.5 max-w-[220px] truncate font-normal text-left" :title="registro.nomeArquivo">{{ registro.nomeArquivo }}</th>
          <td class="px-4 py-2.5 text-right font-mono whitespace-nowrap">{{ formatarTamanho(registro.tamanhoArquivo) }}</td>
          <td class="px-4 py-2.5 text-right font-mono">{{ registro.totalLinhas }}</td>
          <td class="px-4 py-2.5 text-right font-mono text-green">{{ registro.validas }}</td>
          <td class="px-4 py-2.5 text-right font-mono" :class="{ 'text-orange': registro.invalidas }">{{ registro.invalidas }}</td>
          <td class="px-4 py-2.5 text-right font-mono">{{ registro.percentualValido }}%</td>
          <td class="px-4 py-2.5"><BaseBadge :cor="corDoStatus(registro.status)">{{ registro.status }}</BaseBadge></td>
          <td class="px-4 py-2.5 text-right">
            <button
              v-if="registro.erros.length"
              type="button"
              class="text-xs font-semibold text-blue-primary hover:underline whitespace-nowrap"
              :aria-expanded="detalheAberto === registro.id"
              @click="alternarDetalhes(registro.id)"
            >
              {{ detalheAberto === registro.id ? 'Ocultar erros' : 'Ver erros' }}
            </button>
          </td>
        </tr>
        <tr v-if="detalheAberto === registro.id">
          <td :colspan="COLUNAS.length" class="px-6 pb-4 pt-2 bg-orange/5">
            <ul class="text-xs space-y-1">
              <li v-for="erro in registro.erros" :key="erro"><span aria-hidden="true">⚠</span> {{ erro }}</li>
            </ul>
          </td>
        </tr>
      </template>
    </DataTable>
    <EmptyMessage v-else>Nenhum arquivo processado ainda.</EmptyMessage>
  </PanelCard>
</template>

<script setup>
import { ref } from 'vue'
import PanelCard from '../ui/PanelCard.vue'
import DataTable from '../ui/DataTable.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import EmptyMessage from '../ui/EmptyMessage.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { corDoStatus } from '../../constants/validacao'
import { formatarData, formatarTamanho, dataISO } from '../../utils/formatadores'

const COLUNAS = [
  { rotulo: 'Data' },
  { rotulo: 'Arquivo' },
  { rotulo: 'Tamanho', classe: 'text-right' },
  { rotulo: 'Linhas', classe: 'text-right' },
  { rotulo: 'Válidas', classe: 'text-right' },
  { rotulo: 'Inválidas', classe: 'text-right' },
  { rotulo: '% válido', classe: 'text-right' },
  { rotulo: 'Status' },
  { rotulo: 'Detalhes', oculto: true }
]

const store = useUploadStore()

const detalheAberto = ref(null) // Id do registro com os erros abertos.

function alternarDetalhes(id) {
  detalheAberto.value = detalheAberto.value === id ? null : id
}
</script>
