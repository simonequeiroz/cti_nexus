<!-- Sidebar das telas internas: mostra o caminho do dado (upload → validação → relatório → dashboard) e o usuário logado. Pode ser recolhida. -->
<template>
  <aside
    id="menu-lateral"
    class="sticky top-4 m-4 mr-0 h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-[28px] bg-linear-to-b from-black-dark to-[#0b2a44] text-white shadow-2xl transition-[width] duration-300 ease-out motion-reduce:transition-none print:hidden"
    :class="recolhida ? 'w-20' : 'w-60'"
    aria-label="Menu do sistema"
  >
    <FundoNeural class="absolute inset-0 opacity-30" :densidade="9000" :distancia-ligacao="90" />

    <!-- Em janelas baixas (ou com zoom) o conteúdo rola por dentro, sem cortar o usuário lá embaixo. -->
    <div class="relative flex flex-1 flex-col px-3 py-5 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none">
      <div class="flex items-center" :class="recolhida ? 'flex-col gap-3' : 'justify-between pl-2'">
        <LogoMarca v-if="!recolhida" claro />
        <a v-else href="#" class="grid place-items-center w-10 h-10" aria-label="CTI Nexus — página inicial">
          <span class="w-3 h-3 rounded-full bg-blue-primary shadow-glow" aria-hidden="true"></span>
        </a>

        <button
          type="button"
          class="grid place-items-center w-9 h-9 shrink-0 rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-primary"
          aria-controls="menu-lateral"
          :aria-expanded="!recolhida"
          :title="recolhida ? 'Expandir menu' : 'Recolher menu'"
          @click="alternar"
        >
          <svg class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': recolhida }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span class="sr-only">{{ recolhida ? 'Expandir menu' : 'Recolher menu' }}</span>
        </button>
      </div>

      <div class="mt-8 flex items-baseline" :class="recolhida ? 'justify-center' : 'justify-between px-2'">
        <p v-if="!recolhida" class="text-xs font-mono uppercase tracking-widest text-white/50 whitespace-nowrap">Trilha do dado</p>
        <p class="text-xs font-mono text-white/50" :title="recolhida ? 'Etapas concluídas' : undefined">{{ etapasConcluidas }}/{{ etapas.length }}</p>
      </div>

      <nav class="mt-3" aria-label="Etapas do processamento">
        <ol class="flex flex-col gap-3">
          <EtapaTrilha
            v-for="(etapa, indice) in etapas"
            :key="etapa.icone"
            v-bind="etapa"
            :ativa="etapa.link === rota.path"
            :ultima="indice === etapas.length - 1"
            :ligacao-acesa="temDados"
            :recolhida="recolhida"
          />
        </ol>
      </nav>

      <!-- Medidor de qualidade: válidas (verde) x com erro (laranja). -->
      <section
        v-if="temDados"
        class="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        :class="recolhida ? 'p-2 text-center' : 'p-4'"
        aria-label="Qualidade do dado"
        :title="recolhida ? `Qualidade: ${store.percentualValido}% (${store.quantidadeValidas} de ${store.quantidadeLinhas} linhas)` : undefined"
      >
        <div v-if="!recolhida" class="flex items-baseline justify-between">
          <p class="text-xs font-mono uppercase tracking-widest text-white/50">Qualidade</p>
          <p class="font-display font-bold text-2xl">{{ store.percentualValido }}%</p>
        </div>
        <p v-else class="font-display font-bold text-sm">{{ Math.round(store.percentualValido) }}%</p>

        <div class="flex overflow-hidden rounded-full bg-white/10" :class="recolhida ? 'mt-1.5 h-1.5' : 'mt-3 h-2'">
          <span class="bg-green transition-all duration-700" :style="{ width: `${store.percentualValido}%` }"></span>
          <span class="flex-1 bg-orange" :class="{ hidden: !store.quantidadeInvalidas }"></span>
        </div>
        <p v-if="!recolhida" class="mt-2 text-xs text-white/50">{{ store.quantidadeValidas }} de {{ store.quantidadeLinhas }} linhas prontas para análise</p>
      </section>

      <div class="mt-auto flex flex-col gap-3">
        <p v-if="store.historico.length && !recolhida" class="px-2 text-xs font-mono text-white/50">
          {{ store.historico.length }} {{ store.historico.length === 1 ? 'planilha enviada' : 'planilhas enviadas' }} nesta visita
        </p>

        <!-- Administração fica fora da trilha do dado: não é uma etapa do processamento. -->
        <a
          v-if="auth.pode('gerenciar_usuarios')"
          href="#/usuarios"
          class="flex items-center gap-3 rounded-2xl p-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-primary"
          :class="[rota.path === '/usuarios' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white', { 'justify-center': recolhida }]"
          :aria-current="rota.path === '/usuarios' ? 'page' : undefined"
          :title="recolhida ? 'Usuários' : undefined"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span :class="{ 'sr-only': recolhida }">Usuários</span>
        </a>

        <div class="flex items-center rounded-2xl bg-white/10 backdrop-blur-sm" :class="recolhida ? 'flex-col gap-2 p-2' : 'gap-3 p-2'">
          <span
            class="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-linear-to-br from-blue-primary to-pink font-display font-bold"
            :title="recolhida ? auth.usuario?.nome : undefined"
            aria-hidden="true"
          >
            {{ auth.primeiroNome.charAt(0) }}
          </span>
          <span v-if="!recolhida" class="min-w-0">
            <span class="block text-sm font-semibold truncate">{{ auth.usuario?.nome }}</span>
            <span class="block text-xs text-white/50 truncate" :title="auth.usuario?.email">{{ auth.nomeDoPapel }}</span>
          </span>
          <button
            type="button"
            class="grid place-items-center w-9 h-9 shrink-0 rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-primary"
            :class="{ 'ml-auto': !recolhida }"
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
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import EtapaTrilha from './EtapaTrilha.vue'
import LogoMarca from '../ui/LogoMarca.vue'
import FundoNeural from '../ui/FundoNeural.vue'
import { useAutenticacaoStore } from '../../stores/autenticacaoStore'
import { useUploadStore } from '../../stores/uploadStore'
import { useRoute, useRouter } from 'vue-router'
import { useMenuLateral } from '../../composables/useMenuLateral'
import { PERMISSAO_DA_TELA } from '../../constants/permissoes'

