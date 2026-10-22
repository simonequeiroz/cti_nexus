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
