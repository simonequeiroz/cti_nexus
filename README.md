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
| **E — Extrair** | Lê a planilha (.xlsx, .xls ou .csv) | ✅ Pronto (no navegador) |
| **T — Transformar** | Padroniza, valida e permite corrigir linha a linha | ✅ Pronto (no navegador) |
| **L — Carregar** | Libera os dados aprovados para o painel e grava no banco | 🟡 A liberação já existe no front; falta gravar no banco |

---

## 📊 Situação do projeto

| Parte | Tecnologia | Situação |
|---|---|---|
| Front-end | Vue 3, Vite, Tailwind CSS v4, Pinia, Chart.js, SheetJS | ✅ Funcional, com 57 testes automatizados |
| Back-end | Java, Spring Boot, Spring Security + JWT | ⏳ Planejado |
| Banco de dados | PostgreSQL (Neon) | ⏳ Planejado (modelo abaixo) |
| Análise | Python, Pandas, Matplotlib | ⏳ Planejado |
| Publicação | Vercel (front) e Render (back) | ⏳ Planejado |

Enquanto o back-end não existe, o front funciona sozinho: lê e valida a planilha no navegador e usa usuários de demonstração. Os dados ficam só enquanto a página está aberta.

---

## 🚀 Como executar

**Pré-requisitos:** Node.js 18 ou mais novo, e npm.

```bash
# 1. Instalar as dependências (dentro da pasta do front)
cd frontend-vue
npm install

# 2. Iniciar o sistema
npm run dev
```

Abra **http://localhost:5173** no navegador.

> ⚠️ Instale sempre de dentro de `frontend-vue`. O comando `npm install --prefix frontend-vue`, rodado na raiz, faz o npm instalar a própria raiz como dependência do front.

**Outros comandos** (dentro de `frontend-vue`):

| Comando | Para quê |
|---|---|
| `npm test` | Roda os testes automatizados (Vitest) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run planilhas` | Gera de novo as planilhas de modelo e de teste em `public/` |

### Usuários de demonstração

A senha de todos é `123456`. Na tela de login, o link **Usar acesso de demonstração** entra com cada um em um clique. Para esconder esse link (quando existir o back-end), configure `VITE_MOSTRAR_DEMO=false`.

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
| Login | `#login` | Entrada com e-mail e senha. "Esqueci minha senha" e "Não tem acesso?" orientam a falar com o administrador |
| **Upload** (Passo 1) | `#upload` | Enviar a planilha, ver o resultado rápido, os clientes aprovados e o histórico de envios (quem enviou, quando e a situação) |
| **Validação** (Passo 2) | `#validacao` | Único lugar para ver e corrigir os erros linha a linha, com registro de quem alterou o quê. Também mostra os ajustes automáticos, baixa a planilha corrigida e **libera os clientes aprovados para o painel** |
| **Relatório** (Passo 3) | `#relatorio` | Documento de qualidade da planilha, para ler, imprimir ou exportar a lista de erros |
| **Dashboard** (Passo 4) | `#dashboard` | Análise dos clientes **liberados**, com os 3 principais destaques no topo e filtros por segmento e nível |
| Usuários | `#usuarios` | Cadastro de usuários (só administrador) |

### Gráficos do Dashboard

Todos são feitos com Chart.js e acompanham os filtros de segmento e nível:

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
- Quem cadastra é o **administrador**, que escolhe o papel. Não existe "criar conta" aberto, porque ninguém pode escolher o próprio papel.
- Usuários são **desativados, nunca apagados**: o histórico precisa continuar apontando para quem enviou cada planilha.
- O sistema nunca fica sem um administrador ativo, e ninguém desativa a si mesmo.

> Esconder botões no front é só conforto para o usuário. A proteção de verdade será o Spring Boot conferir a permissão em cada rota da API.

---

## 🗄️ Modelo de banco de dados (planejado)

