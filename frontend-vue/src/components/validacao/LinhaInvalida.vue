<!-- Uma linha com erro: todos os campos editáveis, com os que têm problema destacados e a mensagem logo abaixo. -->
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
          @input="evento => { if (campo === 'codigo_cliente') codigoDigitado = evento.target.value }"
          @change="evento => store.corrigirCampo(numeroLinha, campo, evento.target.value)"
        />
        <p v-if="erroDoCampo(campo)" :id="`${idTitulo}-${campo}-erro`" class="mt-1 text-xs text-orange-dark">
          {{ erroDoCampo(campo) }}
        </p>
        <p v-else-if="campo === 'codigo_cliente' && avisoDoCodigo?.livre" role="status" class="mt-1 text-xs text-green-dark">
          {{ avisoDoCodigo.mensagem }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, useId } from 'vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import { useUploadStore } from '../../stores/uploadStore'
import { CAMPOS_DA_PLANILHA, nomeDoCampo, corDoTipo } from '../../constants/validacao'
import { normalizarData, normalizarCodigo } from '../../utils/normalizacao'

const props = defineProps({
  numeroLinha: { type: Number, required: true }, // Linha como aparece no Excel.
  problemas: { type: Array, required: true } // Ocorrências desta linha: [{ campo, tipo, descricao }]
})

const store = useUploadStore()
const idTitulo = useId()

const linha = computed(() => store.dadosBrutos[props.numeroLinha - 2]) // Valores originais (com as correções já feitas).

const tiposDaLinha = computed(() => [...new Set(props.problemas.map(p => p.tipo))])

const codigoDigitado = ref(null) // O que está escrito no campo Código agora (null: ainda não mexeu).

// Enquanto digita: o código está livre ou já existe? Voltou ao código que veio na planilha: vale a mensagem normal.
const avisoDoCodigo = computed(() => {
  if (codigoDigitado.value === null) return null
  const original = store.codigoOriginal.get(props.numeroLinha) ?? linha.value.codigo_cliente
  if (normalizarCodigo(codigoDigitado.value) === normalizarCodigo(original)) return null
  return store.situacaoDoCodigo(props.numeroLinha, codigoDigitado.value)
})

function erroDoCampo(campo) { // No Código, o aviso de agora vale mais do que o resultado da última conferência.
  if (campo === 'codigo_cliente' && avisoDoCodigo.value) return avisoDoCodigo.value.livre ? '' : avisoDoCodigo.value.mensagem
  return problemaDoCampo(campo)
}

function problemaDoCampo(campo) { // Junta as mensagens do campo. Ex.: "UF está vazia".
  return props.problemas.filter(p => p.campo === campo).map(p => p.descricao).join('; ')
}

function valorParaEditar(campo) {
  if (campo === 'codigo_cliente' && codigoDigitado.value !== null) return codigoDigitado.value // Sem isso, o Vue apagaria o que está sendo digitado.
  const valor = linha.value[campo]
  if (campo === 'data_contratacao' && typeof valor === 'number') return normalizarData(valor) || String(valor) // Data do Excel vira dd/mm/aaaa.
  return String(valor ?? '')
}
</script>
