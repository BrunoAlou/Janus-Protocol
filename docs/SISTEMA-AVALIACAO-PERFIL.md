# Sistema de Avaliação de Perfil - Janus Protocol

## 📋 Visão Geral

Este documento define a estrutura completa do sistema de avaliação de perfil do Janus Protocol, integrando os modelos **DISC** e **Big Five** com as quatro abordagens de avaliação do jogo:

1. **Interações** - Modelo force-choice que força trade-offs
2. **Jornadas** - Quests globais com objetivos específicos
3. **Desempenho** - Tempo de raciocínio, decisões e minigames
4. **Objetivos** - Metas não-fixas escolhidas pelo jogador

---

## 🧠 Integração dos Modelos Psicométricos

### Mapeamento DISC → GPI

| DISC | Descrição | Eixo GPI Primário | Eixo GPI Secundário |
|------|-----------|-------------------|---------------------|
| **D** (Dominância) | Foco em resultados, desafios, decisões rápidas | Execução | Inovação |
| **I** (Influência) | Persuasão, relacionamentos, entusiasmo | Colaboração | Resiliência |
| **S** (Estabilidade) | Cooperação, ritmo constante, paciência | Colaboração | Execução |
| **C** (Conformidade) | Qualidade, precisão, análise | Execução | - |

### Mapeamento Big Five → GPI

| Big Five | Descrição | Eixo GPI Primário | Eixo GPI Secundário |
|----------|-----------|-------------------|---------------------|
| **O** (Abertura) | Curiosidade, imaginação, novas ideias | Inovação | - |
| **C** (Conscienciosidade) | Organização, disciplina, responsabilidade | Execução | - |
| **E** (Extroversão) | Sociabilidade, assertividade, energia | Colaboração | Inovação |
| **A** (Amabilidade) | Cooperação, empatia, confiança | Colaboração | Resiliência |
| **N** (Neuroticismo) | Ansiedade, volatilidade emocional | Resiliência (inverso) | - |

### Matriz de Correlação Integrada

```
                    EXECUÇÃO    COLABORAÇÃO    RESILIÊNCIA    INOVAÇÃO
DISC-D              +0.8        -0.2           +0.3           +0.4
DISC-I              +0.1        +0.9           +0.3           +0.2
DISC-S              +0.3        +0.7           +0.4           -0.3
DISC-C              +0.9        -0.1           +0.2           -0.2
BIG5-O              +0.2        +0.3           +0.2           +0.9
BIG5-C              +0.9        +0.2           +0.4           +0.1
BIG5-E              +0.2        +0.8           +0.3           +0.4
BIG5-A              +0.1        +0.9           +0.5           +0.1
BIG5-N (inverso)    +0.3        +0.2           +0.9           +0.1
```

---

## 🎭 Sistema de Interações (Force-Choice)

### Princípio Fundamental

Toda interação no jogo segue o modelo **force-choice**: ao favorecer uma linha de comportamento, o jogador automaticamente deixa de atender outra. Isso elimina respostas "neutras" e revela prioridades genuínas.

### Matriz de Trade-offs

| Escolha Favorece | Prejudica | Exemplo de Dilema |
|------------------|-----------|-------------------|
| Execução | Colaboração | "Terminar a tarefa sozinho vs. Ensinar o colega" |
| Execução | Inovação | "Seguir o procedimento vs. Experimentar nova abordagem" |
| Colaboração | Execução | "Ajudar colega em dificuldade vs. Cumprir prazo pessoal" |
| Colaboração | Inovação | "Consenso do grupo vs. Propor ideia controversa" |
| Resiliência | Execução | "Persistir no desafio vs. Buscar caminho mais fácil" |
| Resiliência | Colaboração | "Enfrentar conflito vs. Manter harmonia" |
| Inovação | Execução | "Explorar área desconhecida vs. Seguir rota segura" |
| Inovação | Colaboração | "Solução individual criativa vs. Solução coletiva tradicional" |

