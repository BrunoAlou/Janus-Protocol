# SPEC-003: Análise e Relatório

## Metadata
- **ID**: SPEC-003
- **Status**: Draft
- **Priority**: High
- **Depends On**: SPEC-002 (Pipeline de Métricas)
- **Enables**: SPEC-004 (Exportação Acadêmica)

---

## 1. Objetivo

Implementar o processamento estatístico dos dados coletados e a visualização do perfil final do jogador, incluindo gráfico radar e score de dissonância.

---

## 2. Componentes do Relatório

### 2.1 Tela de Resultados

```
┌─────────────────────────────────────────────────────────────┐
│                    PERFIL JANUS                             │
│                                                             │
│   ┌─────────────────────┐    ┌─────────────────────────┐   │
│   │   GRÁFICO RADAR     │    │  SCORE DE DISSONÂNCIA   │   │
│   │                     │    │                         │   │
│   │      Execução       │    │  Total: 23.5%           │   │
│   │         ●           │    │                         │   │
│   │   Inn ●   ● Col     │    │  Execução:     12%  ▓▓░ │   │
│   │         ●           │    │  Colaboração:  45%  ▓▓▓▓│   │
│   │     Resiliência     │    │  Resiliência:  18%  ▓▓░ │   │
│   │                     │    │  Inovação:     19%  ▓▓░ │   │
│   │  ── Planejado       │    │                         │   │
│   │  ── Instintivo      │    └─────────────────────────┘   │
│   └─────────────────────┘                                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  INTERPRETAÇÃO                                       │   │
│   │                                                      │   │
│   │  Seu perfil mostra alta consistência em Execução,   │   │
│   │  mas sua Colaboração varia significativamente sob   │   │
│   │  pressão. Isso sugere que...                        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   [Exportar PDF]  [Exportar JSON]  [Ver Detalhes]          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Estrutura de Dados do Relatório

```typescript
interface ProfileReport {
  userId: string;
  sessionId: string;
  generatedAt: number;
  gameVersion: string;
  
  profiles: {
    planned: GPIProfile;
    instinctive: GPIProfile;
    combined: GPIProfile;  // Média ponderada
  };
  
  dissonance: {
    execution: number;
    collaboration: number;
    resilience: number;
    innovation: number;
    total: number;
    interpretation: string;
  };
  
  statistics: {
    totalEvents: number;
    calmEvents: number;
    timedEvents: number;
    totalPlayTime: number;
    dilemmasAnswered: number;
    journeysCompleted: number;
    minigamesPlayed: number;
  };
  
  breakdown: {
    bySource: Record<string, GPIImpactSummary>;
    byScene: Record<string, GPIImpactSummary>;
    timeline: GPITimelinePoint[];
  };
}

interface GPIProfile {
  execution: number;      // 0-100
  collaboration: number;
  resilience: number;
  innovation: number;
}
```

---

## 3. Gráfico Radar

### 3.1 Implementação com Canvas

```javascript
class RadarChart {
  constructor(canvas, options = {}) {
    this.ctx = canvas.getContext('2d');
    this.axes = ['Execução', 'Colaboração', 'Resiliência', 'Inovação'];
    this.colors = {
      planned: '#4CAF50',     // Verde
      instinctive: '#FF5722', // Laranja
      grid: '#E0E0E0'
    };
  }
  
