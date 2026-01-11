# 🗺️ Arquitetura de Transição de Mapas - Diagrama Visual

## Estrutura da Classe SceneManager

```
SceneManager
├── Constructor
│   ├── mapConfig (Configuração centralizada)
│   │   ├── ReceptionScene
│   │   ├── OfficeScene
│   │   ├── LabScene
│   │   └── ... (10 mapas)
│   └── currentState (Estado atual)
│       ├── auth
│       ├── map
│       ├── minigame
│       └── system
│
├── 🎯 MÉTODOS DE TRANSIÇÃO (Core)
│   ├── goToMap(mapKey, data)           [PRINCIPAL - Use isto]
│   └── switchToMap(mapKey, data)       [DEPRECATED - Compatibilidade]
│
├── 🔍 MÉTODOS DE CONSULTA (Query)
│   ├── getMapConfig(mapKey)
│   ├── getAvailableMaps()
│   ├── isValidMap(mapKey)
│   ├── getCurrentMap()
│   ├── getState()
│   └── debugState()
│
├── 🎮 MÉTODOS DE MINIGAME
│   ├── startMinigame(key, data)
│   └── endMinigame(result)
│
├── 🔧 MÉTODOS INTERNOS (Low-level)
│   ├── startScene(key)
│   ├── launchScene(key)
│   ├── stopScene(key)
│   ├── pauseScene(key)
│   └── resumeScene(key)
│
└── 🛡️ MÉTODOS DE SUPORTE
    ├── ensureSystemScenesActive()
    └── stopAllExcept(categories)
```

---

## Fluxo de Execução: goToMap()

```
┌─────────────────────────────────────────┐
│  window.sceneManager.goToMap(           │
│    'OfficeScene',                       │
│    { questId: 'Q001' }                  │
│  )                                       │
└────────────────────┬────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Validar Entrada       │
         ├───────────────────────┤
         │ Mapa existe?          │
         │ ❌ Não → Log erro     │
         │        → Retornar     │
         │ ✅ Sim → Continuar    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Verificar Estado      │
         ├───────────────────────┤
         │ Já está neste mapa?   │
         │ ❌ Sim → Log         │
         │        → Retornar     │
         │ ✅ Não → Continuar    │
         └───────────┬───────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Preparar Dados da Cena         │
    ├────────────────────────────────┤
    │ {                              │
    │   questId: 'Q001',       [user]│
    │   previousScene: atual,  [prev]│
    │   timestamp: now()       [time]│
    │ }                              │
    └────────────┬───────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────┐
  │ Parar Mapa Anterior              │
  ├──────────────────────────────────┤
  │ if (currentMap)                  │
  │   game.scene.stop(currentMap)    │
  │ currentState.map = null          │
  └────────────┬─────────────────────┘
               │
               ▼
  ┌──────────────────────────────────┐
  │ Iniciar Novo Mapa                │
  ├──────────────────────────────────┤
  │ game.scene.run(newMap, data)     │
  │ currentState.map = newMap        │
  └────────────┬─────────────────────┘
               │
               ▼
  ┌──────────────────────────────────┐
  │ Restaurar Sistemas               │
  ├──────────────────────────────────┤
  │ UIScene        → Ativar          │
  │ DialogScene    → Ativar          │
  │ MinimapScene   → Ativar          │
  │ PauseMenuScene → Ativar          │
  └────────────┬─────────────────────┘
               │
               ▼
  ┌──────────────────────────────────┐
  │ Emitir Evento                    │
  ├──────────────────────────────────┤
  │ game.events.emit(                │
  │   'room-changed',                │
  │   'OfficeScene'                  │
  │ )                                │
  └────────────┬─────────────────────┘
               │
               ▼
         ┌──────────────┐
         │ Transição    │
         │  Concluída ✓ │
         │              │
         │ Player está  │
         │ no novo mapa │
         └──────────────┘
```

---

## Estrutura de mapConfig

```javascript
mapConfig = {
  'ReceptionScene': {
    sceneKey: 'ReceptionScene',
    mapKey: 'reception'
  },
  'OfficeScene': {
    sceneKey: 'OfficeScene',
    mapKey: 'office'
  },
  // ... resto dos mapas
}
```

**Cada mapa tem:**
- `sceneKey`: Identificador único (usado em Phaser)
- `mapKey`: Arquivo do mapa Tiled (sem extensão)

---

## Categorias de Cenas

