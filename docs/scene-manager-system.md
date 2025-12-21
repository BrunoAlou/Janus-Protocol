# Sistema de Gerenciamento de Cenas - SceneManager

## Visão Geral

Foi implementado um sistema centralizado de gerenciamento de cenas (`SceneManager`) para controlar de forma consistente quais cenas devem estar ativas, pausadas ou paradas em cada momento do jogo.

## Problema Anterior

Antes da refatoração:
- Cada cena controlava manualmente o lançamento de outras cenas
- Múltiplas cenas de UI eram lançadas repetidamente
- Não havia controle centralizado sobre qual cena deveria estar ativa
- Transições entre cenas eram inconsistentes
- Dificulta adicionar novas cenas sem quebrar o fluxo existente

## Solução Implementada

### Estrutura do SceneManager

O `SceneManager` (`src/managers/SceneManager.js`) categoriza as cenas em 4 tipos:

1. **System** - Cenas de sistema (overlay) que devem estar sempre ativas durante gameplay:
   - `UIScene`
   - `DialogScene`
   - `PauseMenuScene`
   - `MinimapScene`

2. **Auth** - Cenas de autenticação (exclusivas):
   - `LoginScene`

3. **Map** - Cenas de mapa (apenas uma ativa por vez):
   - `ReceptionScene`
   - `OfficeScene`
   - `LabScene`
   - `MeetingRoomScene`
   - `ArchiveRoomScene`
   - `iTRoomScene`
   - `RhRoomScene`
   - `ElevatorScene`
   - `GardenScene`
   - `BossRoomScene`

4. **Minigame** - Minigames (exclusivos, pausam a cena de mapa):
   - `PuzzleGame`
   - `QuizGame`
   - `MemoryGame`
   - `TypingGame`
   - `WhackAMoleGame`
   - `TetrisGame`
   - `SnakeGame`

### API Principal

#### Inicialização
```javascript
// Em main.js, após criar o game
window.sceneManager = new SceneManager(game);
window.sceneManager.startGame(); // Inicia na tela de login
```

#### Fluxo de Autenticação
```javascript
// LoginScene: após autenticação bem-sucedida
window.sceneManager.startGameplay('ReceptionScene', { user });
```

#### Transições entre Mapas
```javascript
// Em qualquer cena de mapa
window.sceneManager.switchToMap('OfficeScene', { 
  spawnPoint: 'fromReception',
  user: this.user 
});
```

#### Iniciar Minigame
```javascript
// UIScene ou qualquer cena
window.sceneManager.startMinigame('PuzzleGame', {
  user: this.user,
  difficulty: 'normal'
});
```

#### Finalizar Minigame
```javascript
// BaseMinigame
window.sceneManager.endMinigame({
  completed: true,
  score: this.score,
  duration: 120
});
```

#### Voltar ao Login
```javascript
// PauseMenuScene
window.sceneManager.switchToAuth('LoginScene');
```

## Comportamento do Sistema

### Ao Iniciar Gameplay (`startGameplay`)
1. Para a cena de autenticação
2. Inicia todas as cenas de sistema (UI, Dialog, PauseMenu, Minimap)
3. Inicia a cena de mapa especificada

### Ao Mudar de Mapa (`switchToMap`)
1. Para a cena de mapa anterior
2. Garante que cenas de sistema estão ativas
3. Inicia a nova cena de mapa
4. Emite evento `'room-changed'` para atualizar minimapa

### Ao Iniciar Minigame (`startMinigame`)
1. Pausa a cena de mapa atual (mantém estado)
2. Pausa cenas de sistema exceto `DialogScene`
3. Inicia o minigame

### Ao Finalizar Minigame (`endMinigame`)
1. Para o minigame
2. Retoma a cena de mapa
3. Retoma todas as cenas de sistema
4. Emite evento `'minigame-completed'` com resultado

## Mudanças nas Cenas Existentes

### BaseMapScene
```javascript
// ANTES
create() {
  // ...
  if (!this.scene.isActive('UIScene')) {
    this.scene.launch('UIScene');
  }
  // Repetido para cada cena de sistema...
}

transitionTo(sceneKey, data) {
  this.scene.start(sceneKey, data);
}

// DEPOIS
create() {
  // ...
  // SceneManager já gerencia as cenas UI
}

transitionTo(sceneKey, data) {
  window.sceneManager.switchToMap(sceneKey, data);
}
```

### LoginScene
```javascript
// ANTES
startGame() {
  this.scene.start('ReceptionScene', { user });
}

// DEPOIS
startGame() {
  window.sceneManager.startGameplay('ReceptionScene', { user });
}
```

### BaseMinigame
```javascript
// ANTES
exitMinigame(completed) {
  this.scene.start(this.previousScene, { 
    minigameCompleted: completed 
  });
}

// DEPOIS
exitMinigame(completed) {
  window.sceneManager.endMinigame({
    completed,
    score: this.score,
    duration: Math.floor((Date.now() - this.startTime) / 1000)
  });
}
```

### UIScene
```javascript
// ANTES
startMinigame(gameKey) {
  this.scene.launch(gameKey, { previousScene, user });
  if (gameScene) {
    this.scene.pause(gameScene.scene.key);
  }
}

// DEPOIS
startMinigame(gameKey) {
  window.sceneManager.startMinigame(gameKey, { user });
}
```

## Benefícios

1. **Controle Centralizado**: Toda lógica de transição em um único lugar
2. **Consistência**: Comportamento uniforme em todas as transições
3. **Manutenibilidade**: Fácil adicionar novas cenas sem quebrar o sistema
4. **Debugging**: Método `debugState()` para inspecionar estado atual
5. **Escalabilidade**: Preparado para crescimento do jogo
6. **Previsibilidade**: Sempre sabemos quais cenas estão ativas

## Debug

Para inspecionar o estado atual do gerenciador:
```javascript
window.sceneManager.debugState();
```

Retorna:
```javascript
{
  auth: null,
  map: 'ReceptionScene',
  minigame: null,
  system: ['UIScene', 'DialogScene', 'PauseMenuScene', 'MinimapScene'],
  activeScenes: ['UIScene', 'DialogScene', 'PauseMenuScene', 'MinimapScene', 'ReceptionScene']
}
```

## Adicionando Novas Cenas

### Nova Cena de Mapa
1. Criar a cena estendendo `BaseMapScene`
2. Adicionar à lista `sceneCategories.map` no `SceneManager`
3. Adicionar ao array `scene` em `main.js`
4. Usar `window.sceneManager.switchToMap('NovaMapaScene')` para transitar

### Novo Minigame
1. Criar o minigame estendendo `BaseMinigame`
2. Adicionar à lista `sceneCategories.minigame` no `SceneManager`
3. Adicionar ao array `scene` em `main.js`
4. Usar `window.sceneManager.startMinigame('NovoMinigame')` para iniciar

### Nova Cena de Sistema (overlay)
1. Criar a cena
2. Adicionar à lista `sceneCategories.system` no `SceneManager`
3. Adicionar ao array `scene` em `main.js`
4. Será automaticamente gerenciada pelo SceneManager

## Próximos Passos Sugeridos

1. **Persistência de Estado**: Salvar progresso do jogador entre cenas
2. **Loading Screen**: Adicionar cena de loading entre transições pesadas
3. **Animações de Transição**: Sistema unificado de fade/slide entre cenas
4. **History Stack**: Implementar histórico de navegação para botão "voltar"
5. **Scene Pooling**: Reutilizar cenas já carregadas para performance
