# Especificacao Tecnica do Relatorio Final Avancado (Janus Protocol)

## 1) Objetivo

Definir uma arquitetura unica para geracao do relatorio final do jogador, dividida em 4 blocos:

1. Perfil comportamental hibrido (GPI + referencia Big Five/DISC derivada)
2. Resultados fixos (tempo, interacoes, desbloqueios)
3. Performance de minigames (tentativas, media, first vs best)
4. Badges diferenciais (assinaturas de comportamento)

Tambem definir estrategia de compartilhamento por LinkedIn e Gmail, com base no backend ja existente.

---

## 2) Estado Atual do Projeto (base real disponivel)

### 2.1 Fontes de dados ja prontas

- Estado persistente de jogo: flags, stats, progresso e metadados por usuario
- Dados de minigame: desbloqueio, tentativas, firstAttempt, bestAttempt, metricas
- Configuracao de metricas: mapeamento GPI, dissonancia calm/crisis, secoes de relatorio
- Telemetria backend: eventos gerais e telemetria de minigame
- OAuth: LinkedIn e Google ja funcionais no backend

### 2.2 Limite atual importante

No momento, o mapa Reception concentra os sinais comportamentais mais maduros (inclusive eixo priorizado na recepcionista). Isso exige que o relatorio declare nivel de cobertura e confianca por secao para evitar superinterpretacao.

---

## 3) Principios de Produto para o Relatorio

1. Transparencia: mostrar o que foi medido e o que ainda nao foi medido.
2. Feedback construtivo: linguagem positiva e orientada a melhoria.
3. Nao diagnostico: evitar claims clinicos ou psicologicos absolutos.
4. Separacao entre potencial e observacao: diferenciar inferencia estatistica de dado observado.
5. Versionamento: relatorio deve carregar versao de schema e versao da logica.

---

## 4) Arquitetura Proposta (pipeline)

## 4.1 Momento de geracao

Gerar ao concluir a jornada principal da fase final (trigger de fim de sessao/escape concluido), com possibilidade de regeracao manual no menu de resultados.

## 4.2 Pipeline em 6 etapas

1. Coleta
   - Ler GameStateManager (flags/stats/progresso)
   - Ler MinigameManager (progress map e stats)
   - Opcional: agregar eventos de backend quando disponivel

2. Normalizacao
   - Converter tudo para escala comum 0-100 quando aplicavel
   - Tratar ausencia de dados com null + reason

3. Calculo por secao
   - Perfil
   - Resultados fixos
   - Minigames
   - Badges

4. Confianca/cobertura
   - Calcular dataCompleteness global e por secao
   - Informar coverageByMap (ex.: reception: alto, outros: baixo)

5. Narrativa
   - Gerar sumario textual curto, sem exagero causal

6. Persistencia e entrega
   - Salvar snapshot local
   - Exibir tela final
   - Preparar payload para compartilhamento

---

## 5) Estrutura do Relatorio (contrato de dados)

```json
{
  "schemaVersion": "1.0.0",
  "engineVersion": "report-engine-1",
  "generatedAt": "ISO-8601",
  "player": {
    "id": "string",
    "name": "string|null",
    "provider": "linkedin|google|guest"
  },
  "coverage": {
    "globalCompleteness": 0,
    "bySection": {
      "profile": 0,
      "fixedResults": 0,
      "minigames": 0,
      "badges": 0
    },
    "byMap": {
      "reception": "high|medium|low"
    },
    "notes": ["string"]
  },
  "sections": {
    "profile": {},
    "fixedResults": {},
    "minigames": {},
    "badges": {}
  },
  "share": {
    "publicSummary": {
      "headline": "string",
      "highlights": ["string"],
      "publicUrl": "string"
    }
  }
}
```

---

## 6) Secao 1 - Perfil Comportamental Hibrido

## 6.1 Objetivo

Apresentar o perfil observado no jogo, centrado em GPI (Execucao, Colaboracao, Resiliencia, Inovacao), com referencias derivadas para Big Five e DISC apenas como camada interpretativa.

## 6.2 Entradas

- Eixo priorizado da recepcionista (primeira escolha)
- Decisoes mapeadas em eventos e impactos de eixo
- Metricas de exploracao, interacoes com NPC e consistencia temporal
- Dissonancia calm vs crisis quando pares analogos existirem

