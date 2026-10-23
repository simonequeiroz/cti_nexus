<!-- Campo de formulário com rótulo e mensagem de erro opcional. O slot "acao" coloca um botão dentro do campo (ex.: o olho de mostrar senha). -->
<template>
  <div>
    <label :for="id" class="block text-sm font-medium mb-1.5">{{ rotulo }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="valor"
        v-bind="$attrs"
        :aria-invalid="erro ? 'true' : undefined"
        :aria-describedby="erro ? `${id}-erro` : undefined"
        class="w-full bg-white border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-black-light focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/15"
        :class="[erro ? 'border-orange' : 'border-blue-secondary', { 'pr-20': $slots.acao }]"
      />
      <div v-if="$slots.acao" class="absolute right-2 top-1/2 -translate-y-1/2">
        <slot name="acao" />
      </div>
    </div>
    <p v-if="erro" :id="`${id}-erro`" class="mt-1 text-xs text-orange-dark">{{ erro }}</p>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false }) // type, placeholder etc. vão para o <input>, não para a <div>.

defineProps({
  rotulo: { type: String, required: true },
  erro: { type: String, default: '' } // Mensagem mostrada abaixo do campo (e lida pelo leitor de tela).
})

const valor = defineModel({ type: String, default: '' })
const id = useId()
</script>
