# CTI Nexus — como continuar em outra máquina

Diário do que foi feito e passo a passo para montar e ligar o sistema em qualquer computador.
Última atualização: **22/10/2026**.

> **Para o Claude Code na outra máquina:** comece pedindo
> *"leia o CLAUDE.md e o docs/COMO-CONTINUAR.md e vamos continuar o CTI Nexus"*.
> A memória do Claude fica só no computador onde ele rodou; o que viaja com o projeto são estes dois arquivos.

---

## 1. Onde paramos

- O **front-end** (Vue) está pronto: telas de planilha, validação, relatório, painel e usuários.
- O **back-end** (Spring Boot + JWT) está feito e **ligado ao front** no login, no pedido de acesso, na tela Usuários e no "Esqueci minha senha".
- O **banco** é o PostgreSQL no **Neon** e já tem a tabela `usuario`.
- **Ainda roda só no navegador:** a planilha (enviar, conferir, corrigir, liberar, painel). Ela ainda não vai para o banco.

## 2. O que foi feito em 22/10/2026

| Commit | O que entrou |
|---|---|
| `4686077` | Back-end seguindo a Aula 10 (prof. Daniel Vieira): pom.xml, entidade `Usuario`, BCrypt, login com JWT, filtro JWT, `ConfiguracaoSeguranca`, tela Usuários na API, testes automáticos |
| `061ae61` | Front ligado à API: login, pedido de acesso e tela Usuários passam a usar o banco (antes era demonstração no navegador) |
| `b83b619` | `services/` com uma função por rota (`autenticacaoService.js`, `usuariosService.js`) e endereço padrão no `api.js` (a professora apontou que o `api.js` não mostrava a ligação com o back-end) |
| `b373fa4` | "Esqueci minha senha" com senha temporária e troca obrigatória; `api.js` com timeout e tratamento do 401; olho na senha; visual do login (cartão e texto maior) |

### Como funciona o login (para explicar na apresentação)

```
Tela → store (Pinia) → service → api.js (axios) → Spring (controller → service → repository) → Neon
```

- **Cadastro** (`#/cadastro`) vira um **pedido de acesso** pendente; o administrador aprova e escolhe o papel.
- **Senha** é guardada com **BCrypt** (no Neon aparece `$2a$10$...`, nunca a senha).
- **Login** devolve um **token JWT** (o "crachá"), que o `api.js` manda em toda chamada (`Authorization: Bearer`).
- O **JwtFiltroAutenticacao.java** confere o token, e a **ConfiguracaoSeguranca.java** decide quem entra onde: sem token, 401; sem permissão, 403.
- **Esqueci minha senha:**
  1. A pessoa pede no login.
  2. O administrador define uma senha temporária na tela Usuários.
  3. A pessoa entra com ela e é obrigada a criar a própria senha.
  4. Volta ao login e entra com a senha nova.

---

## 3. Montar o projeto em outra máquina

### 3.1 Programas necessários

- **Git** e **VS Code**.
- **Node.js** (versão 20 ou mais nova), para o front.
- **Java 21 (JDK)** e **Maven**, para o back-end. O jeito mais fácil é instalar no VS Code a extensão **"Extension Pack for Java"** (ou "Java Extension Pack JDK"), que já traz os dois.
  - Confira no terminal: `java -version` tem que mostrar **21**. O Java 8 não serve.

### 3.2 Baixar o projeto

```powershell
git clone https://github.com/simonequeiroz/cti_nexus.git
cd cti_nexus
```

### 3.3 Front-end

```powershell
cd frontend-vue
npm install
```

O arquivo `frontend-vue/.env` é opcional: sem ele, o front usa `http://localhost:8080/api`.

### 3.4 Back-end: criar o arquivo `backend-java/.env`

Esse arquivo **não vai para o GitHub** (tem a senha do banco), então precisa ser criado em cada máquina:

1. Copie `backend-java/.env.example` para `backend-java/.env`.
2. **Dados do banco:** no site do Neon, entre no projeto **cti_nexus** em uso.
   - São dois projetos com o mesmo nome. O certo é o do endereço que começa com **`ep-late-block-b64cp83y`**.
   - Clique em **Connect**, desligue o **Connection pooling** e copie a Connection string.
