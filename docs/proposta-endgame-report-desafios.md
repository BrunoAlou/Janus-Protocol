# Proposta de Produto e Fluxo

## Contexto

Este documento consolida a proposta para:

1. Completar cobertura de interacoes de eixo em NPCs/objetos existentes.
2. Liberar report para usuario final (fora do debug) ao fim dos 4 objetivos.
3. Impedir retorno ao gameplay apos finalizacao da sessao (endgame irreversivel por login/provedor).
4. Garantir desbloqueio de todos os desafios em todas as rotas jogaveis.
5. Renomear "minigames" para "desafios" na experiencia do usuario.

Escopo desta entrega: **proposta para aprovacao**. Nao ha implementacao neste documento.

---

## Diagnostico Atual (As-Is)

## 1) Report ainda acoplado ao debug

- O botao de report no menu de pausa exige debug ativo.
- O fluxo atual abre report em modo debug explicitamente.
- Nao existe gatilho oficial de "report final de sessao" em modo prod para jogador comum.

## 2) Endgame pode encerrar cedo demais

- O hub de objetivos permite "Finalizar Enredo" apos **qualquer** objetivo concluido.
- A conclusao de objetivo esta sendo marcada no hub ao selecionar opcao de cena/minigame, antes da validacao por evidencia narrativa na sala destino.

Impacto: jornada pode ficar curta e nao representar todo o percurso esperado.

## 3) Cobertura de eixos parcial por opcoes mapeadas

Auditoria automatica em docs/_extracted/options-axis-audit.json:

- Total de opcoes com id auditavel: 32
- Mapeadas no runtime de dilemas: 26
- Nao mapeadas: 6
  - reception: opt_bye, opt_close_board, opt_close_terminal
  - archive-room: opt_archive_bye_1, opt_archive_bye_2
  - boss-room: opt_boss_bye

Distribuicao dominante no mapa estatico de dilemas runtime:

- execution: 18
- collaboration: 14
- innovation: 7
- resilience: 6

Impacto: innovation/resilience estao subrepresentados no mapa estatico.

## 4) Inconsistencia de desbloqueio de desafios

- Interacoes de elementos (action type minigame) desbloqueiam via MinigameManager antes de iniciar.
- Hub de objetivos inicia minigame direto via SceneManager, sem unlock explicito.
- Apenas QuizGame aparece hoje em elementos com action type minigame (reception/terminal_info).
- No config, Snake/Tetris/WhackAMole estao desabilitados.

Impacto: possibilidade de iniciar desafio sem trilha consistente de desbloqueio/flag e cobertura incompleta da experiencia.

## 5) Terminologia de produto ainda mista

- UI, textos e secoes de report usam "minigame" em varios pontos.
- Requisito atual pede renomeacao para "desafio".

---

## Proposta To-Be

## A) Novo contrato de progressao: 4 objetivos obrigatorios

### Regra

A sessao so fica apta ao fechamento quando os **2 objetivos principais** estiverem completos:

1. objective_talk_to_boss_completed
2. objective_talk_to_team_completed
3. objective_solve_anomaly_completed
4. objective_stabilize_system_completed

A ordem deve impactar na contagem de pontos, deve ser possível completar os 4, mas a partir do segundo e apresentado ao usuário a opção de ver o report

### Ajuste de design

- A escolha inicial no elevador continua existindo, mas vira **eixo de prioridade narrativa** (nao exclusividade de conteudo).
- Objetivos passam a ser concluídos por **evidencia em mapa/interacao**, nao apenas por clique no hub.

### Criterio anti-atalho (sem alongar demais)

A opcao de fechamento/report final aparece somente quando:

1. 2/4 objetivos concluidos.
2. Minimo de checkpoints de evidencia cumpridos (1 por objetivo).
3. Minimo de engajamento de sessao (exemplo: session_interaction_count >= 20).

Observacao: o limiar de interacoes pode ser calibrado em QA.

---

## B) Report final em modo produto (fora do debug)

### Regra

- O report final deve abrir em modo prod no encerramento da jornada.
- O report debug continua disponivel apenas para dev/analise.

### Pontos de acesso distribuidos (pedido de produto)

Adicionar pontos de "Consolidar Evidencias" em locais distintos, com pre-requisitos:

1. Boss Room: evidencia executiva (objetivo boss).
2. Coffee Room: evidencia de alinhamento de equipe (objetivo team).
3. Archive Room: evidencia de investigacao/diagnostico (objetivo solve).
4. IT Room ou Quantum Hub: evidencia de estabilizacao tecnica (objetivo stabilize).

A acao final "Gerar Report Final" so libera quando os quatro checkpoints estiverem confirmados.

---

## C) Endgame irreversivel por sessao/logado

### UX obrigatoria

Antes de finalizar:

- Modal de irreversibilidade com texto claro:
  - "Ao finalizar, esta sessao sera encerrada e nao podera retornar ao jogo com este login."
- Botoes:
  - Confirmar finalizacao
  - Cancelar

### Regra tecnica

Ao confirmar:

1. Gravar flags de bloqueio de sessao no progresso do usuario:
   - session_report_only = true
   - session_endgame_locked = true
   - session_endgame_at_ms = timestamp
2. Gerar payload final do report e persistir para leitura segura na pagina report.
3. Marcar ending_resolved e metadados associados.

Ao reabrir com mesmo login/provedor:

- LoginScene detecta sessao bloqueada e **nao inicia gameplay**.
- Usuario e direcionado apenas para visualizacao do report final.

