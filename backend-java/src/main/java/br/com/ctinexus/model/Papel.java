package br.com.ctinexus.model; // Endereço: pastas br/com/ctinexus/model.

import java.util.List;

// Os 3 papéis do CTI Nexus (no slide: enum Perfil com USER e ADMIN).
// Cada papel tem a lista de permissões, igual ao front (constants/permissoes.js).
// As rotas da API conferem a PERMISSÃO (ex.: "gerenciar_usuarios"), nunca o nome do papel.
public enum Papel {

    ADMINISTRADOR(List.of( // Acesso total.
            "enviar_planilha", "corrigir_dados", "aprovar_carga", "ver_relatorio", "ver_painel",
            "limpar_historico", "configurar_conexoes", "gerenciar_regras", "gerenciar_usuarios")),

    ANALISTA(List.of( // Envia planilhas, corrige e libera a carga.
            "enviar_planilha", "corrigir_dados", "aprovar_carga", "ver_relatorio", "ver_painel")),

    GESTOR(List.of( // Só consulta painel e relatórios.
            "ver_relatorio", "ver_painel"));

    private final List<String> permissoes; // Guarda a lista de cada papel.

    Papel(List<String> permissoes) { // Construtor do enum: recebe a lista escrita acima.
        this.permissoes = permissoes;
    }

    public List<String> getPermissoes() {
        return permissoes;
    }
}
