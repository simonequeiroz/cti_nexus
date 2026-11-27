# Deploy do CTI Nexus — explicado para estudo

Anotações do deploy feito em 26/11/2026, na ordem em que aconteceu, para estudar para a apresentação de 10/12.
(O manual técnico completo está em `docs/DEPLOY.md`.)

---

## 1. A ideia em 3 frases

- O sistema tem 3 partes: **o site** (Vue), **o Java** (back-end) e **o Python** (análise dos dados). O banco **Neon** já estava na internet.
- O Java e o Python foram para o **Render**; o site vai para a **Vercel**. Os dois são gratuitos e pegam o código direto do **GitHub**.
- **Ordem:** Python → Java → site → voltar no Java. Cada parte precisa saber o endereço da seguinte.

---

## 2. Palavras que aparecem no caminho

| Palavra | O que é, em português simples |
|---|---|
| **Deploy** | Colocar o sistema no ar, na internet |
| **Web Service** | Um programa que fica ligado na internet esperando pedidos |
| **Build** | "Montar" o programa: instalar bibliotecas, compilar |
| **Start Command** | O comando que liga o programa depois de montado |
| **Variável de ambiente** | Uma informação (senha, endereço) guardada **fora do código**, no painel da plataforma. O código só diz "leia `DATABASE_URL`" |
| **Health Check** | Um endereço que a plataforma visita de tempos em tempos para saber se o programa está vivo ("medir o pulso") |
| **Logs** | O "diário" do servidor: tudo o que ele está fazendo, linha por linha |
| **Docker / contêiner** | Uma "caixa" com tudo o que o programa precisa dentro (Java, bibliotecas, o sistema). Funciona igual em qualquer máquina |
| **Dockerfile** | A "receita" que diz como montar a caixa |
| **Porta ($PORT)** | O "número da porta" por onde o programa recebe pedidos. No PC usávamos 8000 e 8080; na nuvem, o Render escolhe e avisa pela variável `PORT` |
| **CORS** | Regra do navegador: um site só pode chamar uma API de outro endereço se a API autorizar |
| **Cold start** | No plano grátis, o serviço "dorme" sem uso e demora ~50 s para acordar no primeiro acesso |

---

## 3. Python no Render (feito ✅)

**Endereço:** https://cti-nexus-etl.onrender.com — teste: `/health` responde `{"status":"ok"}`.

### O que foi preenchido e por quê

| Campo | Valor | Por quê |
|---|---|---|
| Name | `cti-nexus-etl` | Vira parte do endereço. "ETL" = extrair, transformar, carregar (o que o Python faz) |
| Language | **Python 3** | O Render tinha sugerido "Node" — errado para esta parte |
| Branch | `main` | A branch do GitHub que o Render acompanha |
| Region | Oregon | O Java fica na mesma região: conversam mais rápido |
| Root Directory | `analytics-python` | A pasta do Python dentro do projeto |
| Build Command | `pip install -r requirements.txt` | Instala as bibliotecas (pandas, scipy, fastapi...) |
| Start Command | `uvicorn api:app --host 0.0.0.0 --port $PORT` | "uvicorn, ligue o `app` do arquivo `api.py`, aceite conexões de fora (`0.0.0.0`), na porta que o Render mandar (`$PORT`)" |
| Compute | **Free ($0)** | O Render tinha marcado sozinho o plano de $7 |
| Health Check Path | `/health` | A rota do Python que responde "estou vivo" |

### Variáveis de ambiente do Python

| Nome | Para que serve |
|---|---|
| `DATABASE_URL` | Endereço completo do banco Neon, com usuário e senha (copiado do botão **Connect** do Neon) |
| `ETL_CHAVE` | Senha combinada entre o Java e o Python. Gerada pelo botão **Generate** do Render |
| `PYTHON_VERSION` | `3.13.1`, a mesma versão do PC, para funcionar igual |

### O que os Logs mostraram

