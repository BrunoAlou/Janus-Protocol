# 🔍 Análise de Padrões OOP e Estrutura de Código
## Janus-Protocol - Levantamento de Oportunidades de Melhoria

---

## 📊 Resumo Executivo

A estrutura atual possui **boas intenções** (Factory Pattern, Base Classes, Separation of Concerns), mas apresenta **problemas de linearidade OOP** que impedem escalabilidade. Os principais problemas são:

- ❌ **Mistura de responsabilidades** (Factory criando e fazendo setup)
- ❌ **Falta de interfaces/contratos** entre componentes
- ❌ **Duplicação de código** em minigames e cenas
- ❌ **Magic strings** espalhadas pelo código
- ❌ **Falta de inversão de controle** (IoC)
- ❌ **Propriedades dinâmicas** em objetos Phaser
- ❌ **Gestão inconsistente** de estado

---

## 🔴 PROBLEMA 1: Factory Pattern Incompleto

### Local: `src/player/PlayerFactory.js` e `src/npcs/NPCFactory.js`

**Problema:**
```javascript
// ❌ Ruins - Factory cria + configura + anexa comportamentos
export function createPlayer(scene, x, y) {
  const sprite = scene.physics.add.sprite(x, y, PLAYER_TEXTURE_KEY);
  sprite.setScale(scale);
  sprite.setDepth(4);
  // ... 50+ linhas de configuração
  
  // Propriedades dinâmicas anexadas (não seguro de tipo)
  sprite.playerData = { ... };
  sprite.updateElements = function() { ... };
}
```

**Problema Detalhado:**
1. **Função gigante** (~279 linhas) fazendo múltiplas coisas
2. **Propriedades dinâmicas** anexadas ao sprite (não é escalável)
3. **Responsabilidades misturadas**: criação + configuração + comportamento
4. **Sem classe wrapper** para encapsular a lógica do player

**Impacto:** Difícil manutenção, testes complicados, comportamento não reutilizável

---

### 🔧 Solução: Padrão Object Builder + Wrapper Classes

**Implementar:**

```javascript
// ✅ Bom - Separar responsabilidades

// 1. Classe Player encapsulando a lógica
export class Player {
  constructor(sprite, controller, config) {
    this.sprite = sprite;
    this.controller = controller;
    this.config = config;
    this.state = { isMoving: false, direction: 'down' };
  }

  moveTo(x, y) {
    this.state.isMoving = true;
    this.sprite.setPosition(x, y);
  }

  updateElements() {
    // Lógica centralizada
  }

  getState() {
    return { ...this.state };
  }
}

// 2. Builder para construir Player
export class PlayerBuilder {
  constructor(scene) {
    this.scene = scene;
    this.config = { ...PLAYER_DEFAULTS };
  }

  withScale(scale) {
    this.config.scale = scale;
    return this;
  }

  withHitbox(type) {
    this.config.hitboxType = type;
    return this;
  }

  build(x, y) {
    // Criar sprite
    const sprite = this.scene.physics.add.sprite(
      x, y, 
      PLAYER_TEXTURE_KEY, 
      'walk_down_01'
    );

    // Aplicar configurações
    this._configureSprite(sprite);
    this._setupHitbox(sprite);
    
    // Retornar instância Player
    return new Player(sprite, null, this.config);
  }

  _configureSprite(sprite) {
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(this.config.depth || 4);
    sprite.setScale(this.config.scale || 1);
  }

  _setupHitbox(sprite) {
    // Configuração de hitbox
  }
}

// 3. Factory usando Builder
export function createPlayer(scene, x, y) {
  return new PlayerBuilder(scene)
    .withScale(1.5)
    .withHitbox('circle')
    .build(x, y);
}

// 4. Uso
const player = createPlayer(scene, 100, 100);
player.moveTo(200, 200);
player.controller = new PlayerController(player);
```

---

## 🔴 PROBLEMA 2: Duplicação de Código em Minigames

### Local: Todos os minigames (`src/scenes/minigames/`)

