# Deploy do CTI Nexus — manual passo a passo

Este manual publica o sistema na internet **à mão**, pelo site de cada plataforma, para entender cada peça.
No fim há um resumo dos conceitos de DevOps para a apresentação (10/12).

---

## 1. O mapa: o que vai para onde

Dois diagramas: **como o sistema funciona na nuvem** (1.1) e **como o código chega lá** (1.2).
O GitHub mostra os dois desenhados; no VS Code, use a visualização do Markdown com uma extensão de Mermaid.

### 1.1 O sistema funcionando (quem fala com quem)

```mermaid
flowchart TB
    user(["Navegador do usuário<br/>analista · gestor · administrador"])

    subgraph vercel["Vercel"]
        front["Front Vue 3<br/>site estático (HTML, JS, CSS)"]
    end

    subgraph render["Render · plano Free"]
        api["Back-end Java 21 · Spring Boot<br/>contêiner Docker<br/>health: /api/health"]
        etl["Python · FastAPI<br/>health: /health"]
    end

    subgraph neon["Neon · São Paulo"]
        db[("PostgreSQL")]
    end

    user -->|"1 · baixa o site"| front
    user -->|"2 · chamadas da API + token JWT<br/>(VITE_API_URL · liberado pelo CORS_ORIGENS)"| api
    api -->|"3 · POST /etl + X-ETL-Key<br/>(ETL_URL · ETL_CHAVE)"| etl
    api -->|"usuários · leitura do painel<br/>(DB_URL · DB_USUARIO · DB_SENHA)"| db
    etl -->|"grava clientes, estatísticas e painel<br/>(DATABASE_URL)"| db

    classDef servico fill:#eef4fb,stroke:#0070c0,color:#1a1a1a
    classDef pessoa fill:#fff7e6,stroke:#c07000,color:#1a1a1a
    class front,api,etl,db servico
    class user pessoa
```

**Como ler:**
- A Vercel só entrega os arquivos do site (seta 1). Depois, quem chama o Java é o **navegador** (seta 2), não a Vercel.
  Por isso o Java precisa autorizar o endereço da Vercel no **CORS**: o pedido vem de uma página de outro endereço.
- **O banco só é acessado pelos servidores** (Java e Python). O navegador nunca fala com o Neon: a senha do banco não sai do Render.
- Entre parênteses estão as **variáveis de ambiente** que ligam uma peça à outra.

### 1.2 Entrega contínua (como o código chega na nuvem)

```mermaid
flowchart LR
    dev["PC da Simone<br/>commit + push"] --> gh["GitHub<br/>branch main"]
    gh -->|"npm run build → pasta dist"| front["Vercel<br/>front"]
    gh -->|"monta o Dockerfile → .jar"| api["Render<br/>back-end Java"]
    gh -->|"pip install -r requirements.txt"| etl["Render<br/>Python"]

    classDef servico fill:#eef4fb,stroke:#0070c0,color:#1a1a1a
    classDef pessoa fill:#fff7e6,stroke:#c07000,color:#1a1a1a
    class front,api,etl servico
    class dev pessoa
```

Cada `git push` na `main` faz a Vercel e o Render baixarem o código, montarem (build) e publicarem a versão nova sozinhos.
Nos textos das setas está o que cada plataforma faz no build.

Os endereços dos serviços (ex.: `cti-nexus-api.onrender.com`) são escolhidos na hora de criar: cada plataforma dá o seu.

**Por que essa ordem de deploy?** Cada peça precisa do endereço da seguinte:
1. **Python** primeiro → ganha um endereço.
2. **Java** depois → precisa do endereço do Python (`ETL_URL`).
3. **Front** depois → precisa do endereço do Java (`VITE_API_URL`).
4. **Volta no Java** → ele precisa do endereço do front (`CORS_ORIGENS`), que só existe no passo 3.

---

## 2. O que já foi preparado no código

| Arquivo | O que faz | Por quê |
|---|---|---|
| `backend-java/Dockerfile` | Receita da "caixa" (contêiner) com Java 21 + o sistema | O Render não tem Java pronto; ele monta a caixa seguindo a receita |
| `backend-java/.dockerignore` | Deixa o `.env` e o `target/` fora da caixa | Senha nunca vai dentro da imagem |
| `application.properties` | `server.port=${PORT:8080}` | No Render a porta é escolhida pela plataforma (variável `PORT`) |

O Python e o front não precisaram de mudança: o Render tem Python pronto e a Vercel tem Node pronto.

