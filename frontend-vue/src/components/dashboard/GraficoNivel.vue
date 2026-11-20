<!-- Distribuição dos clientes por nível A, B e C em rosca (partes de um todo), com o total no miolo e legenda com %. -->
<template>
  <CartaoPainel titulo="Clientes por nível" descricao="Proporção da carteira em cada nível. Tom mais escuro = nível mais alto.">
    <div class="p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-6">
      <div class="relative">
        <GraficoBase
          tipo="rosca"
          :dados="dados"
          nome-serie="Clientes"
          descricao="Quantidade de clientes nos níveis A, B e C"
          :formatar-valor="comPercentual"
          :cores="dados.map(d => d.cor)"
          altura="15rem"
        />
        <!-- Total no miolo da rosca (a mesma informação está na legenda ao lado). -->
        <p class="absolute inset-0 grid place-content-center text-center pointer-events-none" aria-hidden="true">
          <span class="font-display font-bold text-3xl">{{ total }}</span>
          <span class="text-xs text-regular">{{ total === 1 ? 'cliente' : 'clientes' }}</span>
        </p>
      </div>

      <!-- Legenda com nome, quantidade e %: a cor nunca aparece sozinha. -->
      <ul class="flex flex-col gap-3 min-w-44">
        <li v-for="item in dados" :key="item.rotulo" class="flex items-center gap-3">
          <span class="w-3 h-3 shrink-0 rounded-full" :style="{ backgroundColor: item.cor }" aria-hidden="true"></span>
          <span class="font-medium whitespace-nowrap">{{ item.rotulo }}</span>
          <span class="ml-auto pl-4 font-mono text-sm text-regular">{{ item.valor }}</span>
          <span class="w-12 text-right font-display font-bold">{{ item.percentual }}%</span>
        </li>
      </ul>
    </div>
  </CartaoPainel>
</template>

<script setup>
// Os números vêm prontos do Python (analise.py): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { CORES_NIVEL } from '../../constants/cores'

const props = defineProps({
  niveis: { type: Array, required: true }, // [{ nivel, quantidade, percentual }]
  total: { type: Number, required: true }
})

const dados = computed(() => props.niveis.map(n => ({
  rotulo: `Nível ${n.nivel}`,
  valor: n.quantidade,
  percentual: n.percentual,
  cor: CORES_NIVEL[n.nivel]
})))

function comPercentual(valor) { // Tooltip. Ex.: "12 (22%)". Mesma quantidade = mesma porcentagem (o total é um só).
  return `${valor} (${dados.value.find(d => d.valor === valor)?.percentual ?? 0}%)`
}
</script>