| Linha do Log | O que significa |
|---|---|
| `Running 'uvicorn api:app --host 0.0.0.0 --port $PORT'` | O Render rodou o Start Command |
| `Uvicorn running on http://0.0.0.0:10000` | O Render escolheu a porta **10000** (por isso `$PORT` e não 8000) |
| `GET /health 200 OK` | O health check funcionando: o Render "mediu o pulso" e o Python respondeu |
| `GET / 404 Not Found` | Normal: o Python não tem página inicial, só `/health` e `/etl` |
| `Your service is live 🎉` | No ar |

---

## 4. Java no Render, com Docker (feito ✅)

**Endereço:** https://cti-nexus-api.onrender.com — teste: `/api/health` responde `{"status":"ok"}` e o login de demonstração devolve o token.

### Por que Docker?

O Render tem Python pronto, mas **não tem Java pronto**. Então mandamos uma **receita** (`backend-java/Dockerfile`)
e o Render monta uma caixa com o Java 21 e o sistema dentro. A receita tem **duas etapas** ("multi-stage"):
uma caixa **grande** para compilar e uma caixa **pequena** só para rodar — a caixa final fica mais leve.

### O que foi preenchido e por quê

| Campo | Valor | Por quê |
|---|---|---|
| Name | `cti-nexus-api` | "API" = o back-end que o site chama |
| Language | **Docker** | Monta a caixa pelo Dockerfile |
| Region | Oregon | A mesma do Python |
| Root Directory | `backend-java` | A pasta do Java |
| Compute | **Free ($0)** | De novo o Render tinha marcado $7 |
| Health Check Path | `/api/health` | No Java, todas as rotas começam com `/api` |
| Dockerfile Path | `backend-java/` + `Dockerfile` | O começo (`backend-java/`) o Render já coloca; estava duplicado e foi corrigido |
| Docker Build Context | `backend-java/` + `.` | O ponto = "esta própria pasta" |
| Docker Command | (vazio) | O comando que liga o Java já está no Dockerfile: `java -jar app.jar` |

### Variáveis de ambiente do Java

| Nome | Para que serve |
|---|---|
| `DB_URL` | Endereço do banco no formato do Java (JDBC): `jdbc:postgresql://...neon.tech/neondb?sslmode=require` |
| `DB_USUARIO` | `neondb_owner` |
| `DB_SENHA` | Só a senha do banco (o pedaço `npg_...`) |
| `JWT_SECRET_BASE64` | A "caneta" que assina o crachá (token) de quem faz login. Precisa ter **32 bytes (256 bits)**: gerada no PowerShell (ver tropeços) |
| `ETL_URL` | Onde o Java encontra o Python: endereço do Python + `/etl` |
| `ETL_CHAVE` | **A mesma** chave do Python — se for diferente, o Python recusa o Java |
| `CORS_ORIGENS` | Quais sites podem chamar o Java. Por enquanto o do PC (`http://localhost:5173`); depois, o da Vercel |

**Por que o Python usa uma variável (`DATABASE_URL`) e o Java três?** São bibliotecas diferentes: o Python (psycopg) aceita
tudo num endereço só; o Java (JDBC) recebe endereço, usuário e senha separados.

### O que acontece nos Logs do Java (etapa por etapa)

| Linha do Log | O que significa |
|---|---|
| `FROM maven:3.9-eclipse-temurin-21 AS compilacao` | Começa a **etapa 1**: baixa a caixa grande, com Maven e Java 21 |
| `RUN mvn -q dependency:go-offline` | Baixa as bibliotecas do Spring (a parte mais demorada) |
| `RUN mvn -q package -DskipTests` | Compila o código e gera o `.jar` (o sistema inteiro num arquivo). Os testes rodam no PC antes do push, por isso aqui são pulados |
| `FROM eclipse-temurin:21-jre` | Começa a **etapa 2**: a caixa pequena, só com o Java para rodar |
| `COPY --from=compilacao ... app.jar` | Leva **só o `.jar`** da caixa grande para a pequena |
| `Started CtiNexusApplication` | O Java ligou e conectou no banco Neon |
| `Your service is live 🎉` | No ar |

---

## 5. Site na Vercel (feito ✅)

**Endereço:** https://cti-nexus.vercel.app

