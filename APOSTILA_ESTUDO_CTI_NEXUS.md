# Apostila de Estudo – CTI Nexus

Este manual foi montado para te ajudar a estudar e praticar sem se perder. Ele reúne o que você aprendeu sobre estrutura do projeto, HTML semântico, Tailwind, Vue, Java/Spring, banco de dados e análise de dados.

## 1. Objetivo da apostila

O objetivo não é decorar tudo de uma vez, e sim:

- entender o que cada parte do projeto faz;
- estudar os assuntos mais importantes para a prova;
- praticar em pequenos exercícios;
- deixar a estrutura do projeto pronta para o desenvolvimento;
- aprender fazendo, e não só lendo.

---

## 2. Estrutura do projeto

A base do projeto está organizada assim:

projeto_cti_nexus/
├── analytics-python/
│   ├── analise.py
│   ├── graficos.py
│   ├── insights.py
│   ├── limpeza.py
│   ├── requirements.txt
│   └── output/
│       └── graficos/
├── backend-java/
│   ├── src/
│   │   └── main/
│   │       └── java/
│   │           └── com/
│   │               └── cti/
│   │                   └── nexus/
│   │                       ├── controllers/
│   │                       ├── services/
│   │                       ├── repositories/
│   │                       ├── dtos/
│   │                       └── NexusApplication.java
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── HELP.md
│   └── .gitignore
├── database/
│   └── schema.sql
├── frontend-vue/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .gitignore
├── README.md
└── APOSTILA_ESTUDO_CTI_NEXUS.md

---

## 3. O que cada área faz

### 3.1 Frontend Vue
Local: frontend-vue/

Esse é o que o usuário vê e interage.

Aqui você estuda:

- HTML semântico
- CSS/Tailwind
- JavaScript/TypeScript
- Vue
- Router
- Pinia
- consumo de API com Axios

O ponto principal é entender que o frontend mostra a interface e envia/recebe dados do backend.

---

### 3.2 Backend Java/Spring
Local: backend-java/

Essa parte é a lógica do sistema.

Você aprende:

- Java
- Spring Boot
- controllers
- services
- repositories
- DTOs
- API REST
- validações
- banco de dados

Fluxo típico:

- rota da API
- controller recebe a requisição
- service executa a regra de negócio
- repository acessa o banco de dados
- resposta volta para o frontend

---

### 3.3 Banco de dados
Local: database/

Aqui ficam os scripts SQL.

Você precisa aprender:

- tabelas
- campos
- relacionamentos
- INSERT, SELECT, UPDATE, DELETE
- estrutura do schema

---

### 3.4 Analytics Python
Local: analytics-python/

Essa parte trabalha com dados.

Você usa:

- limpeza de dados
- análise
- geração de gráficos
- extração de insights

Arquivos mais importantes:

- limpeza.py → limpar dados
- analise.py → processar informações
- insights.py → tirar conclusões
- graficos.py → gerar visualizações
- output/graficos/ → pasta com gráficos salvos

---

## 4. O que a aula 1 da disciplina ensinou

A aula analisada focou em 4 temas principais:

### 4.1 UX e padrão de cores

- UX = experiência do usuário
- as cores guiando a atenção
- regra 60-30-10
- 60% dominante
- 30% secundária
- 10% destaque

Exemplo do projeto:

- fundo: #F8F9FA
- textos e menus: #333333
- destaque: #E3000F

### 4.2 HTML semântico

Semântica significa dar significado ao conteúdo.

Tags principais:

- header → topo da página
- nav → links de navegação
- main → conteúdo principal
- section → bloco temático
- article → conteúdo independente
- footer → rodapé

Importância:

- SEO
- acessibilidade
- manutenção do código
- melhora a organização

### 4.3 Tailwind CSS

Tailwind é um framework de CSS baseado em classes utilitárias.

Em vez de escrever muito CSS manual, você usa classes como:

- bg-white
- text-gray-800
- p-4
- rounded
- flex
- justify-between
- gap-4
- shadow-md
- hover:text-red-600

Isso é muito útil no Vue.

### 4.4 Estrutura da landing page

A aula mostra que uma landing page pode ter:

- header com logo e menu
- main com hero
- section de funcionalidades
- cards
- footer

Estrutura geral:

<header>
  <nav>menu</nav>
</header>

<main>
  <section>hero</section>
  <section>funcionalidades</section>
</main>

<footer>rodapé</footer>

---

## 5. O que cai em prova

Com base no conteúdo da aula, o foco da prova costuma ser:

- HTML semântico e suas tags
- diferença entre HTML semântico e não semântico
- o que é UX e por que cores importam
- regra 60-30-10
- uso de Tailwind
- estrutura de landing page
- uso de Vue e router-link
- organização visual e semântica da página

---

## 6. O que você precisa estudar primeiro

### Ordem ideal:

1. HTML semântico
2. CSS básico
3. Tailwind
4. JavaScript básico
5. Vue
6. Java + Spring
7. SQL
8. Python + análise de dados

Não tente aprender tudo ao mesmo tempo. O melhor é ir em camadas.

---

## 7. Como começar a praticar no Vue

### 7.1 O arquivo principal do projeto

No Vue, o arquivo principal é:

- frontend-vue/src/App.vue

Esse arquivo é a página inicial da aplicação. É ele que você vai modificar para praticar.

Você não precisa criar um arquivo chamado index.html para começar.

