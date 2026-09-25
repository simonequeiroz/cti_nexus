<!-- Cabeçalho das telas internas: logo, menu do sistema, usuário logado e botão Sair. -->
<template>
  <header class="border-b border-blue-secondary/70 bg-white/80 backdrop-blur-sm print:hidden">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
      <div class="flex items-center gap-8">
        <BrandLogo />

        <nav aria-label="Menu do sistema">
          <ul class="flex gap-1 text-sm font-medium">
            <li v-for="item in MENU" :key="item.link">
              <a
                :href="item.link"
                class="block px-3 py-2 rounded-lg transition-colors"
                :class="rotaAtual === item.link ? 'bg-blue-primary/10 text-blue-primary' : 'text-regular hover:text-blue-primary'"
                :aria-current="rotaAtual === item.link ? 'page' : undefined"
              >
                {{ item.rotulo }}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div class="flex items-center gap-5 text-sm">
        <p class="hidden sm:block text-regular">Olá, <strong class="text-black-dark">{{ auth.primeiroNome }}</strong></p>
        <BaseButton variante="secundario" @click="sair">Sair</BaseButton>
      </div>
    </div>
  </header>
</template>

<script setup>
import BrandLogo from '../ui/BrandLogo.vue'
import BaseButton from '../ui/BaseButton.vue'
import { useAuthStore } from '../../stores/authStore'
import { useRotas } from '../../composables/useRotas'

const MENU = [
  { rotulo: 'Upload', link: '#upload' },
  { rotulo: 'Relatório', link: '#relatorio' }
]

const auth = useAuthStore()
const { rotaAtual, irPara } = useRotas()

function sair() {
  auth.logout()
  irPara('#login')
}
</script>
