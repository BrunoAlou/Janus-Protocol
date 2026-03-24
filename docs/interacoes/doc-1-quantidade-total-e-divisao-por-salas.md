# Doc 1 - Quantidade de interacoes total e divisao por salas

## Base utilizada

- src/data/config/balance-config.json
- src/data/config/minigames-config.json
- src/data/interactions/dilemmas.json
- src/data/journeys/journeys.json
- src/data/metrics/performance-config.json

## Regras de capacidade do sistema

- Interacoes por eixo (minimo): 20
- Interacoes por eixo (ideal): 30
- Eixos avaliados: 4 (execution, collaboration, resilience, innovation)
- Regra de design: toda escolha deve impactar pelo menos 2 eixos

## Quantidade total necessaria (projeto)

Como cada interacao impacta 2 eixos, o total minimo de interacoes para cobrir 4 eixos e:

$$
\text{Total minimo} = \left\lceil \frac{20 \times 4}{2} \right\rceil = 40
$$

Faixa recomendada:

$$
40\ a\ 60\ interacoes\ estruturadas
$$

## Inventario atual de conteudo configurado

- Dilemas: 13
- Estagios de jornada: 45
- Estagios com targetLocation explicito: 7
- Minigames totais: 7
- Minigames habilitados: 4
- Unlocks de minigame por sala: 7

## Divisao por salas existentes (indice de demanda)

Indice usado: dilemas por sala + estagios com targetLocation + unlocks de minigame.

- office: 8 (5 dilemas, 2 estagios, 1 unlock)
- it_room: 6 (2 dilemas, 2 estagios, 2 unlocks)
- boss_room: 2 (1 dilema, 1 unlock)
- reception: 2 (0 dilemas, 1 estagio, 1 unlock)
- meeting_room: 2 (2 dilemas)
- garden: 2 (1 dilema, 1 estagio)
- archive_room: 1 (1 unlock)
- break_room: 1 (1 unlock)
- elevator: 1 (1 dilema)
- hall: 1 (1 dilema)
- secret_exit: 1 (1 estagio)

Total do indice: 27 pontos.

## Distribuicao recomendada de interacoes estruturadas (base 40)

Distribuicao proporcional ao indice, com piso de 1 por sala:

- office: 12
- it_room: 8
- meeting_room: 4
- reception: 4
- boss_room: 3
- garden: 3
- archive_room: 2
- break_room: 1
- elevator: 1
- hall: 1
- secret_exit: 1

Total: 40

## Quantos objetos de interacao na Sala 1 (reception)

Com base no papel de onboarding da primeira sala, o minimo proporcional seria 4 interacoes estruturadas. Para tutorial, descoberta e ritmo inicial, a faixa recomendada e maior:

- minimo funcional: 6 objetos interativos
- recomendado: 9 a 12 objetos interativos
- ideal com conteudo "click-only" (sc): 12 a 15 objetos interativos

Observacao: objetos decorativos podem existir sem interacao, mas na sala 1 e melhor transformar parte deles em interacoes leves para ensinar linguagem de jogo.
