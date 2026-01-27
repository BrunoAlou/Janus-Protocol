# SPEC-007: Liberação de Minigames

## Metadata
- **ID**: SPEC-007
- **Status**: Draft
- **Priority**: Medium
- **Depends On**: SPEC-006 (Jornadas), SPEC-002 (Pipeline de Métricas)
- **Enables**: Coleta de dados GPI via performance

---

## 1. Objetivo

Definir o sistema de liberação progressiva de minigames baseado no progresso de jornadas, garantindo que cada minigame contribua para a avaliação GPI.

---

## 2. Catálogo de Minigames

### 2.1 Minigames Disponíveis

| ID | Nome | Eixo Primário | Eixo Secundário | Desbloqueio |
|----|------|---------------|-----------------|-------------|
| `QuizGame` | Quiz de Conhecimento | Execução | - | J001 completa |
| `MemoryGame` | Jogo da Memória | Execução | Resiliência | Início |
| `PuzzleGame` | Puzzle Lógico | Inovação | Execução | J004 completa |
| `TypingGame` | Digitação Rápida | Execução | Resiliência | J003 completa |
| `WhackAMoleGame` | Whack-a-Bug | Resiliência | Execução | J002 Stage 3 |
| `TetrisGame` | Tetris | Inovação | Resiliência | J101 completa |
| `SnakeGame` | Snake | Resiliência | Inovação | J103 completa |

### 2.2 Estrutura de Dados

```typescript
interface MinigameConfig {
  id: string;
  name: string;
  description: string;
  
  // Mapeamento GPI
  gpiMapping: {
    primaryAxis: GPIAxis;
    secondaryAxis?: GPIAxis;
    metrics: MinigameMetric[];
  };
  
  // Desbloqueio
  unlockCondition: {
    type: 'journey_complete' | 'journey_stage' | 'always' | 'score_threshold';
    journeyId?: string;
    stageId?: string;
    minigameId?: string;
    threshold?: number;
  };
  
  // Configuração de contexto
  contexts: {
    calm: MinigameContextConfig;
    timed: MinigameContextConfig;
  };
  
  // Dificuldade
  difficulty: {
    base: number;
    scaling: 'linear' | 'exponential';
    maxLevel: number;
  };
}

interface MinigameMetric {
  name: string;
  description: string;
  axis: GPIAxis;
  weight: number;
  calculation: 'score' | 'time' | 'accuracy' | 'persistence' | 'creativity';
}

interface MinigameContextConfig {
  timeLimit?: number;
  difficultyModifier: number;
  gpiWeightModifier: number;
}
```

---

## 3. MinigameManager Expandido

### 3.1 Gerenciamento de Desbloqueio