**Antes de começar:** essas mudanças precisam estar no GitHub (commit + Sincronizar Alterações),
porque o Render e a Vercel baixam o código de lá.

---

## 3. Preparar os segredos (no PowerShell do seu PC)

Em produção, use chaves **novas** (não as do `.env` do PC). Rode cada comando e guarde o resultado num bloco de notas
que **não** vai para o GitHub.

**Chave do JWT** (assina os tokens de login, 32 bytes em Base64):
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

**Chave do ETL** (senha combinada entre o Java e o Python; a mesma nos dois):
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) -replace '[+/=]', ''
```

**Senha do Neon:** a mesma do `.env` (site do Neon → **Connect** → **Show password**, começa com `npg_`).

---

## 4. Passo A — Python no Render

1. Entre em **render.com** → **Get Started** → entre com a conta do **GitHub** e autorize o acesso ao repositório `cti_nexus`.
2. **New +** → **Web Service** → escolha o repositório `cti_nexus`.
3. Preencha:

| Campo | Valor | O que significa |
|---|---|---|
| Name | `cti-nexus-etl` | Vira parte do endereço |
| Region | **Oregon** ou a mais próxima disponível | Onde o servidor fica |
| Branch | `main` | Branch que o Render acompanha |
| Root Directory | `analytics-python` | A pasta do serviço dentro do repositório |
| Runtime / Language | **Python 3** | Ambiente pronto do Render |
| Build Command | `pip install -r requirements.txt` | Instala as bibliotecas (roda a cada deploy) |
| Start Command | `uvicorn api:app --host 0.0.0.0 --port $PORT` | Liga a API. `0.0.0.0` = aceitar conexões de fora; `$PORT` = porta do Render |
| Instance Type | **Free** | Plano grátis |

4. **Environment Variables** (Add Environment Variable):

| Nome | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:SENHA_DO_NEON@ep-late-block-b64cp83y.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require` |
| `ETL_CHAVE` | a chave do ETL do passo 3 |
| `PYTHON_VERSION` | `3.13.1` (a mesma do seu PC) |

5. **Create Web Service**. Acompanhe a aba **Logs**: instala as bibliotecas e mostra `Uvicorn running`.
6. **Teste:** abra `https://cti-nexus-etl.onrender.com/health` (com o seu endereço). Deve aparecer `{"status":"ok"}`.
7. **Anote o endereço** do Python.

---

## 5. Passo B — Back-end Java no Render (Docker)

1. **New +** → **Web Service** → mesmo repositório.
2. Preencha:

| Campo | Valor | O que significa |
|---|---|---|
| Name | `cti-nexus-api` | |
| Branch | `main` | |
| Root Directory | `backend-java` | |
| Runtime / Language | **Docker** | O Render monta a caixa pelo `Dockerfile` |
| Dockerfile Path | `./Dockerfile` | Relativo à Root Directory |
| Instance Type | **Free** | |

3. **Environment Variables:**

| Nome | Valor | Para quê |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://ep-late-block-b64cp83y.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require` | Endereço do banco (formato JDBC) |
| `DB_USUARIO` | `neondb_owner` | |
| `DB_SENHA` | senha do Neon | |
| `JWT_SECRET_BASE64` | chave do JWT do passo 3 | Assinar os tokens |
| `ETL_URL` | `https://cti-nexus-etl.onrender.com/etl` (endereço do passo A + `/etl`) | Onde o Java entrega a planilha |
| `ETL_CHAVE` | **a mesma** chave do Python | Só o nosso Java consegue gravar |
| `CORS_ORIGENS` | `http://localhost:5173` por enquanto (troca no passo D) | Quais sites podem chamar a API |
| `ADMIN_SENHA` | uma senha forte | Só é usada se o banco não tiver administrador (o Neon já tem) |
| `DEMO_USUARIOS` | `true` | Mantém os botões de demonstração para a apresentação |

4. Em **Advanced** → **Health Check Path**: `/api/health`.
   O Render só considera o deploy pronto quando essa rota responde 200.
5. **Create Web Service**. Nos **Logs** você vê as duas etapas do Dockerfile (compilar e rodar) e, no fim, `Started CtiNexusApplication`.
   O primeiro deploy demora (baixa o Maven e as bibliotecas): 5 a 10 minutos.
6. **Teste:** `https://cti-nexus-api.onrender.com/api/health` → `{"status":"ok"}`.
7. **Anote o endereço** do Java.

---

## 6. Passo C — Front na Vercel

