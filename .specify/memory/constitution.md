# Janus-Protocol Constitution

## Visão do Projeto

**Janus-Protocol** é um TCC (Trabalho de Conclusão de Curso) que propõe **Game-Based Assessment** como alternativa aos testes psicométricos tradicionais, medindo perfil profissional através de comportamento observável em jogo.

### Pergunta de Pesquisa
> *"Como um ambiente de jogo imersivo pode fornecer uma avaliação de perfil de usuário mais autêntica e eficaz do que os testes tradicionais?"*

### Métrica Central
**Score de Dissonância Comportamental** - diferença entre:
- **Perfil Planejado**: decisões sem pressão de tempo
- **Perfil Instintivo**: decisões sob pressão/cronômetro

---

## Core Principles

### I. Data-Driven Design
Toda mecânica de jogo é definida em arquivos JSON em `src/data/`. O código lê e interpreta os dados, nunca hardcoda comportamentos específicos. Isso permite:
- Ajustar dilemas sem alterar código
- Validar academicamente o mapeamento ação→traço
- Rastrear origem de cada decisão de design

### II. Force-Choice Puro
Não existem respostas neutras. Toda interação significativa força um **trade-off** entre eixos GPI. Ao beneficiar um eixo, o jogador necessariamente prejudica outro. Isso elimina respostas socialmente desejáveis.

### III. Telemetria Completa
Toda ação do jogador é registrada com metadados:
- `timestamp`, `session_id`, `user_id`
- `is_timed` (pressão ou não)
- `response_time_ms`
- `gpi_impact` detalhado
- `context` (cena, NPC, estado do jogo)

### IV. Separação Pressão/Não-Pressão
Dilemas análogos aparecem em dois contextos:
- **Calm**: sem limite de tempo (Ato 1 - baseline)
- **Timed/Crisis**: com cronômetro (Ato 2 - instintivo)
A comparação entre respostas análogas gera o Score de Dissonância.

### V. Validação Acadêmica
Todo mapeamento ação→traço deve ter justificativa baseada em literatura psicométrica. Referências obrigatórias:
- PITTENGER (2005) - crítica MBTI
- SIOP (2018) - padrões de validação
- BIRKELAND et al. (2006) - faking em Big Five
- BARRICK & MOUNT (1991) - Conscienciosidade e desempenho

---

## Modelo de Avaliação: GPI (Gamer Performance Index)

### Os 4 Eixos

| Eixo | Descrição | Mapeamento Big Five | Mapeamento DISC |
|------|-----------|---------------------|-----------------|
| **Execução** | Foco, planejamento, conclusão de tarefas | Conscienciosidade (C) | D, C |
| **Colaboração** | Comunicação, empatia, trabalho em equipe | Amabilidade (A), Extroversão (E) | I, S |
| **Resiliência** | Gestão de estresse, persistência, adaptação | Neuroticismo inverso (N-) | S, D |
| **Inovação** | Exploração, criatividade, soluções alternativas | Abertura (O) | D, I |

### Matriz de Trade-offs Obrigatórios

```
Execução ←→ Colaboração
Execução ←→ Inovação
Colaboração ←→ Inovação
Resiliência ←→ Execução
Resiliência ←→ Colaboração
```

---

## Arquitetura Técnica

### Stack
- **Frontend**: Phaser 3.x + Vite + JavaScript ES Modules
- **Backend**: Node.js + Express
- **Banco**: MongoDB
- **Mapas**: Tiled (tilemaps JSON)

### Estrutura de Dados

```
src/data/
├── elements/          # NPCs e objetos por mapa
├── interactions/      # Dilemas force-choice
├── journeys/          # Quests e progressão
├── npcs/              # Arquétipos de NPCs
├── metrics/           # Configuração de métricas
└── config/            # Balanceamento e minigames
```

### Eventos Centrais (GameEvents.js)
- Todos os eventos de telemetria passam por `TELEMETRY_EVENTS`
- Eventos de dilema: `DILEMMA_PRESENTED`, `DILEMMA_CHOSEN`
- Eventos de jornada: `JOURNEY_STARTED`, `JOURNEY_STAGE_COMPLETED`

---

## Entregas Acadêmicas Obrigatórias

1. **Revisão de Literatura** - Fundamentação teórica GBA e psicometria
2. **Mapeamento Comportamental** - Tabela ação→traço com justificativa
3. **Protótipo Funcional** - Jogo coletando telemetria real
4. **Análise de Dados** - Processamento estatístico dos perfis
5. **Conclusões** - Validação/refutação da hipótese

---

## Governance

- Esta Constitution define os princípios invioláveis do projeto
- Alterações requerem justificativa acadêmica documentada
- Todo código deve respeitar o princípio Data-Driven
- Dilemas sem trade-off definido são proibidos
- Telemetria incompleta invalida o dado coletado

**Version**: 1.0.0 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-01-22