## 6.3 Saida

```json
{
  "gpi": {
    "execution": 0,
    "collaboration": 0,
    "resilience": 0,
    "innovation": 0
  },
  "derived": {
    "disc": { "D": 0, "I": 0, "S": 0, "C": 0 },
    "bigFive": { "O": 0, "C": 0, "E": 0, "A": 0, "N": 0 }
  },
  "dissonance": {
    "score": 0,
    "label": "Predictable|Adaptive|Reactive",
    "axisDelta": {
      "execution": 0,
      "collaboration": 0,
      "resilience": 0,
      "innovation": 0
    }
  },
  "interpretation": {
    "summary": "string",
    "caveats": ["string"]
  }
}
```

## 6.4 Regras

1. Se nao houver dados suficientes em um eixo, marcar eixo como low-confidence.
2. Usar DISC/Big Five como derivacao matematica do GPI (nao como teste psicometrico aplicado).
3. Mostrar faixa de confianca para evitar rotulos definitivos.

---

## 7) Secao 2 - Resultados Fixos

## 7.1 Objetivo

Mostrar indicadores objetivos de percurso e produtividade no jogo.

## 7.2 KPIs obrigatorios

1. Tempo total de conclusao
2. Total de interacoes (NPC + elementos)
3. Total de elementos desbloqueados
4. Missoes/jornadas concluidas
5. Taxa de finalizacao de objetivos

## 7.3 Formato sugerido

```json
{
  "completionTimeSec": 0,
  "interactionsCount": 0,
  "elementsUnlocked": 0,
  "journeysCompleted": 0,
  "objectivesCompletionRate": 0,
  "benchmarks": {
    "completionTimeBand": "fast|balanced|thorough",
    "interactionBand": "low|medium|high"
  }
}
```

## 7.4 Regras

1. Nunca usar benchmark externo sem base; iniciar com faixas internas por percentil local.
2. Se amostra estatistica estiver pequena, sinalizar benchmark provisoriamente.

---

## 8) Secao 3 - Minigame Performance

## 8.1 Objetivo

Apresentar performance em minigames como modulo separado (nao contam no GPI principal).

## 8.2 Entradas

- totalAttempts
- firstAttempt
- bestAttempt
- metricas especificas por minigame
- media publica (quando endpoint backend responder)

## 8.3 Saida

```json
{
  "summary": {
    "totalUnlocked": 0,
    "totalAttempted": 0,
    "totalAttempts": 0,
    "avgScoreFirstAttempt": 0,
    "avgScoreBestAttempt": 0,
    "retryRate": 0,
    "abandonRate": 0
  },
  "minigames": [
    {
      "id": "string",
      "displayName": "string",
      "attempts": 0,
      "firstScore": 0,
      "bestScore": 0,
      "improvementDelta": 0,
      "metrics": [
        { "key": "string", "label": "string", "value": 0, "formatted": "string" }
      ],
      "publicComparison": {
        "available": true,
        "averageScore": 0,
        "percentile": 0,
        "frame": "positive-only"
      }
    }
  ]
}
```

## 8.4 Regras

1. Mostrar sempre first vs best para evidenciar aprendizado.
2. Comparacao publica deve seguir framing positivo (ja previsto no config).
3. Quando nao houver media publica, mostrar somente historico individual.

---

## 9) Secao 4 - Badges Diferenciais

## 9.1 Objetivo

Materializar assinaturas de comportamento de forma compreensivel, sem transformar em diagnostico.

## 9.2 Modelo de badge recomendado (singular e observavel)

Cada badge possui:

- id
- titulo
- descricao curta
- trigger comportamental observavel
- criterios parametricos (operador + threshold + janela)
- metrica fonte (stat/flag/evento agregado)
- nivel de evidencia (alto/medio/baixo)
- explicacao de como foi conquistada
- repetibilidade (unico na sessao ou acumulavel)

## 9.3 Linha de badges (estilo desejado)

Exemplos de badges singulares orientados a comportamento:

1. Observador
  - Regra: ativou hover em >= 25 objetos interativos
2. Impaciente
  - Regra: finalizou >= 5 dialogos com ESC
