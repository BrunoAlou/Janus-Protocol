# SPEC-006: Sistema de Jornadas

## Metadata
- **ID**: SPEC-006
- **Status**: Draft
- **Priority**: High
- **Depends On**: SPEC-005 (NPCs/Elementos), SPEC-001 (Dilemas)
- **Enables**: SPEC-007 (Liberação de Minigames)

---

## 1. Objetivo

Implementar o sistema de jornadas (quests) que guia o jogador através de estágios sequenciais, coletando dados GPI relevantes e desbloqueando conteúdo progressivamente.

---

## 2. Estrutura de Jornada

### 2.1 Tipos de Jornada

| Tipo | Descrição | Visibilidade | Peso GPI |
|------|-----------|--------------|----------|
| **main** | Jornada principal, obrigatória | Sempre visível | 1.5x |
| **side** | Jornada secundária, opcional | Visível após trigger | 1.0x |
| **hidden** | Jornada secreta, recompensa exploração | Invisível até descoberta | 0.8x |

### 2.2 Estrutura de Dados

```typescript
interface Journey {
  id: string;                    // Ex: "J001"
  name: string;                  // "Protocolo de Evacuação"
  description: string;
  category: 'main' | 'side' | 'hidden';
  
  // Eixos GPI primário e secundário
  primaryAxis: GPIAxis;
  secondaryAxis?: GPIAxis;
  
  // Alinhamentos psicométricos
  discAlignment: ('D' | 'I' | 'S' | 'C')[];
  bigFiveAlignment: ('O' | 'C' | 'E' | 'A' | 'N')[];
  
  // Pré-requisitos
  prerequisites: string[];       // IDs de outras jornadas
  minProgressToUnlock: number;   // % de progresso geral
  
  // Estágios
  stages: JourneyStage[];
  
  // Recompensas
  totalWeight: number;
  completionBonus: GPIImpact;
  narrativeReward: string;
  unlocksMinigames?: string[];   // IDs de minigames desbloqueados
}

interface JourneyStage {
  id: string;                    // Ex: "J001_S1"
  name: string;
  type: 'interaction' | 'minigame' | 'exploration' | 'decision' | 'collection';
  description: string;
  
  // Target baseado no tipo
  targetNPC?: string;            // Para interaction
  targetLocation?: string;       // Para exploration
  minigameId?: string;           // Para minigame
  dilemmaId?: string;            // Para decision
  collectibleIds?: string[];     // Para collection
  
  // Requisitos
  requiredOutcome?: string;      // 'any', 'positive_relation', 'help_given', etc.
  minimumScore?: number;         // Para minigames
  timeBonus?: number;            // Bônus por completar rápido
  
  // Contexto GPI
  context: 'calm' | 'timed';
  stageGPIImpact?: GPIImpact;
}
```

---

## 3. JourneyManager

### 3.1 Classe Principal

