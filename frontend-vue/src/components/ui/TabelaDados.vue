<!-- Tabela padrão: legenda para leitores de tela, cabeçalhos com scope e linhas pelo slot. -->
<template>
  <!-- relative: prende os textos sr-only dos cabeçalhos dentro da tabela (sem isso, no celular eles alargavam a página). -->
  <div class="relative overflow-x-auto">
    <table class="w-full text-sm">
      <caption class="sr-only">{{ legenda }}</caption>
      <thead class="bg-blue-secondary/30 text-left text-xs font-mono uppercase tracking-wider text-regular">
        <tr>
          <th
            v-for="coluna in colunas"
            :key="coluna.rotulo"
            scope="col"
            class="px-4 py-2.5 font-semibold first:pl-6"
            :class="coluna.classe"
          >
            <span :class="{ 'sr-only': coluna.oculto }">{{ coluna.rotulo }}</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-blue-secondary/50">
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  legenda: { type: String, required: true }, // Descrição da tabela (fica visível só para leitores de tela).
  colunas: { type: Array, required: true } // [{ rotulo, classe?, oculto? }]
})
</script>
