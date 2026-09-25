<!-- Exemplo de planilha com inconsistências (células destacadas em laranja). -->
<template>
  <figure class="p-8 bg-surface-alt/60">
    <figcaption class="text-[11px] font-mono tracking-wider uppercase text-regular mb-4 font-semibold">Planilha — como chega</figcaption>

    <div class="border border-blue-secondary rounded-lg overflow-hidden bg-white shadow-sm">
      <table class="w-full font-mono text-xs table-fixed">
        <thead class="bg-blue-secondary/40 text-black-dark text-left">
          <tr>
            <th scope="col" class="p-2.5 w-[70px] border-r border-b border-blue-secondary">CÓD.</th>
            <th scope="col" class="p-2.5 border-r border-b border-blue-secondary">SEGMENTO</th>
            <th scope="col" class="p-2.5 w-[90px] border-b border-blue-secondary">NÍVEL</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-blue-secondary">
          <tr v-for="linha in LINHAS" :key="linha.codigo">
            <td class="p-2.5 border-r border-blue-secondary">{{ linha.codigo }}</td>
            <td class="p-2.5 border-r border-blue-secondary" :class="{ [DESTAQUE]: linha.erro === 'segmento' }">{{ linha.segmento }}</td>
            <td class="p-2.5" :class="{ [DESTAQUE]: linha.erro === 'nivel' }">{{ linha.nivel }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-orange font-semibold mt-3.5 flex items-center gap-1.5">
      <span aria-hidden="true">⚠</span> 4 inconsistências detectadas
    </p>
  </figure>
</template>

<script setup>
const DESTAQUE = 'text-orange font-bold bg-orange/10'

const LINHAS = [
  { codigo: '0412', segmento: 'IND.', nivel: 'A', erro: 'segmento' },
  { codigo: '0413', segmento: 'Industria', nivel: 'b', erro: 'segmento' },
  { codigo: '0414', segmento: 'Comercio', nivel: 'B', erro: 'nivel' },
  { codigo: '0415', segmento: 'ind', nivel: 'C', erro: 'segmento' }
]
</script>
