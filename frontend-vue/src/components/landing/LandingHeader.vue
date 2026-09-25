<!-- Cabeçalho da landing page: logo, links para as seções e acesso ao sistema. -->
<template>
  <header class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
    <BrandLogo />

    <nav aria-label="Seções da página" class="hidden md:block">
      <ul class="flex gap-8 text-sm font-medium text-regular">
        <li v-for="link in LINKS" :key="link.href">
          <a :href="link.href" class="hover:text-blue-primary transition-colors">{{ link.rotulo }}</a>
        </li>
      </ul>
    </nav>

    <BaseButton href="#login">Entrar no sistema</BaseButton>
  </header>
</template>

<script setup>
import BrandLogo from '../ui/BrandLogo.vue'
import BaseButton from '../ui/BaseButton.vue'

const LINKS = [
  { rotulo: 'Sobre', href: '#sobre' },
  { rotulo: 'Recursos', href: '#recursos' },
  { rotulo: 'Jornada', href: '#jornada' }
]
</script>
