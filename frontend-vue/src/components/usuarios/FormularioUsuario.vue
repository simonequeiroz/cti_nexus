<!-- Formulário de cadastro e edição de usuário. Sem "usuario" é um cadastro novo; com ele, edição (senha em branco = manter). -->
<template>
  <CartaoPainel :titulo="editando ? `Editar ${usuario.nome}` : 'Novo usuário'" :descricao="editando ? 'Deixe a senha em branco para manter a atual.' : 'O acesso vale assim que você cadastrar.'">
    <form class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5" novalidate @submit.prevent="salvar">
      <CampoTexto v-model="dados.nome" rotulo="Nome completo" autocomplete="off" :erro="erros.nome" />
      <CampoTexto v-model="dados.email" rotulo="E-mail" type="email" autocomplete="off" :erro="erros.email" />
      <CampoTexto v-model="dados.senha" :rotulo="editando ? 'Nova senha (opcional)' : 'Senha'" type="password" autocomplete="new-password" :erro="erros.senha" />
      <CampoTexto v-model="dados.confirmacao" rotulo="Confirmar senha" type="password" autocomplete="new-password" :erro="erros.confirmacao" />

      <!-- Quem está logado não muda o próprio papel: evita o administrador tirar o próprio acesso sem querer. -->
      <fieldset class="md:col-span-2" :disabled="proprioUsuario" :aria-describedby="erros.papel ? 'erro-papel' : undefined">
        <legend class="text-sm font-medium mb-1.5">Papel</legend>
        <p v-if="proprioUsuario" class="mb-2 text-xs text-regular">Você não pode mudar o seu próprio papel.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label
            v-for="(papel, codigo) in PAPEIS"
            :key="codigo"
            class="flex gap-3 rounded-lg border p-3 cursor-pointer transition-colors has-[:checked]:border-blue-primary has-[:checked]:bg-blue-primary/5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            :class="erros.papel ? 'border-orange' : 'border-blue-secondary'"
          >
            <input v-model="dados.papel" type="radio" name="papel" :value="codigo" class="mt-1 accent-blue-primary" />
            <span>
              <span class="block text-sm font-semibold">{{ papel.nome }}</span>
              <span class="block text-xs text-regular">{{ papel.descricao }}</span>
            </span>
          </label>
        </div>
        <p v-if="erros.papel" id="erro-papel" class="mt-1 text-xs text-orange-dark">{{ erros.papel }}</p>
      </fieldset>

      <!-- Erro que não é de um campo (ex.: servidor desligado). -->
      <p v-if="erros.geral" role="alert" class="md:col-span-2 text-sm text-orange-dark bg-orange/10 border border-orange/30 rounded-lg px-4 py-2.5">{{ erros.geral }}</p>

      <div class="md:col-span-2 flex justify-end gap-3">
        <BotaoBase variante="secundario" @click="emit('cancelar')">Cancelar</BotaoBase>
        <BotaoBase tipo="submit" :disabled="salvando">{{ salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar usuário' }}</BotaoBase>
      </div>
    </form>
  </CartaoPainel>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import CartaoPainel from '../ui/CartaoPainel.vue'
import CampoTexto from '../ui/CampoTexto.vue'
import BotaoBase from '../ui/BotaoBase.vue'
import { useUsuariosStore } from '../../stores/usuariosStore'
import { PAPEIS } from '../../constants/permissoes'

const props = defineProps({
  usuario: { type: Object, default: null }, // Usuário em edição (null = cadastro novo).
  proprioUsuario: { type: Boolean, default: false } // O usuário em edição é quem está logado.
})

const emit = defineEmits(['concluir', 'cancelar'])

const store = useUsuariosStore()

const editando = computed(() => props.usuario !== null)

// Estado local do formulário: só vai para a store ao salvar.
const dados = reactive({
  nome: props.usuario?.nome ?? '',
  email: props.usuario?.email ?? '',
  senha: '',
  confirmacao: '',
  papel: props.usuario?.papel ?? ''
})

const erros = ref({})
const salvando = ref(false) // Esperando a resposta da API (evita clicar duas vezes).

async function salvar() {
  salvando.value = true
  erros.value = editando.value ? await store.editar(props.usuario.id, dados) : await store.cadastrar(dados) // PUT ou POST na API.
  salvando.value = false
  if (Object.keys(erros.value).length) return
  emit('concluir', editando.value ? `Alterações de ${dados.nome.trim()} salvas.` : `${dados.nome.trim()} cadastrado(a). Já pode entrar com o e-mail ${dados.email.trim().toLowerCase()}.`)
}
</script>