3. Preencha as três linhas a partir dessa string: `postgresql://USUARIO:SENHA@HOST/neondb?...`

   ```
   DB_URL=jdbc:postgresql://HOST/neondb?sslmode=require
   DB_USUARIO=USUARIO
   DB_SENHA=SENHA
   ```

   Repare no `jdbc:` na frente e no final só com `?sslmode=require`.
4. **Chave do JWT:** gere uma no PowerShell (slide 26) e cole em `JWT_SECRET_BASE64=`:

   ```powershell
   $bytes = New-Object byte[] 32
   [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
   [Convert]::ToBase64String($bytes)
   ```

   Cada máquina pode ter uma chave diferente. Trocar a chave só faz quem estava logado precisar entrar de novo.

---

## 4. Ligar o sistema

Use **dois terminais** no VS Code:

```powershell
# Terminal 1 — back-end (porta 8080)
cd backend-java
mvn spring-boot:run
```

O back-end está no ar quando aparece **`Started CtiNexusApplication`**.

```powershell
# Terminal 2 — front-end (porta 5173)
cd frontend-vue
npm run dev
```

Abra **http://localhost:5173/#/login**.

### Usuários de demonstração (senha `123456`)

| Botão "Usar acesso de demonstração" | E-mail |
|---|---|
| Administrador | admin@ctinexus.com |
| Analista de Operações | analista@ctinexus.com |
| Gestor | gestor@ctinexus.com |

Se um botão de demonstração der "senha incorreta", é porque a senha daquele usuário foi trocada num teste. Para voltar:
1. Entre como administrador e abra **Usuários → Editar**.
2. Coloque `123456` de novo.
3. No próximo acesso ele vai pedir para criar uma senha nova (regra da senha temporária).

### Ver o banco no DBeaver

1. Crie uma conexão nova: **Nova conexão → PostgreSQL**.
2. Na aba **Main**, preencha:
   - **Host:** `ep-late-block-b64cp83y.c-2.sa-east-1.aws.neon.tech`
   - **Port:** `5432`
   - **Database:** `neondb`
   - **Username:** `neondb_owner`
   - **Password:** a mesma do `DB_SENHA` do `.env`
3. Na aba **SSL**, marque **Use SSL** e escolha **SSL mode = require**.
4. Clique em **Testar conexão**. Se o DBeaver pedir, baixe o driver.

A tabela fica em **neondb → Schemas → public → Tables → usuario**. Use o DBeaver só para consultar: alterações de usuário devem ser feitas pela tela Usuários, que segue as regras (BCrypt, administrador sempre ativo).

### Ver os usuários no banco

No Neon (**SQL Editor**) ou no DBeaver (**Editor SQL**), rode:

```sql
SELECT id, nome, email, papel, situacao, deve_trocar_senha, criado_em FROM usuario ORDER BY id;
```

---

## 5. Testes automáticos

```powershell
cd backend-java ; mvn test      # 3 testes do back-end (usa banco H2 temporário, não precisa do Neon)
cd frontend-vue ; npm test      # 74 testes do front (usa services/apiFalsa.js, não precisa do back-end)
```

---

## 6. Cuidados

- **Nunca** mande os arquivos `.env` para o GitHub (o `.gitignore` já bloqueia). Não cole a senha do Neon em chat.
- **Envio para o GitHub:** pelo VS Code, no ícone das três bolinhas → **Sincronizar Alterações**.
- **Arquivos Java com o aviso "non-project file" no VS Code:** use **Ctrl+Shift+P → "Java: Clean Java Language Server Workspace"**.
- **Porta 8080 ocupada:** já tem um back-end ligado. Feche o outro terminal ou o VS Code.

---

## 7. Próximos passos

1. **Planilha no back-end** (o "L" do ETL): enviar a planilha para o Spring, gravar a importação e os clientes no Neon, guardar quem enviou e quem liberou (`importacao.enviado_por`, `aprovado_por`) e fazer o painel ler do banco.
2. **Python** (`analytics-python/`): análises com Pandas e os gráficos com Matplotlib, incluindo o **boxplot** de faturamento por segmento, que o plano de ensino exige.
3. **Publicar:** back-end no **Render** e front na **Vercel**.
   - No Render, defina as mesmas variáveis do `.env`, mais `ADMIN_SENHA` forte e `CORS_ORIGENS` com o endereço da Vercel.
   - Na Vercel, defina `VITE_API_URL` com o endereço do Render + `/api`.
