# NPC Character Standard

Este documento define o padrao para adicionar novos personagens NPC mantendo o mesmo tamanho visual e estrutura dos personagens existentes, com base na arquitetura do baker.

## Objetivo

Garantir consistencia entre:
- tamanho/zoom visual dos NPCs
- organizacao de assets e animacoes
- comportamento de personagens estaticos e dinamicos

## Estrutura obrigatoria para novo personagem

1. Criar um modulo dedicado em src/npcs/<nome>Animations.js
2. Expor as mesmas funcoes base do baker:
- load<Nome>Assets(scene)
- create<Nome>Animations(scene)
- resolve<Nome>Animation(action, direction)
- get<Nome>TextureKey()

3. Registrar o carregamento na cena correspondente:
- preload: load<Nome>Assets(this)
- create/setupNPCs: create<Nome>Animations(this)

## Regra de tamanho (size/zoom)

Para NPCs definidos em src/data/elements/*.json, usar no sprite:

- matchPlayerScale: true
- scaleMultiplier: 1 (ou ajuste fino quando necessario)
- scale: 1 (fallback)

Exemplo:

{
  "sprite": {
    "key": "novo_npc_texture",
    "frame": 0,
    "animation": "novo_npc_idle",
    "scale": 1,
    "matchPlayerScale": true,
    "scaleMultiplier": 1
  }
}

Com isso, o NPC acompanha a escala base do player e permanece consistente com o zoom padrao do mapa.

## Personagem estatico (caso do sit_guy)

Para NPC estatico:
- nao adicionar controlador de movimento
- nao iniciar patrulha
- usar apenas animacao passiva (ex.: sit)
- manter posicao fixa no arquivo de elementos

## Personagem dinamico (caso do baker)

Para NPC dinamico:
- pode usar CharacterCommandController
- resolver animacoes por acao/direcao
- pode alternar entre estados (idle/walk/read/lift etc.)

## Checklist rapido para novos NPCs

1. Modulo de animacao criado em src/npcs
2. Assets carregados na cena correta
3. Animacoes criadas antes dos elementos/NPCs
4. Configuracao do sprite com matchPlayerScale
5. Comportamento (estatico ou dinamico) definido explicitamente
6. Validacao visual em jogo com mesmo zoom dos personagens existentes