```javascript
export class MinigameManager {
  constructor(scene) {
    this.scene = scene;
    this.minigames = new Map();
    this.unlocked = new Set(['MemoryGame']); // Sempre disponível
    this.scores = new Map();
  }
  
  async initialize() {
    const config = await fetch('/src/data/config/minigames-config.json');
    const data = await config.json();
    
    for (const minigame of data.minigames) {
      this.minigames.set(minigame.id, minigame);
    }
    
    // Escutar eventos de jornada
    this.scene.events.on('journey_completed', this.onJourneyCompleted.bind(this));
    this.scene.events.on('stage_completed', this.onStageCompleted.bind(this));
  }
  
  onJourneyCompleted(journeyId) {
    for (const [id, config] of this.minigames) {
      if (config.unlockCondition.type === 'journey_complete' &&
          config.unlockCondition.journeyId === journeyId) {
        this.unlockMinigame(id);
      }
    }
  }
  
  onStageCompleted(journeyId, stageId) {
    for (const [id, config] of this.minigames) {
      if (config.unlockCondition.type === 'journey_stage' &&
          config.unlockCondition.journeyId === journeyId &&
          config.unlockCondition.stageId === stageId) {
        this.unlockMinigame(id);
      }
    }
  }
  
  unlockMinigame(minigameId) {
    if (this.unlocked.has(minigameId)) return;
    
    this.unlocked.add(minigameId);
    const config = this.minigames.get(minigameId);
    
    // Notificar UI
    this.scene.events.emit('minigame_unlocked', {
      id: minigameId,
      name: config.name,
      description: config.description
    });
    
    // Telemetria
    logAction('minigame_unlocked', { minigameId });
  }
  
  isUnlocked(minigameId) {
    return this.unlocked.has(minigameId);
  }
  
  getAvailableMinigames() {
    return [...this.unlocked].map(id => ({
      id,
      ...this.minigames.get(id)
    }));
  }
  
  startMinigame(minigameId, context = 'calm') {
    if (!this.isUnlocked(minigameId)) {
      console.warn(`Minigame ${minigameId} não está desbloqueado`);
      return false;
    }
    
    const config = this.minigames.get(minigameId);
    const contextConfig = config.contexts[context];
    
    // Passar configuração para a cena do minigame
    this.scene.scene.start(minigameId, {
      context,
      timeLimit: contextConfig.timeLimit,
      difficultyModifier: contextConfig.difficultyModifier,
      gpiWeightModifier: contextConfig.gpiWeightModifier,
      onComplete: (result) => this.onMinigameComplete(minigameId, context, result)
    });
    
    logAction('minigame_started', { minigameId, context });
    return true;
  }
  
  onMinigameComplete(minigameId, context, result) {
    const config = this.minigames.get(minigameId);
    
    // Calcular impacto GPI
    const gpiImpact = this.calculateGPIImpact(config, result, context);
    
    // Aplicar ao perfil
    this.scene.events.emit('gpi_event', {
      source: 'minigame',
      sourceId: minigameId,
      context,
      impact: gpiImpact,
      weight: config.contexts[context].gpiWeightModifier,
      confidence: this.calculateConfidence(result)
    });
    
    // Salvar score
    this.scores.set(minigameId, {
      ...this.scores.get(minigameId),
      [context]: result
    });
    
    // Telemetria detalhada
    logAction('minigame_completed', {
      minigameId,
      context,
      score: result.score,
      time: result.timeSpent,
      attempts: result.attempts,
      gpiImpact
    });
    
    // Verificar desbloqueios por score
    this.checkScoreUnlocks(minigameId, result.score);
  }
  
  calculateGPIImpact(config, result, context) {
    const impact = { execution: 0, collaboration: 0, resilience: 0, innovation: 0 };
    
    for (const metric of config.gpiMapping.metrics) {
      let value = 0;
      
      switch (metric.calculation) {
        case 'score':
          value = normalize(result.score, 0, 100, -2, 2);
          break;
        case 'time':
          // Menos tempo = melhor
          value = normalize(result.timeSpent, result.maxTime, 0, -2, 2);
          break;
        case 'accuracy':
          value = normalize(result.accuracy, 0, 100, -2, 2);
          break;
        case 'persistence':
          // Mais tentativas após falha = mais resiliência
          value = result.retriesAfterFail > 0 ? 
            Math.min(result.retriesAfterFail * 0.5, 2) : 0;
          break;
        case 'creativity':
          // Soluções não-convencionais
          value = result.uniqueSolutions ? result.uniqueSolutions * 0.5 : 0;
          break;
      }
      
      impact[metric.axis] += value * metric.weight;
    }
    
    return impact;
  }
  
  calculateConfidence(result) {
    // Confidence baseada em quantidade de dados
    const factors = [
      result.timeSpent > 30 ? 1 : result.timeSpent / 30,  // Mínimo 30s
      result.actionsPerformed > 10 ? 1 : result.actionsPerformed / 10,
      result.completed ? 1 : 0.5
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }
}
```

---

## 4. Mapeamento GPI por Minigame

### 4.1 QuizGame (Execução)

```json
{
  "id": "QuizGame",
  "gpiMapping": {
    "primaryAxis": "execution",
    "metrics": [
      { "name": "accuracy", "axis": "execution", "weight": 1.0, "calculation": "accuracy" },
      { "name": "speed", "axis": "execution", "weight": 0.5, "calculation": "time" },
      { "name": "persistence", "axis": "resilience", "weight": 0.3, "calculation": "persistence" }
    ]
  },
  "contexts": {
    "calm": { "timeLimit": null, "difficultyModifier": 1.0, "gpiWeightModifier": 0.6 },
    "timed": { "timeLimit": 60, "difficultyModifier": 1.2, "gpiWeightModifier": 0.8 }
  }
}
```

### 4.2 PuzzleGame (Inovação)

```json
{
  "id": "PuzzleGame",
  "gpiMapping": {
    "primaryAxis": "innovation",
    "secondaryAxis": "execution",
    "metrics": [
      { "name": "creativity", "axis": "innovation", "weight": 1.0, "calculation": "creativity" },
      { "name": "completion", "axis": "execution", "weight": 0.7, "calculation": "score" },
      { "name": "exploration", "axis": "innovation", "weight": 0.5, "calculation": "uniqueSolutions" }
    ]
  }
}
```

### 4.3 TypingGame (Execução + Resiliência)

```json
{
  "id": "TypingGame",
  "gpiMapping": {
    "primaryAxis": "execution",
    "secondaryAxis": "resilience",
    "metrics": [
      { "name": "wpm", "axis": "execution", "weight": 1.0, "calculation": "score" },
      { "name": "accuracy", "axis": "execution", "weight": 0.8, "calculation": "accuracy" },
      { "name": "recovery", "axis": "resilience", "weight": 0.6, "calculation": "persistence" }
    ]
  }
}
```

---

## 5. UI de Seleção de Minigames

