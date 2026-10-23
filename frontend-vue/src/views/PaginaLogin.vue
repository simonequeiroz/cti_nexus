<!-- Tela de login: painel da marca à esquerda e formulário à direita. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <PainelMarcaLogin />

    <!-- Lado do formulário: fundo levemente azulado e o formulário num cartão branco, para não ficar solto no meio da tela. -->
    <main class="flex flex-col justify-center px-6 py-12 sm:px-12 bg-blue-secondary/25">
      <LogoMarca class="lg:hidden mb-8 self-center" />
      <div class="w-full max-w-md xl:max-w-lg mx-auto bg-white rounded-2xl border border-blue-secondary/70 shadow-xl shadow-blue-primary/5 p-8 sm:p-10 xl:p-12">
        <h1 class="font-display font-bold text-3xl xl:text-4xl tracking-tight">Entrar no sistema</h1>
        <p class="mt-2 mb-8 text-sm text-regular">Use seu e-mail corporativo para acessar o painel.</p>

        <FormularioLogin />
      </div>

      <!-- Fora do cartão: não faz parte do login. -->
      <a href="#" class="block mt-6 text-sm text-center text-regular hover:text-blue-primary transition-colors">← Voltar ao início</a>
    </main>
  </div>
</template>

<script setup>
import LogoMarca from '../components/ui/LogoMarca.vue'
import PainelMarcaLogin from '../components/login/PainelMarcaLogin.vue'
import FormularioLogin from '../components/login/FormularioLogin.vue'
</script>