3. Ja Sei
  - Regra: pulou tutorial
4. Persistente
  - Regra: repetiu um minigame >= 3 vezes ate melhorar score
5. Diplomata
  - Regra: manteve saldo positivo de interacoes com NPCs

Observacao: estes badges nao substituem o perfil GPI. Eles funcionam como "assinaturas de sessao".

## 9.4 Geracao abstrata de badges (framework)

Para escalar sem criar regra manual para cada badge, usar uma definicao declarativa:

```json
{
  "id": "badge_observador",
  "title": "Observador",
  "description": "Explorou com atencao os elementos do ambiente.",
  "category": "exploration_style",
  "signal": {
   "source": "stats",
   "key": "interactiveHoverCount",
   "aggregation": "session_total"
  },
  "rule": {
   "operator": ">=",
   "threshold": 25,
   "window": "full_session"
  },
  "evidencePolicy": {
   "minEvents": 10,
   "confidenceFromCoverage": true
  },
  "rarity": "common",
  "stackable": false
}
```

Campos abstratos obrigatorios por badge-template:

1. category: define familia comportamental (exploration_style, dialogue_style, onboarding_style, learning_style, social_style)
2. signal: de onde vem o dado (stats, flags, eventos agregados)
3. rule: operador e threshold
4. evidencePolicy: minimo de evidencia para evitar falso positivo
5. stackable: se badge pode evoluir por nivel

## 9.5 Taxonomia abstrata recomendada

1. exploration_style
  - Exemplo: Observador, Cartografo, Curioso
2. dialogue_style
  - Exemplo: Impaciente, Escuta Ativa
3. onboarding_style
  - Exemplo: Ja Sei, Guia Completo
4. learning_style
  - Exemplo: Persistente, Aprendizado Rapido
5. social_style
  - Exemplo: Diplomata, Resolutor

## 9.6 Regras de atribuicao (baseline)

1. Regra de trigger: badge e concedido quando rule for verdadeira no recorte da sessao.
2. Regra de evidencia: badge so aparece se evidencePolicy for satisfeita.
3. Regra de cobertura: quando cobertura da secao badges for baixa, exibir badge com confidence low.
4. Regra de anti-ruido: para metricas de contagem, exigir minimo absoluto e minimo relativo quando aplicavel.
5. Regra de desempate: se badges conflitantes surgirem (ex.: Impaciente e Escuta Ativa), manter os dois com explicacao contextual.

## 9.7 Exemplos prontos no formato final

```json
{
  "id": "badge_impaciente",
  "title": "Impaciente",
  "description": "Acelerou conversas com encerramento rapido de dialogos.",
  "earned": true,
  "confidence": "high",
  "evidenceLevel": "high",
  "criteria": {
   "source": "stats",
   "key": "dialogEscSkips",
   "operator": ">=",
   "threshold": 5
  },
  "evidence": [
   "dialogEscSkips=7",
   "dialogsCompleted=16",
   "coverage.badges=82"
  ]
}
```

```json
{
  "id": "badge_ja_sei",
  "title": "Ja Sei",
  "description": "Optou por pular a etapa introdutoria do jogo.",
  "earned": true,
  "confidence": "high",
  "evidenceLevel": "high",
  "criteria": {
   "source": "flags",
   "key": "tutorial_skipped",
   "operator": "==",
   "threshold": true
  },
  "evidence": [
   "tutorial_skipped=true"
  ]
}
```

## 9.8 Conexao com GPI (sem misturar score)

Badges nao entram no calculo do score GPI principal.

Uso recomendado:

1. Badges alimentam narrativa qualitativa da sessao.
2. GPI continua sendo camada quantitativa central.
3. Em relatorio publico, priorizar badges de facil entendimento.

---

## 10) Algoritmo de Confianca e Cobertura

## 10.1 Data completeness (0-100)

Calcular por secao:

- perfil: cobertura de eixos + existencia de pares analogos
- fixos: existencia dos KPIs obrigatorios
- minigames: quantidade de minigames com firstAttempt valido
- badges: quantidade de badges avaliaveis com evidencias

Formula base:

dataCompleteness = (campos_presentes / campos_esperados) * 100