### 7.2 O que o App.vue representa

- App.vue = a tela principal
- main.ts = inicia a aplicação
- components = partes reutilizáveis da tela
- views = telas maiores da aplicação
- router = navegação entre telas

---

## 8. Primeiro exercício prático para fixar

Abra o arquivo:

frontend-vue/src/App.vue

E substitute o conteúdo padrão por isso:

```vue
<template>
  <header>
    <nav>
      <a href="#">Início</a>
      <a href="#">Sobre</a>
      <a href="#">Login</a>
    </nav>
  </header>

  <main>
    <section>
      <h1>Transforme Dados em Decisões</h1>
      <p>CTI Insights</p>
    </section>

    <section>
      <article>
        <h2>Upload Simples</h2>
        <p>Envie suas planilhas com um clique.</p>
      </article>
    </section>
  </main>

  <footer>
    <p>© 2026 CTI Insights</p>
  </footer>
</template>
```

Isso já te ajuda a entender:

- header
- nav
- main
- section
- article
- footer

---

## 9. Segundo exercício prático com Tailwind

Depois do exercício anterior, faça a mesma estrutura com Tailwind:

```vue
<template>
  <header class="bg-white shadow-md">
    <nav class="flex items-center justify-between px-6 py-4">
      <div class="text-xl font-bold text-gray-800">CTI Insights</div>

      <div class="flex items-center gap-4">
        <a href="#" class="text-gray-700 hover:text-red-600">Início</a>
        <a href="#" class="text-gray-700 hover:text-red-600">Sobre</a>
        <a href="#" class="rounded bg-red-600 px-4 py-2 text-white">Login</a>
      </div>
    </nav>
  </header>

  <main class="px-6 py-12">
    <section class="mx-auto max-w-6xl">
      <div class="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
            CTI Insights
          </p>
          <h1 class="text-4xl font-bold text-gray-800 md:text-5xl">
            Transforme Dados em Decisões
          </h1>
          <p class="mt-4 text-lg text-gray-600">
            Automatize a análise das suas planilhas e transforme informações em insights claros.
          </p>

          <button class="mt-6 rounded bg-red-600 px-6 py-3 font-medium text-white shadow-md">
            Acessar o Sistema
          </button>
        </div>

        <div class="rounded-xl bg-gray-50 p-6 shadow-sm">
          <div class="rounded-lg bg-white p-6 shadow">
            <h2 class="text-xl font-bold text-gray-800">Dashboard</h2>
            <div class="mt-6 space-y-4">
              <div class="h-3 w-3/4 rounded bg-red-200"></div>
              <div class="h-3 w-2/3 rounded bg-gray-200"></div>
              <div class="h-3 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="bg-gray-900 px-6 py-8 text-center text-white">
    © 2026 CTI Insights. Todos os direitos reservados.
  </footer>
</template>
```

---

## 10. Como testar o app

No terminal, dentro da pasta frontend-vue, execute:

```bash
npm run dev
```

Isso vai subir o ambiente local e você poderá visualizar a página no navegador.

---

## 11. Dicas para memorizar

### HTML semântico

- header = topo
- nav = menu
- main = conteúdo principal
- section = tema/área
- article = conteúdo independente
- footer = rodapé

### Tailwind

- flex → organiza em linha
- grid → organiza em grade
- gap → espaço entre elementos
- text-... → tamanho do texto
- bg-... → cor de fundo
- text-... → cor do texto
- rounded → bordas arredondadas
- shadow → sombra
- p-... / m-... → espaçamento

### Vue

- App.vue = página principal
- components = partes do layout
- views = telas maiores
- router-link = navegação dentro do Vue

---

## 12. Regra principal para não se perder

Você não precisa aprender tudo de uma vez.

Você precisa entender isso:

- o que cada arquivo faz;
- o que cada tag faz;
- o que cada classe faz;
- e praticar com pequenos exercícios.

Isso é muito mais importante do que decorar códigos enormes.

---

## 13. Plano de estudo semanal (prático)

### Semana 1
- HTML semântico
- estrutura da página
- CSS básico
- Tailwind básico

### Semana 2
- Vue
- components
- router
- App.vue
- landing page

### Semana 3
- Java e Spring Boot
- controllers, services e repositories
- API

### Semana 4
- SQL
- banco de dados
- Python para análise e gráficos

---

## 14. Resumo final

Você já tem a base do projeto pronta:

- backend Java configurado;
- frontend Vue configurado;
- Tailwind instalado;
- estrutura de pastas organizada;
- scripts Python prontos;
- banco de dados com schema.

Agora o foco é aprender trabalhando no projeto com pequenas práticas, e não se assustando com a quantidade de arquivos.

O que mais importa agora é:

- usar HTML semântico corretamente;
- aplicar Tailwind de forma prática;
- montar uma landing page em Vue;
- entender o fluxo do projeto.

Se você seguir essa lógica, você vai aprender muito melhor e se preparar melhor para a prova.

---

## 15. Dica final

Não estude olhando só para o código pronto. Estude pensando:

- por que essa tag foi usada?
- por que essa classe está aí?
- o que essa seção representa?
- qual é a função dessa parte da tela?

Esse tipo de pergunta é o que realmente fixa o conteúdo.

---

# Fim da apostila

Essa apostila é seu guia para praticar, estudar e aplicar os conceitos do projeto. Salve em algum lugar do seu computador e revise sempre que precisar.
