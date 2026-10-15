<!-- Lista de usuários com papel, situação e as ações Editar e Desativar/Reativar. -->
<template>
  <CartaoPainel titulo="Usuários cadastrados" :descricao="`${store.quantidadeAtivos} com acesso ativo de ${store.cadastrados.length}.`">
    <TabelaDados legenda="Usuários do sistema" :colunas="COLUNAS">
      <tr v-for="usuario in store.usuariosOrdenados" :key="usuario.id" :class="{ 'text-regular': !usuario.ativo }">
        <th scope="row" class="pl-6 pr-4 py-3 text-left font-normal">
          <span class="block font-semibold" :class="usuario.ativo ? 'text-black-dark' : 'line-through'">
            {{ usuario.nome }}<span v-if="usuario.id === idLogado" class="ml-1 text-xs font-normal text-regular">(você)</span>
          </span>
          <span class="block text-xs text-regular">{{ usuario.email }}</span>
        </th>
        <td class="px-4 py-3"><EtiquetaBase :cor="COR_DO_PAPEL[usuario.papel]">{{ PAPEIS[usuario.papel].nome }}</EtiquetaBase></td>
        <td class="px-4 py-3">
          <EtiquetaBase :cor="usuario.ativo ? 'bg-green/15 text-green-dark' : undefined">{{ usuario.ativo ? 'Ativo' : 'Desativado' }}</EtiquetaBase>
        </td>
        <td class="px-4 py-3 font-mono whitespace-nowrap">{{ usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR') : 'demonstração' }}</td>
        <td class="px-4 pr-6 py-3 text-right whitespace-nowrap">
          <button type="button" class="text-xs font-semibold text-blue-primary hover:underline" @click="emit('editar', usuario)">
            Editar<span class="sr-only"> {{ usuario.nome }}</span>
          </button>
          <!-- Ninguém desativa o próprio acesso. -->
          <button
            v-if="usuario.id !== idLogado"
            type="button"
            class="ml-4 text-xs font-semibold hover:underline"
            :class="usuario.ativo ? 'text-orange-dark' : 'text-green-dark'"
            @click="emit('alternar-ativo', usuario)"
          >
            {{ usuario.ativo ? 'Desativar' : 'Reativar' }}<span class="sr-only"> {{ usuario.nome }}</span>
          </button>
        </td>
      </tr>
    </TabelaDados>
  </CartaoPainel>
</template>

<script setup>
import CartaoPainel from '../ui/CartaoPainel.vue'
import TabelaDados from '../ui/TabelaDados.vue'
import EtiquetaBase from '../ui/EtiquetaBase.vue'
import { useUsuariosStore } from '../../stores/usuariosStore'
import { PAPEIS } from '../../constants/permissoes'

defineProps({
  idLogado: { type: Number, default: null } // Usuário que está usando o sistema agora.
})

const emit = defineEmits(['editar', 'alternar-ativo'])

const store = useUsuariosStore()

const COLUNAS = [
  { rotulo: 'Usuário' },
  { rotulo: 'Papel' },
  { rotulo: 'Situação' },
  { rotulo: 'Cadastro' },
  { rotulo: 'Ações', oculto: true }
]

// Escala de azul como nos níveis A/B/C: mais escuro = mais acesso.
const COR_DO_PAPEL = {
  administrador: 'bg-blue-primary text-white',
  analista: 'bg-blue-primary/15 text-blue-primary',
  gestor: 'bg-blue-secondary/50 text-regular'
}
</script>