### Tipos de Interações

#### 1. Diálogos com NPCs
```typescript
interface DialogChoice {
  id: string;
  text: string;
  impact: {
    execution: number;    // -2 a +2
    collaboration: number;
    resilience: number;
    innovation: number;
  };
  discAlignment: 'D' | 'I' | 'S' | 'C';
  bigFiveAlignment: 'O' | 'C' | 'E' | 'A' | 'N';
  pressureContext: 'calm' | 'timed' | 'crisis';
}
```

#### 2. Ações Ambientais
```typescript
interface EnvironmentalAction {
  id: string;
  actionType: 'help_npc' | 'solve_puzzle' | 'explore' | 'follow_order' | 'disobey';
  impact: GPIImpact;
  timeLimit?: number; // em segundos, se aplicável
  reversible: boolean;
}
```

#### 3. Dilemas Morais
```typescript
interface MoralDilemma {
  id: string;
  scenario: string;
  options: DilemmaOption[];
  noNeutralOption: true; // Sempre forçado
  analogPairId?: string; // ID do dilema análogo (pressão vs não-pressão)
}
```

---

## 🗺️ Sistema de Jornadas (Quests Globais)

### Estrutura de Jornada

```typescript
interface Journey {
  id: string;
  name: string;
  description: string;
  category: 'main' | 'side' | 'hidden';
  primaryAxis: 'execution' | 'collaboration' | 'resilience' | 'innovation';
  secondaryAxis?: GPIAxis;
  
  // Requisitos
  prerequisites: string[]; // IDs de outras jornadas
  minProgressToUnlock: number; // % de progresso geral
  
  // Estrutura
  stages: JourneyStage[];
  totalWeight: number; // Peso no cálculo final do perfil
  
  // Recompensas
  completionBonus: GPIImpact;
  narrativeReward: string;
}

interface JourneyStage {
  id: string;
  type: 'interaction' | 'minigame' | 'exploration' | 'decision';
  targetId: string;
  requiredOutcome?: string;
  timeBonus?: number; // Bônus por completar rápido
}
```

### Catálogo de Jornadas

#### Jornadas Principais (Obrigatórias)

| ID | Nome | Eixo Primário | Descrição | Estágios |
|----|------|---------------|-----------|----------|
| `J001` | Protocolo de Evacuação | Execução | Seguir procedimentos de emergência | 5 |
| `J002` | Nenhum Colega Para Trás | Colaboração | Garantir que todos escapem | 6 |
| `J003` | Enfrentando JANUS | Resiliência | Confrontar a IA em múltiplos desafios | 4 |
| `J004` | Caminho Alternativo | Inovação | Descobrir rota de fuga não convencional | 5 |

#### Jornadas Secundárias (Opcionais)

| ID | Nome | Eixo Primário | Trade-off |
|----|------|---------------|-----------|
| `J101` | O Perfeccionista | Execução | -Colaboração (focar em qualidade pessoal) |
| `J102` | Mediador de Conflitos | Colaboração | -Execução (tempo gasto em diplomacia) |
| `J103` | Sob Pressão | Resiliência | -Inovação (foco em estabilidade) |
| `J104` | Hacker Criativo | Inovação | -Execução (desvio dos procedimentos) |

#### Jornadas Ocultas (Descobertas por Exploração)

| ID | Condição de Desbloqueio | Revelação |
|----|------------------------|-----------|
| `J201` | Explorar todas as salas do Ato 1 | "Segredos de JANUS" |
| `J202` | Ajudar 3+ NPCs antes da crise | "Rede de Aliados" |
| `J203` | Falhar e persistir 3x no mesmo desafio | "Mestre da Persistência" |
| `J204` | Resolver puzzle de forma não-padrão | "Pensador Lateral" |

### Peso das Jornadas no Perfil Final

```typescript
const journeyWeights = {
  main: 0.40,      // 40% do peso total
  side: 0.35,      // 35% do peso total
  hidden: 0.25     // 25% do peso total (bônus por descoberta)
};
```