**Problema:**
```javascript
// ❌ Duplicado em QuizGame, MemoryGame, TetrisGame, etc.
create() {
  super.create();
  const { width, height } = this.cameras.main;

  // IGUAL em todas as cenas
  this.add.text(width / 2, 80, title, {
    fontSize: '36px',
    color: '#00d9ff',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  this.scoreText = this.add.text(...);
  this.timerText = this.add.text(...);
  
  // Cada minigame repete isso
  this.logTelemetry('game_started', {...});
}
```

**Problema Detalhado:**
1. **Código duplicado** em múltiplas cenas
2. **Sem padrão consistente** entre minigames
3. **Telemetria manual** em cada game
4. **UI widgets** criados manualmente (sem componentes)

**Impacto:** Mudança em um lugar não afeta outro, inconsistência visual/comportamental

---

### 🔧 Solução: UI Component System + Template Method Pattern

```javascript
// ✅ Bom - Sistema de componentes reutilizáveis

// 1. Abstract Component
export abstract class UIComponent {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  abstract render(): void;
  
  destroy() {
    this.elements.forEach(el => el?.destroy?.());
  }

  show() {
    this.elements.forEach(el => el?.setVisible(true));
  }

  hide() {
    this.elements.forEach(el => el?.setVisible(false));
  }
}

// 2. Componentes específicos
export class MinigameHeader extends UIComponent {
  constructor(scene, title, subtitle = '') {
    super(scene);
    this.title = title;
    this.subtitle = subtitle;
  }

  render() {
    const { width } = this.scene.cameras.main;
    
    this.elements.push(
      this.scene.add.text(width / 2, 80, this.title, {
        fontSize: '36px',
        color: '#00d9ff',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    );

    if (this.subtitle) {
      this.elements.push(
        this.scene.add.text(width / 2, 140, this.subtitle, {
          fontSize: '16px',
          color: '#ffffff'
        }).setOrigin(0.5)
      );
    }
  }
}

export class MinigameHUD extends UIComponent {
  constructor(scene) {
    super(scene);
    this.score = 0;
    this.time = 0;
  }

  render() {
    const { width } = this.scene.cameras.main;
    
    this.scoreText = this.scene.add.text(width - 20, 30, 'Pontos: 0', {
      fontSize: '20px',
      color: '#00d9ff'
    }).setOrigin(1, 0).setDepth(1000);
    
    this.timerText = this.scene.add.text(width / 2, 30, 'Tempo: 0s', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1000);

    this.elements.push(this.scoreText, this.timerText);
  }

  updateScore(value) {
    this.score = value;
    this.scoreText.setText(`Pontos: ${this.score}`);
  }

  updateTime(seconds) {
    this.time = seconds;
    this.timerText.setText(`Tempo: ${this.time}s`);
  }
}

// 3. Base class aprimorada com template method
export class BaseMinigame extends Phaser.Scene {
  create() {
    const { width, height } = this.cameras.main;
    
    // Background (comum)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);

    // Template Method Pattern
    this.createComponents();  // Subclass implementa
    this.createHUD();         // Compartilhado
    this.createButtons();     // Compartilhado
    this.setupTelemetry();    // Centralizado

    this.onCreateComplete?.();  // Hook para subclasses
  }

  createComponents() {
    // Subclasses implementam
  }

  createHUD() {
    this.hud = new MinigameHUD(this);
    this.hud.render();
  }

  createButtons() {
    this.exitBtn = this._createExitButton();
    this.pauseBtn = this._createPauseButton();
  }

  setupTelemetry() {
    this.telemetry.trackEvent('minigame_started', {
      minigame: this.minigameKey,
      timestamp: Date.now()
    });
  }

  _createExitButton() {
    // Implementação centralizada
  }
}

// 4. Uso em QuizGame
export class QuizGame extends BaseMinigame {
  onCreateComplete() {
    this.createQuizUI();
    this.showQuestion(0);
  }

  createComponents() {
    // Criar header e outros elementos específicos
    this.header = new MinigameHeader(this, 'QUIZ', 'Teste seus conhecimentos');
    this.header.render();
  }

  createQuizUI() {
    // Lógica específica do quiz
  }
}
```

---

