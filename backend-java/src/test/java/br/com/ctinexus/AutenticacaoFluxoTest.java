package br.com.ctinexus;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Passo 7 do slide 13: "testar o acesso com e sem autenticação".
// Faz automaticamente os testes do Thunder Client (slides 27 a 30) e as regras do CTI Nexus.
// Roda com: mvn test   (usa o banco H2 em memória, então não precisa do Neon).
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:teste;MODE=PostgreSQL", // Banco temporário só para o teste.
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",                // Cria as tabelas no começo e apaga no fim.
        "jwt.segredo=Y2hhdmUtZGUtdGVzdGUtY3RpLW5leHVzLTMyYnl0ZXM=" // Chave fixa só para o teste.
})
@AutoConfigureMockMvc // MockMvc = "Thunder Client" de mentira, sem abrir a porta 8080.
class AutenticacaoFluxoTest {

    @Autowired
    MockMvc api;

    @Test
    void fluxoCompletoDeAcesso() throws Exception {
        // ===== Teste 1 do slide: cadastrar -> 201, mas entra PENDENTE e sem papel =====
        String resposta = api.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nome": "Maria", "email": "Maria@Senai.com", "senha": "Aluno12345" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("maria@senai.com")) // E-mail padronizado.
                .andExpect(jsonPath("$.situacao").value("PENDENTE"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist())       // A senha nunca sai da API.
                .andReturn().getResponse().getContentAsString();
        int idMaria = JsonPath.read(resposta, "$.id");

        // E-mail repetido -> 409. Campos inválidos -> 400 com o erro de cada campo.
        api.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nome": "Outra", "email": "maria@senai.com", "senha": "123456" }
                                """))
                .andExpect(status().isConflict());
        api.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nome": "A", "email": "nao-e-email", "senha": "1" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.senha").exists());

        // Pedido ainda não aprovado: senha certa, mas 403.
        api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "maria@senai.com", "senha": "Aluno12345" }
                                """))
                .andExpect(status().isForbidden());

        // ===== Teste 3 do slide: rota privada sem token -> 401; com token falso -> 401 =====
        api.perform(get("/api/privado")).andExpect(status().isUnauthorized());
        api.perform(get("/api/privado").header("Authorization", "Bearer token.falso.aqui"))
                .andExpect(status().isUnauthorized());