---

## ⚡ Sistema de Desempenho

### Métricas Coletadas

```typescript
interface PerformanceMetrics {
  // Tempo de Raciocínio
  averageDecisionTime: number;        // ms
  decisionTimeUnderPressure: number;  // ms
  decisionTimeCalm: number;           // ms
  timeConsistency: number;            // desvio padrão
  
  // Decisões
  totalDecisions: number;
  decisionsReversed: number;          // Mudou de ideia
  decisionsSkipped: number;           // Deixou passar
  decisionConfidence: number;         // % de decisões firmes
  
  // Minigames
  minigamesCompleted: number;
  minigamesAttempted: number;
  minigameAverageScore: number;
  minigameRetryRate: number;          // % de tentativas após falha
  
  // Exploração
  areasExplored: number;
  totalAreas: number;
  hiddenAreasFound: number;
  explorationEfficiency: number;      // % de áreas úteis exploradas
}
```

### Cálculo de Score de Desempenho por Eixo

```typescript
function calculatePerformanceScore(metrics: PerformanceMetrics): GPIScore {
  return {
    execution: calculateExecutionPerformance(metrics),
    collaboration: calculateCollaborationPerformance(metrics),
    resilience: calculateResiliencePerformance(metrics),
    innovation: calculateInnovationPerformance(metrics)
  };
}

function calculateExecutionPerformance(m: PerformanceMetrics): number {
  const timeScore = normalizeTime(m.averageDecisionTime, 1000, 10000);
  const completionScore = m.minigamesCompleted / m.minigamesAttempted;
  const consistencyScore = 1 - (m.decisionsReversed / m.totalDecisions);
  
  return (timeScore * 0.3) + (completionScore * 0.4) + (consistencyScore * 0.3);
}

function calculateResiliencePerformance(m: PerformanceMetrics): number {
  const retryScore = m.minigameRetryRate;
  const pressureAdaptation = 1 - Math.abs(
    m.decisionTimeUnderPressure - m.decisionTimeCalm
  ) / m.decisionTimeCalm;
  const persistenceScore = 1 - (m.decisionsSkipped / m.totalDecisions);
  
  return (retryScore * 0.4) + (pressureAdaptation * 0.3) + (persistenceScore * 0.3);
}

function calculateInnovationPerformance(m: PerformanceMetrics): number {
  const explorationScore = m.areasExplored / m.totalAreas;
  const hiddenDiscoveryScore = m.hiddenAreasFound / 10; // Normalizado
  const efficiencyPenalty = m.explorationEfficiency; // Explorar demais sem propósito
  
  return (explorationScore * 0.3) + (hiddenDiscoveryScore * 0.5) + (efficiencyPenalty * 0.2);
}

function calculateCollaborationPerformance(m: PerformanceMetrics): number {
  // Baseado em interações com NPCs - coletado separadamente
  return npcInteractionScore;
}
```

### Minigames e Mapeamento de Competências

| Minigame | Eixo Primário | Eixo Secundário | Métrica Principal |
|----------|---------------|-----------------|-------------------|
| QuizGame | Execução | - | Precisão de respostas |
| MemoryGame | Execução | Inovação | Velocidade + Padrões |
| PuzzleGame | Inovação | Execução | Soluções alternativas |
| TypingGame | Execução | Resiliência | Velocidade sob pressão |
| SnakeGame | Resiliência | Execução | Persistência após falha |
| TetrisGame | Execução | Inovação | Planejamento + Adaptação |
| WhackAMoleGame | Resiliência | - | Reação sob pressão |

---

## 🎯 Sistema de Objetivos

### Tipos de Objetivos

