# Documentação (docs/)

Este diretório consolida figuras, diagramas e esquemas de dados do projeto.

## Estrutura

- `img/` — exportações das figuras (PNG/SVG) para uso no README, TCC, etc.
- `diagrams/mermaid/` — fontes dos diagramas em Mermaid (`.mmd`).
  - `plataforma-geral.mmd` — visão geral de comunicação entre cliente, backend e persistência.
  - `fluxo-eventos.mmd` — sequência de ingestão de um evento de telemetria.
  - `deploy-context.mmd` — contexto simplificado de implantação.
- `data-schemas/` — esquemas de dados (ex.: `events.schema.json`).
- `infografico-plataforma.md` — versão em Markdown com os diagramas embutidos e instruções de exportação.

## Visualização e exportação

- Visualize os `.mmd` no VS Code com a extensão "Markdown Preview Mermaid Support".
- Para exportar para SVG/PNG via CLI (opcional):
  - Instale `@mermaid-js/mermaid-cli` globalmente ou use `npx`.
  - Exporte cada arquivo `.mmd` para `img/` conforme instruções em `infografico-plataforma.md`.

## Como contribuir

- Ao alterar os diagramas, atualize os arquivos `.mmd` e gere novas versões em `img/`.
- Para novos tipos de evento, atualize `data-schemas/events.schema.json` e a documentação relacionada.
