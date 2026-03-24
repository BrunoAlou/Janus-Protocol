# Flow de Entrada do Usuario - Recepcao

## 1. Objetivo do flow

Definir o fluxo inicial da experiencia de entrada do candidato (entrevista de emprego), com foco em:
- observabilidade comportamental
- interatividade guiada
- ramificacao por perfil
- encaixe futuro em jornadas e dilemas existentes

Escopo: documentacao funcional e narrativa. Sem implementacao tecnica.

## 2. Contexto narrativo inicial

Estado inicial do jogador:
- chegou para entrevista de emprego
- esta na recepcao
- ainda nao passou por eventos de crise

Mensagem de abertura sugerida:
- "Bem-vindo(a). Sua entrevista comeca em instantes. Enquanto aguarda, voce pode explorar o ambiente e se preparar."

## 3. Opcoes iniciais da Recepcao

1. Opcao 1 - Explorar ambiente
2. Opcao 2 - Conversar com sit_guy
3. Opcao 3 - Conversar com recepcionista
4. Opcao 4 - Acessar computadores ou painel de informacoes
5. Opcao 5 - Ler revistas

## 4. Regras gerais de observabilidade

## 4.1 Eventos observaveis minimos

- entrada na recepcao
- primeira opcao escolhida
- ordem das opcoes escolhidas
- tempo ate primeira interacao
- tempo total na recepcao
- quantidade de objetos inspecionados
- numero de dialogos completos
- numero de abandonos/interrupcoes de dialogo

## 4.2 Regra de comparativo entre usuarios

Para comparacao entre usuarios na sala inicial, manter pelo menos os indicadores:
- objetos_inspecionados_total
- objetos_inspecionados_unicos
- tempo_na_recepcao
- proporcao_dialogo_vs_exploracao
- diversidade_de_escolhas_iniciais

## 4.3 Regra de impacto em eixo

Cada escolha relevante deve impactar ao menos 2 eixos (um positivo e um negativo), alinhado com:
- interactionRules.minAxesAffected = 2
- interactionRules.balanceRequirement (minPositive 1, minNegative 1)

## 5. Detalhamento das opcoes iniciais

## 5.1 Opcao 1 - Explorar ambiente

Objetivo:
- medir curiosidade, autonomia, foco e padrao exploratorio

Regras declarativas:
- contabilizar cada objeto inspecionado
- diferenciar objeto novo de objeto repetido
- registrar tempo por inspeção
- registrar sequencia de inspeção

Sinais de perfil sugeridos:
- innovation: sobe com exploracao ampla e descoberta de itens nao obrigatorios
- execution: sobe com exploracao objetiva e baixa repeticao
- resilience: sobe com persistencia em encontrar interacoes escondidas
- collaboration: neutro ou leve, quando exploracao inclui leitura de contexto social

KPI funcional da opcao:
- cobertura de objetos da sala 1
- taxa de inspecao util (objeto com retorno narrativo)

## 5.2 Opcao 2 - Conversar com sit_guy

Objetivo:
- abrir ramificacao de perfil logo no inicio com tema "vaga"

Prompt introdutorio sugerido (sit_guy):
- "Voce tambem veio para a vaga de analista?"

Estrutura de resposta sugerida (4 opcoes):
1. Collaboration: "Sim, achei lindo o predio, primeira vez aqui?"
2. Innovation: "Sim, estou um pouco nervoso, mas bem empolgado para a vaga."
3. Resilience: "Sim, que transito complicado... tento manter a calma nessas horas."
4. Execution: "Sim, to focado na entrevista, depois a gente conversa. Boa sorte!"

Mapeamento sugerido de alinhamento:
- Collaboration: DISC I/S, Big Five A/E
- Innovation: DISC I/D, Big Five O
- Resilience: DISC S/C (estabilidade), Big Five C/A
- Execution: DISC D/C, Big Five C

Observacao:
- permitir resposta secundaria opcional ("depende do contexto") para capturar flexibilidade de perfil

Mecanica de perda forcada (termo recomendado):
- nome de design: Trade-off (escolha forcada)
- nome analitico: Custo de Oportunidade
- regra: ao escolher 1 resposta favorita, as demais ficam menos favoritas (penalizacao cruzada leve)

## 5.3 Opcao 3 - Conversar com recepcionista

Objetivo:
- repetir o padrao de ramificacao com vies institucional (expectativas da vaga)

Prompt introdutorio sugerido (recepcionista):
- "Como voce prefere iniciar? Para eu te direcionar melhor, me diz o que voce quer conhecer primeiro."

Estrutura de resposta sugerida (4 opcoes):
1. Collaboration: "Gostaria de conhecer o time com quem vou trabalhar."
- eixo principal: collaboration
- trade-off sugerido: collaboration (+) x execution (-)

2. Innovation: "Quero entender os projetos e os desafios que posso assumir apos a contratacao."
- eixo principal: innovation
- trade-off sugerido: innovation (+) x execution (-)

3. Resilience: "Quero saber como voces trabalham em momentos de pressao e como o time se organiza nesses cenarios."
- eixo principal: resilience
- trade-off sugerido: resilience (+) x collaboration (-)

