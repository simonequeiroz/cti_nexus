<!-- Tela de pedido de acesso (#cadastro): mesmo visual do login. Quem aprova e escolhe o papel é o administrador. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <PainelMarcaLogin />

    <main class="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div class="w-full max-w-sm mx-auto">
        <LogoMarca class="lg:hidden mb-10" />

        <h1 class="font-display font-bold text-3xl tracking-tight">Pedir acesso</h1>
        <p class="mt-2 mb-8 text-sm text-regular">Preencha seus dados. O administrador confere o pedido e define o que você vai poder fazer no sistema.</p>

        <FormularioPedidoAcesso />

        <p class="mt-8 text-sm text-center text-regular">
          Já tem acesso? <a href="#login" class="font-semibold text-blue-primary hover:underline">Entrar</a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import LogoMarca from '../components/ui/LogoMarca.vue'
import PainelMarcaLogin from '../components/login/PainelMarcaLogin.vue'
import FormularioPedidoAcesso from '../components/login/FormularioPedidoAcesso.vue'
</script>
