<!-- Clientes por consultor: barras deitadas (aula "Dashboard Front e Back": porConsultor). Mostra quem tem a maior carteira. -->
<template>
  <CartaoPainel titulo="Clientes por consultor" descricao="Quantos clientes cada consultor atende. A dica de cada barra mostra o faturamento somado.">
    <div class="p-6">
      <GraficoBase
        tipo="barraHorizontal"
        :dados="dados"
        nome-serie="Clientes"
        descricao="Quantidade de clientes atendidos por cada consultor"
        :formatar-valor="comFaturamento"
      />
    </div>
  </CartaoPainel>
</template>

<script setup>
// Os números vêm prontos do Python (analise.py, _por_consultor): o componente só desenha.
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import GraficoBase from './GraficoBase.vue'
import { formatarMoeda } from '../../utils/formatadores'

const props = defineProps({
  consultores: { type: Array, default: () => [] } // [{ nome, quantidade, faturamento }], de quem tem mais clientes para quem tem menos
})

const dados = computed(() => props.consultores.map(c => ({ rotulo: c.nome, valor: c.quantidade })))

// Dica da barra e tabela de leitura de tela. Ex.: "6 · faturamento R$ 1,2 mi".
// O GraficoBase entrega o valor e a posição da barra; pela posição achamos o consultor e o faturamento dele.
function comFaturamento(valor, indice) {
  const consultor = props.consultores[indice]
  return consultor ? `${valor} · faturamento ${formatarMoeda(consultor.faturamento, true)}` : String(valor)
}
</script>