```typescript
type ObjectiveCategory = 
  | 'personal'      // Definido pelo jogador
  | 'suggested'     // Sugerido pelo sistema
  | 'hidden'        // Descoberto durante gameplay
  | 'challenge';    // Desafios opcionais

interface Objective {
  id: string;
  category: ObjectiveCategory;
  name: string;
  description: string;
  
  // Condições
  conditions: ObjectiveCondition[];
  deadline?: 'before_crisis' | 'during_crisis' | 'end_game';
  
  // Impacto no Perfil
  gpiImpact: GPIImpact;
  discAlignment: ('D' | 'I' | 'S' | 'C')[];
  bigFiveAlignment: ('O' | 'C' | 'E' | 'A' | 'N')[];
  
  // Tracking
  progress: number;       // 0-100
  isSelected: boolean;    // Jogador optou por este objetivo
  isCompleted: boolean;
}

interface ObjectiveCondition {
  type: 'interact' | 'complete' | 'explore' | 'avoid' | 'time' | 'score';
  target: string;
  value?: number;
  comparison?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}
```

### Catálogo de Objetivos Sugeridos

#### Objetivos de Execução

| ID | Nome | Condição | Trade-off |
|----|------|----------|-----------|
| `OBJ_E01` | Speedrunner | Completar em < 30min | -Exploração, -Colaboração |
| `OBJ_E02` | Perfeccionista | 100% precisão em minigames | -Velocidade |
| `OBJ_E03` | Líder Eficiente | Concluir 3 jornadas principais primeiro | -Jornadas secundárias |

#### Objetivos de Colaboração

| ID | Nome | Condição | Trade-off |
|----|------|----------|-----------|
| `OBJ_C01` | Amigo de Todos | Interagir positivamente com todos os NPCs | -Tempo, -Execução |
| `OBJ_C02` | Diplomata | Resolver 3 conflitos entre NPCs | -Foco pessoal |
| `OBJ_C03` | Mentor | Ajudar 5 NPCs a completar suas tarefas | -Próprias tarefas |

#### Objetivos de Resiliência

| ID | Nome | Condição | Trade-off |
|----|------|----------|-----------|
| `OBJ_R01` | Imbatível | Não desistir de nenhum minigame | -Eficiência |
| `OBJ_R02` | Mestre da Pressão | 90%+ score em eventos cronometrados | -Exploração |
| `OBJ_R03` | Fênix | Falhar e retornar 5x mais forte | -Consistência |

#### Objetivos de Inovação

| ID | Nome | Condição | Trade-off |
|----|------|----------|-----------|
| `OBJ_I01` | Explorador | Descobrir todas as áreas ocultas | -Foco em objetivos |
| `OBJ_I02` | Hacker | Resolver 3 puzzles de forma alternativa | -Tempo |
| `OBJ_I03` | Rebelde | Desobedecer 3 ordens de forma criativa | -Conformidade |

### Seleção de Objetivos pelo Jogador

```typescript
interface ObjectiveSelection {
  // Jogador escolhe no início
  primaryObjective: string;    // Obrigatório
  secondaryObjectives: string[]; // Máximo 2
  
  // Sistema sugere baseado no comportamento inicial
  suggestedObjectives: string[];
  
  // Desbloqueados durante o jogo
  discoveredObjectives: string[];
}
```

### Peso dos Objetivos no Perfil Final

```typescript
const objectiveWeights = {
  personal: {
    primary: 0.15,    // 15% do peso total
    secondary: 0.10   // 10% do peso total (cada)
  },
  completed: 1.0,     // 100% do valor se completado
  partial: 0.5,       // 50% do valor se > 50% progresso
  attempted: 0.25     // 25% do valor se tentou mas falhou
};
```

---

## 👥 Sistema de NPCs

### Arquétipos de NPC por Perfil DISC

```typescript
interface NPCArchetype {
  id: string;
  name: string;
  discProfile: {
    primary: 'D' | 'I' | 'S' | 'C';
    secondary?: 'D' | 'I' | 'S' | 'C';
  };
  bigFiveProfile: {
    O: number; // 1-5
    C: number;
    E: number;
    A: number;
    N: number;
  };
  
  // Comportamento
  interactionStyle: InteractionStyle;
  conflictTriggers: string[];
  cooperationTriggers: string[];
  
  // Papel no Jogo
  journeyConnections: string[];
  dilemmasInvolved: string[];
}

type InteractionStyle = 
  | 'directive'      // D - Dá ordens, espera resultados
  | 'enthusiastic'   // I - Animado, busca conexão
  | 'supportive'     // S - Calmo, oferece ajuda
  | 'analytical';    // C - Detalhista, questiona
```