        // ===== Teste 2 do slide: login -> 200 com token =====
        // O administrador foi criado sozinho pelo DadosIniciais (admin@ctinexus.com / 123456).
        String tokenAdmin = login("admin@ctinexus.com", "123456");
        api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "admin@ctinexus.com", "senha": "errada" }
                                """))
                .andExpect(status().isUnauthorized()); // Senha errada -> 401.

        // Administrador vê a lista e aprova a Maria. Aprovar sem papel -> 400.
        api.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
        api.perform(patch("/api/admin/usuarios/" + idMaria + "/status").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "situacao": "ATIVO" }
                                """))
                .andExpect(status().isBadRequest());
        api.perform(patch("/api/admin/usuarios/" + idMaria + "/status").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "situacao": "ATIVO", "papel": "ANALISTA" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("ANALISTA"));

        // ===== Teste 4 do slide: /api/auth/me com token -> o próprio usuário =====
        String tokenMaria = login("maria@senai.com", "Aluno12345");
        api.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenMaria))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("maria@senai.com"));
        api.perform(get("/api/privado").header("Authorization", "Bearer " + tokenMaria))
                .andExpect(status().isOk());

        // Autorização: analista tem token válido, mas não tem "gerenciar_usuarios" -> 403.
        api.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + tokenMaria))
                .andExpect(status().isForbidden());

        // Proteções: administrador não desativa a si mesmo.
        api.perform(patch("/api/admin/usuarios/1/status").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "situacao": "DESATIVADO" }
                                """))
                .andExpect(status().isConflict());

        // Desativada, a Maria perde o acesso na hora, mesmo com o token antigo.
        api.perform(patch("/api/admin/usuarios/" + idMaria + "/status").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "situacao": "DESATIVADO" }
                                """))
                .andExpect(status().isOk());
        api.perform(get("/api/privado").header("Authorization", "Bearer " + tokenMaria))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void administradorCadastraEEditaUsuarios() throws Exception {
        String tokenAdmin = login("admin@ctinexus.com", "123456");

        // Usuários de demonstração criados pelo DadosIniciais entram com 123456.
        login("gestor@ctinexus.com", "123456");

        // Cadastro direto: já nasce ativo e com papel, então já consegue entrar.
        String resposta = api.perform(post("/api/admin/usuarios").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Carla Souza", "email": "carla@ctinexus.com", "senha": "123456", "papel": "GESTOR" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.situacao").value("ATIVO"))
                .andReturn().getResponse().getContentAsString();
        int idCarla = JsonPath.read(resposta, "$.id");
        login("carla@ctinexus.com", "123456");

        // Cadastro sem senha -> 400 apontando o campo "senha".
        api.perform(post("/api/admin/usuarios").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Sem Senha", "email": "sem@ctinexus.com", "papel": "GESTOR" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());

        // Editar: troca papel e senha. E-mail de outra pessoa -> 409 no campo "email".
        api.perform(put("/api/admin/usuarios/" + idCarla).header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Carla Souza", "email": "carla@ctinexus.com", "senha": "nova123", "papel": "ANALISTA" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("ANALISTA"));
        login("carla@ctinexus.com", "nova123");
        api.perform(put("/api/admin/usuarios/" + idCarla).header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Carla Souza", "email": "gestor@ctinexus.com", "papel": "ANALISTA" }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.campos.email").exists());

        // O administrador edita o próprio nome (pode), mas não o próprio papel.
        api.perform(put("/api/admin/usuarios/1").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Rita Andrade", "email": "admin@ctinexus.com", "papel": "ADMINISTRADOR" }
                                """))
                .andExpect(status().isOk());
        api.perform(put("/api/admin/usuarios/1").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Rita Andrade", "email": "admin@ctinexus.com", "papel": "GESTOR" }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.campos.papel").exists());
    }

    @Test
    void esqueciMinhaSenhaComSenhaTemporaria() throws Exception {
        String tokenAdmin = login("admin@ctinexus.com", "123456");

        // Cria a Bia, que troca a senha inicial (o administrador cadastrou, então ela é obrigada a trocar).
        String resposta = api.perform(post("/api/admin/usuarios").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                { "nome": "Bia Costa", "email": "bia@ctinexus.com", "senha": "inicial1", "papel": "ANALISTA" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deveTrocarSenha").value(true))
                .andReturn().getResponse().getContentAsString();
        int idBia = JsonPath.read(resposta, "$.id");

        // Com senha temporária: login funciona, mas sem permissão nenhuma até trocar.
        String tokenBia = login("bia@ctinexus.com", "inicial1");
        api.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenBia))
                .andExpect(jsonPath("$.deveTrocarSenha").value(true))
                .andExpect(jsonPath("$.permissoes").isEmpty());
        trocarSenha(tokenBia, "inicial1", "minhaSenha1");
        api.perform(get("/api/auth/me").header("Authorization", "Bearer " + tokenBia))
                .andExpect(jsonPath("$.deveTrocarSenha").value(false))
                .andExpect(jsonPath("$.permissoes").isNotEmpty());

        // Esqueceu a senha: o pedido fica marcado. E-mail que não existe recebe a mesma resposta (200).
        api.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"bia@ctinexus.com\" }"))
                .andExpect(status().isOk());
        api.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"ninguem@ctinexus.com\" }"))
                .andExpect(status().isOk());
        api.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(jsonPath("$[?(@.email == 'bia@ctinexus.com')].pediuNovaSenhaEm").isNotEmpty());

        // Administrador define a senha temporária; a antiga para de funcionar.
        api.perform(patch("/api/admin/usuarios/" + idBia + "/senha").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content("{ \"senha\": \"temp2026\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deveTrocarSenha").value(true));
        api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"bia@ctinexus.com\", \"senha\": \"minhaSenha1\" }"))
                .andExpect(status().isUnauthorized());

        // Entra com a temporária: enquanto não troca, não abre nada que exija permissão.
        String tokenTemp = login("bia@ctinexus.com", "temp2026");
        api.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + tokenTemp))
                .andExpect(status().isForbidden());

        // Senha atual errada ou nova igual à atual -> 400 no campo certo.
        api.perform(post("/api/auth/trocar-senha").header("Authorization", "Bearer " + tokenTemp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"senhaAtual\": \"errada\", \"senhaNova\": \"outra123\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senhaAtual").exists());
        api.perform(post("/api/auth/trocar-senha").header("Authorization", "Bearer " + tokenTemp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"senhaAtual\": \"temp2026\", \"senhaNova\": \"temp2026\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senhaNova").exists());

        trocarSenha(tokenTemp, "temp2026", "novaDaBia1");
        login("bia@ctinexus.com", "novaDaBia1"); // Agora a senha é só dela.
    }

    private void trocarSenha(String token, String atual, String nova) throws Exception {
        api.perform(post("/api/auth/trocar-senha").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"senhaAtual\": \"" + atual + "\", \"senhaNova\": \"" + nova + "\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deveTrocarSenha").value(false));
    }

    // Faz login e devolve só o token.
    private String login(String email, String senha) throws Exception {
        String resposta = api.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"" + email + "\", \"senha\": \"" + senha + "\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }
}
