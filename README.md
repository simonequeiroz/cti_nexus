# CTI Nexus

> **Do Excel bagunçado à decisão certa.**  
> Plataforma integrada para tratamento, padronização e análise estratégica de dados comerciais.  
> Projeto Integrador — SENAI

---

## 📌 Sobre o Projeto

O **CTI Nexus** foi desenvolvido para solucionar problemas comuns em gestão comercial baseada em planilhas manuais:
- Erros de digitação e duplicidade de dados (ex.: "IND.", "Industria" e "ind" na mesma coluna);
- Falta de padronização na carteira de clientes;
- Dificuldade para extrair KPIs e identificar quais segmentos e clientes trazem mais retorno financeiro.

---

## 📂 Estrutura do Repositório

```text
projeto_cti_nexus/
├── frontend-vue/       # Aplicação Web (Vue 3, Vite, Tailwind CSS v4)
├── backend-java/       # API RESTful (Java / Spring Boot)
├── analytics-python/   # Scripts de limpeza, análise de dados e gráficos (Python)
├── database/           # Modelagem e scripts SQL (schema.sql)
├── landing.html        # Landing page institucional independente
└── package.json        # Gerenciador de scripts unificados
```

---

## 🚀 Como Executar o Frontend

### Pré-requisitos
- Node.js (v18+)
- npm

### Instalação e Execução
Na raiz do projeto:

```bash
# Instalar dependências (caso não tenha instalado)
npm install --prefix frontend-vue

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

Acesse no navegador: `http://localhost:5173`

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Vue.js 3, Vite, Tailwind CSS v4, Google Fonts (*Space Grotesk*, *Inter*, *IBM Plex Mono*)
- **Backend:** Java, Spring Boot, Maven
- **Analytics:** Python, Pandas, Matplotlib
- **Banco de Dados:** SQL / PostgreSQL

---

## 📄 Licença e Créditos

Projeto desenvolvido como parte do **Projeto Integrador — SENAI (2026)**.
