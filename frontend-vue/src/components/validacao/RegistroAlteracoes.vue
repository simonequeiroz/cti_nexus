<!-- Log "quem alterou o quê": correções feitas à mão na Validação (os ajustes automáticos ficam na TabelaPadronizacao). -->
<template>
  <CartaoPainel titulo="Alterações feitas à mão" descricao="Quem mudou cada valor, quando, e o que estava antes. Os ajustes automáticos ficam em outra tabela.">
    <TabelaDados v-if="store.alteracoes.length" legenda="Alterações feitas à mão na planilha" :colunas="COLUNAS">
      <tr v-for="alteracao in store.alteracoes" :key="alteracao.id">
        <td class="pl-6 pr-4 py-2.5 font-mono whitespace-nowrap">
          <time :datetime="dataISO(alteracao.em)">{{ formatarData(alteracao.em) }}</time>
        </td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ alteracao.usuario?.nome ?? '—' }}</td>
        <th scope="row" class="px-4 py-2.5 text-left font-normal whitespace-nowrap">
          <span class="font-mono">{{ alteracao.linha }}</span>
          <span v-if="alteracao.codigo" class="text-xs text-regular"> · {{ alteracao.codigo }}</span>
        </th>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ nomeDoCampo(alteracao.campo) }}</td>
        <td class="px-4 pr-6 py-2.5">
          <span class="font-mono text-orange-dark line-through decoration-orange/50">{{ alteracao.valorAntigo || '(vazio)' }}</span>
          <span class="mx-2 text-regular" aria-hidden="true">→</span>
          <span class="sr-only"> mudou para </span>
          <span class="font-mono text-green-dark">{{ alteracao.valorNovo || '(vazio)' }}</span>
        </td>
      </tr>
    </TabelaDados>
    <MensagemVazia v-else>Nenhuma alteração feita à mão nesta planilha.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo } from '../../constants/validacao'
import { formatarData, dataISO } from '../../utils/formatadores'

const store = useUploadStore()

const COLUNAS = [
  { rotulo: 'Quando' },
  { rotulo: 'Quem' },
  { rotulo: 'Linha' },
  { rotulo: 'Campo' },
  { rotulo: 'Antes → depois' }
]
</script>
