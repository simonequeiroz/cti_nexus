<!-- Tela de upload: envio da planilha, resultado da validação e histórico. -->
<template>
  <LayoutSistema>
    <IntroducaoPagina etapa="Etapa 1 — Validação inicial" titulo="Upload de planilha">
      <p>Envie a carteira de clientes em Excel. Antes do ETL, o sistema padroniza os textos e aponta as linhas com problemas para você corrigir.</p>
    </IntroducaoPagina>

    <section aria-labelledby="titulo-indicadores" class="mt-8">
      <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
      <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
    </section>

    <!-- Arquivo e inconsistências lado a lado: a lista acompanha a altura do cartão de upload e rola por dentro. -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <PainelUpload />
      <div class="relative min-w-0">
        <ProblemasValidacao class="lg:absolute lg:inset-0 lg:flex lg:flex-col" />
      </div>
    </div>

    <PreviaDadosValidos class="mt-6" />
    <HistoricoProcessamento class="mt-6" />
  </LayoutSistema>
</template>

<script setup>
import { computed } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import IntroducaoPagina from '../components/layout/IntroducaoPagina.vue'
import GradeEstatisticas from '../components/ui/GradeEstatisticas.vue'
import PainelUpload from '../components/upload/PainelUpload.vue'
import ProblemasValidacao from '../components/upload/ProblemasValidacao.vue'
import PreviaDadosValidos from '../components/upload/PreviaDadosValidos.vue'
import HistoricoProcessamento from '../components/upload/HistoricoProcessamento.vue'
import { useUploadStore } from '../stores/uploadStore'
import { formatarMoeda } from '../utils/formatadores'

const store = useUploadStore()

// Valores calculados pelos Getters da store.
const indicadores = computed(() => [
  { rotulo: 'Linhas', valor: store.quantidadeLinhas },
  { rotulo: 'Válidas', valor: store.quantidadeValidas, cor: 'text-green' },
  { rotulo: 'Inválidas', valor: store.quantidadeInvalidas, cor: store.quantidadeInvalidas ? 'text-orange' : undefined },
  { rotulo: 'Clientes únicos', valor: store.quantidadeClientes },
  { rotulo: '% válido', valor: `${store.percentualValido}%` },
  { rotulo: 'Faturamento', valor: formatarMoeda(store.faturamentoTotal, true) }
])
</script>