### Catálogo de NPCs Necessários

#### NPCs Principais (Essenciais para Jornadas Main)

| ID | Nome | Perfil DISC | Papel | Localização |
|----|------|-------------|-------|-------------|
| `NPC001` | Chefe Silva | D/C | Dá ordens, cria pressão | Sala de Reunião |
| `NPC002` | Ana (Colega) | I/S | Precisa de ajuda, oferece suporte | Escritório |
| `NPC003` | Carlos (TI) | C/S | Fornece soluções técnicas | Sala de TI |
| `NPC004` | Dra. Marta | S/I | Mediadora de conflitos | RH |
| `NPC005` | João (Segurança) | D/S | Bloqueia/libera rotas | Hall |
| `NPC006` | JANUS (IA) | C/D | Antagonista, testa resiliência | Todos |

#### NPCs Secundários (Jornadas Side/Hidden)

| ID | Nome | Perfil DISC | Interação Principal | Trade-off |
|----|------|-------------|---------------------|-----------|
| `NPC101` | Estagiário Pedro | S/I | Precisa de mentoria | Tempo vs Colaboração |
| `NPC102` | Diretora Helena | D/C | Oferece atalho antiético | Execução vs Ética |
| `NPC103` | Zelador Roberto | S/A | Conhece passagens secretas | Exploração vs Tempo |
| `NPC104` | Visitante Suspeito | I/D | Informação duvidosa | Inovação vs Segurança |
| `NPC105` | Colega em Pânico | N alto | Precisa ser acalmado | Resiliência vs Execução |
| `NPC106` | Rival Marcos | D/I | Competição direta | Execução vs Colaboração |

### Matriz de Interações NPC ↔ Jogador

```
                    Jogador Execução    Jogador Colab    Jogador Resil    Jogador Inov
NPC-D (Dominância)  ✓ Respeito mútuo    ✗ Conflito       ± Teste          ± Desafio
NPC-I (Influência)  ± Impaciente        ✓ Conexão        ✓ Suporte        ✓ Entusiasmo
NPC-S (Estabilidade)✗ Pressão demais    ✓ Harmonia       ✓ Compreensão    ± Resistência
NPC-C (Conformidade)✓ Alinhamento       ± Detalhismo     ± Análise        ✗ Conflito método
```

### Diálogos Force-Choice por NPC

```typescript
interface NPCDialogTree {
  npcId: string;
  context: 'calm' | 'crisis';
  branches: DialogBranch[];
}

interface DialogBranch {
  trigger: string;
  playerOptions: PlayerOption[];
}

interface PlayerOption {
  text: string;
  gpiImpact: GPIImpact;
  
  // Force-Choice: sempre um trade-off
  benefits: GPIAxis[];    // Eixos beneficiados
  costs: GPIAxis[];       // Eixos prejudicados
  
  // Alinhamento
  discBonus: ('D' | 'I' | 'S' | 'C')[];
  discPenalty: ('D' | 'I' | 'S' | 'C')[];
  
  // Consequências
  unlocksJourney?: string;
  blocksJourney?: string;
  npcRelationChange: number; // -2 a +2
}
```

---

## 📊 Fórmula de Cálculo Final do Perfil

### Componentes do Score

