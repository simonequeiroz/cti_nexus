# CTI Nexus

Trabalho **individual** de Simone Queiroz (SENAI, Projeto Integrador II, 2026), baseado no desafio "Sistema CTI Insights" da empresa Provedor CTI. O CTI Insights é o projeto da equipe (com sprints e divisão back-end/Python/banco/nuvem); o CTI Nexus é a versão individual para avaliação individual. Plataforma que recebe planilhas comerciais bagunçadas (Excel), valida e padroniza os dados e mostra relatório de qualidade, dashboard e insights.

Referências da atividade: plano de ensino 5.01-FR-97 v.4 (PI-2 2026), com stack Vue 3 + Tailwind + Chart.js + Vue Router + axios, Spring Boot, Python/Pandas, Neon PostgreSQL, Vercel/Render; e o dicionário de dados da planilha da aula (aba `upload_clientes`: codigo_cliente, nome_cliente, consultor, segmento, nivel_cliente, faturamento_anual, servicos_contratados, data_contratacao, cidade e uf opcionais).

## Repositório

- GitHub: https://github.com/simonequeiroz/cti_nexus (remote `origin`)
- Trabalhar na branch `main`. A `master` do GitHub é só o setup inicial antigo (ainda está como branch padrão lá).
- O repositório antigo `simonequeiroz/projeto-cti_nexus` não é mais usado.

## Estrutura

- `frontend-vue/`: única parte implementada. Vue 3 + Vite + Tailwind CSS v4 + Pinia + `xlsx` (SheetJS) para ler planilhas.
- `backend-java/`, `analytics-python/`, `database/`: por enquanto só arquivos vazios (Spring Boot, Pandas/Matplotlib e PostgreSQL planejados).
- `landing.html`: landing page institucional independente do app Vue.

## Como rodar

Na raiz: `npm install --prefix frontend-vue` e depois `npm run dev` (http://localhost:5173). Depois de todo `git pull` que alterar `frontend-vue/package.json`, rodar `npm install` de novo (sem isso aparece erro de import, ex.: "failed to resolve import pinia").

## Frontend: convenções

- **Tudo em português**: nomes de arquivos, componentes, variáveis, funções e comentários. Componentes em PascalCase português (`BotaoBase`, `PaginaUpload`, `TabelaDetalhesErros`). Só ficam em inglês os nomes padrão do ecossistema: `App.vue`, `main.js`, `style.css` e as pastas `components/`, `pages/`, `stores/`, `composables/`, `utils/`, `constants/`.
- Pastas de componentes por tela: `components/inicio/`, `login/`, `upload/`, `relatorio/`, `layout/`, e `ui/` para peças reutilizáveis.
- Telas internas usam `LayoutSistema`: no desktop, a sidebar "Trilha do dado" (`TrilhaDados.vue` + `EtapaTrilha.vue`) mostra Upload → Validação → Relatório → Dashboard com o status real da `uploadStore`. Ela é recolhível (240px ↔ 80px); o estado fica em `composables/useMenuLateral.js`, salvo no localStorage. No celular aparece o `CabecalhoSistema`.
- Páginas em `src/pages/` (`PaginaInicial`, `PaginaLogin`, `PaginaUpload`, `PaginaValidacao`, `PaginaRelatorio`, `PaginaDashboard`).
- Rotas por hash, sem vue-router: `src/composables/useRotas.js` (`#login`, `#upload`, `#validacao`, `#relatorio`, `#dashboard`; todas menos login exigem login).
- Validação (`#validacao`): linhas com erro editáveis (`components/validacao/LinhaInvalida.vue`). As ações `corrigirCampo`, `revalidar` e `baixarPlanilhaCorrigida` da `uploadStore` alteram `dadosBrutos` e rodam `validarDados()` de novo; as correções não persistem ao recarregar a página. O plano de ensino pede Vue Router com `/upload` e `/dashboard` e pastas `views/` e `router/` (ainda não migrado).
- Dashboard (`components/dashboard/`): Chart.js via `GraficoBase.vue` (tabela sr-only). Cores em `constants/cores.js`: cada segmento tem uma cor fixa em todos os gráficos (paleta validada para daltonismo em todos os pares; sem laranja/verde-limão, que significam erro/válido), nível A/B/C numa escala de azul (A escuro, C claro) e medidas únicas (contratações, histograma, serviços) no azul da marca. Cor nunca sozinha: sempre com nome no eixo, legenda ou tabela. Tipos de gráfico seguem o plano de ensino (barras, linha, dispersão, histograma, boxplot); o nível A/B/C é uma rosca (cobre o "pizza" do plano), com total no miolo e legenda com %. Gráficos recebem `clientes` (válidos e filtrados) por prop. Estatística em `utils/estatistica.js`; meses, histograma e insights (formato da classe Insight: titulo, descricao, tipo, prioridade) em `utils/dadosDashboard.js`.
- Stores Pinia no estilo setup, com seções `// ===== STATE =====`, `GETTERS`, `ACTIONS`: `autenticacaoStore.js` (`useAutenticacaoStore`, id `'auth'`) e `uploadStore.js` (estado do upload; só orquestra leitura e validação).
- Regras fora da store, em funções puras: `utils/leituraPlanilha.js` (aba `upload_clientes` ou a primeira, CSV UTF-8/ANSI, erros `ExcelInvalidoError` e `ColunaObrigatoriaError`, que imitam as exceções previstas para o Spring Boot), `utils/validacao.js` (`validarLinhas`: padronização + regras do dicionário) e `utils/normalizacao.js`. Listas fixas (segmentos, níveis, colunas obrigatórias) em `constants/validacao.js`.
- Limites do upload (`constants/validacao.js`): .xlsx/.xls/.csv, até 5 MB (`verificarArquivo`, antes de ler) e até 20.000 linhas (conferido pela área da aba, antes de converter). 20 mil linhas levam ~1,6 s para ler e validar. Quando existir o back-end, usar o mesmo limite no Spring: `spring.servlet.multipart.max-file-size=5MB` (o padrão dele é 1 MB).
- Testes com Vitest: `npm test` na pasta `frontend-vue` (arquivos `*.test.js` ao lado do código em `utils/`).
- Login é de demonstração enquanto o backend não existe: `admin@ctinexus.com` / `123456`, sessão guardada em `sessionStorage`.
- Planilhas oferecidas na tela de upload, geradas por `npm run planilhas` (`scripts/gerarPlanilhas.js`, usa `constants/validacao.js`): `public/modelo-clientes.xlsx` (aba `upload_clientes` com 2 linhas corretas + aba `dicionario`) e `public/teste-clientes.xlsx` (15 linhas despadronizadas de propósito: 5 válidas e 10 com erro). Depois de mudar regras em `constants/validacao.js`, rodar `npm run planilhas` de novo; `src/utils/planilhasPublicas.test.js` confere os dois arquivos.
