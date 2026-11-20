<!-- REMOVER ANTES DA ENTREGA ----------------------------------------------------------------------
     Como testar a correção: na tela Validação, digite um valor errado e depois um certo num campo laranja.
     A mensagem muda na hora; o campo certo mostra "✓ Certo", "Antes: ..." e "Desfazer". Depois, "Conferir de novo".
     -------------------------------------------------------------------------------------------------- -->
<!-- Uma linha com erro: todos os campos editáveis, com os que têm problema destacados e a mensagem logo abaixo.
     Cada campo é conferido enquanto a pessoa digita (o erro some ou muda na hora), e o campo alterado mostra o valor de antes e "Desfazer". -->
<template>
  <article :aria-labelledby="idTitulo" class="bg-white border border-blue-secondary/80 rounded-2xl shadow-sm overflow-hidden">
    <header class="px-5 py-3 border-b border-blue-secondary/60 flex flex-wrap items-center gap-x-3 gap-y-2">
      <h3 :id="idTitulo" class="font-display font-bold">
        Linha {{ numeroLinha }}
        <span class="font-mono font-normal text-sm text-regular">· {{ linha.codigo_cliente || '(sem código)' }}</span>
      </h3>
      <ul class="flex flex-wrap gap-1.5 sm:ml-auto">
        <li v-for="tipo in tiposDaLinha" :key="tipo">
          <EtiquetaBase :cor="corDoTipo(tipo)">{{ tipo }}</EtiquetaBase>
        </li>
        <li v-if="!tiposDaLinha.length">
          <EtiquetaBase cor="bg-green/15 text-green-dark">Tudo certo: clique em Conferir de novo</EtiquetaBase>
        </li>
      </ul>
    </header>

    <div class="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-x-4 gap-y-3">
      <div v-for="campo in CAMPOS_DA_PLANILHA" :key="campo">
        <label :for="`${idTitulo}-${campo}`" class="block text-[11px] font-mono uppercase tracking-wider" :class="erroDoCampo(campo) ? 'text-orange-dark font-semibold' : 'text-regular'">
          {{ nomeDoCampo(campo) }}
        </label>
        <input
          :id="`${idTitulo}-${campo}`"
          type="text"
          :value="valorParaEditar(campo)"
          class="mt-1 w-full rounded-lg border px-2.5 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-primary"
          :class="erroDoCampo(campo) ? 'border-orange bg-orange/5' : 'border-blue-secondary bg-white'"
          :aria-invalid="erroDoCampo(campo) ? 'true' : undefined"
          :aria-describedby="erroDoCampo(campo) ? `${idTitulo}-${campo}-erro` : undefined"
          @input="evento => rascunho[campo] = evento.target.value"
          @change="evento => store.corrigirCampo(numeroLinha, campo, evento.target.value)"
        />
        <p v-if="erroDoCampo(campo)" :id="`${idTitulo}-${campo}-erro`" class="mt-1 text-xs text-orange-dark">
          {{ erroDoCampo(campo) }}
        </p>
        <p v-else-if="campo === 'codigo_cliente' && avisoDoCodigo?.livre" role="status" class="mt-1 text-xs text-green-dark">
          {{ avisoDoCodigo.mensagem }}
        </p>
        <p v-else-if="foiAlterado(campo)" role="status" class="mt-1 text-xs text-green-dark font-medium">✓ Certo</p>
        <!-- Campo mexido: mostra o que estava antes, para a pessoa não perder a referência, e deixa voltar. -->
        <p v-if="foiAlterado(campo)" class="mt-0.5 text-xs text-regular">
          Antes: <span class="font-mono">{{ valorOriginal(campo) || '(vazio)' }}</span>
          <button type="button" class="ml-1 font-medium text-blue-primary hover:underline" @click="desfazer(campo)">Desfazer</button>
        </p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, reactive, useId } from 'vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { CAMPOS_DA_PLANILHA, nomeDoCampo, corDoTipo } from '../../constants/validacao'
import { normalizarData, normalizarCodigo } from '../../utils/normalizacao'
import { validarLinhas } from '../../utils/validacao'

const props = defineProps({
  numeroLinha: { type: Number, required: true }, // Linha como aparece no Excel.
  problemas: { type: Array, required: true } // Ocorrências desta linha na última conferência: [{ campo, tipo, descricao }]
})

const store = useUploadStore()
const idTitulo = useId()

const linha = computed(() => store.dadosBrutos[props.numeroLinha - 2]) // Valores da planilha (com as correções já feitas).

const originais = { ...linha.value } // Como a linha estava quando a tela abriu: é o "Antes" de cada campo.
const rascunho = reactive({}) // O que está escrito em cada campo agora (campo -> texto), mesmo antes de sair dele.

function valorOriginal(campo) {
  const valor = originais[campo]
  if (campo === 'data_contratacao' && typeof valor === 'number') return normalizarData(valor) || String(valor)
  return String(valor ?? '')
}

function foiAlterado(campo) {
  return campo in rascunho && String(rascunho[campo]).trim() !== valorOriginal(campo).trim()
}

function desfazer(campo) { // Volta ao valor de antes (e o registro de alterações apaga essa edição).
  rascunho[campo] = valorOriginal(campo)
  store.corrigirCampo(props.numeroLinha, campo, originais[campo] ?? '')
}

// Confere a linha como está escrita AGORA, com as mesmas regras da conferência (utils/validacao.js).
// Assim o erro some ou muda enquanto a pessoa digita, sem esperar o "Conferir de novo".
const problemasAgora = computed(() => validarLinhas([{ ...linha.value, ...rascunho }]).ocorrencias)

// Código: o aviso de agora (livre ou já usado) vale mais; sem mexer no código, vale a última conferência
// (que sabe de código repetido em outras linhas, coisa que a conferência só desta linha não enxerga).
const avisoDoCodigo = computed(() => {
  if (!('codigo_cliente' in rascunho)) return null
  const original = store.codigoOriginal.get(props.numeroLinha) ?? originais.codigo_cliente
  if (normalizarCodigo(rascunho.codigo_cliente) === normalizarCodigo(original)) return null
  return store.situacaoDoCodigo(props.numeroLinha, rascunho.codigo_cliente)
})

function problemasDoCampo(campo) {
  if (campo === 'codigo_cliente') {
    if (avisoDoCodigo.value) return avisoDoCodigo.value.livre ? [] : [{ tipo: 'Código repetido', descricao: avisoDoCodigo.value.mensagem }]
    const agora = problemasAgora.value.filter(p => p.campo === campo) // Ex.: código apagado (vazio).
    return agora.length ? agora : props.problemas.filter(p => p.campo === campo)
  }
  return problemasAgora.value.filter(p => p.campo === campo)
}

function erroDoCampo(campo) { // Junta as mensagens do campo. Ex.: "UF está vazia".
  return problemasDoCampo(campo).map(p => p.descricao).join('; ')
}

const tiposDaLinha = computed(() => [...new Set(CAMPOS_DA_PLANILHA.flatMap(campo => problemasDoCampo(campo).map(p => p.tipo)))])

function valorParaEditar(campo) {
  if (campo in rascunho) return rascunho[campo] // Sem isso, o Vue apagaria o que está sendo digitado.
  const valor = linha.value[campo]
  if (campo === 'data_contratacao' && typeof valor === 'number') return normalizarData(valor) || String(valor) // Data do Excel vira dd/mm/aaaa.
  return String(valor ?? '')
}
</script>
