<!-- Tela de login: painel da marca à esquerda e formulário à direita. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <LoginBrandPanel />

    <main class="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div class="w-full max-w-sm mx-auto">
        <BrandLogo class="lg:hidden mb-10" />

        <h1 class="font-display font-bold text-3xl tracking-tight">Entrar no sistema</h1>
        <p class="mt-2 mb-8 text-sm text-regular">Use seu e-mail corporativo para acessar o painel.</p>

        <LoginForm />

        <a href="#" class="block mt-8 text-sm text-center text-regular hover:text-blue-primary transition-colors">← Voltar ao início</a>
      </div>
    </main>
  </div>
</template>

<script setup>
import BrandLogo from '../components/ui/BrandLogo.vue'
import LoginBrandPanel from '../components/login/LoginBrandPanel.vue'
import LoginForm from '../components/login/LoginForm.vue'
</script>
