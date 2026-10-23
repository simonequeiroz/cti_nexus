<!-- Tela "Crie sua nova senha" (#/trocar-senha): aparece logo depois de entrar com a senha temporária
     que o administrador passou. Enquanto a pessoa não troca, o router não deixa abrir nenhuma outra tela. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <PainelMarcaLogin />

    <!-- Lado do formulário: fundo levemente azulado e o formulário num cartão branco, para não ficar solto no meio da tela. -->
    <main class="flex flex-col justify-center px-6 py-12 sm:px-12 bg-blue-secondary/25">
      <LogoMarca class="lg:hidden mb-8 self-center" />
      <div class="w-full max-w-md xl:max-w-lg mx-auto bg-white rounded-2xl border border-blue-secondary/70 shadow-xl shadow-blue-primary/5 p-8 sm:p-10 xl:p-12">
        <h1 class="font-display font-bold text-3xl xl:text-4xl tracking-tight">Definir nova senha</h1>
        <p class="mt-2 mb-8 text-sm text-regular">
          Você acessou com uma senha temporária. Por segurança, defina uma nova senha para continuar.
        </p>

        <FormularioTrocaSenha />

        <!-- Não é a pessoa certa ou quer fazer depois: sai sem trocar. -->
        <button type="button" class="block mx-auto mt-8 text-sm text-regular hover:text-blue-primary transition-colors" @click="sair">
          Sair
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import LogoMarca from '../components/ui/LogoMarca.vue'
import PainelMarcaLogin from '../components/login/PainelMarcaLogin.vue'
import FormularioTrocaSenha from '../components/login/FormularioTrocaSenha.vue'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'

const auth = useAutenticacaoStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push('/login')
}
</script>
