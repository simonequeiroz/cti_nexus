# CTI Nexus — API (Spring Boot)

Back-end do CTI Nexus: login com JWT, pedido de acesso e aprovação de usuários pelo administrador.
Segue a Aula 10 de Desenvolvimento Backend (prof. Daniel Vieira).

**Tecnologias:** Java 21, Spring Boot 4.1, Spring Security, JPA, PostgreSQL (Neon), JJWT 0.12.6, BCrypt.

## Pastas

```
src/main/java/br/com/ctinexus/
├── CtiNexusApplication.java   Liga o sistema (porta 8080)
├── model/        Usuario (tabela usuario), Papel, SituacaoUsuario
├── repository/   UsuarioRepository (conversa com o banco)
├── dto/          O que entra e sai da API (sem a senha)
├── service/      Regras: AutenticacaoService (cadastro e login), UsuarioService (tela Usuários)
├── security/     JwtService (gera/confere o token), JwtFiltroAutenticacao (lê o token de cada pedido)
├── config/       ConfiguracaoSeguranca (quem entra onde), TratadorDeErros, DadosIniciais (1º administrador)
└── controller/   AutenticacaoController, AdminUsuarioController, PrivadoController
```

## Como rodar

1. Gere a chave do JWT e defina as variáveis no PowerShell (no mesmo terminal em que vai rodar):

   ```powershell
   $bytes = New-Object byte[] 32
   [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
   $env:JWT_SECRET_BASE64 = [Convert]::ToBase64String($bytes)

   # Banco no Neon (copiar do painel do Neon, formato JDBC):
   $env:DB_URL = "jdbc:postgresql://<host>.neon.tech/<banco>?sslmode=require"
   $env:DB_USUARIO = "<usuario>"
   $env:DB_SENHA = "<senha>"
   ```

   A lista completa está em [.env.example](.env.example).

2. Rode, dentro da pasta `backend-java`: `mvn spring-boot:run` (ou o botão Run do Spring Boot Dashboard).
3. Na primeira vez, o sistema cria as tabelas e o primeiro administrador: `admin@ctinexus.com` / `123456`
   (ou o que estiver em `ADMIN_EMAIL` / `ADMIN_SENHA`).

## Rotas

| Método | Endereço | Quem pode | O que faz |
|---|---|---|---|
| POST | `/api/auth/cadastro` | todos | Pedido de acesso `{nome, email, cargo?, senha}` → 201, fica PENDENTE |
| POST | `/api/auth/login` | todos | `{email, senha}` → `{token, tipo: "Bearer", usuario}` |
| GET | `/api/auth/me` | logado | Dados de quem está logado |
| GET | `/api/privado` | logado | Rota de teste da aula |
| GET | `/api/admin/usuarios` | administrador | Lista usuários e pedidos |
| PATCH | `/api/admin/usuarios/{id}/status` | administrador | `{situacao: "ATIVO", papel: "ANALISTA"}` aprova; `{situacao: "DESATIVADO"}` desativa |
| DELETE | `/api/admin/usuarios/{id}` | administrador | Recusa um pedido pendente |

Respostas de erro: `{status, mensagem, campos}`. 400 = campo inválido, 401 = sem login ou senha errada,
403 = sem permissão ou conta pendente/desativada, 409 = e-mail repetido ou regra de proteção.

## Testes

- **Automático:** `mvn test` faz os 4 testes do Thunder Client da aula e as regras do CTI Nexus
  (usa um banco H2 temporário, não precisa do Neon). Arquivo: `src/test/java/.../AutenticacaoFluxoTest.java`.
- **Thunder Client:** com o sistema rodando, siga a tabela acima. Para rotas que exigem login,
  em Auth → Bearer, cole o token recebido no login.
