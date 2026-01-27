# SPEC-004: Exportação Acadêmica

## Metadata
- **ID**: SPEC-004
- **Status**: Draft
- **Priority**: High
- **Depends On**: SPEC-003 (Análise e Relatório)
- **Enables**: Análise estatística no TCC

---

## 1. Objetivo

Exportar dados coletados em formatos estruturados para análise acadêmica, permitindo validação estatística da hipótese do TCC.

---

## 2. Formatos de Exportação

### 2.1 JSON Estruturado (Completo)

```json
{
  "export_metadata": {
    "version": "1.0.0",
    "exported_at": "2026-01-22T10:30:00Z",
    "game_version": "1.0.0",
    "schema": "janus-protocol-academic-v1"
  },
  
  "participant": {
    "id": "P001",
    "session_id": "S001",
    "anonymized": true,
    "consent_given": true,
    "demographics": {
      "age_range": "18-25",
      "gender": "not_specified",
      "education_level": "undergraduate"
    }
  },
  
  "session": {
    "start_time": "2026-01-22T10:00:00Z",
    "end_time": "2026-01-22T10:28:00Z",
    "duration_seconds": 1680,
    "completed": true
  },
  
  "profiles": {
    "planned": {
      "execution": 72,
      "collaboration": 58,
      "resilience": 65,
      "innovation": 81
    },
    "instinctive": {
      "execution": 68,
      "collaboration": 42,
      "resilience": 71,
      "innovation": 75
    }
  },
  
  "dissonance": {
    "execution": 4,
    "collaboration": 16,
    "resilience": 6,
    "innovation": 6,
    "total": 8
  },
  
  "events": [
    {
      "id": "EVT001",
      "type": "dilemma_choice",
      "timestamp": "2026-01-22T10:05:23Z",
      "dilemma_id": "DLM001",
      "context": "calm",
      "option_chosen": "DLM001_A",
      "response_time_ms": 4523,
      "gpi_impact": { "execution": 2, "collaboration": -2 }
    }
  ],
  
  "journeys": {
    "completed": ["J001", "J003"],
    "in_progress": ["J002"],
    "not_started": ["J004", "J005"]
  },
  
  "minigames": [
    {
      "id": "QuizGame",
      "attempts": 1,
      "score": 85,
      "time_seconds": 120,
      "context": "calm"
    }
  ]
}
```

### 2.2 CSV para Análise Estatística

#### 2.2.1 Arquivo: `participants.csv`

```csv
participant_id,session_id,age_range,gender,education,duration_s,completed
P001,S001,18-25,not_specified,undergraduate,1680,true
P002,S002,26-35,female,graduate,1450,true
```

#### 2.2.2 Arquivo: `profiles.csv`

```csv
participant_id,profile_type,execution,collaboration,resilience,innovation
P001,planned,72,58,65,81
P001,instinctive,68,42,71,75
P002,planned,65,78,55,70
P002,instinctive,60,65,58,68
```

#### 2.2.3 Arquivo: `dissonance.csv`

```csv
participant_id,execution,collaboration,resilience,innovation,total
P001,4,16,6,6,8
P002,5,13,3,2,5.75
```

#### 2.2.4 Arquivo: `events.csv`

```csv
participant_id,event_id,type,timestamp,context,dilemma_id,option,response_ms,exec,collab,resil,innov
P001,EVT001,dilemma_choice,2026-01-22T10:05:23Z,calm,DLM001,DLM001_A,4523,2,-2,0,0
P001,EVT002,dilemma_choice,2026-01-22T10:12:45Z,timed,DLM001_T,DLM001_T_B,1823,-1,2,0,0
```

#### 2.2.5 Arquivo: `dilemma_pairs.csv` (Análise de Dissonância por Dilema)

```csv
participant_id,pair_id,calm_option,timed_option,calm_response_ms,timed_response_ms,choice_changed,axis_affected
P001,DLM001,DLM001_A,DLM001_T_B,4523,1823,true,collaboration
P001,DLM002,DLM002_B,DLM002_T_B,3200,2100,false,none
```

---

## 3. Anonimização

### 3.1 Dados Removidos
- Nome real
- Email
- IP
- Identificadores pessoais

### 3.2 Dados Preservados (Anonimizados)
- ID sequencial (P001, P002...)
- Faixas demográficas (não valores exatos)
- Todos os dados comportamentais

### 3.3 Implementação