4. Execution: "Quero entender a carga horaria, as prioridades e o que esperam das minhas entregas."
- eixo principal: execution
- trade-off sugerido: execution (+) x innovation (-)

Regra de consistencia:
- comparar resposta do sit_guy e da recepcionista
- gerar indicador de coerencia inicial do perfil (alta, media, baixa)

## 5.4 Opcao 4 - Acessar computadores ou painel de informacoes

Objetivo:
- captar sinal cognitivo inicial e preferencia de abordagem informacional

Sugestoes de flow:
1. Computador A - "Simulacao curta de priorizacao"
- micro tarefa de ordenar 3 atividades da vaga
- impacto principal: execution e resilience

2. Computador B - "Cenario de melhoria de processo"
- escolher entre seguir padrao ou propor ajuste
- impacto principal: innovation e execution

3. Painel de informacoes - "Cultura e valores"
- leitura de 3 cards institucionais com escolha de valor mais aderente
- impacto principal: collaboration e innovation

Encaixe com minigames:
- usar como ponte opcional para QuizGame (reception)
- sem bloqueio de progressao

## 5.5 Opcao 5 - Ler revistas (inserir em cena)

Objetivo:
- criar camada de interacao leve com observabilidade de interesse e foco

Sugestoes de flow:
1. Revista de negocios
- tema: produtividade e metas
- impacto principal: execution

2. Revista de tecnologia
- tema: tendencias e IA
- impacto principal: innovation

3. Revista de carreira
- tema: colaboracao e soft skills
- impacto principal: collaboration

4. Revista de bem-estar
- tema: autocontrole e pressao
- impacto principal: resilience

Regra de design:
- leitura deve ser curta (1-2 telas)
- gerar escolha final simples ("com o que voce mais concorda?")
- cada revista pode acionar um micro flag de preferencia

## 6. Flow possivel da recepcao (alto nivel)

1. Entrada na recepcao
2. Apresentacao das 5 opcoes
3. Jogador pode escolher em qualquer ordem
4. Sistema registra sinais de observabilidade por opcao
5. Ao concluir pelo menos 2 opcoes, liberar sugestao de proximo passo
6. Ao concluir 3+ opcoes, habilitar transicao orientada para rota de jornada

Regra recomendada:
- nao bloquear jogador rigidamente
- usar "soft gating" por recomendacao de caminho

## 7. Encaixe com Jornadas

Base em src/data/journeys/journeys.json.

Sugestao de encaixe posterior apos recepcao:
- perfil com maior Execution: sugerir caminho J001 (Protocolo de Evacuacao)
- perfil com maior Collaboration: sugerir caminho J002 (Nenhum Colega Para Tras)
- perfil com maior Resilience: sugerir caminho J003 (Enfrentando JANUS)
- perfil com maior Innovation: sugerir caminho J004 (Caminho Alternativo)

Regra de recomendacao:
- recomendacao inicial nao deve forcar escolha definitiva
- permitir override do jogador

## 8. Encaixe com Dilemas

Base em src/data/interactions/dilemmas.json.

Dilemas de entrada recomendados para ligacao indireta:
- eixo Collaboration/Execution: TRD001 e TRD003 (ex.: DLM001, DLM002)
- eixo Innovation/Execution: TRD002 e TRD007 (ex.: DLM003, DLM009)
- eixo Resilience/Collaboration: TRD006 (ex.: DLM005)

Sugestao:
- respostas de sit_guy e recepcionista definem "seed" de priorizacao de dilemas iniciais
- seed influencia ordem de aparicao, nao resultado final

## 9. Matriz declarativa de pontuacao inicial (sugestao)

Escala sugerida por escolha macro na recepcao:
- escolha principal: +2 no eixo alvo, -1 em eixo de trade-off
- escolha secundaria: +1 no eixo alvo, 0 nos demais

Trade-offs iniciais sugeridos:
- execution vs collaboration
- execution vs innovation
- resilience vs collaboration
- innovation vs execution

Aplicacao pratica da perda forcada:
- escolha favorita: +2 no eixo principal
- eixo em trade-off: -1
- opcoes nao escolhidas na mesma pergunta: recebem fator de despriorizacao (ex.: -0.25 de preferencia para ranking interno)

## 10. Requisitos de qualidade do flow

1. Toda opcao deve ter retorno narrativo claro.
2. Pelo menos 1 evento observavel por opcao.
3. Pelo menos 3 opcoes devem impactar eixo de forma explicita.
4. Sala 1 deve funcionar como onboarding, nao como filtro eliminatorio.
5. Minigame na recepcao deve permanecer opcional.

## 11. Entregaveis futuros (sem implementacao agora)

1. Script de dialogo completo sit_guy (4 ramificacoes)
2. Script de dialogo completo recepcionista (4 ramificacoes)
3. Catalogo de objetos inspecionaveis da recepcao com tags de eixo
4. Mapa de transicao recomendada: recepcao -> jornada inicial
5. Tabela de comparativo entre usuarios para dashboard de observabilidade