---

## D) Expansao de interacoes de eixo (NPCs/objetos existentes)

## Objetivo

Aumentar densidade de sinais por eixo sem criar NPCs novos.

## Proposta de adicoes (primeira leva)

1. Coffee Room
- coffee_oven: opcao de priorizacao de fila (execution vs collaboration).
- coffee_table_1 ou coffee_table_3: opcao de mediacao de conflito (collaboration vs resilience).

2. Garden
- garden_shrub_1: opcao de observacao/hipotese (innovation vs execution).
- garden_vase_1: opcao de cuidado preventivo (resilience vs innovation).

3. Boss Room
- obj_boss_computer_station: opcao de estrategia de entrega (execution vs innovation).
- obj_boss_phone_1: opcao de alinhamento com stakeholders (collaboration vs execution).

4. Archive Room
- terminal_archive_consulta_1: opcao de analise sistematica (execution vs resilience).
- obj_archive_painel_avisos: opcao de conformidade/processo (resilience vs collaboration).

## Tratamento de opcoes hoje nao mapeadas

Normalizar comportamento das opcoes de despedida/fechamento:

- opt_bye
- opt_close_board
- opt_close_terminal
- opt_archive_bye_1
- opt_archive_bye_2
- opt_boss_bye

Elas podem permanecer com impacto 0, mas entram explicitamente no runtime para rastreabilidade e consistencia analitica.

---

## E) Garantia de desbloqueio completo de desafios

## Meta

Todos os desafios ativos devem poder ser desbloqueados e jogados em qualquer rota valida.

## Regras

1. Habilitar no config os desafios atualmente desativados:
- SnakeGame
- TetrisGame
- WhackAMoleGame

2. Padronizar ponto unico de inicio:
- Toda inicializacao de desafio passa por helper que executa unlock + sync + start.
- Evita divergencia entre hub e elementos interativos.

3. Garantir pelo menos 1 origem obrigatoria + 1 origem alternativa por desafio.

Exemplo de distribuicao inicial:

- QuizGame: reception terminal (obrigatorio de onboarding).
- MemoryGame: objective hub e/ou terminal TI.
- PuzzleGame: rota de anomalia + fallback em archive.
- TypingGame: archive terminal (digitalizacao urgente).
- SnakeGame: coffee terminal oculto (diagnostico rapido).
- TetrisGame: organizacao de arquivo (archive).
- WhackAMoleGame: bugs criticos no TI.

---

## F) Renomeacao de "minigames" para "desafios"

## Estrategia recomendada

Fase 1 (baixo risco, imediata):

- Renomear apenas textos de interface e report para "desafio(s)".
- Manter identificadores tecnicos internos (minigame_*) por compatibilidade.

Fase 2 (opcional, risco moderado):

- Refatorar nomes internos e eventos para challenge_* com camada de alias.
- Executar migracao controlada de flags e storage legado.

---

## Plano de Implementacao (apos aprovacao)

## Fase 1 - Regras de fechamento e report final

1. Ajustar gating no hub de objetivos para exigir 4/4 concluidos.
2. Mover conclusao de objetivo para evidencias em cenas/mapas.
3. Criar fluxo de confirmacao de finalizacao irreversivel.
4. Abrir report final em modo prod.

## Fase 2 - Lock de sessao pos-endgame

1. Persistir flags de bloqueio por usuario.
2. Interceptar em LoginScene/startGame para impedir retorno ao gameplay.
3. Redirecionar usuario para report final.

## Fase 3 - Cobertura de eixo e desafios

1. Adicionar nova leva de opcoes com eixo em coffee/garden/boss/archive.
2. Normalizar opcoes nao mapeadas no runtime.
3. Padronizar unlock/start de desafios e ativar os 7 desafios.

## Fase 4 - Terminologia

1. Renomear UI/menus/report para "desafios".
2. Validar consistencia textual e telemetria.

---

## Criterios de Aceite

1. Report final so aparece apos 4 objetivos completos + checkpoints.
2. Usuario nao precisa debug para gerar report final.
3. Apos confirmar finalizacao, mesmo login nao retorna ao gameplay.
4. Hub nao marca objetivo como completo sem evidencia real no mapa.
5. Todos os 7 desafios podem ser desbloqueados e iniciados em uma sessao completa.
6. UI nao exibe "minigame" para jogador final (somente "desafio").
7. Auditoria de opcoes/eixo nao deixa IDs sem tratamento runtime.

---

## Decisoes para aprovacao

1. Confirmar se o fechamento exige 4/4 objetivos obrigatorios (sim/nao).
2. Confirmar limiar de engajamento anti-atalho (proposta inicial: >= 20 interacoes).
3. Confirmar se lock deve ser permanente para aquele usuario ate reset administrativo.
4. Confirmar se Fase 1 de nomenclatura (apenas UI) ja atende o produto.
5. Confirmar distribuicao sugerida dos novos pontos de evidencia/report por mapa.

---

## Notas de rastreabilidade

- Auditoria base utilizada: docs/_extracted/options-axis-audit.json
- Diagnostico de fluxo atual de objetivos/report/endgame feito em:
  - src/scenes/map/ElevatorScene.js
  - src/scenes/map/QuantumObjectivesScene.js
  - src/report/openBaseReport.js
  - src/scenes/PauseMenuScene.js
  - src/narrative/EndingResolver.js
  - src/managers/MinigameManager.js
  - src/elements/interactive/actionUtils.js
  - src/data/config/minigames-config.json
