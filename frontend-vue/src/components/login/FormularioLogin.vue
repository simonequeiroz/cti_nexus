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

  <!-- Sem recuperação por e-mail (precisaria do back-end): quem troca a senha é o administrador, na tela Usuários. -->
  <div class="mt-4 text-center">
    <button
      type="button"
      class="text-sm font-medium text-blue-primary hover:underline"
      :aria-expanded="ajudaSenha"
      aria-controls="ajuda-senha"
      @click="ajudaSenha = !ajudaSenha"
    >
      Esqueci minha senha
    </button>
    <p v-if="ajudaSenha" id="ajuda-senha" class="mt-2 rounded-lg bg-blue-primary/5 border border-blue-secondary px-4 py-3 text-sm text-regular text-left">
      Por segurança, a senha é trocada pelo administrador do sistema. Peça a ele uma senha nova e entre com ela.
    </p>
  </div>

  <!-- Não é um "criar conta" aberto: vira um pedido, e só entra depois que o administrador aprovar e escolher o papel. -->
  <p class="mt-6 pt-6 border-t border-blue-secondary/70 text-sm text-center text-regular">
    Não tem acesso? <a href="#cadastro" class="font-semibold text-blue-primary hover:underline">Pedir acesso</a>
  </p>

  <!-- Acesso de demonstração para a apresentação: recolhido, e desligado com VITE_MOSTRAR_DEMO=false.
       Entra pelo id do usuário de demonstração, então continua funcionando mesmo se o e-mail ou a senha dele mudar na tela Usuários. -->
  <details v-if="MOSTRAR_DEMO" class="mt-6 text-xs text-regular">
    <summary class="cursor-pointer text-center hover:text-blue-primary">Usar acesso de demonstração</summary>
    <div class="mt-3 flex flex-wrap justify-center gap-2">
      <button
        v-for="demo in demonstracao"
        :key="demo.id"
        type="button"
        class="rounded-full border border-blue-secondary px-3 py-1.5 font-semibold text-black-dark hover:border-blue-primary hover:bg-blue-primary/5 transition-colors"
        :disabled="auth.carregando"
        @click="entrarComDemo(demo.id)"
      >
        {{ PAPEIS[demo.papel].nome }}
      </button>
    </div>
  </details>
</template>

<script setup>
import { ref, computed } from 'vue'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { USUARIOS_DEMO, useUsuariosStore } from '../../stores/usuariosStore'
import { useRotas } from '../../composables/useRotas'
import { PAPEIS } from '../../constants/permissoes'

const auth = useAutenticacaoStore()
const { irPara } = useRotas()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const ajudaSenha = ref(false) // Mostra a explicação de "Esqueci minha senha".

const MOSTRAR_DEMO = import.meta.env.VITE_MOSTRAR_DEMO !== 'false' // Ligado por padrão (apresentação e Vercel).

async function entrar() {
  const deuCerto = await auth.login(email.value, senha.value)
  if (deuCerto) irPara(auth.telaDeEntrada) // Analista e administrador vão para o upload; gestor, para o painel.
}

// Usuários de demonstração como estão agora no cadastro (o papel pode ter mudado); os desativados não aparecem.
const demonstracao = computed(() => {
  const usuarios = useUsuariosStore().usuarios
  return USUARIOS_DEMO.map(demo => usuarios.find(u => u.id === demo.id)).filter(u => u?.ativo && PAPEIS[u.papel])
})

async function entrarComDemo(id) { // Um clique, sem digitar e-mail e senha.
  if (await auth.loginDemonstracao(id)) irPara(auth.telaDeEntrada)
}
</script>