```javascript
function anonymizeExport(rawData) {
  return {
    ...rawData,
    participant: {
      id: generateSequentialId(),
      session_id: hashSessionId(rawData.session_id),
      anonymized: true,
      demographics: {
        age_range: getAgeRange(rawData.age),  // Ex: 18-25
        gender: rawData.gender || 'not_specified',
        education_level: rawData.education
      }
    }
  };
}
```

---

## 4. API de Exportação

### 4.1 Endpoints Backend

```javascript
// GET /api/export/participant/:id
// Exporta dados de um participante

// GET /api/export/study/:studyId
// Exporta todos os dados de um estudo

// GET /api/export/aggregate
// Exporta estatísticas agregadas
```

### 4.2 Formatos Suportados

| Endpoint | Formatos |
|----------|----------|
| `/participant/:id` | JSON, CSV-ZIP |
| `/study/:studyId` | JSON, CSV-ZIP |
| `/aggregate` | JSON |

---

## 5. Exportação no Frontend

### 5.1 Botão na ResultsScene

```javascript
async exportForAcademic(format = 'json') {
  const report = this.generateFullReport();
  const anonymized = anonymizeExport(report);
  
  if (format === 'json') {
    downloadJSON(anonymized, `janus-export-${Date.now()}.json`);
  } else if (format === 'csv') {
    const csvBundle = generateCSVBundle(anonymized);
    downloadZIP(csvBundle, `janus-export-${Date.now()}.zip`);
  }
  
  // Registrar exportação na telemetria
  logAction('data_exported', { format, participant_id: anonymized.participant.id });
}
```

---

## 6. Validação de Dados

### 6.1 Schema JSON

```javascript
const exportSchema = {
  type: 'object',
  required: ['export_metadata', 'participant', 'session', 'profiles', 'events'],
  properties: {
    export_metadata: {
      type: 'object',
      required: ['version', 'exported_at', 'schema']
    },
    profiles: {
      type: 'object',
      required: ['planned', 'instinctive'],
      properties: {
        planned: { $ref: '#/definitions/gpiProfile' },
        instinctive: { $ref: '#/definitions/gpiProfile' }
      }
    }
  },
  definitions: {
    gpiProfile: {
      type: 'object',
      required: ['execution', 'collaboration', 'resilience', 'innovation'],
      properties: {
        execution: { type: 'number', minimum: 0, maximum: 100 },
        collaboration: { type: 'number', minimum: 0, maximum: 100 },
        resilience: { type: 'number', minimum: 0, maximum: 100 },
        innovation: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  }
};
```

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/export/AcademicExporter.js` | CRIAR | Classe de exportação |
| `src/export/Anonymizer.js` | CRIAR | Anonimização de dados |
| `src/export/CSVGenerator.js` | CRIAR | Geração de CSVs |
| `src/export/schemas/export.schema.json` | CRIAR | Schema de validação |
| `backend/routes/export.js` | CRIAR | Rotas de API |

---

## 8. Critérios de Aceitação

- [ ] Exportação JSON completa funcional
- [ ] Bundle CSV com todos os arquivos
- [ ] Anonimização aplicada corretamente
- [ ] Schema validado antes de exportar
- [ ] Download funciona no navegador
- [ ] API backend retorna dados corretos
- [ ] Dados suficientes para análise SPSS/R

---

## 9. Uso no TCC

### 9.1 Análises Estatísticas Possíveis

Com os dados exportados, o TCC pode realizar:

1. **Teste t pareado**: Comparar perfil planejado vs instintivo
2. **Correlação**: Dissonância vs tempo de resposta
3. **ANOVA**: Diferenças entre grupos demográficos
4. **Regressão**: Fatores preditores de dissonância

### 9.2 Exemplo de Análise em R

```r
# Carregar dados
profiles <- read.csv("profiles.csv")
dissonance <- read.csv("dissonance.csv")

# Teste t pareado para Colaboração
t.test(profiles$collaboration[profiles$profile_type == "planned"],
       profiles$collaboration[profiles$profile_type == "instinctive"],
       paired = TRUE)

# Correlação Dissonância x Tempo de Resposta
cor.test(events$response_ms, events$dissonance_impact)
```

---

## 10. Justificativa Acadêmica

A exportação estruturada permite replicabilidade (princípio científico fundamental) e análise estatística robusta. O formato CSV é compatível com SPSS, R e Excel, ferramentas comuns em pesquisa acadêmica.

**Referências**:
- APA (2020). Publication Manual of the American Psychological Association (7th ed.).
- SIOP (2018). Principles for validation and use of personnel selection procedures.
