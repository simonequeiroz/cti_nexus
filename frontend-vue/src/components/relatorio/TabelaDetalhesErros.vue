<!-- Todos os erros com linha, código, campo, tipo e descrição. Tem filtro por tipo e busca. -->
<template>
  <CartaoPainel titulo="Detalhamento dos erros" descricao="Linha da planilha, campo com problema e o que precisa ser corrigido.">
    <template #acoes>
      <div role="search" class="print:hidden">
        <label for="busca-erros" class="sr-only">Buscar erros</label>
        <input
          id="busca-erros"
          v-model="busca"
          type="search"
          placeholder="Buscar por linha, código ou descrição"
          class="w-full md:w-72 bg-white border border-blue-secondary rounded-lg px-3.5 py-2 text-sm outline-none placeholder:text-black-light focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15"
        />
      </div>
    </template>

    <fieldset v-if="store.ocorrencias.length" class="px-6 py-3 border-b border-blue-secondary/60 flex flex-wrap gap-2 print:hidden">
      <legend class="sr-only">Filtrar por tipo de erro</legend>
      <button
        v-for="opcao in opcoesFiltro"
        :key="opcao.nome"
        type="button"
        class="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
        :class="filtroTipo === opcao.nome ? 'bg-blue-primary text-white border-blue-primary' : 'border-blue-secondary text-regular hover:border-blue-primary hover:text-blue-primary'"
        :aria-pressed="filtroTipo === opcao.nome"
        @click="filtroTipo = opcao.nome"
      >
        {{ opcao.nome }} ({{ opcao.quantidade }})
      </button>
    </fieldset>

    <TabelaDados v-if="ocorrenciasFiltradas.length" legenda="Erros encontrados na planilha" :colunas="COLUNAS">
      <tr v-for="(ocorrencia, i) in ocorrenciasFiltradas" :key="i">
        <th scope="row" class="pl-6 pr-4 py-2.5 font-mono font-semibold text-left">{{ ocorrencia.linha }}</th>
        <td class="px-4 py-2.5 font-mono whitespace-nowrap">{{ ocorrencia.codigo_cliente }}</td>
        <td class="px-4 py-2.5 whitespace-nowrap">{{ nomeDoCampo(ocorrencia.campo) }}</td>
        <td class="px-4 py-2.5"><EtiquetaBase :cor="corDoTipo(ocorrencia.tipo)">{{ ocorrencia.tipo }}</EtiquetaBase></td>
        <td class="px-4 py-2.5">{{ ocorrencia.descricao }}</td>
      </tr>
    </TabelaDados>
    <MensagemVazia v-else>
      {{ store.ocorrencias.length ? 'Nenhum erro encontrado com esse filtro.' : 'Nenhum erro encontrado. A planilha está pronta para o ETL.' }}
    </MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import { ref, computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo, corDoTipo } from '../../constants/validacao'

const COLUNAS = [
  { rotulo: 'Linha', classe: 'w-20' },
  { rotulo: 'Código' },
  { rotulo: 'Campo' },
  { rotulo: 'Tipo' },
  { rotulo: 'Descrição' }
]

const store = useUploadStore()

const busca = ref('')
const filtroTipo = ref('Todos')

const opcoesFiltro = computed(() => [
  { nome: 'Todos', quantidade: store.ocorrencias.length },
  ...store.errosPorTipo
])

const ocorrenciasFiltradas = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return store.ocorrencias.filter(ocorrencia => {
    if (filtroTipo.value !== 'Todos' && ocorrencia.tipo !== filtroTipo.value) return false
    if (!termo) return true
    return [ocorrencia.linha, ocorrencia.codigo_cliente, ocorrencia.descricao, nomeDoCampo(ocorrencia.campo)]
      .some(valor => String(valor).toLowerCase().includes(termo))
  })
})
</script>