  draw(planned, instinctive) {
    this.drawGrid();
    this.drawPolygon(planned, this.colors.planned, 'Planejado');
    this.drawPolygon(instinctive, this.colors.instinctive, 'Instintivo');
    this.drawLabels();
    this.drawLegend();
  }
}
```

### 3.2 Responsividade

- Mínimo: 300x300px
- Máximo: 500x500px
- Escala automática com container

---

## 4. Interpretação Automática

### 4.1 Regras de Interpretação

```javascript
const interpretationRules = {
  dissonance: {
    low: {
      threshold: 15,
      text: "Seu comportamento é consistente independente da pressão."
    },
    moderate: {
      threshold: 30,
      text: "Você apresenta variação moderada sob pressão."
    },
    high: {
      threshold: 100,
      text: "Seu comportamento muda significativamente sob pressão."
    }
  },
  
  axes: {
    execution: {
      high: "Você demonstra forte orientação para resultados e conclusão de tarefas.",
      low: "Você pode priorizar outros aspectos em detrimento da eficiência."
    },
    collaboration: {
      high: "Você valoriza o trabalho em equipe e o bem-estar coletivo.",
      low: "Você tende a focar em objetivos individuais."
    },
    resilience: {
      high: "Você mantém estabilidade emocional sob pressão.",
      low: "Situações de estresse podem impactar suas decisões."
    },
    innovation: {
      high: "Você busca ativamente soluções criativas e alternativas.",
      low: "Você prefere abordagens testadas e convencionais."
    }
  }
};
```

### 4.2 Geração de Texto

```javascript
function generateInterpretation(report) {
  const paragraphs = [];
  
  // Parágrafo 1: Visão geral da dissonância
  const dissonanceLevel = getDissonanceLevel(report.dissonance.total);
  paragraphs.push(interpretationRules.dissonance[dissonanceLevel].text);
  
  // Parágrafo 2: Eixo mais consistente
  const mostConsistent = findMostConsistent(report.dissonance);
  paragraphs.push(`Seu eixo mais consistente é ${mostConsistent}.`);
  
  // Parágrafo 3: Eixo com maior dissonância
  const mostDissonant = findMostDissonant(report.dissonance);
  paragraphs.push(`Maior variação observada em ${mostDissonant}.`);
  
  // Parágrafo 4: Perfil dominante
  const dominant = findDominantAxis(report.profiles.combined);
  paragraphs.push(interpretationRules.axes[dominant].high);
  
  return paragraphs.join(' ');
}
```

---

## 5. Cena de Resultados

### 5.1 ResultsScene.js

```javascript
class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }
  
  init(data) {
    this.report = data.report;
  }
  
  create() {
    this.createBackground();
    this.createRadarChart();
    this.createDissonancePanel();
    this.createInterpretation();
    this.createExportButtons();
    this.createStatistics();
  }
  
  createExportButtons() {
    // Botão PDF
    this.add.text(100, 500, '[Exportar PDF]')
      .setInteractive()
      .on('pointerdown', () => this.exportPDF());
    
    // Botão JSON
    this.add.text(250, 500, '[Exportar JSON]')
      .setInteractive()
      .on('pointerdown', () => this.exportJSON());
  }
}
```

---

## 6. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/scenes/ResultsScene.js` | CRIAR | Cena de resultados |
| `src/ui/components/RadarChart.js` | CRIAR | Componente gráfico radar |
| `src/ui/components/DissonanceBar.js` | CRIAR | Barra de dissonância |
| `src/analysis/ReportGenerator.js` | CRIAR | Geração do relatório |
| `src/analysis/Interpreter.js` | CRIAR | Interpretação automática |
| `src/data/config/interpretations.json` | CRIAR | Textos de interpretação |

---

## 7. Critérios de Aceitação

- [ ] Gráfico radar exibe ambos os perfis
- [ ] Score de dissonância calculado e exibido
- [ ] Interpretação gerada automaticamente
- [ ] Exportação PDF funcional
- [ ] Exportação JSON funcional
- [ ] Estatísticas de sessão exibidas
- [ ] Responsivo em diferentes resoluções
- [ ] Acessível (contraste, fontes legíveis)

---

## 8. Justificativa Acadêmica

A visualização em gráfico radar permite comparação intuitiva entre perfis (CHAMBERS et al., 1983). A interpretação automática baseia-se em limiares estatísticos e descrições validadas do Big Five (COSTA & McCRAE, 1992).

**Referências**:
- CHAMBERS, J. M. et al. (1983). Graphical Methods for Data Analysis.
- COSTA, P. T. & McCRAE, R. R. (1992). NEO PI-R professional manual.