```sql
CREATE TABLE papel (
  id     SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,      -- administrador, analista, gestor
  nome   VARCHAR(60) NOT NULL
);

CREATE TABLE permissao (
  id        SERIAL PRIMARY KEY,
  codigo    VARCHAR(40) UNIQUE NOT NULL,   -- enviar_planilha, corrigir_dados...
  descricao VARCHAR(120) NOT NULL
);

CREATE TABLE papel_permissao (
  papel_id     INT REFERENCES papel(id),
  permissao_id INT REFERENCES permissao(id),
  PRIMARY KEY (papel_id, permissao_id)
);

CREATE TABLE usuario (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(120) UNIQUE NOT NULL,
  senha_hash VARCHAR(100) NOT NULL,        -- BCrypt, nunca a senha pura
  papel_id   INT NOT NULL REFERENCES papel(id),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Trilha de auditoria: quem enviou, quando e o resultado de cada planilha.
CREATE TABLE importacao (
  id              SERIAL PRIMARY KEY,
  nome_arquivo    VARCHAR(255) NOT NULL,
  tamanho_bytes   INT NOT NULL,
  enviado_por     INT NOT NULL REFERENCES usuario(id),
  enviado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
  total_linhas    INT NOT NULL,
  linhas_validas  INT NOT NULL,
  linhas_com_erro INT NOT NULL,
  status          VARCHAR(30) NOT NULL,
  aprovado_por    INT REFERENCES usuario(id),
  aprovado_em     TIMESTAMP
);
```

A tabela de clientes segue as colunas do dicionário de dados, ligada à `importacao` de onde veio.

---

## 📂 Estrutura do repositório

```text
cti_nexus/
├── frontend-vue/          # Aplicação web (a parte implementada)
│   ├── public/            # Planilha modelo e planilha de teste
│   ├── scripts/           # Gerador das planilhas (npm run planilhas)
│   └── src/
│       ├── pages/         # Uma página por tela (PaginaUpload, PaginaDashboard...)
│       ├── components/    # Peças de cada tela + ui/ (peças reutilizáveis)
│       ├── stores/        # Estado com Pinia: autenticação, upload e usuários
│       ├── utils/         # Regras em funções puras: leitura, validação, estatística
│       ├── constants/     # Listas fixas: regras, permissões, cores
│       └── composables/   # Rotas e menu lateral
├── backend-java/          # API Spring Boot (planejado)
├── analytics-python/      # Limpeza e análise com Pandas (planejado)
├── database/              # schema.sql (planejado)
└── landing.html           # Página institucional independente
```

**Convenções do código:**
- **Tudo em português:** arquivos, componentes, variáveis e comentários. Ficam em inglês só os nomes padrão do ecossistema (`App.vue`, `main.js`, as pastas `components/`, `stores/`...).
- **Textos da tela na linguagem do consultor comercial**, sem termos técnicos.
- **Acessibilidade:** gráficos com tabela equivalente para leitores de tela, navegação por teclado e cores conferidas para daltonismo.

---

## 🧪 Testes

Os testes são feitos com Vitest (`npm test` dentro de `frontend-vue`) e cobrem:

- leitura da planilha: abas, colunas obrigatórias, CSV com acentos e limites;
- regras de validação e padronização;
- estatística: média, mediana, quartis e desvio padrão (com os mesmos resultados do Pandas);
- as planilhas de modelo e de teste oferecidas na tela;
- permissões de cada papel;
- regras do cadastro de usuário;
- o fluxo completo com a planilha de teste: quem enviou, tempo da conferência, registro de alterações e liberação para o painel (inclusive que o gestor não pode liberar).

---

## 🗺️ Próximos passos

1. **Back-end:**
   - autenticação com Spring Security + JWT e senha com BCrypt;
   - validação no padrão DTO, Service e Controller.
2. **Banco** PostgreSQL no Neon, com o modelo acima. Com ele, o "L" do ETL passa a existir: gravar os dados aprovados e o histórico.
3. **Integração do front com a API** usando axios, e migração da navegação para o Vue Router.
4. **Análise em Python** (Pandas + Matplotlib) a partir dos dados do banco.
5. **Publicação** na Vercel (front) e na Render (back).
