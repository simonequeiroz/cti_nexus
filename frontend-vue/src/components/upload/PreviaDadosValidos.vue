<!-- Prévia das primeiras linhas que passaram na validação, já padronizadas. -->
<template>
  <CartaoPainel titulo="Dados válidos (padronizados)">
    <template #acoes>
      <p v-if="store.quantidadeValidas > LIMITE" class="text-xs text-regular">
        Mostrando {{ LIMITE }} de {{ store.quantidadeValidas }}
      </p>
    </template>

    <TabelaDados v-if="store.quantidadeValidas" legenda="Prévia das linhas válidas da planilha" :colunas="COLUNAS">
      <tr v-for="linha in store.dadosValidos.slice(0, LIMITE)" :key="linha.codigo_cliente">
        <th scope="row" class="pl-6 pr-4 py-2.5 font-mono font-normal text-left">{{ linha.codigo_cliente }}</th>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.nome_cliente }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.consultor }}</td>
        <td class="px-4 py-2.5">{{ linha.segmento }}</td>
        <td class="px-4 py-2.5">{{ linha.nivel_cliente }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.servicos_contratados }}</td>
        <td class="px-4 py-2.5 font-mono whitespace-nowrap">{{ linha.data_contratacao }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.cidade }}/{{ linha.uf }}</td>
        <td class="px-4 py-2.5 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.faturamento_anual) }}</td>
      </tr>
    </TabelaDados>
    <MensagemVazia v-else>Nenhuma linha válida para mostrar.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { formatarMoeda } from '../../utils/formatadores'

const LIMITE = 10 // Quantidade de linhas mostradas na prévia.

const COLUNAS = [
  { rotulo: 'Código' },
  { rotulo: 'Cliente' },
  { rotulo: 'Consultor' },
  { rotulo: 'Segmento' },
  { rotulo: 'Nível' },
  { rotulo: 'Serviços' },
  { rotulo: 'Contratação' },
  { rotulo: 'Cidade/UF' },
  { rotulo: 'Faturamento', classe: 'text-right' }
]

const store = useUploadStore()
</script>
