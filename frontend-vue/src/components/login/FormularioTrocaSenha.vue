<!-- Formulário da tela "Crie sua nova senha". Pede a senha temporária de novo (prova que é a própria pessoa)
     e a senha nova duas vezes. Ao salvar, entra no sistema pela tela de sempre do papel. -->
<template>
  <form class="space-y-5" novalidate @submit.prevent="salvar">
    <CampoTexto v-model="dados.senhaAtual" rotulo="Senha temporária" type="password" autocomplete="current-password" :erro="erros.senhaAtual" />
    <CampoTexto v-model="dados.senhaNova" rotulo="Nova senha" type="password" autocomplete="new-password" :erro="erros.senhaNova" />
    <CampoTexto v-model="dados.confirmacao" rotulo="Confirmar nova senha" type="password" autocomplete="new-password" :erro="erros.confirmacao" />

    <!-- Erro que não é de um campo (ex.: servidor desligado). -->
    <p v-if="erros.geral" role="alert" class="text-sm text-orange-dark bg-orange/10 border border-orange/30 rounded-lg px-4 py-2.5">{{ erros.geral }}</p>

    <BotaoBase tipo="submit" tamanho="lg" class="w-full" :disabled="salvando">{{ salvando ? 'Salvando…' : 'Salvar nova senha' }}</BotaoBase>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'

const auth = useAutenticacaoStore()
const router = useRouter()

// Estado local do formulário: só vai para a store ao salvar.
const dados = reactive({ senhaAtual: '', senhaNova: '', confirmacao: '' })
const erros = ref({})
const salvando = ref(false) // Esperando a resposta da API (evita clicar duas vezes).

async function salvar() {
  salvando.value = true
  erros.value = await auth.trocarSenha(dados) // POST /auth/trocar-senha
  salvando.value = false
  if (Object.keys(erros.value).length) return

  // Senha trocada: sai e volta para o login, para a pessoa entrar com a senha nova (confirma que ela sabe a senha).
  // O e-mail vai junto no endereço para já aparecer preenchido; "senha=alterada" mostra o aviso de sucesso.
  const email = auth.usuario.email
  auth.logout()
  router.push({ path: '/login', query: { senha: 'alterada', email } })
}
</script>