## 10.2 Confidence tier

1. High: >= 75
2. Medium: 45-74
3. Low: < 45

Mostrar sempre o tier ao lado da secao.

---

## 11) UX da Tela Final

Fluxo sugerido:

1. Modal/scene de "Analise concluida"
2. Abas: Perfil | Resultados | Minigames | Badges
3. Botao de compartilhar
4. Botao de baixar resumo (json/pdf em fase posterior)

Copy guideline:

- usar linguagem objetiva
- sem rotulos absolutos (evitar "voce e X")
- preferir "nesta sessao observamos..."

---

## 12) Compartilhamento (LinkedIn e Gmail)

## 12.1 Estrategia recomendada

Fase 1 (imediata e segura):

1. Gerar URL publica de resumo (sem dados sensiveis)
2. Abrir intents de compartilhamento no cliente:
   - LinkedIn share URL
   - Gmail compose URL (mailto)

Fase 2 (posterior):

1. Postagem autenticada server-to-server em LinkedIn API
2. Envio de email via provedor (SMTP/API)

## 12.2 Contrato de resumo publico

```json
{
  "reportId": "string",
  "headline": "Perfil de resposta em simulacao de crise",
  "highlights": [
    "Forte sinal em Colaboracao",
    "Evolucao consistente em minigames",
    "Concluiu em ritmo equilibrado"
  ],
  "publicMetrics": {
    "gpiTopAxes": ["collaboration", "execution"],
    "badges": ["Elo de Equipe", "Executor Consistente"]
  }
}
```

## 12.3 Privacidade

1. Nao publicar email, id interno, eventos crus ou flags sensiveis.
2. Publicar apenas resumo textual + indicadores agregados.
3. Permitir opt-in explicito antes do compartilhamento.

---

## 13) Plano de Implementacao em 4 sprints

Sprint 1 - Motor de relatorio

1. Criar report engine unificando GameState + MinigameManager
2. Implementar schemaVersion e coverage/confidence
3. Entregar JSON final local

Sprint 2 - UI final

1. Tela final com 4 secoes
2. Graficos basicos (radar + barras + cards)
3. Tratamento de estados sem dados

Sprint 3 - Badges

1. Definir catalogo inicial e thresholds
2. Implementar motor de avaliacao de badges
3. Exibir evidencia textual por badge

Sprint 4 - Compartilhamento

1. Gerar resumo publico
2. Integrar intents LinkedIn/Gmail
3. Auditar privacidade e consentimento

---

## 14) Riscos e mitigacoes

1. Risco: pouca cobertura fora do mapa Reception
   - Mitigacao: confidence tier + labels de cobertura

2. Risco: interpretacao psicologica excessiva
   - Mitigacao: linguagem observacional e disclaimers

3. Risco: comparacoes publicas instaveis com amostra baixa
   - Mitigacao: minimo de N jogadores para ativar percentil

4. Risco: compartilhamento expor dados pessoais
   - Mitigacao: payload publico minimizado e opt-in

---

## 15) Checklist de aceite

1. Relatorio gera as 4 secoes sem quebrar quando faltam dados
2. Cada secao mostra cobertura e confianca
3. Minigames continuam separados do score GPI principal
4. Badges exibem criterio e evidencia
5. Compartilhamento LinkedIn/Gmail funciona com resumo publico
6. Nenhum dado sensivel e enviado no payload de compartilhamento

---

## 16) Pontos em aberto para decisao

1. Quais badges singulares entram no MVP (ex.: Observador, Impaciente, Ja Sei, Persistente, Diplomata)?
2. Quais thresholds oficiais por badge no MVP (ex.: hover >= 25, ESC >= 5)?
3. Quais sinais precisam ser adicionados ao estado para suportar os badges (interactiveHoverCount, dialogEscSkips, tutorial_skipped)?
4. O Perfil Derivado (DISC/Big Five) sera exibido sempre ou apenas com confidence >= medium?
5. Qual criterio oficial de "fim de jogo" para disparar geracao do relatorio?
6. Compartilhamento deve ser apenas por link publico ou tambem com envio direto autenticado ja no MVP?
7. O resumo publico pode mostrar scores numericos exatos ou apenas faixas (alto/medio/baixo)?