## 🔴 PROBLEMA 3: Magic Strings Espalhados

### Local: Todo o projeto

**Problema:**
```javascript
// ❌ Magic strings sem tipagem
window.sceneManager.goToMap('OfficeScene');
this.load.tilemapTiledJSON('reception', './src/assets/reception.json');
this.cameras.main.startFollow(sprite);
this.logTelemetry('quiz_started', { ... });

// Difícil manter, sem autocomplete
if (scene.sceneKey === 'ReceptionScene') { ... }
```

**Problema Detalhado:**
1. **Sem autocomplete** IDE
2. **Refatoração difícil**
3. **Erros em tempo de execução**
4. **Sem documentação** de valores válidos

---

### 🔧 Solução: Enum Constants + Type Guards

```javascript
// ✅ Bom - Constants centralizadas com tipos

// constants/SceneNames.ts
export const SCENE_NAMES = {
  LOGIN: 'LoginScene',
  RECEPTION: 'ReceptionScene',
  OFFICE: 'OfficeScene',
  LAB: 'LabScene',
  MEETING_ROOM: 'MeetingRoomScene',
  ARCHIVE_ROOM: 'ArchiveRoomScene',
  IT_ROOM: 'ItRoomScene',
  RH_ROOM: 'RhRoomScene',
  ELEVATOR: 'ElevatorScene',
  GARDEN: 'GardenScene',
  BOSS_ROOM: 'BossRoomScene'
} as const;

export type SceneName = typeof SCENE_NAMES[keyof typeof SCENE_NAMES];

// constants/MapAssets.ts
export const MAP_ASSETS = {
  RECEPTION: { 
    sceneKey: SCENE_NAMES.RECEPTION,
    mapKey: 'reception',
    path: './src/assets/reception.json'
  },
  OFFICE: {
    sceneKey: SCENE_NAMES.OFFICE,
    mapKey: 'office',
    path: './src/assets/office.json'
  }
  // ...
} as const;

// constants/Events.ts
export const GAME_EVENTS = {
  ROOM_CHANGED: 'room-changed',
  PLAYER_MOVED: 'player-moved',
  MINIGAME_STARTED: 'minigame-started',
  MINIGAME_COMPLETED: 'minigame-completed',
  DIALOGUE_STARTED: 'dialogue-started',
  NPC_INTERACTION: 'npc-interaction'
} as const;

// Uso
window.sceneManager.goToMap(SCENE_NAMES.OFFICE);  // ✅ Autocomplete!
this.load.tilemapTiledJSON(MAP_ASSETS.RECEPTION.mapKey, MAP_ASSETS.RECEPTION.path);
this.game.events.emit(GAME_EVENTS.ROOM_CHANGED, currentScene);

// Type guard
function isValidScene(name: string): name is SceneName {
  return Object.values(SCENE_NAMES).includes(name as SceneName);
}
```

---

## 🔴 PROBLEMA 4: Falta de Inversão de Controle (IoC)

### Local: `src/managers/`, `src/scenes/`

**Problema:**
```javascript
// ❌ Classes criando suas próprias dependências
export default class BaseMapScene extends Phaser.Scene {
  create() {
    // Criando diretamente - acoplado!
    const player = createPlayer(this, x, y);
    const controller = new PlayerController(player);
    const manager = new InteractionManager(this);
    
    // Sem injeção = difícil testar
  }
}

// Global singleton (anti-pattern)
window.sceneManager = new SceneManager(game);  // ❌ Acoplamento global
```

**Problema Detalhado:**
1. **Tightly coupled** - difícil de testar
2. **Difícil trocar implementações**
3. **Configuração espalhada**
4. **Singletons globais** acoplam componentes

---

### 🔧 Solução: Service Locator + Dependency Injection