1. Entre em **vercel.com** com a conta do **GitHub** → **Add New…** → **Project** → importe `cti_nexus`.
2. Preencha:

| Campo | Valor | O que significa |
|---|---|---|
| Framework Preset | **Vite** | A Vercel já sabe como montar um projeto Vite |
| Root Directory | `frontend-vue` | |
| Build Command | `npm run build` (padrão) | Gera a pasta `dist` com o site pronto |
| Output Directory | `dist` (padrão) | O que a Vercel publica |

3. **Environment Variables:**

| Nome | Valor |
|---|---|
| `VITE_API_URL` | `https://cti-nexus-api.onrender.com/api` (endereço do passo B + `/api`) |

   Atenção: variáveis `VITE_` entram **dentro** do site na hora do build. Mudou o valor? Precisa fazer **Redeploy**.
4. **Deploy**. Em 1 a 2 minutos aparece o endereço, por exemplo `https://cti-nexus.vercel.app`. **Anote.**

As rotas usam `#` (`/#/login`), por isso a Vercel não precisa de nenhuma configuração extra de rotas.

---

## 7. Passo D — Liberar o front no Java (CORS)

O navegador só deixa o site da Vercel chamar a API do Render se a API autorizar aquele endereço.

1. Render → `cti-nexus-api` → **Environment** → edite `CORS_ORIGENS`:
   `https://cti-nexus.vercel.app,http://localhost:5173` (o endereço da Vercel, **sem barra no fim**; o localhost continua para testar no PC).
2. **Save Changes** → o Render refaz o deploy sozinho.

---

## 8. Teste final (o mesmo roteiro da apresentação)

1. Abra o endereço da Vercel → **Usar acesso de demonstração** → **Analista de Operações**.
2. Envie a planilha de teste → corrija → **Liberar para o painel**.
3. Abra o **Dashboard**: os gráficos e os três testes estatísticos aparecem.
4. Saia e entre como **Gestor**: o painel vem do banco.

---

## 9. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Primeiro acesso demora ~1 minuto | Plano grátis do Render "dorme" após 15 min sem uso | Normal. Antes de apresentar, abra `/api/health` do Java e `/health` do Python uns minutos antes |
| Login não funciona e o console (F12) fala em **CORS** | `CORS_ORIGENS` sem o endereço exato da Vercel | Passo D (sem barra no fim, com `https://`) |
| Front chama `localhost:8080` | `VITE_API_URL` ausente ou adicionada depois do build | Vercel → Settings → Environment Variables → Redeploy |
| Java não sobe: `password authentication failed` | `DB_SENHA` errada | Corrigir a variável no Render |
| Java não sobe: falta `jwt.segredo` | `JWT_SECRET_BASE64` não definida | Criar a variável |
| Liberar planilha dá erro de "serviço de análise" | `ETL_URL` errada, Python dormindo ou `ETL_CHAVE` diferente | Conferir as duas variáveis e abrir `/health` do Python |
| Java reinicia sozinho (memória) | Plano grátis tem 512 MB | O Dockerfile já limita o Java a 75%; se repetir, ver Logs |

Onde investigar: Render → serviço → **Logs**; Vercel → projeto → **Deployments** → **Build Logs**; navegador → **F12** → Console e Rede.

---

## 10. Conceitos de DevOps para a apresentação

- **Deploy contínuo (CD):** Render e Vercel acompanham a branch `main`. Cada push gera um deploy novo sozinho.
- **Variáveis de ambiente e segredos:** senhas e endereços ficam no painel de cada plataforma, nunca no código
  (o `application.properties` lê `${DB_SENHA}`; o Python lê `os.getenv`). Mesmo código, configuração diferente por ambiente (PC × nuvem).
- **Contêiner (Docker):** o Java vai numa caixa montada por uma receita (`Dockerfile`), igual em qualquer máquina.
  **Multi-stage:** uma caixa grande compila e só o `.jar` vai para a caixa final, menor.
- **Health check:** `/api/health` e `/health` dizem à plataforma se o serviço está vivo.
- **Arquitetura em serviços:** front, API e ETL publicados separadamente; cada um escala e cai sozinho.
  O Python só aceita pedidos com a chave `X-ETL-Key`.
- **Cold start:** no plano grátis o serviço dorme sem uso e acorda no primeiro pedido.
- **Build × runtime:** a Vercel gera o site no build (por isso `VITE_API_URL` exige redeploy); o Java lê as variáveis ao ligar.
