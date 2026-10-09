<!-- Histórico das planilhas conferidas nesta sessão (quem enviou, quando e o resultado). Os erros linha a linha ficam só na Validação. -->
<template>
  <CartaoPainel titulo="Histórico de envios" descricao="Fica guardado até você recarregar ou fechar a página.">
    <template #acoes>
      <button
        v-if="store.historico.length && auth.pode('limpar_historico')"
        type="button"
        class="text-xs font-semibold text-regular hover:text-orange transition-colors"
        @click="store.limparHistorico()"
      >
        Limpar histórico
      </button>
    </template>

    <TabelaDados v-if="store.historico.length" legenda="Planilhas enviadas nesta visita" :colunas="COLUNAS">
      <tr v-for="registro in store.historico" :key="registro.id">
        <td class="pl-6 pr-4 py-2.5 font-mono whitespace-nowrap">
          <time :datetime="dataISO(registro.dataProcessamento)">{{ formatarData(registro.dataProcessamento) }}</time>
        </td>
        <th scope="row" class="px-4 py-2.5 max-w-[220px] font-normal text-left">
          <span class="block truncate" :title="registro.nomeArquivo">{{ registro.nomeArquivo }}</span>
          <!-- Leitura que falhou: o motivo (ex.: coluna faltando) só existe aqui, porque a Validação não abre. -->
          <span v-if="registro.motivo" class="block text-xs text-red-700 whitespace-normal">{{ registro.motivo }}</span>
        </th>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ registro.enviadoPor?.nome ?? '—' }}</td>
        <td class="px-4 py-2.5 text-right font-mono whitespace-nowrap">{{ formatarTamanho(registro.tamanhoArquivo) }}</td>
        <td class="px-4 py-2.5 text-right font-mono">{{ registro.totalLinhas }}</td>
        <td class="px-4 py-2.5 text-right font-mono text-green">{{ registro.validas }}</td>
        <td class="px-4 py-2.5 text-right font-mono" :class="{ 'text-orange': registro.invalidas }">{{ registro.invalidas }}</td>
        <td class="px-4 py-2.5 text-right font-mono">{{ registro.percentualValido }}%</td>
        <td class="px-4 py-2.5"><EtiquetaBase :cor="corDoStatus(registro.status)">{{ registro.status }}</EtiquetaBase></td>
        <td class="px-4 pr-6 py-2.5 text-right">
          <!-- Só a planilha aberta pode ser corrigida; as anteriores já foram substituídas. -->
          <a
            v-if="registro.id === store.idHistoricoAtual && registro.invalidas"
            href="#validacao"
            class="text-xs font-semibold text-blue-primary hover:underline whitespace-nowrap"
          >
            Corrigir →
          </a>
        </td>
      </tr>
    </TabelaDados>
    <MensagemVazia v-else>Nenhuma planilha enviada ainda.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { corDoStatus } from '../../constants/validacao'
import { formatarData, formatarTamanho, dataISO } from '../../utils/formatadores'

const COLUNAS = [
  { rotulo: 'Data' },
  { rotulo: 'Arquivo' },
  { rotulo: 'Enviado por' },
  { rotulo: 'Tamanho', classe: 'text-right' },
  { rotulo: 'Linhas', classe: 'text-right' },
  { rotulo: 'Aprovadas', classe: 'text-right' },
  { rotulo: 'Com erro', classe: 'text-right' },
  { rotulo: '% aprovado', classe: 'text-right' },
  { rotulo: 'Situação' },
  { rotulo: 'Ações', oculto: true }
]

const store = useUploadStore()
const auth = useAutenticacaoStore()
</script>