const auth = useAutenticacaoStore()
const store = useUploadStore()
const rota = useRoute() // Tela aberta agora (rota.path, ex.: '/upload').
const router = useRouter()
const { recolhida, alternar } = useMenuLateral()

const temDados = computed(() => store.quantidadeLinhas > 0) // O dado já saiu do upload e seguiu pela trilha.

// Estado de cada etapa calculado a partir da última planilha processada.
const etapas = computed(() => {
  const recusado = store.statusValidacao === 'Arquivo recusado'
  const erroLeitura = store.falhouLeitura
  const invalidas = store.quantidadeInvalidas

  const upload = {
    rotulo: 'Upload',
    icone: 'upload',
    link: '/upload',
    estado: store.carregando ? 'processando' : erroLeitura ? 'erro' : temDados.value ? 'concluida' : 'pendente',
    detalhe: store.carregando ? 'lendo planilha…' : erroLeitura ? (recusado ? 'arquivo recusado' : 'falha na leitura') : temDados.value ? store.nomeArquivo : 'envie a planilha'
  }

  const validacao = {
    rotulo: 'Validação',
    icone: 'validacao',
    link: '/validacao',
    estado: !temDados.value ? 'pendente' : invalidas ? 'alerta' : 'concluida',
    detalhe: !temDados.value ? 'aguardando dados' : invalidas ? `${invalidas} ${invalidas === 1 ? 'linha' : 'linhas'} com erro` : 'tudo certo'
  }

  const relatorio = {
    rotulo: 'Relatório',
    icone: 'relatorio',
    link: '/relatorio',
    estado: temDados.value ? 'concluida' : 'pendente',
    detalhe: temDados.value ? `${store.percentualValido}% de qualidade` : 'aguardando planilha'
  }

  const liberados = store.quantidadeLiberados
  const dashboard = {
    rotulo: 'Dashboard',
    icone: 'dashboard',
    link: '/dashboard',
    estado: !store.liberada ? 'pendente' : store.mudouDesdeLiberacao ? 'alerta' : 'concluida',
    detalhe: store.liberada
      ? (store.mudouDesdeLiberacao ? 'há dados novos' : `${liberados} ${liberados === 1 ? 'cliente' : 'clientes'}`)
      : store.quantidadeValidas ? 'aguardando liberação' : 'aguardando dados'
  }

  // Etapa que o papel não pode abrir: continua na trilha (o dado passa por ela), mas sem link.
  return [upload, validacao, relatorio, dashboard].map(etapa => auth.pode(PERMISSAO_DA_TELA[etapa.link])
    ? etapa
    : { ...etapa, link: null, detalhe: 'sem acesso' })
})

const etapasConcluidas = computed(() => etapas.value.filter(e => ['concluida', 'alerta'].includes(e.estado)).length)

function sair() {
  auth.logout()
  router.push('/login')
}
</script>