```javascript
// ✅ Bom - Contentor de IoC

// services/ServiceContainer.ts
export class ServiceContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  register(name: string, factory: (container: this) => any, singleton = false) {
    this.services.set(name, { factory, singleton });
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this));
      }
      return this.singletons.get(name);
    }

    return service.factory(this);
  }
}

// boot/setupServices.ts
export function setupServices(container: ServiceContainer, game: Phaser.Game) {
  // Registrar gerenciadores
  container.register('sceneManager', () => new SceneManager(game), true);
  container.register('telemetry', () => new TelemetryService(), true);
  container.register('authManager', () => new AuthManager(), true);

  // Registrar factories com suas dependências
  container.register('playerFactory', (c) => new PlayerFactory(c.get('telemetry')));
  container.register('npcFactory', (c) => new NPCFactory(c.get('telemetry')));
}

// scenes/map/ReceptionScene.ts
export class ReceptionScene extends BaseMapScene {
  private playerFactory: PlayerFactory;
  private sceneManager: SceneManager;

  init(data: { container: ServiceContainer }) {
    // Injetar dependências
    this.playerFactory = data.container.get('playerFactory');
    this.sceneManager = data.container.get('sceneManager');
  }

  create() {
    // Usar injetados
    const player = this.playerFactory.create(this, 100, 100);
  }
}

// main.ts
const container = new ServiceContainer();
setupServices(container, game);

// Passar container para cenas
game.events.on('transitionstart', (scene) => {
  scene.init({ container });
});
```

---

## 🔴 PROBLEMA 5: Propriedades Dinâmicas não Seguras

### Local: Principalmente em `NPCFactory.js`

**Problema:**
```javascript
// ❌ Propriedades dinâmicas - sem tipagem
const npc = scene.physics.add.sprite(x, y, texture);
npc.npcId = id;                           // Runtime property
npc.npcName = name;                       // Runtime property
npc.dialogues = dialogues;                // Runtime property
npc.currentDialogueIndex = 0;             // Runtime property
npc.canMove = canMove;                    // Runtime property
npc.isInteracting = false;                // Runtime property

// Depois:
if (npc.isInteracting) { ... }  // TypeError risk
npc.unknown_property = true;     // Sem erro

// Difícil entender que propriedades existem
```

**Problema Detalhado:**
1. **Sem segurança de tipo**
2. **Difícil de documentar**
3. **Runtime errors**
4. **IDE não oferece autocomplete**

---

### 🔧 Solução: Classes Wrapper com Interfaces

```javascript
// ✅ Bom - Classes com tipagem

// types/NPC.ts
export interface NPCConfig {
  id: string;
  name: string;
  texture: string;
  frame?: number;
  scale?: number;
  dialogues: DialogueNode[];
  canMove?: boolean;
  patrol?: PatrolConfig;
  interactionRadius?: number;
}

export interface DialogueNode {
  id: string;
  text: string;
  options?: DialogueOption[];
  next?: string;
}

// entities/NPC.ts
export class NPC {
  readonly id: string;
  readonly name: string;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  
  private dialogues: DialogueNode[];
  private currentDialogueIndex: number = 0;
  private canMove: boolean;
  private isInteracting: boolean = false;
  private patrol?: PatrolConfig;

  constructor(
    sprite: Phaser.Physics.Arcade.Sprite,
    config: NPCConfig
  ) {
    this.id = config.id;
    this.name = config.name;
    this.sprite = sprite;
    this.dialogues = config.dialogues;
    this.canMove = config.canMove ?? false;
    this.patrol = config.patrol;
  }

  // Métodos com tipagem
  getDialogue(): DialogueNode | null {
    return this.dialogues[this.currentDialogueIndex] ?? null;
  }

  interactWith(player: Player): void {
    if (!this.isInteracting) {
      this.isInteracting = true;
      this.emit('interaction-start', this);
    }
  }

  moveTo(x: number, y: number): void {
    if (this.canMove) {
      this.sprite.setVelocity(0, 0);
      this.sprite.setPosition(x, y);
    }
  }

  // Simples propriedade sem risco
  getInteractionRadius(): number {
    return 32;
  }
}

// factories/NPCFactory.ts
export class NPCFactory {
  create(scene: Phaser.Scene, config: NPCConfig): NPC {
    // Criar sprite base
    const sprite = scene.physics.add.sprite(
      config.x,
      config.y,
      config.texture,
      config.frame ?? 0
    );

    // Configurar sprite
    sprite.setScale(config.scale ?? 2);
    sprite.setDepth(4);

    // Criar e retornar entidade NPC
    return new NPC(sprite, config);
  }
}

// Uso
const npc = npcFactory.create(scene, {
  id: 'scientist',
  name: 'Dra. Silva',
  texture: 'npc_scientist',
  dialogues: [...]
});

// Tipo seguro!
const dialogue = npc.getDialogue();  // DialogueNode | null
npc.moveTo(100, 200);                 // Seguro
```

