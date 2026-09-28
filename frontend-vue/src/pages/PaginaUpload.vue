<!-- Tela de upload: envio da planilha, resultado resumido, dados válidos e histórico. Os erros linha a linha ficam na Validação. -->
<template>
  <LayoutSistema>
    <IntroducaoPagina etapa="Passo 1 de 4 — Upload" titulo="Enviar planilha">
      <p>Envie a planilha com a carteira de clientes. O sistema corrige sozinho as diferenças de escrita (como “IND.” e “Industria”) e mostra as linhas que precisam da sua ajuda.</p>
    </IntroducaoPagina>

    <section aria-labelledby="titulo-indicadores" class="mt-8">
      <h2 id="titulo-indicadores" class="sr-only">Indicadores da planilha</h2>
      <GradeEstatisticas :itens="indicadores" class="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
    </section>

    <!-- Arquivo e resultado lado a lado: o resultado acompanha a altura do cartão de upload. -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      <PainelUpload />
      <div class="relative min-w-0">
        <ResultadoValidacao class="lg:absolute lg:inset-0 lg:flex lg:flex-col" />
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
import ResultadoValidacao from '../components/upload/ResultadoValidacao.vue'
import PreviaDadosValidos from '../components/upload/PreviaDadosValidos.vue'
import HistoricoProcessamento from '../components/upload/HistoricoProcessamento.vue'
import { useUploadStore } from '../stores/uploadStore'
import { formatarMoeda } from '../utils/formatadores'

const store = useUploadStore()

// Valores calculados pelos Getters da store.
const indicadores = computed(() => [
  { rotulo: 'Linhas', valor: store.quantidadeLinhas },
  { rotulo: 'Aprovadas', valor: store.quantidadeValidas, cor: 'text-green' },
  { rotulo: 'Com erro', valor: store.quantidadeInvalidas, cor: store.quantidadeInvalidas ? 'text-orange' : undefined },
  { rotulo: 'Clientes únicos', valor: store.quantidadeClientes },
  { rotulo: '% aprovado', valor: `${store.percentualValido}%` },
  { rotulo: 'Faturamento', valor: formatarMoeda(store.faturamentoTotal, true) }
])
</script>