```javascript
export class JourneyManager {
  constructor(scene) {
    this.scene = scene;
    this.journeys = new Map();
    this.progress = new Map();
    this.activeJourneys = new Set();
  }
  
  async initialize() {
    const data = await fetch('/src/data/journeys/journeys.json');
    const { journeys } = await data.json();
    
    // Indexar jornadas
    for (const category of ['main', 'side', 'hidden']) {
      for (const journey of journeys[category] || []) {
        this.journeys.set(journey.id, journey);
        this.progress.set(journey.id, {
          status: 'locked',
          currentStage: 0,
          stagesCompleted: [],
          startedAt: null,
          completedAt: null
        });
      }
    }
    
    // Desbloquear jornadas iniciais
    this.unlockInitialJourneys();
  }
  
  unlockInitialJourneys() {
    for (const [id, journey] of this.journeys) {
      if (journey.prerequisites.length === 0 && journey.minProgressToUnlock === 0) {
        this.unlockJourney(id);
      }
    }
  }
  
  unlockJourney(journeyId) {
    const progress = this.progress.get(journeyId);
    if (progress.status === 'locked') {
      progress.status = 'available';
      this.emitEvent('journey_unlocked', { journeyId });
    }
  }
  
  startJourney(journeyId) {
    const journey = this.journeys.get(journeyId);
    const progress = this.progress.get(journeyId);
    
    if (progress.status !== 'available') return false;
    
    progress.status = 'active';
    progress.startedAt = Date.now();
    this.activeJourneys.add(journeyId);
    
    // Ativar primeiro estágio
    this.activateStage(journeyId, 0);
    
    // Telemetria
    this.logJourneyEvent('journey_started', journeyId);
    
    return true;
  }
  
  activateStage(journeyId, stageIndex) {
    const journey = this.journeys.get(journeyId);
    const stage = journey.stages[stageIndex];
    
    // Notificar sistemas relevantes
    switch (stage.type) {
      case 'interaction':
        this.scene.events.emit('npc_quest_marker', stage.targetNPC, true);
        break;
      case 'minigame':
        this.scene.events.emit('minigame_available', stage.minigameId);
        break;
      case 'exploration':
        this.scene.events.emit('location_objective', stage.targetLocation);
        break;
      case 'decision':
        // Dilema será trigado pelo DilemmaManager
        break;
    }
    
    this.logJourneyEvent('stage_activated', journeyId, stage.id);
  }
  
  completeStage(journeyId, stageId, outcome) {
    const journey = this.journeys.get(journeyId);
    const progress = this.progress.get(journeyId);
    const stageIndex = journey.stages.findIndex(s => s.id === stageId);
    const stage = journey.stages[stageIndex];
    
    // Validar outcome se necessário
    if (stage.requiredOutcome && stage.requiredOutcome !== 'any') {
      if (outcome !== stage.requiredOutcome) {
        // Estágio falhou, mas continua
        this.logJourneyEvent('stage_failed', journeyId, stageId, outcome);
      }
    }
    
    // Marcar como completo
    progress.stagesCompleted.push({
      stageId,
      outcome,
      completedAt: Date.now()
    });
    
    // Aplicar impacto GPI do estágio
    if (stage.stageGPIImpact) {
      this.applyGPIImpact(stage.stageGPIImpact, stage.context);
    }
    
    // Avançar para próximo estágio ou completar jornada
    if (stageIndex + 1 < journey.stages.length) {
      progress.currentStage = stageIndex + 1;
      this.activateStage(journeyId, stageIndex + 1);
    } else {
      this.completeJourney(journeyId);
    }
    
    this.logJourneyEvent('stage_completed', journeyId, stageId, outcome);
  }
  
  completeJourney(journeyId) {
    const journey = this.journeys.get(journeyId);
    const progress = this.progress.get(journeyId);
    
    progress.status = 'completed';
    progress.completedAt = Date.now();
    this.activeJourneys.delete(journeyId);
    
    // Aplicar bônus de conclusão
    this.applyGPIImpact(journey.completionBonus, 'calm');
    
    // Desbloquear minigames
    if (journey.unlocksMinigames) {
      for (const minigameId of journey.unlocksMinigames) {
        this.scene.events.emit('minigame_unlocked', minigameId);
      }
    }
    
    // Verificar novas jornadas desbloqueadas
    this.checkUnlocks();
    
    // Mostrar recompensa narrativa
    this.scene.events.emit('show_notification', {
      title: `Jornada Completa: ${journey.name}`,
      text: journey.narrativeReward
    });
    
    this.logJourneyEvent('journey_completed', journeyId);
  }
  
  checkUnlocks() {
    const completedIds = [...this.progress.entries()]
      .filter(([_, p]) => p.status === 'completed')
      .map(([id, _]) => id);
    
    const totalProgress = this.calculateTotalProgress();
    
    for (const [id, journey] of this.journeys) {
      const progress = this.progress.get(id);
      if (progress.status !== 'locked') continue;
      
      // Verificar pré-requisitos
      const prereqsMet = journey.prerequisites.every(
        prereq => completedIds.includes(prereq)
      );
      
      // Verificar progresso mínimo
      const progressMet = totalProgress >= journey.minProgressToUnlock;
      
      if (prereqsMet && progressMet) {
        this.unlockJourney(id);
      }
    }
  }
}
```

