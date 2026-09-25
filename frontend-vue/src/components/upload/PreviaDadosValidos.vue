<!-- Linhas que passaram na validação, já padronizadas, com paginação (a planilha pode ter até 20 mil linhas). -->
<template>
  <CartaoPainel titulo="Dados válidos (padronizados)">
    <template #acoes>
      <p v-if="store.quantidadeValidas" class="text-xs text-regular">
        {{ store.quantidadeValidas.toLocaleString('pt-BR') }} {{ store.quantidadeValidas === 1 ? 'linha válida' : 'linhas válidas' }}
      </p>
    </template>

    <TabelaDados v-if="store.quantidadeValidas" legenda="Linhas válidas da planilha" :colunas="COLUNAS">
      <tr v-for="linha in visiveis" :key="linha.codigo_cliente">
        <th scope="row" class="pl-6 pr-4 py-2.5 font-mono font-normal text-left">{{ linha.codigo_cliente }}</th>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.nome_cliente }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.consultor }}</td>
        <td class="px-4 py-2.5">{{ linha.segmento }}</td>
        <td class="px-4 py-2.5">{{ linha.nivel_cliente }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ linha.servicos_contratados }}</td>
        <td class="px-4 py-2.5 font-mono whitespace-nowrap">{{ linha.data_contratacao }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ [linha.cidade, linha.uf].filter(Boolean).join('/') || '—' }}</td>
        <td class="px-4 py-2.5 text-right font-mono whitespace-nowrap">{{ formatarMoeda(linha.faturamento_anual) }}</td>
      </tr>
    </TabelaDados>
    <Paginacao
      v-if="store.quantidadeValidas > 10"
      v-model:pagina="pagina"
      v-model:por-pagina="porPagina"
      :total="store.quantidadeValidas"
      rotulo="Paginação dos dados válidos"
    />
    <MensagemVazia v-if="!store.quantidadeValidas">Nenhuma linha válida para mostrar.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import Paginacao from '../ui/Paginacao.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { formatarMoeda } from '../../utils/formatadores'

// Estado local da paginação.
const pagina = ref(1)
const porPagina = ref(10)

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

const visiveis = computed(() => store.dadosValidos.slice((pagina.value - 1) * porPagina.value, pagina.value * porPagina.value))

watch(() => store.dadosValidos, () => { pagina.value = 1 }) // Planilha nova ou revalidada: volta para a primeira página.
</script>