---

## 🔴 PROBLEMA 6: Gestão de Estado Inconsistente

### Local: `SceneManager.js`, cenas individuais

**Problema:**
```javascript
// ❌ Estado espalhado
export default class SceneManager {
  currentState = {
    auth: null,
    map: null,
    minigame: null,
    system: []
  };

  // Gerenciado manualmente em múltiplos lugares
  goToMap(mapKey) {
    this.currentState.map = mapKey;  // ❌ Mutação direta
  }
}

// Cada cena gerencia seu próprio estado
export class TetrisGame {
  create() {
    this.score = 0;
    this.level = 1;
    this.gameOver = false;  // ❌ Sem padrão
    this.pieces = [];       // ❌ Sem validação
  }
}
```

**Problema Detalhado:**
1. **Estado mutado diretamente**
2. **Sem validação**
3. **Sem histórico de mudanças**
4. **Difícil debugar**

---

### 🔧 Solução: State Management Pattern

```javascript
// ✅ Bom - State Manager centralizado

// state/GameState.ts
export interface GameStateType {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
    provider: 'linkedin' | 'google' | null;
  };
  scenes: {
    current: SceneName;
    previous: SceneName | null;
    active: SceneName[];
  };
  minigame: {
    active: string | null;
    score: number;
    completed: boolean;
  };
  settings: {
    volume: number;
    difficulty: 'easy' | 'normal' | 'hard';
  };
}

export class GameStateManager extends EventEmitter {
  private state: GameStateType;
  private history: GameStateType[] = [];

  constructor(initialState: Partial<GameStateType>) {
    super();
    this.state = this.mergeWithDefaults(initialState);
  }

  // Imutável - retorna novo estado
  setState(updates: Partial<GameStateType>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Histórico
    this.history.push(oldState);

    // Notificar
    this.emit('state-changed', this.state);
  }

  // Atualização segura com validação
  setCurrentScene(scene: SceneName): void {
    if (!isValidScene(scene)) {
      throw new Error(`Invalid scene: ${scene}`);
    }

    this.setState({
      scenes: {
        ...this.state.scenes,
        previous: this.state.scenes.current,
        current: scene
      }
    });
  }

  // Imutável getter
  getState(): Readonly<GameStateType> {
    return Object.freeze({ ...this.state });
  }

  // Time travel (debug)
  undo(): void {
    if (this.history.length > 0) {
      this.state = this.history.pop()!;
      this.emit('state-changed', this.state);
    }
  }

  private mergeWithDefaults(updates: Partial<GameStateType>): GameStateType {
    return {
      auth: { isAuthenticated: false, user: null, provider: null, ...updates.auth },
      scenes: { current: SCENE_NAMES.LOGIN, previous: null, active: [], ...updates.scenes },
      minigame: { active: null, score: 0, completed: false, ...updates.minigame },
      settings: { volume: 1, difficulty: 'normal', ...updates.settings }
    };
  }
}

// Uso
const stateManager = new GameStateManager({});

stateManager.on('state-changed', (state) => {
  console.log('State updated:', state);
});

stateManager.setCurrentScene(SCENE_NAMES.OFFICE);
const currentState = stateManager.getState();
```

---

## 🔴 PROBLEMA 7: Telemetria Acoplada

### Local: `BaseMinigame.js`, `BaseMapScene.js`

**Problema:**
```javascript
// ❌ Acoplada e inconsistente
export class BaseMinigame {
  create() {
    this.logTelemetry('minigame_started', {
      minigame: this.minigameKey,
      difficulty: this.difficulty,
      user: this.user?.name
    });
  }
}

// Cada minigame faz diferente
export class QuizGame {
  selectOption() {
    this.logTelemetry('option_selected', {
      index: i
      // faltam dados padrão
    });
  }
}
```

