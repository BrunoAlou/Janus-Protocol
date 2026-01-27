# Janus-Protocol - Índice de Especificações

## 📋 Visão Geral

Este diretório contém as especificações técnicas do projeto Janus-Protocol, um TCC sobre Game-Based Assessment.

---

## 📚 Documentos

### Constitution
- [constitution.md](constitution.md) - Princípios fundamentais do projeto

### Especificações Técnicas

| # | Spec | Prioridade | Status | Descrição |
|---|------|------------|--------|-----------|
| 01 | [Sistema de Dilemas](specs/01-sistema-dilemas.spec.md) | 🔴 Critical | Draft | Force-choice com pares calm/timed |
| 02 | [Pipeline de Métricas](specs/02-pipeline-metricas.spec.md) | 🔴 Critical | Draft | Mapeamento ação → GPI |
| 03 | [Análise e Relatório](specs/03-analise-relatorio.spec.md) | 🟡 High | Draft | Gráfico radar e interpretação |
| 04 | [Exportação Acadêmica](specs/04-exportacao-academica.spec.md) | 🟡 High | Draft | JSON/CSV para análise estatística |
| 05 | [NPCs e Elementos](specs/05-npcs-elementos.spec.md) | 🟡 High | Draft | Sistema data-driven de NPCs |
| 06 | [Sistema de Jornadas](specs/06-sistema-jornadas.spec.md) | 🟡 High | Draft | Quests e progressão |
| 07 | [Liberação de Minigames](specs/07-liberacao-minigames.spec.md) | 🟢 Medium | Draft | Desbloqueio progressivo |

---

## 🔗 Dependências entre Specs

```
Constitution
    │
    ├── SPEC-001 (Dilemas) ────────┐
    │       │                      │
    │       ▼                      │
    ├── SPEC-005 (NPCs) ──────────►├── SPEC-002 (Métricas)
    │       │                      │       │
    │       ▼                      │       ▼
    └── SPEC-006 (Jornadas) ──────►├── SPEC-003 (Relatório)
            │                      │       │
            ▼                      │       ▼
        SPEC-007 (Minigames) ─────►└── SPEC-004 (Exportação)
```

---

## 🎯 Ordem de Implementação Sugerida

### Fase 1: Fundação (Semana 1-2)
1. ✅ Constitution definida
2. [ ] SPEC-005: ElementManager expandido
3. [ ] SPEC-001: DilemmaManager básico

### Fase 2: Core Loop (Semana 3-4)
4. [ ] SPEC-006: JourneyManager
5. [ ] SPEC-007: MinigameManager expandido
6. [ ] SPEC-002: GPICalculator

### Fase 3: Análise (Semana 5-6)
7. [ ] SPEC-003: ResultsScene
8. [ ] SPEC-004: AcademicExporter

### Fase 4: Polimento (Semana 7-8)
9. [ ] Testes de integração
10. [ ] Coleta de dados piloto
11. [ ] Ajustes de balanceamento

---

## 📊 Métricas de Progresso

| Área | Arquivos | Implementados | % |
|------|----------|---------------|---|
| Managers | 5 | 2 | 40% |
| Scenes | 3 | 1 | 33% |
| Data JSON | 8 | 3 | 38% |
| UI Components | 4 | 0 | 0% |
| Export | 3 | 0 | 0% |

---

## 📝 Notas

- Todas as specs seguem o princípio **Data-Driven**
- Telemetria é obrigatória em toda interação significativa
- Trade-offs GPI devem ser validados antes de implementar
- Referências acadêmicas incluídas para o TCC
