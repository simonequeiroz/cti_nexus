<!-- Formulário de login. Ao entrar, leva para a primeira tela que o papel pode abrir (upload ou painel). -->
<template>
  <!-- Aviso depois de definir a nova senha (tela #/trocar-senha manda para cá com ?senha=alterada). -->
  <p v-if="senhaAlterada" role="status" class="mb-5 text-sm text-green-dark bg-green/10 border border-green/30 rounded-lg px-4 py-2.5">
    Senha alterada com sucesso. Entre com a nova senha.
  </p>

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
        <!-- Ícone de olho: aberto = mostrar a senha; riscado = esconder. O texto fica para o leitor de tela e para a dica do mouse. -->
        <button
          type="button"
          class="grid place-items-center w-9 h-9 rounded-md text-regular hover:text-blue-primary transition-colors"
          :aria-pressed="mostrarSenha"
          :title="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
          @click="mostrarSenha = !mostrarSenha"
        >
          <svg v-if="mostrarSenha" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span class="sr-only">{{ mostrarSenha ? 'Ocultar senha' : 'Mostrar senha' }}</span>
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

  <!-- Esqueci minha senha (sem e-mail): vira um pedido para o administrador, que passa uma senha temporária.
       No primeiro login com ela, a pessoa é obrigada a criar a própria senha (tela #/trocar-senha). -->
  <div class="mt-4 text-center">
    <button
      type="button"
      class="text-sm font-medium text-blue-primary hover:underline"
      :aria-expanded="ajudaSenha"
      aria-controls="ajuda-senha"
      @click="abrirAjudaSenha"
    >
      Esqueci minha senha
    </button>
    <div v-if="ajudaSenha" id="ajuda-senha" class="mt-2 rounded-lg bg-blue-primary/5 border border-blue-secondary px-4 py-3 text-sm text-regular text-left">
      <p v-if="pedidoSenhaEnviado" role="status">
        Solicitação registrada. Se o e-mail estiver cadastrado, o administrador enviará uma senha temporária.
      </p>
      <form v-else class="space-y-3" novalidate @submit.prevent="pedirNovaSenha">
        <p>Informe seu e-mail de acesso para solicitar uma senha temporária ao administrador.</p>
        <CampoTexto v-model="emailSenha" rotulo="E-mail" type="email" autocomplete="username" :erro="erroSenha" />
        <BotaoBase tipo="submit" variante="secundario" class="w-full" :disabled="enviandoSenha">
          {{ enviandoSenha ? 'Enviando…' : 'Solicitar nova senha' }}
        </BotaoBase>
      </form>
    </div>
  </div>

  <!-- Não é um "criar conta" aberto: vira um pedido, e só entra depois que o administrador aprovar e escolher o papel. -->
  <p class="mt-6 pt-6 border-t border-blue-secondary/70 text-sm text-center text-regular">
    Não tem acesso? <a href="#/cadastro" class="font-semibold text-blue-primary hover:underline">Pedir acesso</a>
  </p>

  <!-- Acesso de demonstração para a apresentação: recolhido, e desligado com VITE_MOSTRAR_DEMO=false.
       Entra com os usuários que o back-end cria (DEMO_USUARIOS=true). Se o e-mail ou a senha deles mudar na tela Usuários, o botão mostra o erro do login. -->
  <details v-if="MOSTRAR_DEMO" class="mt-6 text-xs text-regular">
    <summary class="cursor-pointer text-center hover:text-blue-primary">Usar acesso de demonstração</summary>
    <div class="mt-3 flex flex-wrap justify-center gap-2">
      <button
        v-for="demo in USUARIOS_DEMO"
        :key="demo.email"
        type="button"
        class="rounded-full border border-blue-secondary px-3 py-1.5 font-semibold text-black-dark hover:border-blue-primary hover:bg-blue-primary/5 transition-colors"
        :disabled="auth.carregando"
        @click="entrarComDemo(demo.email)"
      >
        {{ PAPEIS[demo.papel].nome }}
      </button>
    </div>
  </details>
</template>

<script setup>
import { ref } from 'vue'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useAutenticacaoStore, USUARIOS_DEMO } from '../../stores/autenticacaoStore'
import { useRouter, useRoute } from 'vue-router'
import { PAPEIS } from '../../constants/permissoes'

const auth = useAutenticacaoStore()
const router = useRouter()
const rota = useRoute() // Endereço atual, para ler o ?senha=alterada&email=... que vem da troca de senha.

const senhaAlterada = rota.query.senha === 'alterada'
const email = ref(rota.query.email ?? '') // Já preenchido depois da troca de senha.
const senha = ref('')
const mostrarSenha = ref(false)
// "Esqueci minha senha"
const ajudaSenha = ref(false) // Mostra o quadro do pedido de nova senha.
const emailSenha = ref('')
const erroSenha = ref('')
const enviandoSenha = ref(false)
const pedidoSenhaEnviado = ref(false)

function abrirAjudaSenha() {
  ajudaSenha.value = !ajudaSenha.value
  if (!emailSenha.value) emailSenha.value = email.value // Aproveita o e-mail já digitado no login.
}

async function pedirNovaSenha() {
  enviandoSenha.value = true
  erroSenha.value = await auth.pedirNovaSenha(emailSenha.value) // POST /auth/esqueci-senha; '' = deu certo.
  enviandoSenha.value = false
  pedidoSenhaEnviado.value = !erroSenha.value
}

const MOSTRAR_DEMO = import.meta.env.VITE_MOSTRAR_DEMO !== 'false' // Ligado por padrão (apresentação e Vercel).

async function entrar() {
  const deuCerto = await auth.login(email.value, senha.value) // Chama POST /auth/login na API.
  if (deuCerto) router.push(auth.telaDeEntrada) // Analista e administrador vão para o upload; gestor, para o painel.
}

async function entrarComDemo(emailDemo) { // Um clique, sem digitar e-mail e senha.
  if (await auth.loginDemonstracao(emailDemo)) router.push(auth.telaDeEntrada)
}
</script>
