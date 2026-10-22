<!-- Estrutura comum das telas internas: trilha do dado (desktop) ou cabeçalho (celular) + conteúdo principal. -->
<template>
  <div class="bg-surface text-black-dark font-sans antialiased min-h-screen lg:flex lg:items-start">
    <TrilhaDados class="hidden lg:flex" />

    <div class="flex-1 min-w-0">
      <CabecalhoSistema class="lg:hidden" />
      <main class="max-w-7xl mx-auto px-6 py-10">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import CabecalhoSistema from './CabecalhoSistema.vue'
import TrilhaDados from './TrilhaDados.vue'
import { onMounted } from 'vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { useUsuariosStore } from '../../stores/usuariosStore'

const auth = useAutenticacaoStore()
const usuarios = useUsuariosStore()

// Administrador: busca os usuários na API ao abrir cada tela interna. Serve para a tela Usuários
// e para o número de pedidos de acesso ao lado de "Usuários" na trilha e no menu do celular.
onMounted(() => {
  if (auth.pode('gerenciar_usuarios')) usuarios.carregar()
})
</script>
