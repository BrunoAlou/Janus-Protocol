# SPEC-002: Pipeline de Métricas GPI

## Metadata
- **ID**: SPEC-002
- **Status**: Draft
- **Priority**: Critical
- **Depends On**: SPEC-001 (Sistema de Dilemas)
- **Enables**: SPEC-003 (Análise e Relatório)

---

## 1. Objetivo

Definir como cada ação do jogador alimenta os 4 eixos GPI (Execução, Colaboração, Resiliência, Inovação) com justificativa científica para cada mapeamento.

---

## 2. Fontes de Dados

### 2.1 Categorias de Ação

| Categoria | Fonte | Peso Base |
|-----------|-------|-----------|
| **Dilemas** | DilemmaManager | 1.0 (máximo) |
| **Jornadas** | JourneyManager | 0.8 |
| **Minigames** | MinigameManager | 0.6 |
| **Exploração** | PlayerController | 0.3 |
| **Interações NPC** | InteractionManager | 0.5 |

### 2.2 Estrutura de Evento GPI

```typescript
interface GPIEvent {
  source: 'dilemma' | 'journey' | 'minigame' | 'exploration' | 'npc';
  sourceId: string;
  timestamp: number;
  context: 'calm' | 'timed' | 'crisis';
  
  impact: {
    execution: number;
    collaboration: number;
    resilience: number;
    innovation: number;
  };
  
  weight: number;        // 0.0 a 1.0
  confidence: number;    // 0.0 a 1.0 (qualidade do dado)
  
  metadata: {
    responseTime?: number;
    attempts?: number;
    helpRequested?: boolean;
    alternativePathTaken?: boolean;
  };
}
```

---

## 3. Mapeamento Ação → Traço

### 3.1 Execução (Conscienciosidade)

| Ação | Impacto | Justificativa |
|------|---------|---------------|
| Completar tarefa no prazo | +2 | BARRICK & MOUNT (1991): Conscienciosidade prediz desempenho |
| Seguir procedimento padrão | +1 | Disciplina e organização |
| Abandonar tarefa | -2 | Falta de persistência orientada a meta |
| Minigame: score alto | +1 | Foco e execução eficiente |
| Ignorar objetivo secundário | +1/-1 | Priorização (positivo) vs rigidez (negativo) |

### 3.2 Colaboração (Amabilidade + Extroversão)

| Ação | Impacto | Justificativa |
|------|---------|---------------|
| Ajudar NPC em dificuldade | +2 | Altruísmo e empatia |
| Compartilhar recurso | +1 | Cooperação |
| Ignorar pedido de ajuda | -2 | Baixa amabilidade |
| Escolher solução de grupo | +1 | Trabalho em equipe |
| Interagir com múltiplos NPCs | +1 | Sociabilidade |

### 3.3 Resiliência (Neuroticismo Inverso)

| Ação | Impacto | Justificativa |
|------|---------|---------------|
| Tentar novamente após falha | +2 | Persistência sob adversidade |
| Manter performance sob pressão | +2 | Estabilidade emocional |
| Desistir após 1ª falha | -2 | Baixa tolerância a frustração |
| Completar sob tempo crítico | +1 | Gestão de estresse |
| Pedir ajuda estratégica | +1 | Adaptabilidade |

### 3.4 Inovação (Abertura à Experiência)

| Ação | Impacto | Justificativa |
|------|---------|---------------|
| Explorar área opcional | +2 | Curiosidade |
| Usar rota alternativa | +1 | Busca por novidade |
| Solução não-convencional | +2 | Criatividade |
| Seguir apenas caminho óbvio | -1 | Baixa exploração |
| Experimentar mecânica nova | +1 | Abertura a experiências |

---

## 4. Cálculo do Perfil

### 4.1 Fórmula de Agregação

```javascript
function calculateAxisScore(events, axis) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const event of events) {
    const impact = event.impact[axis];
    const weight = event.weight * event.confidence;
    
    weightedSum += impact * weight;
    totalWeight += weight;
  }
  
  // Normalizar para escala 0-100
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return normalize(rawScore, -2, 2, 0, 100);
}
```

### 4.2 Separação por Contexto

```javascript
function calculateProfiles(events) {
  const calmEvents = events.filter(e => e.context === 'calm');
  const timedEvents = events.filter(e => e.context !== 'calm');
  
  return {
    planned: {  // Perfil Planejado (calm)
      execution: calculateAxisScore(calmEvents, 'execution'),
      collaboration: calculateAxisScore(calmEvents, 'collaboration'),
      resilience: calculateAxisScore(calmEvents, 'resilience'),
      innovation: calculateAxisScore(calmEvents, 'innovation')
    },
    instinctive: {  // Perfil Instintivo (timed/crisis)
      execution: calculateAxisScore(timedEvents, 'execution'),
      collaboration: calculateAxisScore(timedEvents, 'collaboration'),
      resilience: calculateAxisScore(timedEvents, 'resilience'),
      innovation: calculateAxisScore(timedEvents, 'innovation')
    }
  };
}
```

### 4.3 Score de Dissonância

```javascript
function calculateDissonanceScore(profiles) {
  const axes = ['execution', 'collaboration', 'resilience', 'innovation'];
  const dissonance = {};
  
  for (const axis of axes) {
    dissonance[axis] = Math.abs(
      profiles.planned[axis] - profiles.instinctive[axis]
    );
  }
  
  // Score total de dissonância (média ponderada)
  dissonance.total = axes.reduce((sum, axis) => 
    sum + dissonance[axis], 0) / axes.length;
  
  return dissonance;
}
```

---

## 5. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/metrics/GPICalculator.js` | CRIAR | Cálculo de scores GPI |
| `src/metrics/GPIEventCollector.js` | CRIAR | Coleta e agregação de eventos |
| `src/metrics/DissonanceAnalyzer.js` | CRIAR | Análise de dissonância |
| `src/data/metrics/gpi-mappings.json` | CRIAR | Mapeamentos ação→traço |
| `src/data/metrics/weights.json` | CRIAR | Pesos por categoria |

---

## 6. Telemetria Agregada

```javascript
// Evento de atualização de perfil
{
  event_type: 'gpi_profile_update',
  timestamp: Date.now(),
  session_id: string,
  data: {
    profiles: {
      planned: { execution, collaboration, resilience, innovation },
      instinctive: { execution, collaboration, resilience, innovation }
    },
    dissonance: {
      execution, collaboration, resilience, innovation, total
    },
    event_count: {
      calm: number,
      timed: number,
      total: number
    }
  }
}
```

---

## 7. Critérios de Aceitação

- [ ] Todos os eventos GPI têm source identificado
- [ ] Mapeamentos documentados em JSON
- [ ] Pesos configuráveis externamente
- [ ] Cálculo separado calm/timed funcional
- [ ] Score de dissonância calculado corretamente
- [ ] Perfil atualizado em tempo real
- [ ] Validação de confidence > 0

---

## 8. Justificativa Acadêmica

O mapeamento segue a taxonomia do Big Five (COSTA & McCRAE, 1992) e evidências de validade preditiva (BARRICK & MOUNT, 1991). A separação por contexto permite operacionalizar o conceito de dissonância comportamental, central na proposta do TCC.

**Referências**:
- BARRICK, M. R. & MOUNT, M. K. (1991). Big Five and job performance: meta-analysis.
- COSTA, P. T. & McCRAE, R. R. (1992). NEO PI-R professional manual.