---

### 🔧 Solução: Telemetry Service com Tipos

```javascript
// ✅ Bom - Serviço centralizado

// services/TelemetryService.ts
export interface TelemetryEvent {
  name: string;
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
}

export class TelemetryService extends EventEmitter {
  private sessionId: string;
  private queue: TelemetryEvent[] = [];

  constructor() {
    super();
    this.sessionId = this.generateSessionId();
  }

  track(eventName: string, data: Record<string, any> = {}): void {
    const event: TelemetryEvent = {
      name: eventName,
      timestamp: Date.now(),
      data: {
        ...data,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent
      },
      sessionId: this.sessionId
    };

    this.queue.push(event);
    this.emit('event', event);

    // Batch a cada 10 eventos
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
    } catch (error) {
      console.error('Telemetry flush failed:', error);
      // Re-queue on failure
      this.queue.unshift(...batch);
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Uso com tipos
export const TELEMETRY_EVENTS = {
  MINIGAME_STARTED: 'minigame:started',
  MINIGAME_COMPLETED: 'minigame:completed',
  OPTION_SELECTED: 'quiz:option-selected',
  PLAYER_MOVED: 'player:moved'
} as const;

export interface MinigameStartedEvent {
  minigame: string;
  difficulty: 'easy' | 'normal' | 'hard';
  user: string;
}

// Injection
export class QuizGame extends BaseMinigame {
  constructor(private telemetry: TelemetryService) {
    super();
  }

  create() {
    this.telemetry.track(TELEMETRY_EVENTS.MINIGAME_STARTED, {
      minigame: 'quiz',
      difficulty: this.difficulty,
      user: this.user?.name
    } as MinigameStartedEvent);
  }
}
```

---

## 📋 Tabela de Prioridades

| # | Problema | Impacto | Esforço | Prioridade |
|---|----------|--------|--------|-----------|
| 1 | Factory Pattern Incompleto | Alto | Médio | 🔴 Alta |
| 2 | Duplicação em Minigames | Médio | Médio | 🟡 Média |
| 3 | Magic Strings | Médio | Baixo | 🟡 Média |
| 4 | Falta de IoC | Alto | Alto | 🔴 Alta |
| 5 | Propriedades Dinâmicas | Médio | Médio | 🟡 Média |
| 6 | Estado Inconsistente | Alto | Alto | 🔴 Alta |
| 7 | Telemetria Acoplada | Baixo | Baixo | 🟢 Baixa |

---

## 🚀 Mapa de Refatoração Sugerido

### Fase 1: Fundação (Semana 1-2)
1. Criar constantes centralizadas (PROBLEMA 3)
2. Implementar ServiceContainer (PROBLEMA 4)
3. Criar GameStateManager (PROBLEMA 6)

### Fase 2: Camadas (Semana 3-4)
4. Refatorar Factory Pattern (PROBLEMA 1)
5. Criar Classes Wrapper (PROBLEMA 5)
6. Implementar UI Component System (PROBLEMA 2)

### Fase 3: Integração (Semana 5-6)
7. Integrar com todas as cenas
8. Atualizar telemetria (PROBLEMA 7)
9. Testes e refinamento

---

## ✅ Checklist de Melhoria

### Phase 1: Foundation
- [ ] Criar `constants/` com todas as constantes
- [ ] Implementar `ServiceContainer`
- [ ] Implementar `GameStateManager`
- [ ] Criar `types/` com todas as interfaces

### Phase 2: Refactor
- [ ] Criar classes wrapper (`Player`, `NPC`, etc)
- [ ] Refatorar `PlayerFactory` e `NPCFactory`
- [ ] Criar `UIComponent` base
- [ ] Refatorar minigames com components

### Phase 3: Integration
- [ ] Atualizar todas as cenas
- [ ] Integrar state manager
- [ ] Integrar service container
- [ ] Testes automatizados

---

**Documento preparado para guiar refatoração estrutural** 📚
