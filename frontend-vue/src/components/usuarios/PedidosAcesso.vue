<!-- Pedidos de acesso feitos na tela de login. O administrador escolhe o papel e aprova, ou recusa. -->
<template>
  <CartaoPainel titulo="Pedidos de acesso" :descricao="`${store.pedidosPendentes.length} aguardando sua aprovação. A pessoa só entra depois de aprovada.`">
    <ul class="divide-y divide-blue-secondary/60">
      <li v-for="pedido in store.pedidosPendentes" :key="pedido.id" class="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-black-dark">{{ pedido.nome }}</p>
          <p class="text-xs text-regular">
            {{ pedido.email }}<span v-if="pedido.cargo"> · {{ pedido.cargo }}</span>
            · pedido em {{ new Date(pedido.criadoEm).toLocaleDateString('pt-BR') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="sr-only" :for="`papel-pedido-${pedido.id}`">Papel de {{ pedido.nome }}</label>
          <select
            :id="`papel-pedido-${pedido.id}`"
            v-model="papelEscolhido[pedido.id]"
            class="bg-white border border-blue-secondary rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15"
          >
            <option value="">Escolha o papel…</option>
            <option v-for="(papel, codigo) in PAPEIS" :key="codigo" :value="codigo">{{ papel.nome }}</option>
          </select>
          <BotaoBase :disabled="!papelEscolhido[pedido.id]" @click="aprovar(pedido)">
            Aprovar<span class="sr-only"> {{ pedido.nome }}</span>
          </BotaoBase>
          <button type="button" class="text-xs font-semibold text-orange-dark hover:underline" @click="recusar(pedido)">
            Recusar<span class="sr-only"> {{ pedido.nome }}</span>
          </button>
        </div>
      </li>
    </ul>
  </CartaoPainel>
</template>

<script setup>
import { reactive } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUsuariosStore } from '../../stores/usuariosStore'
import { PAPEIS } from '../../constants/permissoes'

const emit = defineEmits(['aviso'])

const store = useUsuariosStore()

const papelEscolhido = reactive({}) // Papel escolhido para cada pedido, pelo id. Começa vazio: o administrador decide.

function aprovar(pedido) {
  const problema = store.aprovarPedido(pedido.id, papelEscolhido[pedido.id])
  emit('aviso', problema
    ? { texto: problema, erro: true }
    : { texto: `${pedido.nome} aprovado(a) como ${PAPEIS[papelEscolhido[pedido.id]].nome}. Já pode entrar com o e-mail ${pedido.email}.`, erro: false })
}

function recusar(pedido) {
  store.recusarPedido(pedido.id)
  emit('aviso', { texto: `Pedido de ${pedido.nome} recusado.`, erro: false })
}
</script>
