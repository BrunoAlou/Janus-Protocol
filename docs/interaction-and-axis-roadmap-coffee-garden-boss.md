# Roadmap de Interacoes e Definicao de Eixo

Documento de proposta para evoluir interacoes nos ambientes:
- Coffee Room
- Garden
- Boss Room

Objetivo:
- manter consistencia com a arquitetura atual (InteractionManager + ElementManager + DialogScene + flags globais + pontuacao por eixo);
- ampliar cobertura dos 4 eixos (execution, collaboration, resilience, innovation);
- criar pontos de definicao de eixo em contexto narrativo (sem parecer questionario isolado).

## 1. Principios de Design

- Escolha forcada: toda interacao relevante deve exigir trade-off real entre dois valores.
- Contexto primeiro: cada decisao precisa estar ancorada em situacao do ambiente.
- Pressao progressiva: comecar sem tempo (analitico) e depois repetir dilema em versao sob pressao (instintivo).
- Sinal claro de impacto: cada opcao deve mapear para eixo e pontos previsiveis.
- Coerencia com i18n: todo texto visivel deve ficar em src/i18n/**.

## 2. Macro-estrutura recomendada por sala

### Coffee Room (foco: colaboracao x execucao)

Missao da sala:
- captar sinais sociais e ruídos de comunicacao da equipe.

Ponto de definicao de eixo principal:
- "Voce encontra 2 equipes com versoes conflitantes do incidente."
- Escolhas-base:
  - Facilitar alinhamento coletivo antes de agir (collaboration +2).
  - Escolher um responsavel e executar plano minimo (execution +2).
  - Sugerir experimento rapido para validar hipoteses (innovation +2).
  - Reduzir tensao e estabilizar clima antes da decisao (resilience +2).

Interacoes sugeridas:
- NPC Baker (ja existente): dilema de priorizacao operacional vs acolhimento do time.
- Quadro de avisos da copa: pistas contraditorias para validar escuta ativa.
- Maquina de cafe: microescolha com custo de tempo x ganho de informacao.

Cobertura minima sugerida:
- 1 decisao principal (4 opcoes, 4 eixos).
- 2 microdecisoes (2 eixos por decisao).
- Total alvo: 3 decisoes estruturais.

### Garden (foco: resiliencia x inovacao)

Missao da sala:
- observar autocontrole, tolerancia a incerteza e exploracao de alternativas.

Ponto de definicao de eixo principal:
- "Sistema instavel: seguir protocolo de contingencia ou testar abordagem alternativa?"
- Escolhas-base:
  - Protocolo conservador de estabilidade (resilience +2).
  - Teste exploratorio para achar causa raiz (innovation +2).
  - Chamar suporte e distribuir tarefas de suporte (collaboration +2).
  - Isolar variaveis e executar checklist tecnico (execution +2).

Interacoes sugeridas:
- Jardineiro (ja existente): conversa sobre riscos controlados vs improviso.
- Sensor ambiental quebrado: escolha entre reparar paliativamente ou diagnostico profundo.
- Banco/area de pausa: opcao de regular estresse com custo de tempo.

Cobertura minima sugerida:
- 1 decisao principal (4 eixos).
- 2 microdecisoes orientadas a pressao e recuperacao.
- Total alvo: 3 decisoes estruturais.

### Boss Room (foco: execucao x colaboracao com impacto politico)

Missao da sala:
- consolidar prioridade estrategica e responsabilidade sobre consequencias.

Ponto de definicao de eixo principal:
- "Chefe exige resultado imediato, mas dados ainda inconclusivos."
- Escolhas-base:
  - Entregar plano imediato com risco calculado (execution +2).
  - Negociar alinhamento com liderancas antes de executar (collaboration +2).
  - Propor alternativa nao convencional com possivel ganho alto (innovation +2).
  - Sugerir plano faseado para reduzir dano em caso de erro (resilience +2).

Interacoes sugeridas:
- NPC Chefe: dilema de autoridade, prazo e evidencias.
- Painel de metas: escolha entre KPI curto prazo ou estabilidade de medio prazo.
- Terminal executivo: opcao de ocultar/incorporar incerteza no reporte.

Cobertura minima sugerida:
- 1 decisao principal (4 eixos).
- 2 microdecisoes de governanca e accountability.
- Total alvo: 3 decisoes estruturais.

## 3. Modelo de "Ponto de Definicao de Eixo"

Formato recomendado para cada ponto:
- id: chave unica da decisao.
- scene: sala de origem.
- trigger: NPC, objeto interativo ou evento.
- prompt: contexto curto e objetivo.
- options: 4 opcoes (uma por eixo principal).
- impact:
  - axis: execution|collaboration|resilience|innovation
  - points: inteiro positivo/negativo
- pressureMode:
  - analytic (sem timer)
  - instinctive (com timer)
- persistence:
  - answer flag
  - timestamp
  - source

## 4. Sugestao de cadencia de implementacao

Fase 1 (rapida):
- 1 decisao principal por sala (Coffee/Garden/Boss) com 4 opcoes mapeadas aos eixos.
- Sem timer, foco em estabilidade do fluxo.

Fase 2 (comparativa):
- repetir a mesma decisao em versao sob pressao (timer curto) para medir dissonancia.

Fase 3 (enriquecimento):
- adicionar 2 microdecisoes por sala e travas/flags de progressao.

## 5. Estrutura tecnica recomendada (alinhada ao projeto)

Dados:
- src/data/interactions/coffee/**
- src/data/interactions/garden/**
- src/data/interactions/boss/**

Textos:
- src/i18n/** (sem texto hardcoded em scene/service).

Orquestracao:
- scene especifica so orquestra fluxo.
- logica repetida em service reutilizavel (padrao SceneDialogueFlowService).

Estado:
- flags para resposta e progresso por decisao.
- stats para eixo por decisao (axis_points_*).
- timeline de escolhas via appendAxisChoiceEntry.

## 6. Lista de decisoes propostas (versao inicial)

Coffee Room:
- coffee_axis_primary_conflict
- coffee_axis_signal_vs_speed
- coffee_axis_people_vs_deadline

Garden:
- garden_axis_stability_vs_experiment
- garden_axis_risk_window
- garden_axis_reset_under_stress

Boss Room:
- boss_axis_deadline_vs_certainty
- boss_axis_transparency_vs_control
- boss_axis_authority_vs_consensus

## 7. Critérios de qualidade para aprovar cada decisao

- A decisao representa conflito real de prioridade.
- O jogador entende consequencias de curto prazo.
- O mapeamento de eixo e coerente com a narrativa.
- Existe variacao de escolha entre jogadores (nao obvio).
- A decisao pode ser espelhada em modo pressao depois.

## 8. Resultado esperado apos este roadmap

- Cada novo ambiente passa a contribuir com definicao de eixo de forma clara.
- O jogo reduz concentracao de avaliacoes apenas na recepcao/TI/elevador.
- A analise final ganha melhor distribuicao situacional (social, tecnico, estrategico).
- Fica pronta base para medir dissonancia entre modo analitico e instintivo nesses 3 ambientes.
