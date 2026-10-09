<!-- Tela de upload: envio da planilha, resultado resumido, dados válidos e histórico. Os erros linha a linha ficam na Validação.
     Sem faixa de números: o "Resultado da conferência" já resume a planilha, e o faturamento é assunto do Dashboard. -->
<template>
  <LayoutSistema>
    <IntroducaoPagina etapa="Passo 1 de 4 — Upload" titulo="Enviar planilha">
      <p>Envie a planilha com a carteira de clientes. O sistema corrige sozinho as diferenças de escrita (como “IND.” e “Industria”) e mostra as linhas que precisam da sua ajuda.</p>
    </IntroducaoPagina>

    <!-- Arquivo e resultado lado a lado: o resultado acompanha a altura do cartão de upload. -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
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
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import IntroducaoPagina from '../components/layout/IntroducaoPagina.vue'
import PainelUpload from '../components/upload/PainelUpload.vue'
import ResultadoValidacao from '../components/upload/ResultadoValidacao.vue'
import PreviaDadosValidos from '../components/upload/PreviaDadosValidos.vue'
import HistoricoProcessamento from '../components/upload/HistoricoProcessamento.vue'
</script>
