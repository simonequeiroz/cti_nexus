# CTI Nexus

> **Do Excel bagunçado à decisão certa.**
> Plataforma que recebe planilhas comerciais, confere e padroniza os dados e mostra relatório de qualidade, painel e conclusões sobre a carteira de clientes.

Projeto Integrador II — SENAI, 2026 · Trabalho individual de **Simone Queiroz**
Baseado no desafio "Sistema CTI Insights", da empresa Provedor CTI.

---

## 📌 O problema

A carteira de clientes da CTI é controlada em planilhas preenchidas à mão. Isso gera:

- **escrita diferente para a mesma coisa:** "IND.", "Industria" e "indústria" na mesma coluna;
- **erros de digitação e códigos repetidos;**
- **datas e valores em formatos diferentes**, que impedem somar e comparar;
- **dificuldade para responder perguntas simples**, como "qual segmento fatura mais?".

O CTI Nexus segue o caminho de um **ETL**:

| Etapa | O que faz | Situação |
|---|---|---|
| **E — Extrair** | Lê a planilha (.xlsx, .xls ou .csv) | ✅ No navegador (Vue) |
| **T — Transformar** | Padroniza, valida e permite corrigir linha a linha; o Java confere de novo e o Python limpa com Pandas | ✅ Vue + Java + Python |
| **L — Carregar** | Grava os clientes aprovados, as estatísticas e o painel calculado no PostgreSQL (Neon) | ✅ Python |

---

## 📊 Situação do projeto

| Parte | Tecnologia | Situação |
|---|---|---|
| Front-end | Vue 3, Vite, Tailwind CSS v4, Pinia, Chart.js, SheetJS | ✅ Funcional, com 83 testes automatizados |
| Back-end | Java, Spring Boot, Spring Security + JWT | ✅ Funcional (login, usuários, envio da planilha, consultas do painel), com 26 testes |
| Banco de dados | PostgreSQL (Neon) | ✅ Funcional (`backend-java/src/main/resources/schema.sql`) |
| Análise | Python, FastAPI, Pandas | ✅ Pipeline (`main.py`): limpeza, cálculo de todo o painel, insights e gravação, com 10 testes |
| Publicação | Vercel (front) e Render (back) | ⏳ Planejado |

---

## 🏗️ Arquitetura e fluxo dos dados

Usuários (atores): **Administrador** (gerencia usuários), **Analista de Operações** (envia, corrige e libera a planilha) e **Gestor** (só vê relatório e painel).

```
Vue (tela) → store Pinia → service → api.js (axios + JWT) → API Java (Spring Boot) → Python (FastAPI) → PostgreSQL (Neon)
```

**1. Login e usuários**
- `PaginaLogin.vue` → `autenticacaoStore.js` → `autenticacaoService.js` → `api.js` → `AutenticacaoController.java` → `AutenticacaoService.java` → `JwtService.java` (gera o token) e `UsuarioRepository.java` → tabela `usuario` no **Neon**.
- `PaginaUsuarios.vue` → `usuariosStore.js` → `usuariosService.js` → `api.js` → `AdminUsuarioController.java` → `UsuarioService.java` → `UsuarioRepository.java` → **Neon**.
- Toda chamada passa pelo `JwtFiltroAutenticacao.java`, que confere o token e as permissões do papel (`Papel.java`).

**2. Envio da planilha (ETL)**
- `PaginaUpload.vue` → `uploadStore.js` → `leituraPlanilha.js` (lê o Excel) → `validacao.js` (valida e padroniza no navegador).
- `PaginaValidacao.vue` → correção linha a linha → `uploadStore.js` → `uploadService.js` → `api.js` → `POST /api/uploads/validadas`.
- `UploadController.java` → `UploadService.java` → `ClienteValidacaoService.java` (valida de novo no back-end; linhas com erro voltam ao front) → `PythonEtlService.java` → `POST /etl` no Python.
- `analytics-python/api.py` (recebe o pedido e confere a chave) → `main.py` (pipeline) → `limpeza.py` (limpa com Pandas) → `analise.py` (estatísticas por segmento e **todos os números do painel**, para cada filtro) + `insights.py` (conclusões em texto) → `banco.py` → grava lote, clientes, contratos, estatísticas, painel (`painel_lote`) e alterações no **Neon**.
- O Java grava só a tabela `usuario`; as tabelas da planilha quem grava é o Python.

