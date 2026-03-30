# Janus-Protocol

Janus-Protocol e um serious game 2D (Phaser) para avaliacao comportamental em contexto corporativo simulado.

O projeto coleta sinais de interacao do jogador (escolhas, jornadas e progresso), calcula eixos comportamentais (GPI) e deriva perfis complementares para analise.

## Objetivo Atual do Projeto

- Simular dilemas comportamentais em ambiente de escritorio gamificado.
- Medir os eixos do GPI:
  - execution
  - collaboration
  - resilience
  - innovation
- Derivar indicadores complementares (DISC e Big Five) a partir dos sinais coletados em runtime.
- Gerar relatorios de sessao com consolidacao de perfil e confianca.

## Stack Tecnologica

### Frontend (Jogo)

- Phaser 3
- JavaScript (ES Modules)
- Vite

### Backend (API)

- Node.js
- Express
- Swagger UI (documentacao OpenAPI)

### Persistencia

- MongoDB (quando `MONGODB_URI` estiver configurada)
- Fallback automatico para armazenamento local em arquivo (quando MongoDB nao estiver disponivel)

## Estrutura Principal

```text
.
|- src/                      # Runtime do jogo, cenas, perfil, narrativa e relatorios
|- backend/                  # API, controladores, rotas, persistencia e docs OpenAPI
|- docs/                     # Documentacao tecnica e analises
|- scripts/                  # Scripts utilitarios (assets e suporte)
|- public/                   # Arquivos publicos para o frontend
|- build/                    # Build estatico gerado pelo Vite
|- gdd.md                    # Game Design Document
`- README.md
```

## Pre-requisitos

- Node.js 22.x
- npm 10.x

As versoes esperadas tambem estao declaradas em `package.json` no campo `engines`.

## Instalacao

1. Clone o repositorio.
2. Instale as dependencias na raiz do projeto:

```bash
npm install
```

## Configuracao de Ambiente

Use o arquivo `.env.example` como base e crie `.env` na raiz do projeto.

Variaveis principais:

- `PORT`: porta do backend (padrao: `3000`)
- `MONGODB_URI`: conexao com MongoDB Atlas
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: OAuth Google (backend)
- `VITE_GOOGLE_CLIENT_ID`: OAuth Google (frontend)
- `VITE_LINKEDIN_CLIENT_ID`: OAuth LinkedIn (frontend)
- `LINKEDIN_CLIENT_SECRET`: OAuth LinkedIn (backend)
- `DEBUG_MANAGER_PASSWORD` (ou aliases aceitos no backend): desbloqueio de debug

## Como Executar em Desenvolvimento

O projeto roda com frontend e backend separados.

1. Inicie o backend:

```bash
npm start
```

2. Em outro terminal, inicie o frontend:

```bash
npm run dev
```

3. Acesse a aplicacao no endereco exibido pelo Vite (normalmente `http://localhost:5173`).

## Scripts Disponiveis

- `npm run dev`: inicia o frontend com Vite
- `npm run build`: gera build de desenvolvimento
- `npm run build:prod`: gera build de producao
- `npm run preview`: pre-visualiza build localmente
- `npm start`: inicia o backend Node/Express
- `npm run optimize:assets`: otimiza JSON e imagens (com escrita)
- `npm run optimize:assets:dry`: simula otimizacao sem escrita
- `npm run optimize:json`: otimiza somente JSON
- `npm run optimize:images`: otimiza somente imagens

## Endpoints Relevantes da API

- `GET /`: status da API
- `GET /api/docs`: documentacao interativa Swagger
- `GET /api/openapi.json`: especificacao OpenAPI
- `GET /api/events` e `POST /api/events`: ingestao/leitura de eventos
- `POST /api/events/batch`: ingestao em lote
- `POST /api/telemetry/minigame`: telemetria de minigames
- `GET /api/minigames/public-averages`: medias publicas de minigames
- `POST /api/auth/token`: troca de token OAuth
- `POST /api/debug/unlock`: desbloqueio de debug

## Dependencias

Principais dependencias de runtime:

- `phaser`
- `express`
- `mongodb`
- `cors`
- `helmet`
- `morgan`
- `swagger-ui-express`

Principais dependencias de desenvolvimento:

- `vite`
- `sharp`

Lista completa: `package.json`.

## Pontos Relevantes

O projeto adota comentarios curtos e objetivos para explicar trechos nao obvios, principalmente em:

- Inicializacao global e fluxo de runtime
- Integracao entre cenas e gerenciadores
- Regras de derivacao de perfil
- Pontos de fallback e tolerancia a falha (ex.: persistencia)

## Deploy

- Build de release: `npm run build`
- Processo web: `npm start`

O `Procfile` atual:

```Procfile
release: npm run build
web: npm start
```

## Documentacao Complementar

- `gdd.md`: visao de design e objetivos do jogo

## Licenca

Este projeto esta licenciado sob os termos definidos no arquivo `LICENSE`.
