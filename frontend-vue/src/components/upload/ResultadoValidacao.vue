<!-- Resultado rápido da validação na tela de upload: resumo por tipo de erro, padronizações e o próximo passo.
     A lista linha a linha fica só na tela de Validação (onde dá para corrigir) e no Relatório (para imprimir). -->
<template>
  <CartaoPainel titulo="Resultado da conferência">
    <div class="p-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
      <p v-if="!store.quantidadeLinhas" class="text-sm text-regular">
        {{ semResultado }}
      </p>

      <template v-else>
        <p class="font-display font-bold text-lg" :class="invalidas ? 'text-orange-dark' : 'text-green-dark'">
          {{ invalidas ? `${invalidas} ${invalidas === 1 ? 'linha precisa' : 'linhas precisam'} de correção` : 'Todas as linhas estão válidas' }}
        </p>
        <p class="mt-1 text-sm text-regular">
          <template v-if="invalidas">
            As outras {{ store.quantidadeValidas.toLocaleString('pt-BR') }} de {{ store.quantidadeLinhas.toLocaleString('pt-BR') }} já estão corretas e prontas para a análise.
          </template>
          <template v-else>
            As {{ store.quantidadeLinhas.toLocaleString('pt-BR') }} linhas estão corretas e prontas para a análise.
          </template>
          Conferida em {{ formatarDuracao(store.duracaoMs) }}.
        </p>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section v-if="invalidas" aria-labelledby="titulo-tipos-erro">
            <h3 id="titulo-tipos-erro" class="text-xs font-mono uppercase tracking-wider text-regular">Problemas por tipo</h3>
            <ul class="mt-2 flex flex-col gap-1.5 text-sm">
              <li v-for="tipo in tiposEncontrados" :key="tipo.nome" class="flex items-center gap-2">
                <span class="w-2 h-2 shrink-0 rounded-full" :class="tipo.ponto" aria-hidden="true"></span>
                {{ tipo.nome }}
                <span class="ml-auto font-mono font-semibold">{{ tipo.quantidade }}</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="titulo-padronizacoes">
            <h3 id="titulo-padronizacoes" class="text-xs font-mono uppercase tracking-wider text-regular">Corrigido automaticamente</h3>
            <p class="mt-2 text-sm">
              <strong class="font-mono">{{ store.padronizacoes.length }}</strong>
              {{ store.padronizacoes.length === 1 ? 'valor ajustado' : 'valores ajustados' }}
              <span v-if="camposPadronizados" class="text-regular">({{ camposPadronizados }})</span>
            </p>
          </section>
        </div>

        <!-- Próximo passo: corrigir se houver erro; senão, revisar e liberar para o painel (na Validação). -->
        <div class="mt-6 flex flex-wrap gap-3">
          <BotaoBase v-if="invalidas" href="#validacao">Corrigir {{ invalidas }} {{ invalidas === 1 ? 'linha' : 'linhas' }} →</BotaoBase>
          <BotaoBase v-else-if="!store.liberada" href="#validacao">Revisar e liberar →</BotaoBase>
          <BotaoBase v-else href="#dashboard">Ver painel →</BotaoBase>
          <BotaoBase href="#relatorio" variante="secundario">Ver relatório</BotaoBase>
        </div>
      </template>
    </div>

    <!-- Regras aplicadas por validarLinhas() (utils/validacao.js). Fica no rodapé e ocupa o espaço que sobra. -->
    <footer class="lg:mt-auto border-t border-blue-secondary/60 bg-surface/60 px-6 py-4">
      <h3 class="text-xs font-mono uppercase tracking-wider text-regular">O que é verificado</h3>
      <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <li v-for="regra in REGRAS_VERIFICADAS" :key="regra" class="flex gap-2">
          <svg class="w-4 h-4 mt-0.5 shrink-0 text-blue-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
          {{ regra }}
        </li>
      </ul>
    </footer>
  </CartaoPainel>
</template>

<script setup>
import { computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { TIPOS_DE_ERRO, REGRAS_VERIFICADAS, nomeDoCampo } from '../../constants/validacao'
import { formatarDuracao } from '../../utils/formatadores'

const store = useUploadStore()

const invalidas = computed(() => store.quantidadeInvalidas)

const semResultado = computed(() => store.falhouLeitura
  ? 'Sem resultado: não foi possível abrir a planilha. Veja o aviso no cartão ao lado.'
  : 'Escolha uma planilha e clique em Conferir planilha para ver o resultado aqui.')

// Tipos de erro que apareceram, na ordem e com as cores de constants/validacao.js.
const tiposEncontrados = computed(() => TIPOS_DE_ERRO
  .map(tipo => ({ ...tipo, quantidade: store.errosPorTipo.find(item => item.nome === tipo.nome)?.quantidade ?? 0 }))
  .filter(tipo => tipo.quantidade > 0))

const camposPadronizados = computed(() => store.padronizacoesPorCampo.slice(0, 3).map(item => nomeDoCampo(item.nome).toLowerCase()).join(', '))
</script>
