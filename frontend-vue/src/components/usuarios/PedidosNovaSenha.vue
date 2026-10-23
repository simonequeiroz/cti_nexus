<!-- Pedidos de "Esqueci minha senha" feitos na tela de login. O administrador define uma senha temporária
     e passa para a pessoa (pessoalmente ou por mensagem). No próximo login ela é obrigada a criar a própria senha. -->
<template>
  <CartaoPainel titulo="Pedidos de nova senha" :descricao="`${store.pedidosNovaSenha.length} aguardando. A senha temporária deverá ser alterada pelo usuário no próximo acesso.`">
    <ul class="divide-y divide-blue-secondary/60">
      <li v-for="pessoa in store.pedidosNovaSenha" :key="pessoa.id" class="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-black-dark">{{ pessoa.nome }}</p>
          <p class="text-xs text-regular">{{ pessoa.email }} · pedido em {{ new Date(pessoa.pediuNovaSenhaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="sr-only" :for="`senha-temporaria-${pessoa.id}`">Senha temporária de {{ pessoa.nome }}</label>
          <input
            :id="`senha-temporaria-${pessoa.id}`"
            v-model="senhas[pessoa.id]"
            type="text"
            autocomplete="off"
            placeholder="Senha temporária"
            class="bg-white border border-blue-secondary rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15"
          />
          <BotaoBase :disabled="!senhas[pessoa.id]" @click="definir(pessoa)">
            Definir<span class="sr-only"> senha temporária de {{ pessoa.nome }}</span>
          </BotaoBase>
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

const emit = defineEmits(['aviso'])

const store = useUsuariosStore()

// Senha temporária digitada para cada pedido, pelo id. Campo de texto (não de senha): o administrador precisa ver o que vai passar.
const senhas = reactive({})

async function definir(pessoa) {
  const senha = senhas[pessoa.id]
  const problema = await store.definirSenhaTemporaria(pessoa.id, senha) // PATCH na API; '' = deu certo.
  emit('aviso', problema
    ? { texto: problema, erro: true }
    : { texto: `Senha temporária definida para ${pessoa.nome}: ${senha}. O usuário deverá alterá-la no próximo acesso.`, erro: false })
  if (!problema) delete senhas[pessoa.id]
}
</script>
