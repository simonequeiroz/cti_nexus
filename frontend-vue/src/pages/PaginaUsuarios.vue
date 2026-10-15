<!-- Tela de usuários (só administrador): pedidos de acesso, cadastro, edição do papel e desativação de acesso. -->
<template>
  <LayoutSistema>
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <IntroducaoPagina etapa="Administração" titulo="Usuários">
        <p>Cadastre quem vai usar o sistema e escolha o que cada pessoa pode fazer. Um acesso desativado não entra mais, mas continua na lista.</p>
      </IntroducaoPagina>
      <BotaoBase v-if="!formularioAberto" class="self-start md:self-auto" @click="abrirFormulario(null)">+ Novo usuário</BotaoBase>
    </div>

    <p v-if="aviso.texto" role="status" class="mt-6 rounded-lg border px-4 py-2.5 text-sm" :class="aviso.erro ? 'bg-orange/10 border-orange/30 text-orange-dark' : 'bg-green/10 border-green/30 text-green-dark'">
      {{ aviso.texto }}
    </p>

    <PedidosAcesso v-if="store.pedidosPendentes.length" class="mt-6" @aviso="mostrarAviso" />

    <!-- :key recria o formulário ao trocar de usuário, para não levar dados de um para o outro. -->
    <FormularioUsuario
      v-if="formularioAberto"
      :key="emEdicao?.id ?? 'novo'"
      :usuario="emEdicao"
      :proprio-usuario="emEdicao?.id === auth.usuario?.id"
      class="mt-6"
      @concluir="concluir"
      @cancelar="formularioAberto = false"
    />

    <TabelaUsuarios class="mt-6" :id-logado="auth.usuario?.id" @editar="abrirFormulario" @alternar-ativo="alternarAtivo" />
  </LayoutSistema>
</template>

<script setup>
import { ref, reactive } from 'vue'
import LayoutSistema from '../components/layout/LayoutSistema.vue'
import IntroducaoPagina from '../components/layout/IntroducaoPagina.vue'
import BotaoBase from '../components/ui/BotaoBase.vue'
import FormularioUsuario from '../components/usuarios/FormularioUsuario.vue'
import TabelaUsuarios from '../components/usuarios/TabelaUsuarios.vue'
import PedidosAcesso from '../components/usuarios/PedidosAcesso.vue'
import { useUsuariosStore } from '../stores/usuariosStore'
import { useAutenticacaoStore } from '../stores/autenticacaoStore'

const store = useUsuariosStore()
const auth = useAutenticacaoStore()

// Estado local da tela.
const formularioAberto = ref(false)
const emEdicao = ref(null) // Usuário em edição (null = cadastro novo).
const aviso = reactive({ texto: '', erro: false })

function abrirFormulario(usuario) {
  emEdicao.value = usuario
  formularioAberto.value = true
  aviso.texto = ''
}

function concluir(mensagem) {
  if (emEdicao.value?.id === auth.usuario?.id) auth.atualizarSessao(emEdicao.value) // Nome novo aparece na trilha e no cabeçalho.
  formularioAberto.value = false
  Object.assign(aviso, { texto: mensagem, erro: false })
}

function mostrarAviso(novoAviso) {
  Object.assign(aviso, novoAviso)
}

function alternarAtivo(usuario) {
  const problema = store.alternarAtivo(usuario.id)
  Object.assign(aviso, problema
    ? { texto: problema, erro: true }
    : { texto: `${usuario.nome} ${usuario.ativo ? 'pode entrar de novo' : 'não consegue mais entrar'}.`, erro: false })
}
</script>
