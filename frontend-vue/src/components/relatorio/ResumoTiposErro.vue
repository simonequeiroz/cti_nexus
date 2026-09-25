<!-- Tabela "Validação realizada | Quantidade", com uma barra para cada tipo de erro. -->
<template>
  <CartaoPainel titulo="Resumo da validação" descricao="Quantidade de problemas por tipo de erro.">
    <TabelaDados legenda="Quantidade de problemas por tipo de erro" :colunas="COLUNAS">
      <tr v-for="tipo in TIPOS_DE_ERRO" :key="tipo.nome">
        <th scope="row" class="pl-6 pr-4 py-3 font-normal text-left">
          <span class="flex items-center gap-2 mb-1.5">
            <span class="w-2 h-2 rounded-full" :class="tipo.ponto" aria-hidden="true"></span>
            {{ tipo.nome }}
          </span>
          <BarraProgresso :valor="quantidadeDoTipo(tipo.nome)" :maximo="maiorQuantidade" :cor="tipo.ponto" altura="h-1.5" />
        </th>
        <td class="px-6 py-3 text-right font-mono font-semibold" :class="{ 'text-black-light': !quantidadeDoTipo(tipo.nome) }">
          {{ quantidadeDoTipo(tipo.nome) }}
        </td>
      </tr>
      <tr class="bg-green/5">
        <th scope="row" class="pl-6 pr-4 py-3 font-semibold text-left text-green-dark">Registros válidos</th>
        <td class="px-6 py-3 text-right font-mono font-semibold text-green-dark">{{ store.quantidadeValidas }}</td>
      </tr>
    </TabelaDados>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import BarraProgresso from '../ui/BarraProgresso.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { TIPOS_DE_ERRO } from '../../constants/validacao'

const COLUNAS = [
  { rotulo: 'Validação realizada' },
  { rotulo: 'Quantidade', classe: 'text-right w-24 pr-6' }
]

const store = useUploadStore()

const maiorQuantidade = computed(() => Math.max(1, ...store.errosPorTipo.map(item => item.quantidade)))

function quantidadeDoTipo(tipo) {
  return store.errosPorTipo.find(item => item.nome === tipo)?.quantidade ?? 0
}
</script>