```typescript
interface FinalProfile {
  // Scores por Eixo (0-100)
  execution: number;
  collaboration: number;
  resilience: number;
  innovation: number;
  
  // Perfis Derivados
  discProfile: {
    D: number;
    I: number;
    S: number;
    C: number;
    primaryType: 'D' | 'I' | 'S' | 'C';
    secondaryType: 'D' | 'I' | 'S' | 'C';
  };
  
  bigFiveProfile: {
    O: number;
    C: number;
    E: number;
    A: number;
    N: number;
  };
  
  // Análise de Dissonância
  dissonance: {
    overall: number;          // 0-100
    byAxis: GPIScore;         // Dissonância por eixo
    plannedProfile: GPIScore; // Perfil calmo
    instinctiveProfile: GPIScore; // Perfil sob pressão
  };
  
  // Metadados
  completedJourneys: string[];
  selectedObjectives: string[];
  performanceMetrics: PerformanceMetrics;
}
```

### Fórmula de Cálculo

```typescript
function calculateFinalProfile(gameData: GameData): FinalProfile {
  const weights = {
    interactions: 0.30,    // 30%
    journeys: 0.25,        // 25%
    performance: 0.25,     // 25%
    objectives: 0.20       // 20%
  };
  
  // Calcular cada componente
  const interactionScore = calculateInteractionScore(gameData.interactions);
  const journeyScore = calculateJourneyScore(gameData.journeys);
  const performanceScore = calculatePerformanceScore(gameData.metrics);
  const objectiveScore = calculateObjectiveScore(gameData.objectives);
  
  // Combinar com pesos
  const finalGPI = {
    execution: weighted([
      interactionScore.execution,
      journeyScore.execution,
      performanceScore.execution,
      objectiveScore.execution
    ], weights),
    collaboration: weighted([...], weights),
    resilience: weighted([...], weights),
    innovation: weighted([...], weights)
  };
  
  // Derivar DISC e Big Five
  const discProfile = deriveDiscFromGPI(finalGPI);
  const bigFiveProfile = deriveBigFiveFromGPI(finalGPI, gameData);
  
  // Calcular dissonância
  const dissonance = calculateDissonance(
    gameData.calmDecisions,
    gameData.pressureDecisions
  );
  
  return { ...finalGPI, discProfile, bigFiveProfile, dissonance };
}
```

### Derivação DISC a partir do GPI

```typescript
function deriveDiscFromGPI(gpi: GPIScore): DISCProfile {
  return {
    D: (gpi.execution * 0.6) + (gpi.innovation * 0.3) + (gpi.resilience * 0.1),
    I: (gpi.collaboration * 0.7) + (gpi.innovation * 0.2) + (gpi.resilience * 0.1),
    S: (gpi.collaboration * 0.5) + (gpi.resilience * 0.3) + (gpi.execution * 0.2),
    C: (gpi.execution * 0.7) + (gpi.resilience * 0.2) + (gpi.collaboration * 0.1)
  };
}
```

### Derivação Big Five a partir do GPI + Dados Específicos

```typescript
function deriveBigFiveFromGPI(gpi: GPIScore, data: GameData): BigFiveProfile {
  return {
    O: (gpi.innovation * 0.8) + (gpi.collaboration * 0.2),
    C: (gpi.execution * 0.9) + (gpi.resilience * 0.1),
    E: (gpi.collaboration * 0.6) + (gpi.innovation * 0.3) + (gpi.resilience * 0.1),
    A: (gpi.collaboration * 0.8) + (gpi.resilience * 0.2),
    N: invertScale(gpi.resilience * 0.7 + gpi.execution * 0.3)
  };
}
```

---

## ⚖️ Balanceamento e Validação

### Regras de Balanceamento

1. **Nenhuma Escolha Neutra**: Toda decisão deve impactar pelo menos 2 eixos (1 positivo, 1 negativo)

2. **Distribuição de Oportunidades**: Cada eixo deve ter quantidade equivalente de oportunidades de pontuação
   - Execução: ~25% das interações
   - Colaboração: ~25% das interações
   - Resiliência: ~25% das interações
   - Inovação: ~25% das interações

3. **Jornadas Balanceadas**: 
   - Mínimo 1 jornada principal por eixo
   - Mínimo 2 jornadas secundárias por eixo
   - Mínimo 1 jornada oculta por eixo