| Campo | Valor | Por quê |
|---|---|---|
| Repositório | `cti_nexus` (não o antigo `projeto-cti_nexus`) | |
| Tipo de importação | **Import single project** na linha `frontend-vue` | A Vercel viu várias partes (Python e site); aqui vai **só o site** |
| Project Name | `cti-nexus` | Vira o endereço `cti-nexus.vercel.app` (endereço usa traço) |
| Root Directory | `frontend-vue` | A pasta do site |
| Preset | Vite | A Vercel já sabe: roda `npm run build` e publica a pasta `dist` |
| `VITE_API_URL` | `https://cti-nexus-api.onrender.com/api` | Onde o site encontra o Java |

**Diferença importante:** no Render, o Java lê as variáveis quando **liga**. Na Vercel, o `VITE_API_URL` é "carimbado"
**dentro** do site na hora do build. Mudou o valor? Precisa fazer o deploy de novo.

## 6. Último passo: CORS (feito ✅)

Render → `cti-nexus-api` → **Environment** → **Edit** → `CORS_ORIGENS` =
`https://cti-nexus.vercel.app,http://localhost:5173` (dois endereços, vírgula sem espaço, sem barra no fim) → **Save, rebuild, and deploy**.

**Por quê:** quem chama o Java é o **navegador** do usuário, não a Vercel. O site vem de `vercel.app` e o Java está em
`onrender.com` — endereços diferentes. Antes de chamar, o navegador pergunta ao Java "este site pode te chamar?".
Sem o endereço no `CORS_ORIGENS`, a resposta é não e o navegador bloqueia o login.

### Logs do Java no ar

| Linha | O que significa |
|---|---|
| `Tomcat started on port 10000` | O Java usou a porta do Render (`server.port=${PORT:8080}`) |
| `Started CtiNexusApplication in 99 seconds` | No PC liga em ~10 s; aqui o plano grátis tem só **0,1 CPU** — por isso o primeiro acesso é lento |
| `Trigger: Environment updated by you` | Mudar uma variável faz o Render ligar o Java de novo sozinho |

## 7. Antes da apresentação

- Uns **5 minutos antes**, abra `https://cti-nexus-api.onrender.com/api/health` e `https://cti-nexus-etl.onrender.com/health`
  para "acordar" os dois serviços (plano grátis dorme depois de 15 min sem uso).
- Depois abra https://cti-nexus.vercel.app.

## 8. Tropeços do caminho (e o que ensinam)

| O que aconteceu | Causa | Lição |
|---|---|---|
| O Render abriu um projeto antigo ("Upload-Arquivos") | A conta já existia, de 2 anos atrás | Conferir sempre **qual serviço** está aberto |
| O repositório `cti_nexus` não aparecia | O Render só tinha permissão para 1 repositório, e a busca foi com traço (`cti-nexus`) | Permissões do GitHub são por repositório; o nome certo usa sublinhado |
| Language veio como "Node" | O Render chuta a linguagem | Conferir antes de criar |
| Plano veio como $7/mês | É o padrão do Render | Sempre marcar **Free** |
| Dockerfile Path duplicado (`backend-java/backend-java/`) | O Render já prefixa a Root Directory | Ler o pedaço cinza do campo antes de digitar |
| A senha do banco apareceu num print | O Render mostra o valor enquanto se digita | Senha que vazou deve ser **trocada** (rotação de segredo) — fazer no fim |
| 1º deploy do Java falhou: `WeakKeyException ... 192 bits` | A chave do JWT foi criada pelo botão **Generate** do Render, que fez uma chave de 192 bits; a regra do JWT exige **no mínimo 256 bits** | O **build passou** (a receita estava certa), mas o sistema **não ligou**. Quem mostrou o motivo exato foi o **Log**: o nome do erro e o arquivo (`JwtService`). O sistema fez o certo ao recusar uma chave fraca |

### Como foi corrigida a chave do JWT

No terminal do VS Code (PowerShell):
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```
- `byte[] 32` = 32 bytes = **256 bits** (o mínimo do JWT HS256).
- `RandomNumberGenerator` = gerador de números aleatórios **próprio para segurança** (imprevisível).
- `ToBase64String` = transforma os bytes em texto (Base64), que dá para colar numa variável.

Depois: Render → `cti-nexus-api` → **Environment** → editar `JWT_SECRET_BASE64` → **Save, rebuild, and deploy**.