**3. Relatório e painel**
- `PaginaRelatorio.vue` → `uploadStore.js` (relatório de qualidade da planilha conferida).
- `PaginaDashboard.vue` → `uploadStore.js` → `dashboardService.js` → `api.js` → `GET /api/dashboard?segmento=&nivel=` e `GET /api/uploads` → `DashboardController.java` / `UploadController.java` → `ConsultaCargaService.java` → lê do **Neon** o painel que o Python calculou (`painel_lote`).
- **O navegador não calcula nada do painel:** indicadores, gráficos, tabela de estatísticas e insights chegam prontos do Python; o Vue só desenha (Chart.js). Trocar o filtro só busca outro resultado já calculado.

---

## 🚀 Como executar

**Pré-requisitos:** Node.js 18+, Java 21 (JDK) + Maven, Python 3.11+ e um banco PostgreSQL no [Neon](https://neon.tech).

**1. Configuração (só na primeira vez)**

```bash
cd frontend-vue && npm install                                # front
cd ../analytics-python && python -m pip install -r requirements.txt   # Python
```

- Copie `backend-java/.env.example` para `backend-java/.env` e preencha o banco (`DB_URL` no formato `jdbc:postgresql://HOST/neondb?sslmode=require`, `DB_USUARIO`, `DB_SENHA`), a chave do JWT (`JWT_SECRET_BASE64`, 32 bytes em Base64) e a `ETL_CHAVE` (um texto longo qualquer).
- Copie `analytics-python/.env.example` para `analytics-python/.env`: `DATABASE_URL` (a connection string do Neon) e a **mesma** `ETL_CHAVE`.
- Os arquivos `.env` têm senha: ficam só no seu computador (o Git ignora).

**2. Ligar o sistema** (três terminais, nesta ordem)

```bash
cd analytics-python && python -m uvicorn api:app --port 8000   # 1) Python  → http://localhost:8000/health
cd backend-java && mvn spring-boot:run                         # 2) Java    → http://localhost:8080/api/health
cd frontend-vue && npm run dev                                 # 3) Front   → http://localhost:5173
```

Na primeira vez, o Java cria as tabelas no banco e os usuários de demonstração (abaixo). Abra **http://localhost:5173** no navegador.

**Outros comandos**

| Onde | Comando | Para quê |
|---|---|---|
| `frontend-vue` | `npm test` | Testes do front (Vitest) |
| `frontend-vue` | `npm run planilhas` | Gera de novo as planilhas de modelo e de teste em `public/` |
| `backend-java` | `mvn test` | Testes do back-end (banco H2 temporário, sem Neon nem Python) |
| `analytics-python` | `python -m unittest -v` | Testes dos cálculos do painel |

### Usuários de demonstração

A senha de todos é `123456`. Na tela de login, o link **Usar acesso de demonstração** entra com cada um em um clique. Os usuários são criados pelo back-end na primeira vez que ele liga. Para esconder esse link, configure `VITE_MOSTRAR_DEMO=false` no `frontend-vue/.env`.

| E-mail | Nome | Papel |
|---|---|---|
| `admin@ctinexus.com` | Rita Andrade | Administrador |
| `analista@ctinexus.com` | Ana Lima | Analista de Operações |
| `gestor@ctinexus.com` | Gustavo Reis | Gestor |

### Roteiro rápido para testar

1. Entre como **analista**.
2. Na tela de envio, baixe a **Planilha de teste**. Ela tem 15 linhas com erros de propósito: 5 corretas e 10 com problema.
3. Envie a planilha e clique em **Conferir planilha**.
4. Clique em **Corrigir linhas**, ajuste os campos destacados e clique em **Conferir de novo**. Cada alteração fica registrada (quem, quando, antes e depois).
5. Clique em **Liberar para o painel**. Antes disso, o Dashboard fica esperando a liberação.
6. Abra o **Relatório** e o **Dashboard**.
7. Saia e entre como **gestor**: ele só vê o Relatório e o Dashboard, sem botões de alteração.
8. Saia e entre como **administrador**: só ele vê a tela **Usuários**.

---

## 🖥️ Telas

Cada tela tem uma função, para não repetir informação.

| Tela | Endereço | Para que serve |
|---|---|---|
| Página inicial | `/` | Apresentação do sistema |
| Login | `#/login` | Entrada com e-mail e senha. "Esqueci minha senha" avisa o administrador, que define uma senha temporária (trocada no próximo login); "Não tem acesso? Pedir acesso" leva ao pedido de acesso |
| Pedir acesso | `#/cadastro` | Formulário aberto (nome, e-mail, cargo, senha) que vira um pedido; só entra depois que o administrador aprovar |
| **Upload** (Passo 1) | `#/upload` | Enviar a planilha, ver o resultado rápido, os clientes aprovados e o histórico de envios (quem enviou, quando e a situação) |
| **Validação** (Passo 2) | `#/validacao` | Único lugar para ver e corrigir os erros linha a linha, com registro de quem alterou o quê. Também mostra os ajustes automáticos, baixa a planilha corrigida e **libera os clientes aprovados para o painel** |
| **Relatório** (Passo 3) | `#/relatorio` | Documento de qualidade da planilha, para ler, imprimir ou exportar a lista de erros |
| **Dashboard** (Passo 4) | `#/dashboard` | Análise dos clientes **liberados**, com os 3 principais destaques no topo e filtros por segmento e nível |
| Usuários | `#/usuarios` | Pedidos de acesso e cadastro de usuários (só administrador) |

### Gráficos do Dashboard

Os números de todos os gráficos são **calculados no Python** (`analise.py` e `insights.py`) e chegam prontos pela API; o navegador só desenha, com Chart.js. Todos acompanham os filtros de segmento e nível:

- **Clientes por segmento** (barras);
- **Clientes por nível A/B/C** (rosca, com o total no centro);
- **Evolução das contratações** (linha, por mês);
- **Serviços mais contratados** (barras);
- **Faturamento × nº de serviços** (dispersão);
- **Distribuição do faturamento** (histograma);
- **Estatísticas do faturamento**: média por segmento ou nível (barras) e tabela com média, mediana e desvio padrão;
- **O que os dados mostram**: conclusões geradas automaticamente, com prioridade.

Cada segmento tem a mesma cor em todos os gráficos. A paleta foi conferida para daltonismo, e a cor nunca aparece sozinha: sempre vem com o nome no eixo, na legenda ou numa tabela.

---

## ✅ Regras de validação

As regras seguem o dicionário de dados da aba `upload_clientes`.

**Limites do arquivo:**
- formatos .xlsx, .xls ou .csv;
- até **5 MB** e até **20.000 linhas**;
- todas as colunas obrigatórias presentes.

**Colunas obrigatórias:** `codigo_cliente`, `nome_cliente`, `consultor`, `segmento`, `nivel_cliente`, `faturamento_anual`, `servicos_contratados`, `data_contratacao`.
**Colunas opcionais:** `cidade` e `uf`.

**O que o sistema corrige sozinho** (ajustes automáticos):
- espaços sobrando;
- maiúsculas e minúsculas;
- abreviações e acentos de segmento ("IND." e "industria" viram "Indústria");
- código do cliente ("cti004" vira "CTI004") e nível ("a" vira "A");
- nomes de pessoa ("ANA SOUZA" vira "Ana Souza");
- faturamento escrito como moeda ("R$ 1.850.000,00" vira 1850000);
- UF em minúsculas;
- datas digitadas sem zero à esquerda ou guardadas no formato numérico do Excel.

**O que vira erro para corrigir:**

| Tipo | Exemplo |
|---|---|
| Campo vazio | Nome do cliente em branco |
| Código repetido | Dois clientes com o mesmo `codigo_cliente` |
| Fora do padrão | Segmento fora da lista, nível diferente de A/B/C, UF sem 2 letras |
| Valor inválido | Faturamento negativo ou não numérico, data inexistente (31/02) |

As regras ficam em funções puras (`utils/validacao.js` e `utils/normalizacao.js`), separadas da tela. Assim elas podem ser testadas e, depois, reproduzidas no back-end.

---

## 🔐 Níveis de acesso (RBAC)

O sistema lida com dados sensíveis de clientes e faturamento, então o acesso é separado por papel:

| Permissão | Administrador | Analista de Operações | Gestor |
|---|:-:|:-:|:-:|
| Enviar planilhas | ✅ | ✅ | — |
| Ver erros e corrigir linhas | ✅ | ✅ | — |
| Liberar os clientes para o painel | ✅ | ✅ | — |
| Ver relatório e dashboard | ✅ | ✅ | ✅ |
| Limpar o histórico | ✅ | — | — |
| Cadastrar usuários | ✅ | — | — |
| Configurar conexões e regras ¹ | ✅ | — | — |

¹ A permissão já existe, mas a tela depende do back-end.

**Como funciona no front:**
- As telas conferem a **permissão** (ex.: "pode corrigir dados?"), nunca o nome do papel. Por isso, mudar o que um papel pode fazer é mexer numa lista só (`constants/permissoes.js`).
- Se alguém digitar o endereço de uma tela sem permissão, volta para a sua tela inicial.

**Cadastro de usuários:**
- Quem define o papel é sempre o **administrador**: ninguém escolhe o próprio papel.
- Dois caminhos: o administrador cadastra direto na tela Usuários, **ou** a pessoa clica em "Pedir acesso" no login e preenche nome, e-mail e senha. O pedido fica pendente (sem papel e sem entrar) até o administrador escolher o papel e aprovar; se recusar, o pedido é removido.
- Usuários são **desativados, nunca apagados**: o histórico precisa continuar apontando para quem enviou cada planilha.
- O sistema nunca fica sem um administrador ativo, e ninguém desativa a si mesmo.

> Esconder botões no front é só conforto para o usuário. A proteção de verdade é o Spring Boot, que confere a permissão em cada rota da API (`ConfiguracaoSeguranca.java`).

---

## 🗄️ Banco de dados (PostgreSQL no Neon)

Tabelas criadas pelo `backend-java/src/main/resources/schema.sql`:

| Tabela | Quem grava | Para que serve |
|---|---|---|
| `usuario` | Java (`UsuarioRepository`) | Login, papel (administrador, analista, gestor) e situação (pendente, ativo, desativado) |
| `upload_lote` | Python (`banco.py`) | Cada carga liberada: arquivo, contagens, quem enviou e quem aprovou |
| `consultor`, `segmento`, `servico` | Python | Listas usadas pelos clientes |
| `cliente` | Python | Clientes da planilha (código único; carga nova atualiza) |
| `contrato` | Python | Serviços contratados por cliente |
| `estatistica_lote` | Python (`analise.py`) | Quantidade, total, média, mediana e desvio padrão por segmento |
| `painel_lote` | Python (`analise.py` + `insights.py`) | Painel do Dashboard já calculado, um JSON por filtro (segmento × nível) |
| `alteracao` | Python | Correções feitas à mão na tela Validação (quem alterou o quê) |

O Java só **lê** as tabelas da planilha (`ConsultaCargaService`) para o painel.

---

## 🔌 Rotas da API (back-end Java)

Todas começam com `http://localhost:8080`. Com login, o front manda o token no cabeçalho `Authorization: Bearer <token>`. O arquivo `backend-java/testes-api.http` tem um roteiro pronto (extensão REST Client do VS Code).

| Método | Endereço | Quem pode | O que faz |
|---|---|---|---|
| POST | `/api/auth/login` | todos | `{email, senha}` → `{token, tipo: "Bearer", usuario}` |
| POST | `/api/auth/cadastro` | todos | Pedido de acesso `{nome, email, cargo?, senha}` → fica PENDENTE |
| POST | `/api/auth/esqueci-senha` | todos | Avisa o administrador (resposta sempre igual) |
| POST | `/api/auth/trocar-senha` | logado | Troca a própria senha (obrigatório depois de senha temporária) |
| GET | `/api/auth/me` | logado | Dados de quem está logado |
| GET | `/api/health` | todos | `{"status":"ok"}`: o back-end está ligado |
| GET | `/api/privado` | logado | Rota de teste da aula de JWT |
| POST | `/api/uploads/validadas` | analista e administrador | Clientes aprovados → o Java valida de novo → o Python calcula e grava |
| GET | `/api/uploads` | todos os papéis | Cargas gravadas (quem enviou, quem liberou, quantas linhas) |
| GET | `/api/dashboard?segmento=&nivel=` | todos os papéis | Painel já calculado pelo Python para o filtro |
| GET | `/api/clientes` | todos os papéis | Clientes da última carga (aula "Telas do Backend") |
| GET | `/api/clientes/codigos` | analista e administrador | Códigos já cadastrados (para a correção não repetir código) |
| POST | `/api/clientes/validar` | analista e administrador | Aula "Validação de dados no Backend": DTO + `@Valid`, sem gravar |
| GET / POST | `/api/admin/usuarios` | administrador | Lista ou cadastra usuários |
| PUT | `/api/admin/usuarios/{id}` | administrador | Edita nome, e-mail, papel e senha |
| PATCH | `/api/admin/usuarios/{id}/status` | administrador | Aprova pedido, desativa ou reativa |
| PATCH | `/api/admin/usuarios/{id}/senha` | administrador | Define senha temporária |
| DELETE | `/api/admin/usuarios/{id}` | administrador | Recusa um pedido de acesso |

Erros vêm como `{status, mensagem, campos}`: 400 campo inválido, 401 sem login, 403 sem permissão, 409 regra de proteção, 422 planilha sem linha válida ou acima do limite, 502 o Python respondeu com erro, 503 o Python está desligado.

---

## 📂 Estrutura do repositório

```text
cti_nexus/
├── frontend-vue/          # Aplicação web Vue 3 (telas, Pinia, axios)
│   ├── public/            # Planilha modelo e planilha de teste
│   ├── scripts/           # Gerador das planilhas (npm run planilhas)
│   └── src/
│       ├── views/         # Uma página por tela (PaginaUpload, PaginaDashboard...)
│       ├── router/        # Vue Router: endereços das telas e proteção por login e permissão
│       ├── services/      # api.js: comunicação com o back-end (axios)
│       ├── components/    # Peças de cada tela + ui/ (peças reutilizáveis)
│       ├── stores/        # Estado com Pinia: autenticação, upload e usuários
│       ├── utils/         # Regras em funções puras: leitura, validação, estatística
│       ├── constants/     # Listas fixas: regras, permissões, cores
│       └── composables/   # Menu lateral recolhível
├── backend-java/          # API Spring Boot (schema.sql do banco em src/main/resources): JWT, usuários, envio da planilha, consultas (chama o Python)
├── analytics-python/      # FastAPI: pipeline (main.py), limpeza, painel calculado, insights e gravação no Neon
└── docs/                  # Como continuar em outra máquina e relatórios das atividades
```

**Convenções do código:**
- **Tudo em português:** arquivos, componentes, variáveis e comentários. Ficam em inglês só os nomes padrão do ecossistema (`App.vue`, `main.js`, as pastas `components/`, `stores/`...).
- **Textos da tela na linguagem do consultor comercial**, sem termos técnicos.
- **Acessibilidade:** gráficos com tabela equivalente para leitores de tela, navegação por teclado e cores conferidas para daltonismo.

---

## 🧪 Testes

Três conjuntos de testes:

- **Python** (`python -m unittest -v` dentro de `analytics-python`): cálculos do painel (média, mediana, desvio padrão amostral, histograma, contratações por mês, filtros e insights).
- **Java** (`mvn test` dentro de `backend-java`): login, usuários, envio da planilha, validação e a rota do painel (`GET /api/dashboard`).
- **Front** com Vitest (`npm test` dentro de `frontend-vue`), que cobre:

- leitura da planilha: abas, colunas obrigatórias, CSV com acentos e limites;
- regras de validação e padronização;
- as planilhas de modelo e de teste oferecidas na tela;
- permissões de cada papel;
- regras do cadastro de usuário;
- o fluxo completo com a planilha de teste: quem enviou, tempo da conferência, registro de alterações e liberação para o painel (inclusive que o gestor não pode liberar).

---

## 🗺️ Próximos passos

1. **Publicação** na Vercel (front) e na Render (Java e Python).
