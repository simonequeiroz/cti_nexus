<!-- Valores corrigidos automaticamente (antes → depois), com o motivo: espaços extras, maiúsculas, escrita ou formato. -->
<template>
  <CartaoPainel titulo="Ajustes automáticos" descricao="Diferenças de escrita que o sistema corrigiu sozinho. Não impedem a linha de ser aprovada.">
    <template #acoes>
      <ul class="flex flex-wrap gap-2">
        <li v-for="item in store.padronizacoesPorMotivo" :key="item.nome">
          <EtiquetaBase cor="bg-blue-primary/10 text-blue-primary">{{ item.nome }}: {{ item.quantidade }}</EtiquetaBase>
        </li>
      </ul>
    </template>

    <template v-if="store.padronizacoes.length">
      <TabelaDados legenda="Valores ajustados automaticamente" :colunas="COLUNAS">
        <tr v-for="(item, i) in visiveis" :key="i">
          <th scope="row" class="pl-6 pr-4 py-2.5 font-mono font-semibold text-left">{{ item.linha }}</th>
          <td class="px-4 py-2.5 whitespace-nowrap">{{ nomeDoCampo(item.campo) }}</td>
          <td class="px-4 py-2.5 font-mono whitespace-pre text-orange-dark"><del class="no-underline">"{{ item.antes }}"</del></td>
          <td class="px-4 py-2.5 text-black-light" aria-hidden="true">→</td>
          <td class="px-4 py-2.5 font-mono text-green-dark"><ins class="no-underline">"{{ item.depois }}"</ins></td>
          <td class="px-4 py-2.5 whitespace-nowrap text-regular">{{ item.motivo }}</td>
        </tr>
      </TabelaDados>

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
    <MensagemVazia v-else>Nenhum texto precisou de ajuste.</MensagemVazia>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import MensagemVazia from '../ui/MensagemVazia.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { nomeDoCampo } from '../../constants/validacao'

const LIMITE = 10

const COLUNAS = [
  { rotulo: 'Linha', classe: 'w-20' },
  { rotulo: 'Campo' },
  { rotulo: 'Antes' },
  { rotulo: 'Para', oculto: true, classe: 'w-8' },
  { rotulo: 'Depois' },
  { rotulo: 'Motivo' }
]

const store = useUploadStore()

const verTodas = defineModel('verTodas', { type: Boolean, default: false }) // A página abre tudo antes de imprimir.

const visiveis = computed(() => (verTodas.value ? store.padronizacoes : store.padronizacoes.slice(0, LIMITE)))
</script>
