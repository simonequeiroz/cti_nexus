<!-- Cabeçalho das telas internas: logo, menu do sistema, usuário logado e botão Sair. -->
<template>
  <header class="border-b border-blue-secondary/70 bg-white/80 backdrop-blur-sm print:hidden">
    <!-- No celular: logo e Sair na 1ª linha, menu inteiro na 2ª. A partir de sm fica tudo numa linha só. -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-3 sm:gap-x-8 gap-y-2">
      <LogoMarca class="shrink-0" />

      <nav aria-label="Menu do sistema" class="order-last w-full sm:order-0 sm:w-auto sm:mr-auto">
        <ul class="flex gap-1 text-sm font-medium">
          <li v-for="item in menu" :key="item.link" class="flex-1 sm:flex-none">
            <a
              :href="'#' + item.link"
              class="relative block px-1 sm:px-3 py-2 rounded-lg text-center whitespace-nowrap transition-colors"
              :class="rota.path === item.link ? 'bg-blue-primary/10 text-blue-primary' : 'text-regular hover:text-blue-primary'"
              :aria-current="rota.path === item.link ? 'page' : undefined"
            >
              {{ item.rotulo }}
              <!-- Pedidos de acesso esperando aprovação, ao lado de "Usuários". No celular fica no canto, sem ocupar espaço no menu. -->
              <template v-if="item.link === '/usuarios' && pedidos">
                <span class="absolute -top-1 right-0 sm:static sm:ml-1 inline-grid place-items-center min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 sm:px-1.5 rounded-full bg-blue-primary text-[10px] sm:text-xs leading-none text-white align-middle" aria-hidden="true">{{ pedidos }}</span>
                <span class="sr-only">({{ pedidos }} {{ pedidos === 1 ? 'pedido de acesso aguardando' : 'pedidos de acesso aguardando' }})</span>
              </template>
            </a>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-5 text-sm shrink-0">
        <p class="hidden sm:block text-regular">Olá, <strong class="text-black-dark">{{ auth.primeiroNome }}</strong> <span class="text-xs">({{ auth.nomeDoPapel }})</span></p>
        <span class="hidden sm:block">
          <BotaoBase variante="secundario" @click="sair">Sair</BotaoBase>
        </span>
        <!-- No celular o Sair vira só ícone. -->
        <button
          type="button"
          class="sm:hidden grid place-items-center w-10 h-10 rounded-lg border border-blue-secondary bg-white text-regular hover:text-blue-primary focus-visible:outline-2 focus-visible:outline-blue-primary"
          title="Sair"
          @click="sair"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 12H4m0 0 3-3m-3 3 3 3M10 5V4h9v16h-9v-1" />
          </svg>
          <span class="sr-only">Sair</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import LogoMarca from '../ui/LogoMarca.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { useUsuariosStore } from '../../stores/usuariosStore'
import { useRoute, useRouter } from 'vue-router'
import { PERMISSAO_DA_TELA } from '../../constants/permissoes'

const MENU = [
  { rotulo: 'Upload', link: '/upload' },
  { rotulo: 'Validação', link: '/validacao' },
  { rotulo: 'Relatório', link: '/relatorio' },
  { rotulo: 'Dashboard', link: '/dashboard' },
  { rotulo: 'Usuários', link: '/usuarios' }
]

const auth = useAutenticacaoStore()
const rota = useRoute() // Tela aberta agora (rota.path, ex.: '/upload').
const router = useRouter()

const usuarios = useUsuariosStore()
const pedidos = computed(() => usuarios.pedidosPendentes.length) // Pedidos de acesso esperando o administrador.

const menu = computed(() => MENU.filter(item => auth.pode(PERMISSAO_DA_TELA[item.link]))) // Só as telas que o papel pode abrir.

function sair() {
  auth.logout()
  router.push('/login')
}
</script>
