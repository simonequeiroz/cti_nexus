<!-- Formulário de login. Ao entrar, leva para a primeira tela que o papel pode abrir (upload ou painel). -->
<template>
  <form class="space-y-5" novalidate @submit.prevent="entrar">
    <CampoTexto v-model="email" rotulo="E-mail" type="email" autocomplete="username" placeholder="voce@empresa.com" />

    <CampoTexto
      v-model="senha"
      rotulo="Senha"
      :type="mostrarSenha ? 'text' : 'password'"
      autocomplete="current-password"
      placeholder="••••••"
    >
      <template #acao>
        <button
          type="button"
          class="text-xs font-semibold text-regular hover:text-blue-primary px-2 py-1"
          :aria-pressed="mostrarSenha"
          @click="mostrarSenha = !mostrarSenha"
        >
          {{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}
        </button>
      </template>
    </CampoTexto>

    <p v-if="auth.erro" role="alert" class="text-sm text-orange-dark bg-orange/10 border border-orange/30 rounded-lg px-4 py-2.5 flex gap-2">
      <span aria-hidden="true">⚠</span> {{ auth.erro }}
    </p>

    <BotaoBase tipo="submit" tamanho="lg" class="w-full" :disabled="auth.carregando">
      {{ auth.carregando ? 'Entrando…' : 'Entrar' }}
    </BotaoBase>
  </form>

  <aside class="mt-8 border border-dashed border-blue-secondary rounded-lg p-4 text-xs text-regular" aria-labelledby="titulo-demo">
    <!-- Saída para quem chegou pela página inicial e ainda não tem acesso. -->
    <h2 id="titulo-demo" class="text-sm font-semibold text-black-dark">Primeira vez aqui?</h2>
    <p class="mt-1 mb-3">Escolha um acesso de demonstração. Cada um vê e pode fazer coisas diferentes. Senha de todos: <span class="font-mono">123456</span>.</p>
    <ul class="flex flex-col gap-2">
      <li v-for="demo in USUARIOS_DEMO" :key="demo.email">
        <button
          type="button"
          class="w-full text-left rounded-lg border border-blue-secondary px-3 py-2 hover:border-blue-primary hover:bg-blue-primary/5 transition-colors"
          @click="preencherDemo(demo)"
        >
          <span class="block font-semibold text-blue-primary">{{ PAPEIS[demo.papel].nome }}</span>
          <span class="block">{{ PAPEIS[demo.papel].descricao }}</span>
          <span class="block font-mono mt-0.5">{{ demo.email }}</span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { USUARIOS_DEMO } from '../../stores/usuariosStore'
import { useRotas } from '../../composables/useRotas'
import { PAPEIS } from '../../constants/permissoes'

const auth = useAutenticacaoStore()
const { irPara } = useRotas()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)

async function entrar() {
  const deuCerto = await auth.login(email.value, senha.value)
  if (deuCerto) irPara(auth.telaDeEntrada) // Analista e administrador vão para o upload; gestor, para o painel.
}

function preencherDemo(demo) {
  email.value = demo.email
  senha.value = demo.senha
}
</script>
