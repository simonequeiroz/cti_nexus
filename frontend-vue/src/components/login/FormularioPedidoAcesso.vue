<!-- Pedido de acesso, aberto a partir do login. Não escolhe papel: o administrador aprova na tela Usuários e decide o que a pessoa pode fazer. -->
<template>
  <div v-if="enviado" role="status" class="rounded-lg bg-green/10 border border-green/30 px-4 py-4 text-sm text-green-dark">
    <p class="font-semibold">Pedido enviado.</p>
    <p class="mt-1">Assim que o administrador aprovar, você entra com o e-mail <span class="font-mono">{{ enviado }}</span> e a senha que escolheu.</p>
    <a href="#/login" class="inline-block mt-3 font-semibold text-blue-primary hover:underline">Ir para o login</a>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="enviar">
    <CampoTexto v-model="dados.nome" rotulo="Nome completo" autocomplete="name" :erro="erros.nome" />
    <CampoTexto v-model="dados.email" rotulo="E-mail corporativo" type="email" autocomplete="email" placeholder="voce@empresa.com" :erro="erros.email" />
    <CampoTexto v-model="dados.cargo" rotulo="Cargo ou área (opcional)" autocomplete="organization-title" placeholder="Ex.: Operações, Diretoria comercial" />
    <CampoTexto v-model="dados.senha" rotulo="Senha" type="password" autocomplete="new-password" :erro="erros.senha" />
    <CampoTexto v-model="dados.confirmacao" rotulo="Confirmar senha" type="password" autocomplete="new-password" :erro="erros.confirmacao" />

    <BotaoBase tipo="submit" tamanho="lg" class="w-full">Pedir acesso</BotaoBase>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUsuariosStore } from '../../stores/usuariosStore'

const store = useUsuariosStore()

// Estado local do formulário: só vai para a store ao enviar.
const dados = reactive({ nome: '', email: '', cargo: '', senha: '', confirmacao: '' })
const erros = ref({})
const enviado = ref('') // E-mail do pedido enviado (vazio = formulário aberto).

function enviar() {
  erros.value = store.pedirAcesso(dados)
  if (Object.keys(erros.value).length) return
  enviado.value = dados.email.trim().toLowerCase()
}
</script>
