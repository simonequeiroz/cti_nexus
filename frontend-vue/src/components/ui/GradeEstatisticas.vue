<!-- Lista de indicadores (rótulo + valor). Usa <dl>, que é a tag semântica para pares nome/valor. -->
<template>
  <dl class="grid gap-3">
    <div
      v-for="item in itens"
      :key="item.rotulo"
      class="rounded-xl p-4"
      :class="escuro ? 'bg-white/5 border border-white/10' : 'bg-white border border-blue-secondary/80 shadow-sm'"
    >
      <dt class="text-[10px] font-mono uppercase tracking-wider mb-1" :class="escuro ? 'text-black-light' : 'text-regular'">
        {{ item.rotulo }}
      </dt>
      <dd class="font-display font-bold text-xl" :class="item.cor ?? (escuro ? 'text-white' : '')">
        {{ item.valor }}
      </dd>
    </div>
  </dl>
</template>

<script setup>
defineProps({
  itens: { type: Array, required: true }, // [{ rotulo, valor, cor? }]
  escuro: { type: Boolean, default: false } // true para fundos escuros.
})
</script>
