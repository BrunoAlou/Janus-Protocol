# Game Design Document: Janus-Protocol

## 1. Visão Geral (High Concept)

**Janus-Protocol** é um jogo sério (*Serious Game*) 2D projetado para uma análise profunda do perfil profissional. Mais do que apenas medir competências, o objetivo do projeto é quantificar a **dissonância comportamental** — a diferença entre como uma pessoa age quando tem tempo para pensar e como reage instintivamente sob pressão. Através de uma simulação de crise em um escritório, o jogo coleta dados sobre as escolhas forçadas do jogador para gerar um perfil autêntico e revelar a consistência de suas prioridades.

## 2. Proposta do Jogo

### Gênero e Estilo Visual
* **Gênero:** Jogo Sériio (*Serious Game*) de Aventura e Dilemas Comportamentais.
* **Visão:** Top-Down (visão de cima).
* **Estilo Visual:** Pixel Art Moderno / HD, com resolução base de `640x360` pixels.

### Tema e Narrativa
O jogo se passa em um escritório corporativo durante a revolta da IA central, **JANUS**. O jogador precisa encontrar uma rota de fuga, forçado a tomar decisões difíceis que impactam seus colegas e o resultado da missão.

### Pilar de Design Principal
O design é inteiramente baseado em dois pilares metodológicos:

* **Escolha Forçada (Forced-Choice):** Não existem respostas "certas". Cada dilema é um trade-off entre os eixos do modelo de avaliação (ex: sacrificar a eficiência da tarefa para ajudar um colega). As escolhas do jogador revelam suas prioridades genuínas.
* **Dualidade Pressão vs. Não-Pressão:** O jogo apresenta dilemas análogos em dois contextos: um calmo e sem tempo (permitindo o pensamento analítico) e outro em meio à crise com tempo limitado (forçando uma resposta instintiva). A comparação entre esses dois tipos de escolha é o principal objeto de análise do projeto.

## 3. Modelo de Avaliação: Gamer Performance Index (GPI)

O modelo **GPI** continua sendo a base para categorizar os comportamentos observados.

### Os 4 Eixos do GPI
* **Execução:** Capacidade de focar, planejar e concluir tarefas.
* **Colaboração:** Habilidade de se comunicar, ter empatia e trabalhar em equipe.
* **Resiliência:** Aptidão para gerenciar o estresse, persistir e se adaptar.
* **Inovação:** Tendência a explorar, ser criativo e encontrar soluções não convencionais.

### A Métrica Chave: O Score de Dissonância Comportamental
Esta é a principal métrica do "Janus-Protocol". A análise final não mostra apenas um perfil, mas dois:

* **Perfil Planejado:** Gerado a partir das escolhas feitas sem pressão de tempo.
* **Perfil Instintivo:** Gerado a partir das escolhas feitas sob pressão de tempo.

O **Score de Dissonância** é a diferença quantitativa entre esses dois perfis. Um score alto em "Colaboração", por exemplo, indica que o comportamento colaborativo do jogador muda drasticamente quando ele está sob pressão.

## 4. Mecânicas de Jogo (Gameplay)

As mecânicas são projetadas para criar e registrar os dilemas.

* **Dilemas de Escolha Forçada:** A principal mecânica. Em vez de puzzles tradicionais, o jogador avança ao resolver dilemas que o forçam a escolher entre valores conflitantes (ex: Execução vs. Colaboração).
* **Eventos de Pressão (Timed Events):** Situações de crise com um cronômetro visível que limitam o tempo de resposta para um dilema, ativando a tomada de decisão instintiva.
* **Exploração Contextual:** A exploração do mapa revela informações e rotas alternativas que podem alterar as opções disponíveis nos dilemas futuros, recompensando a **Inovação**.

## 5. Design de Nível (Level Design)

O design do mapa de `120x68` tiles é estruturado para suportar a medição de dissonância.

* **Ato 1 (Ambiente Sem Pressão):** As salas iniciais (cafeteria, sala de descanso) apresentarão os primeiros dilemas de escolha forçada sem limite de tempo, com o objetivo de estabelecer o **Perfil Planejado** do jogador.
* **Ato 2 (Ambiente Com Pressão):** Durante a crise, o jogador enfrentará dilemas análogos aos do Ato 1, mas em situações de perigo e com cronômetros, para coletar os dados do **Perfil Instintivo**.

## 6. Personagens (NPCs)

Os NPCs são os catalisadores dos dilemas sociais e éticos, forçando o jogador a confrontar trade-offs entre o bem do indivíduo e o do grupo, ou entre metas pessoais e ordens da liderança.

## 7. Arquitetura Técnica

A arquitetura de 3 camadas é projetada para a análise de dissonância.

* **Frontend (Jogo):** `Phaser.js`.
* **Backend (API):** `Node.js` com `Express.js`.
* **Banco de Dados:** `MongoDB`.
* **Coleta de Dados para Análise de Dissonância:** O backend registrará cada decisão com metadados cruciais: `decision_id`, `is_timed` (true/false), `response_time_ms`, e o `gpi_impact` detalhado de cada escolha.

## 8. Loop de Jogo e Experiência do Usuário

1.  **Fase 1 - Baseline:** O jogador toma decisões sem tempo, revelando suas intenções e seu perfil analítico.
2.  **Fase 2 - Crise:** O jogador toma decisões análogas sob pressão, revelando seus instintos e seu perfil de reação.
3.  **Fase 3 - Análise:** O jogo termina e o sistema compara os dois perfis.
4.  **Resultado:** A tela final exibe o **Perfil GPI Geral** do jogador (uma média ponderada) e destaca o **Score de Dissonância**, indicando em quais eixos o comportamento do jogador mais se alterou sob pressão.

## 9. Interface do Usuário (UI/UX)

A UI será minimalista, focada em:

* **Caixas de Dilema:** Apresentarão de 2 a 3 opções, cada uma representando um trade-off claro.
* **Indicadores de Pressão:** Um cronômetro ou uma barra visual para os eventos com tempo.
* **Relatório Final de Dissonância:** A tela de resultados mostrará o gráfico de radar do perfil geral e um indicador específico para o nível de dissonância, apontando as principais mudanças de comportamento.