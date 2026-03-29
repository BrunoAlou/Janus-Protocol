# NPC Mobile Interaction Reference

Este guia documenta as funcoes usadas para NPC movel com bloqueio de passagem e interacao por proximidade (tecla E).

## Objetivo

- Impedir que o player atravesse NPCs.
- Garantir que a zona de interacao acompanhe NPC movel.
- Exibir o indicador E ao entrar na zona de interacao.

## Funcoes Principais

### 1) `InteractionManager.registerNPCs(npcs)`
Arquivo: `src/interactions/InteractionManager.js`

Responsabilidades:
- Registra overlap entre player e `npc.interactionZone` para proximidade.
- Forca corpo do NPC como nao-empurravel:
  - `npc.body.setImmovable(true)`
  - `npc.body.setPushable(false)` (quando disponivel)
- Cria collider fisico `player <-> npc` para bloquear passagem.

Quando usar:
- Em cenas com `useLegacyNpcInteractionManager = true`.
- Fluxo automatico via `setupInteractions()` do `NpcSetupMixin`.

### 2) `AmbientMobileNpcService.registerRandomWalker(config)`
Arquivo: `src/scenes/map/services/npc/AmbientMobileNpcService.js`

Responsabilidades:
- Movimento aleatorio e acoes de idle do NPC movel.
- Sincronizacao por frame de:
  - `interactionZone` (posicao)
  - `interactionZone.body` (refresh: `updateFromGameObject`/`reset`)
  - `interactionIndicator` (E)
  - `nameTag`

Quando usar:
- NPCs moveis em cenas de mapa (ex: Baker no CoffeeRoom).

### 3) `npc.updateElements()`
Arquivo: `src/npcs/NPCFactory.js`

Responsabilidades:
- Atualiza posicoes visuais e profundidade (depth) do NPC.
- Reposiciona `interactionZone` e atualiza body para colisao/overlap corretos.

Quando usar:
- Automaticamente no `BaseMapScene.update()` para todo NPC em `this.npcs`.

## Onde aplicar em novas cenas

1. Criar NPC via `NPCFactory.create(...)`.
2. Adicionar em `this.npcs`.
3. Ativar interacao legacy na cena:
   - `this.useLegacyNpcInteractionManager = true`
4. Para NPC movel, registrar no `AmbientMobileNpcService.registerRandomWalker(...)`.

## Exemplo (resumo)

- Cena: `src/scenes/map/CoffeeRoomScene.js`
- NPC movel: Baker
- Fluxo:
  - cria Baker
  - adiciona colisoes de mapa no Baker
  - registra random walker
  - inclui Baker em `this.npcs`
  - `setupInteractions()` registra overlap + collider + bloqueio de empurrao

## Checklist de validacao

- [ ] Player nao atravessa NPC movel
- [ ] Player nao empurra NPC movel
- [ ] Indicador E aparece por proximidade
- [ ] E acompanha o NPC enquanto ele se move
- [ ] Interacao abre dialogo ao pressionar E dentro da zona
