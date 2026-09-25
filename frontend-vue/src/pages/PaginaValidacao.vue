<!-- Tela de validação: conferir as linhas com erro, corrigir os valores na tela, revalidar e baixar a planilha corrigida. -->
<template>
  <LayoutSistema>
    <RelatorioVazio
      v-if="!store.quantidadeLinhas"
      titulo="Nada para validar ainda"
      texto="Envie e processe uma planilha na tela de upload para conferir e corrigir as linhas com erro."
    />

    <template v-else>
      <IntroducaoPagina etapa="Etapa 2 — Validação" titulo="Conferência e correção">
        <p>Corrija os valores direto nos campos destacados e clique em <strong class="text-black-dark">Revalidar</strong>. As correções valem nesta sessão; baixe a planilha corrigida para guardar.</p>
      </IntroducaoPagina>

      <!-- Barra de ações: fica presa no topo enquanto a lista rola. -->
      <div class="sticky top-0 z-10 -mx-6 mt-6 px-6 py-3 bg-surface/90 backdrop-blur-sm border-b border-blue-secondary/60 flex flex-wrap items-center gap-3">
        <p class="text-sm">
          <strong :class="store.quantidadeInvalidas ? 'text-orange-dark' : 'text-green-dark'">
            {{ store.quantidadeInvalidas }} {{ store.quantidadeInvalidas === 1 ? 'linha com erro' : 'linhas com erro' }}
          </strong>
          <span class="text-regular"> de {{ store.quantidadeLinhas }}</span>
        </p>
        <p role="status" class="text-sm text-green-dark font-medium">{{ mensagem }}</p>

        <div class="ml-auto flex flex-wrap gap-2">
          <BotaoBase variante="secundario" @click="store.baixarPlanilhaCorrigida()">Baixar planilha corrigida</BotaoBase>
          <BotaoBase :disabled="!store.edicoesPendentes" @click="revalidar">
            Revalidar
            <span v-if="store.edicoesPendentes" class="rounded-full bg-white/20 px-1.5 text-xs">{{ store.edicoesPendentes }}</span>
          </BotaoBase>
        </div>
      </div>

      <section v-if="!store.quantidadeInvalidas" class="mt-6 rounded-2xl border border-green/40 bg-green/10 p-6 text-center">
        <p class="font-display font-bold text-lg text-green-dark">Todas as linhas estão válidas</p>
        <p class="mt-1 text-sm text-regular">A planilha está pronta para o ETL.</p>
        <BotaoBase href="#dashboard" variante="contorno" class="mt-4">Ver dashboard →</BotaoBase>
      </section>

      <template v-else>
        <div class="mt-6 flex flex-wrap items-end gap-4" role="search" aria-label="Filtrar linhas com erro">
          <label class="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-regular">
            Tipo de erro
            <select v-model="tipo" :class="CLASSE_CAMPO" class="min-w-44">
              <option value="">Todos</option>
              <option v-for="item in store.errosPorTipo" :key="item.nome" :value="item.nome">{{ item.nome }} ({{ item.quantidade }})</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-regular">
            Campo
            <select v-model="campo" :class="CLASSE_CAMPO" class="min-w-44">
              <option value="">Todos</option>
              <option v-for="item in store.errosPorCampo" :key="item.nome" :value="item.nome">{{ nomeDoCampo(item.nome) }} ({{ item.quantidade }})</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs font-mono uppercase tracking-wider text-regular">
            Buscar
            <input v-model="busca" type="search" placeholder="Código ou nº da linha" :class="CLASSE_CAMPO" class="min-w-52" />
          </label>
          <p class="text-sm text-regular pb-2">{{ linhasFiltradas.length }} {{ linhasFiltradas.length === 1 ? 'linha' : 'linhas' }}</p>
        </div>

        <div class="mt-4 flex flex-col gap-4">
          <LinhaInvalida
            v-for="item in linhasVisiveis"
            :key="item.numeroLinha"
            :numero-linha="item.numeroLinha"
            :problemas="item.problemas"
          />
        </div>

        <p v-if="!linhasFiltradas.length" class="mt-6 text-center text-regular">Nenhuma linha com esses filtros.</p>
        <div v-if="linhasFiltradas.length > limite" class="mt-4 text-center">
          <BotaoBase variante="secundario" @click="limite += PASSO">
            Mostrar mais {{ Math.min(PASSO, linhasFiltradas.length - limite) }} de {{ linhasFiltradas.length - limite }}
          </BotaoBase>
        </div>
      </template>

      <TabelaPadronizacao class="mt-10" />
    </template>
  </LayoutSistema>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import IntroducaoPagina from '../components/layout/IntroducaoPagina.vue'
import BotaoBase from '../components/ui/BotaoBase.vue'
import RelatorioVazio from '../components/relatorio/RelatorioVazio.vue'
import TabelaPadronizacao from '../components/relatorio/TabelaPadronizacao.vue'
import LinhaInvalida from '../components/validacao/LinhaInvalida.vue'
import { useUploadStore } from '../stores/uploadStore'
import { nomeDoCampo } from '../constants/validacao'

const store = useUploadStore()

const PASSO = 20 // Quantas linhas aparecem de cada vez (planilhas grandes podem ter centenas de erros).
const CLASSE_CAMPO = 'rounded-lg border border-blue-secondary bg-white px-3 py-2 text-sm font-sans normal-case tracking-normal text-black-dark focus-visible:outline-2 focus-visible:outline-blue-primary'

// Estado local da tela.
const tipo = ref('')
const campo = ref('')
const busca = ref('')
const limite = ref(PASSO)
const mensagem = ref('')

watch([tipo, campo, busca], () => { limite.value = PASSO }) // Filtro novo volta para o início da lista.

// Junta as ocorrências por linha: [{ numeroLinha, problemas: [...] }].
const linhasComErro = computed(() => {
  const porLinha = new Map()
  for (const ocorrencia of store.ocorrencias) {
    if (!porLinha.has(ocorrencia.linha)) porLinha.set(ocorrencia.linha, [])
    porLinha.get(ocorrencia.linha).push(ocorrencia)
  }
  return [...porLinha].map(([numeroLinha, problemas]) => ({ numeroLinha, problemas }))
})

const linhasFiltradas = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return linhasComErro.value.filter(item =>
    (!tipo.value || item.problemas.some(p => p.tipo === tipo.value)) &&
    (!campo.value || item.problemas.some(p => p.campo === campo.value)) &&
    (!termo || String(item.numeroLinha) === termo || item.problemas[0].codigo_cliente.toLowerCase().includes(termo))
  )
})

const linhasVisiveis = computed(() => linhasFiltradas.value.slice(0, limite.value))

function revalidar() {
  const corrigidas = store.revalidar()
  const restantes = store.quantidadeInvalidas
  mensagem.value = corrigidas > 0
    ? `${corrigidas} ${corrigidas === 1 ? 'linha corrigida' : 'linhas corrigidas'}.${restantes ? ` Faltam ${restantes}.` : ''}`
    : 'Nenhuma linha nova ficou válida.'
}
</script>