---

## 4. Catálogo de Jornadas

### 4.1 Jornadas Principais

| ID | Nome | Eixo Primário | Estágios | Desbloqueia |
|----|------|---------------|----------|-------------|
| J001 | Protocolo de Evacuação | Execução | 5 | QuizGame |
| J002 | Nenhum Colega Para Trás | Colaboração | 4 | - |
| J003 | Sob Pressão | Resiliência | 4 | TypingGame |
| J004 | Rota Alternativa | Inovação | 5 | PuzzleGame |

### 4.2 Jornadas Secundárias

| ID | Nome | Eixo Primário | Pré-requisito |
|----|------|---------------|---------------|
| J101 | Café com o Chefe | Colaboração | J001 completa |
| J102 | Arquivos Perdidos | Execução | J002 completa |
| J103 | O Segredo do Servidor | Inovação | J001 + J004 |

### 4.3 Jornadas Secretas

| ID | Nome | Trigger | Eixo |
|----|------|---------|------|
| J201 | A Mensagem de JANUS | Encontrar terminal oculto | Inovação |
| J202 | Aliado Inesperado | Ajudar NPC em crise 3x | Colaboração |

---

## 5. UI de Jornadas

### 5.1 HUD de Jornada Ativa

```
┌─────────────────────────────────┐
│ ⚡ Protocolo de Evacuação       │
│ ├─ ✓ Falar com João            │
│ ├─ ● Ativar painel (ATUAL)     │
│ ├─ ○ Verificar sistemas        │
│ └─ ○ Coordenar com TI          │
└─────────────────────────────────┘
```

### 5.2 Menu de Jornadas (Pause)

```
┌─────────────────────────────────────────────┐
│           JORNADAS                          │
│                                             │
│ ATIVAS (2)                                  │
│ ├─ ⚡ Protocolo de Evacuação [60%]          │
│ └─ ⚡ Nenhum Colega Para Trás [25%]         │
│                                             │
│ DISPONÍVEIS (1)                             │
│ └─ ○ Sob Pressão                            │
│                                             │
│ COMPLETAS (1)                               │
│ └─ ✓ Tutorial                               │
│                                             │
│ BLOQUEADAS (3)                              │
│ └─ 🔒 Rota Alternativa (Requer: J001)       │
└─────────────────────────────────────────────┘
```

---

## 6. Telemetria de Jornadas

```javascript
{
  event_type: 'journey_event',
  timestamp: Date.now(),
  session_id: string,
  data: {
    action: 'started' | 'stage_completed' | 'completed' | 'abandoned',
    journey_id: string,
    journey_name: string,
    stage_id?: string,
    outcome?: string,
    time_spent_ms: number,
    gpi_impact: GPIImpact,
    context: 'calm' | 'timed'
  }
}
```

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/managers/JourneyManager.js` | CRIAR | Gerenciador de jornadas |
| `src/ui/components/JourneyHUD.js` | CRIAR | HUD de jornada ativa |
| `src/ui/components/JourneyMenu.js` | CRIAR | Menu de jornadas |
| `src/data/journeys/journeys.json` | MODIFICAR | Completar todas as jornadas |
| `src/constants/GameEvents.js` | MODIFICAR | Adicionar JOURNEY_EVENTS |

---

## 8. Critérios de Aceitação

- [ ] Jornadas carregadas de JSON
- [ ] Desbloqueio condicional funciona
- [ ] Estágios avançam corretamente
- [ ] HUD mostra jornada ativa
- [ ] Menu lista todas as jornadas
- [ ] Telemetria registrada em cada evento
- [ ] Minigames desbloqueados ao completar
- [ ] Bônus GPI aplicado corretamente

---

## 9. Justificativa Acadêmica

O sistema de jornadas fornece contexto narrativo para os dilemas, aumentando a imersão e reduzindo a percepção de estar sendo "testado" (DETERDING et al., 2011). A estrutura em estágios permite rastrear o progresso e correlacionar decisões específicas com outcomes GPI.

**Referências**:
- DETERDING, S. et al. (2011). Gamification: Using game design elements in non-game contexts.