4. **NPCs Distribuídos**:
   - Mínimo 2 NPCs por perfil DISC primário
   - Cada NPC deve participar de pelo menos 2 jornadas

5. **Minigames Equilibrados**:
   - Cada eixo deve ser testado por pelo menos 2 minigames
   - Dificuldade progressiva consistente

### Checklist de Validação

```typescript
interface BalanceValidation {
  // Distribuição de Interações
  interactionsPerAxis: {
    execution: number;
    collaboration: number;
    resilience: number;
    innovation: number;
  };
  isBalanced: boolean; // Variação < 10%
  
  // Cobertura de Jornadas
  journeysPerAxis: {
    main: AxisCount;
    side: AxisCount;
    hidden: AxisCount;
  };
  hasMinimumCoverage: boolean;
  
  // NPCs
  npcsPerDISCType: { D: number; I: number; S: number; C: number };
  hasMinimumNPCs: boolean;
  
  // Trade-offs
  tradeOffMatrix: TradeOffCount[][];
  allTradeOffsCovered: boolean;
}
```

### Métricas de Qualidade

| Métrica | Mínimo Aceitável | Ideal |
|---------|------------------|-------|
| Interações por eixo | 20 | 30+ |
| Variação entre eixos | < 15% | < 5% |
| Jornadas principais | 4 (1/eixo) | 6+ |
| Jornadas secundárias | 8 (2/eixo) | 12+ |
| Jornadas ocultas | 4 (1/eixo) | 8+ |
| NPCs principais | 6 | 8+ |
| NPCs secundários | 6 | 10+ |
| Trade-offs únicos | 12 | 16+ |
| Dilemas análogos (calm/crisis) | 8 pares | 12+ pares |

---

## 📁 Estrutura de Dados Sugerida

### Arquivos de Configuração

```
src/
├── assets/
│   └── DBQuestions/
│       ├── questions.json          # DISC questions
│       ├── questions.ts            # Big Five questions
│       ├── journeys.json           # Definição de jornadas
│       ├── objectives.json         # Catálogo de objetivos
│       └── balance-config.json     # Pesos e configurações
├── data/
│   ├── npcs/
│   │   ├── npc-archetypes.json     # Arquétipos de NPCs
│   │   └── npc-dialogs.json        # Árvores de diálogo
│   ├── interactions/
│   │   ├── force-choice-matrix.json # Matriz de trade-offs
│   │   └── dilemmas.json           # Dilemas morais
│   └── minigames/
│       └── minigame-mapping.json   # Mapeamento competências
└── services/
    └── ProfileCalculator.js        # Serviço de cálculo
```

---

## 🔄 Próximos Passos

1. **Criar arquivos de dados**:
   - [ ] `journeys.json` - Definir todas as jornadas
   - [ ] `objectives.json` - Catalogar objetivos
   - [ ] `npc-archetypes.json` - Definir NPCs
   - [ ] `dilemmas.json` - Criar dilemas force-choice

2. **Implementar serviços**:
   - [ ] `ProfileCalculator.js` - Cálculo do perfil final
   - [ ] `DissonanceAnalyzer.js` - Análise de dissonância
   - [ ] `BalanceValidator.js` - Validação de balanceamento

3. **Integrar com NPCs existentes**:
   - [ ] Mapear NPCs atuais para arquétipos
   - [ ] Criar árvores de diálogo force-choice

4. **Testar balanceamento**:
   - [ ] Simular múltiplos perfis de jogador
   - [ ] Validar distribuição de oportunidades
   - [ ] Ajustar pesos conforme necessário

---

## 📚 Referências

- GDD Principal: [gdd.md](../gdd.md)
- Informações Psicométricas: [infos.md](../infos.md)
- Questões DISC: [questions.json](../src/assets/DBQuestions/questions.json)
- Questões Big Five: [questions.ts](../src/assets/DBQuestions/questions.ts)