### 5.1 MinigameMenuScene

```
┌─────────────────────────────────────────────────────────────┐
│                    MINIGAMES                                │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ ✓ Memory    │  │ ✓ Quiz      │  │ 🔒 Puzzle   │        │
│   │ [Jogar]     │  │ [Jogar]     │  │ Requer: J004│        │
│   │ ★★★☆☆      │  │ ★★☆☆☆      │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ 🔒 Typing   │  │ 🔒 Tetris   │  │ 🔒 Snake    │        │
│   │ Requer: J003│  │ Requer: J101│  │ Requer: J103│        │
│   │             │  │             │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   Contexto: [● Calm] [○ Timed]                             │
│                                                             │
│   [Voltar]                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Seleção de Contexto

O jogador pode escolher jogar em:
- **Calm**: Sem limite de tempo, menor peso GPI
- **Timed**: Com limite de tempo, maior peso GPI (mede comportamento sob pressão)

---

## 6. Integração com Jornadas

### 6.1 Minigame como Estágio de Jornada

Quando um minigame é parte de uma jornada:

```javascript
// Em JourneyManager
completeMinigameStage(journeyId, stageId, minigameResult) {
  const stage = this.getStage(journeyId, stageId);
  
  // Verificar score mínimo
  if (stage.minimumScore && minigameResult.score < stage.minimumScore) {
    this.logJourneyEvent('stage_failed', journeyId, stageId, {
      reason: 'score_below_minimum',
      score: minigameResult.score,
      required: stage.minimumScore
    });
    
    // Permitir retry
    return { success: false, canRetry: true };
  }
  
  // Completar estágio
  this.completeStage(journeyId, stageId, 'minigame_passed');
  return { success: true };
}
```

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/managers/MinigameManager.js` | MODIFICAR | Adicionar sistema de desbloqueio |
| `src/scenes/MinigameMenuScene.js` | MODIFICAR | UI com minigames bloqueados/desbloqueados |
| `src/data/config/minigames-config.json` | CRIAR | Configuração completa de minigames |
| `src/constants/GameEvents.js` | MODIFICAR | Adicionar MINIGAME_EVENTS expandidos |

---

## 8. Configuração Completa

### 8.1 minigames-config.json

```json
{
  "version": "1.0.0",
  "minigames": [
    {
      "id": "MemoryGame",
      "name": "Jogo da Memória",
      "description": "Encontre os pares de cartas",
      "icon": "🧠",
      "unlockCondition": { "type": "always" },
      "gpiMapping": {
        "primaryAxis": "execution",
        "secondaryAxis": "resilience",
        "metrics": [
          { "name": "pairs_found", "axis": "execution", "weight": 1.0, "calculation": "score" },
          { "name": "attempts", "axis": "resilience", "weight": 0.5, "calculation": "persistence" }
        ]
      },
      "contexts": {
        "calm": { "timeLimit": null, "difficultyModifier": 1.0, "gpiWeightModifier": 0.5 },
        "timed": { "timeLimit": 120, "difficultyModifier": 1.0, "gpiWeightModifier": 0.7 }
      },
      "difficulty": { "base": 6, "scaling": "linear", "maxLevel": 16 }
    },
    {
      "id": "QuizGame",
      "name": "Quiz de Conhecimento",
      "description": "Responda perguntas sobre a empresa",
      "icon": "❓",
      "unlockCondition": { "type": "journey_complete", "journeyId": "J001" },
      "gpiMapping": {
        "primaryAxis": "execution",
        "metrics": [
          { "name": "correct_answers", "axis": "execution", "weight": 1.0, "calculation": "accuracy" },
          { "name": "response_time", "axis": "execution", "weight": 0.3, "calculation": "time" }
        ]
      },
      "contexts": {
        "calm": { "timeLimit": null, "difficultyModifier": 1.0, "gpiWeightModifier": 0.6 },
        "timed": { "timeLimit": 60, "difficultyModifier": 1.2, "gpiWeightModifier": 0.8 }
      }
    }
  ]
}
```

---

## 9. Critérios de Aceitação

- [ ] Minigames bloqueados mostram requisito
- [ ] Desbloqueio automático ao completar jornada
- [ ] Seleção de contexto (calm/timed) funciona
- [ ] Scores salvos por minigame
- [ ] Impacto GPI calculado corretamente
- [ ] Integração com estágios de jornada
- [ ] Telemetria completa registrada
- [ ] UI responsiva e acessível

---

## 10. Justificativa Acadêmica

A liberação progressiva de minigames segue princípios de game design (tutorialização gradual) enquanto garante que dados GPI sejam coletados em contextos controlados. A separação calm/timed permite a análise de dissonância também no desempenho em minigames.

**Referências**:
- DETERDING, S. et al. (2011). Gamification design elements.
- HAMARI, J. et al. (2014). Does gamification work? A literature review.