```
┌─────────────────────────────────┐
│      SceneManager               │
│  ┌──────────────────────────┐   │
│  │  sceneCategories         │   │
│  ├──────────────────────────┤   │
│  │ system:  [4 cenas]       │   │ ← Sempre ativas
│  │   └─ UIScene             │   │
│  │   └─ DialogScene         │   │
│  │   └─ PauseMenuScene      │   │
│  │   └─ MinimapScene        │   │
│  │                          │   │
│  │ auth:    [1 cena]        │   │ ← Exclusiva
│  │   └─ LoginScene          │   │
│  │                          │   │
│  │ map:     [10 cenas]      │   │ ← Uma por vez
│  │   └─ ReceptionScene      │   │
│  │   └─ OfficeScene         │   │
│  │   └─ LabScene            │   │
│  │   └─ ... (7 mais)        │   │
│  │                          │   │
│  │ minigame:[7 cenas]       │   │ ← Uma por vez
│  │   └─ PuzzleGame          │   │
│  │   └─ QuizGame            │   │
│  │   └─ ... (5 mais)        │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

---

## Estado Atual (currentState)

```
currentState = {
  auth: null | 'LoginScene',
  map: null | 'ReceptionScene' | 'OfficeScene' | ... | 'BossRoomScene',
  minigame: null | 'PuzzleGame' | 'QuizGame' | ...,
  system: [
    'UIScene',
    'DialogScene',
    'PauseMenuScene',
    'MinimapScene'
  ]
}
```

**Estado Típico em Jogo:**
```javascript
{
  auth: null,                    // Usuário autenticado
  map: 'OfficeScene',           // Mapa ativo
  minigame: null,               // Sem minigame
  system: [4 cenas ativas]      // Todos os sistemas
}
```

---

## Sequência de Transição Visual

```
ANTES:                          DURANTE:                        DEPOIS:
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│ Reception    │               │ (Transição)  │               │ Office       │
│              │               │              │               │              │
│ ┌──────────┐ │               │ • Parar cena │               │ ┌──────────┐ │
│ │ Player   │ │               │ • Carregar   │               │ │ Player   │ │
│ │ NPC      │ │──────────────▶│ • Iniciar    │──────────────▶│ │ NPC      │ │
│ │ Door     │ │               │ • Restaurar  │               │ │ Door     │ │
│ │ Objects  │ │               │ • Notificar  │               │ │ Objects  │ │
│ └──────────┘ │               │              │               │ └──────────┘ │
│              │               └──────────────┘               │              │
│ Sistemas: ✓  │               Duração: ~100ms               │ Sistemas: ✓  │
└──────────────┘                                              └──────────────┘

              goToMap('OfficeScene', data)
```

---

## Métodos de Consulta - Exemplos

```
┌─────────────────────────────────────────┐
│  Métodos de Consulta (Query Methods)    │
├─────────────────────────────────────────┤
│                                         │
│  manager.getMapConfig('OfficeScene')   │
│  └─▶ { sceneKey: '...', mapKey: '...' }│
│                                         │
│  manager.getAvailableMaps()             │
│  └─▶ [10 mapas]                        │
│                                         │
│  manager.isValidMap('OfficeScene')      │
│  └─▶ true                              │
│                                         │
│  manager.isValidMap('InvalidScene')     │
│  └─▶ false                             │
│                                         │
│  manager.getCurrentMap()                │
│  └─▶ 'OfficeScene'                     │
│                                         │
│  manager.getState()                     │
│  └─▶ { auth: null, map: '...', ... }   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Comparação: Antes vs Depois

```
ANTES (Anti-pattern):
┌─────────────────────────────────────────┐
│ SceneManager                            │
├─────────────────────────────────────────┤
│ switchToMap()                           │
│ switchToReception()                     │
│ switchToOffice()                        │
│ switchToLab()                           │
│ switchToMeetingRoom()                   │
│ switchToArchiveRoom()                   │
│ switchToItRoom()                        │
│ switchToRhRoom()                        │
│ switchToElevator()                      │
│ switchToGarden()                        │
│ switchToBossRoom()                      │
│ ... (muita duplicação de código)        │
└─────────────────────────────────────────┘
         ❌ Difícil manutenção
         ❌ Código duplicado
         ❌ Não escalável


DEPOIS (Design Pattern):
┌─────────────────────────────────────────┐
│ SceneManager                            │
├─────────────────────────────────────────┤
│ mapConfig {10 mapas}                    │
│                                         │
│ goToMap(mapKey) ◀── UMA FUNÇÃO          │
│                      PARA TUDO!         │
│ Query Methods:                          │
│ • getMapConfig()                        │
│ • getAvailableMaps()                    │
│ • isValidMap()                          │
│ • getCurrentMap()                       │
└─────────────────────────────────────────┘
         ✅ Fácil manutenção
         ✅ Código limpo (DRY)
         ✅ Escalável
```

---

## Fluxo de Adição de Novo Mapa

```
Problema: "Quero adicionar um novo mapa"

ANTES:
├─ Criar cena: NewRoomScene.js
├─ Criar função: switchToNewRoom()
├─ Adicionar à lista de cenas
└─ Documentar função
   ❌ 4 etapas, código duplicado

DEPOIS:
├─ Criar cena: NewRoomScene.js
├─ Adicionar em mapConfig:
│  'NewRoomScene': {
│    sceneKey: 'NewRoomScene',
│    mapKey: 'new-room'
│  }
└─ ✓ PRONTO! Use: goToMap('NewRoomScene')
   ✅ 2 etapas, sem duplicação
```

---

## Validação Automática

```
Chamada: goToMap('InvalidMap')
           │
           ▼
    ┌─────────────┐
    │ Validar em  │
    │  mapConfig  │
    └──────┬──────┘
           │
       ❌ Não existe
           │
           ▼
    ┌──────────────────────────┐
    │ console.error():         │
    │ "Mapa inválido: ..."     │
    │                          │
    │ "Mapas disponíveis:      │
    │  ReceptionScene,         │
    │  OfficeScene, ..."       │
    └──────────────────────────┘
           │
           ▼
    Retornar sem fazer nada
```

---

**Arquitetura implementada e documentada! 🎉**
