<!-- Formulário de login. Ao entrar com sucesso, leva para a tela de upload. -->
<template>
  <form class="space-y-5" novalidate @submit.prevent="entrar">
    <TextField v-model="email" rotulo="E-mail" type="email" autocomplete="username" placeholder="voce@empresa.com" />

    <TextField
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
    </TextField>

    <p v-if="auth.erro" role="alert" class="text-sm text-orange-dark bg-orange/10 border border-orange/30 rounded-lg px-4 py-2.5 flex gap-2">
      <span aria-hidden="true">⚠</span> {{ auth.erro }}
    </p>

    <BaseButton tipo="submit" tamanho="lg" class="w-full" :disabled="auth.carregando">
      {{ auth.carregando ? 'Entrando…' : 'Entrar' }}
    </BaseButton>
  </form>

  <aside class="mt-8 border border-dashed border-blue-secondary rounded-lg p-4 text-xs text-regular" aria-labelledby="titulo-demo">
    <h2 id="titulo-demo" class="font-mono uppercase tracking-wider font-semibold text-blue-primary mb-2">Acesso de demonstração</h2>
    <p class="font-mono">admin@ctinexus.com · 123456</p>
    <button type="button" class="mt-2 font-semibold text-blue-primary hover:underline" @click="preencherDemo">
      Preencher automaticamente
    </button>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import TextField from '../ui/TextField.vue'
import BaseButton from '../ui/BaseButton.vue'
import { useAuthStore } from '../../stores/authStore'
import { useRotas } from '../../composables/useRotas'

const auth = useAuthStore()
const { irPara } = useRotas()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)

async function entrar() {
  const deuCerto = await auth.login(email.value, senha.value)
  if (deuCerto) irPara('#upload') // Depois do login, vai para a tela de upload.
}

function preencherDemo() {
  email.value = 'admin@ctinexus.com'
  senha.value = '123456'
}
</script>
