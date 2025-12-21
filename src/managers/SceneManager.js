/**
 * SceneManager - Gerenciador centralizado de cenas
 * 
 * Controla quais cenas devem estar ativas, pausadas ou paradas em cada momento.
 * Gerencia a transição entre cenas de forma consistente.
 */
export default class SceneManager {
  constructor(game) {
    this.game = game;
    
    // Categorias de cenas
    this.sceneCategories = {
      // Cenas de sistema que devem estar sempre ativas (overlay)
      system: ['UIScene', 'DialogScene', 'PauseMenuScene', 'MinimapScene'],
      
      // Cenas de autenticação (exclusivas)
      auth: ['LoginScene'],
      
      // Cenas de mapa (apenas uma ativa por vez)
      map: [
        'ReceptionScene',
        'OfficeScene',
        'LabScene',
        'MeetingRoomScene',
        'ArchiveRoomScene',
        'ItRoomScene',
        'RhRoomScene',
        'ElevatorScene',
        'GardenScene',
        'BossRoomScene'
      ],
      
      // Minigames (exclusivos, pausam a cena de mapa)
      minigame: [
        'PuzzleGame',
        'QuizGame',
        'MemoryGame',
        'TypingGame',
        'WhackAMoleGame',
        'TetrisGame',
        'SnakeGame'
      ]
    };
    
    // Estado atual
    this.currentState = {
      auth: null,        // Cena de autenticação ativa (null se autenticado)
      map: null,         // Cena de mapa ativa
      minigame: null,    // Minigame ativo (null se não houver)
      system: []         // Cenas de sistema ativas
    };
    
    console.log('[SceneManager] Initialized');
  }
  
  /**
   * Obtém o Phaser SceneManager
   */
  getSceneManager() {
    return this.game.scene;
  }
  
  /**
   * Obtém o ScenePlugin de uma cena ativa para manipular outras cenas
   * Prioriza cenas de sistema que são persistentes
   */
  getScenePlugin() {
    const sceneManager = this.getSceneManager();
    
    // Primeiro: tentar pegar uma cena de sistema ativa (são persistentes)
    for (const systemSceneKey of this.sceneCategories.system) {
      if (sceneManager.isActive(systemSceneKey)) {
        const scene = sceneManager.getScene(systemSceneKey);
        if (scene) {
          return scene.scene;
        }
      }
    }
    
    // Segundo: tentar pegar qualquer cena ativa
    const scenes = sceneManager.getScenes(true);
    if (scenes.length > 0) {
      return scenes[0].scene;
    }
    
    // Fallback: pegar a primeira cena disponível
    const allScenes = sceneManager.scenes;
    if (allScenes.length > 0) {
      return allScenes[0].scene;
    }
    
    return null;
  }
  
  /**
   * Inicia o jogo na tela de login
   */
  startGame() {
    console.log('[SceneManager] Starting game at login screen');
    this.switchToAuth('LoginScene');
  }
  
  /**
   * Muda para uma cena de autenticação
   * Para todas as outras cenas exceto system
   */
  switchToAuth(authSceneKey) {
    console.log(`[SceneManager] Switching to auth: ${authSceneKey}`);
    
    // Parar todas as cenas
    this.game.scene.getScenes(true).forEach(scene => {
      if (scene.scene.key !== authSceneKey) {
        this.game.scene.stop(scene.scene.key);
      }
    });
    
    // Iniciar cena de auth
    this.game.scene.start(authSceneKey);
    this.currentState.auth = authSceneKey;
    this.currentState.map = null;
    this.currentState.minigame = null;
    this.currentState.system = [];
  }
  
  /**
   * Inicia o jogo após autenticação bem-sucedida
   * @param {string} initialMapScene - Cena de mapa inicial (padrão: ReceptionScene)
   * @param {Object} userData - Dados do usuário autenticado
   */
  startGameplay(initialMapScene = 'ReceptionScene', userData = {}) {
    console.log(`[SceneManager] Starting gameplay at: ${initialMapScene}`);
    
    // Parar cena de auth
    if (this.currentState.auth) {
      this.game.scene.stop(this.currentState.auth);
      this.currentState.auth = null;
    }
    
    // Limpar lista de cenas de sistema
    this.currentState.system = [];
    
    // Dados da cena
    const sceneData = {
      ...userData,
      previousScene: null,
      timestamp: Date.now()
    };
    
    // LANÇAR TODAS AS CENAS EM PARALELO
    // 1. Mapa (base) - usar start para iniciar
    console.log(`[SceneManager] Starting: ${initialMapScene}`);
    this.game.scene.start(initialMapScene, sceneData);
    this.currentState.map = initialMapScene;
    
    // 2. Cenas de sistema - lançar após a cena de mapa iniciar
    // Usar evento 'create' da cena ou setTimeout como fallback
    const launchSystemScenes = () => {
      const mapScene = this.game.scene.getScene(initialMapScene);
      if (mapScene && mapScene.scene) {
        this.sceneCategories.system.forEach(sceneKey => {
          console.log(`[SceneManager] Launching system scene: ${sceneKey}`);
          if (!this.game.scene.isActive(sceneKey)) {
            mapScene.scene.launch(sceneKey);
          }
          if (!this.currentState.system.includes(sceneKey)) {
            this.currentState.system.push(sceneKey);
          }
        });
        console.log(`[SceneManager] All system scenes launched`);
      } else {
        console.error('[SceneManager] Map scene not available');
      }
    };
    
    // Tentar imediatamente e também com pequeno delay para garantir
    launchSystemScenes();
    setTimeout(launchSystemScenes, 100);
    
    // Notificar mudança de sala
    this.game.events.emit('room-changed', initialMapScene);
    
    console.log(`[SceneManager] Gameplay started - all scenes launched`);
  }
  
  /**
   * Muda para uma cena de mapa diferente
   * @param {string} mapSceneKey - Chave da nova cena de mapa
   * @param {Object} data - Dados a passar para a nova cena
   */
  switchToMap(mapSceneKey, data = {}) {
    if (!this.sceneCategories.map.includes(mapSceneKey)) {
      console.error(`[SceneManager] Invalid map scene: ${mapSceneKey}`);
      return;
    }
    
    console.log(`[SceneManager] Switching map: ${this.currentState.map} -> ${mapSceneKey}`);
    
    const sceneData = {
      ...data,
      previousScene: this.currentState.map,
      timestamp: Date.now()
    };
    
    // Parar cena de mapa anterior
    if (this.currentState.map && this.currentState.map !== mapSceneKey) {
      console.log(`[SceneManager] Stopping current map: ${this.currentState.map}`);
      this.game.scene.stop(this.currentState.map);
    }
    
    // Lançar nova cena de mapa usando run (equivalente a launch)
    console.log(`[SceneManager] Running new map scene: ${mapSceneKey}`);
    this.game.scene.run(mapSceneKey, sceneData);
    this.currentState.map = mapSceneKey;
    
    // Notificar mudança de sala
    this.game.events.emit('room-changed', mapSceneKey);
    
    console.log(`[SceneManager] Map switch complete`);
  }
  
  /**
   * Inicia um minigame, pausando a cena de mapa atual
   * @param {string} minigameKey - Chave do minigame
   * @param {Object} data - Dados do minigame
   */
  startMinigame(minigameKey, data = {}) {
    if (!this.sceneCategories.minigame.includes(minigameKey)) {
      console.error(`[SceneManager] Invalid minigame: ${minigameKey}`);
      return;
    }
    
    console.log(`[SceneManager] Starting minigame: ${minigameKey}`);
    
    // Pausar cena de mapa (não parar, para manter estado)
    if (this.currentState.map) {
      this.pauseScene(this.currentState.map);
    }
    
    // Parar cenas de sistema (exceto DialogScene para mensagens de vitória/derrota)
    this.sceneCategories.system.forEach(sceneKey => {
      if (sceneKey !== 'DialogScene') {
        this.pauseScene(sceneKey);
      }
    });
    
    // Iniciar minigame
    const minigameData = {
      ...data,
      returnToScene: this.currentState.map,
      timestamp: Date.now()
    };
    
    this.startScene(minigameKey, minigameData);
    this.currentState.minigame = minigameKey;
  }
  
  /**
   * Finaliza um minigame e retorna para a cena de mapa
   * @param {Object} result - Resultado do minigame (score, completed, etc)
   */
  endMinigame(result = {}) {
    if (!this.currentState.minigame) {
      console.warn('[SceneManager] No minigame active to end');
      return;
    }
    
    console.log(`[SceneManager] Ending minigame: ${this.currentState.minigame}`);
    
    const returnScene = this.currentState.map;
    
    // Parar minigame
    this.stopScene(this.currentState.minigame);
    this.currentState.minigame = null;
    
    // Retomar cena de mapa
    if (returnScene) {
      this.resumeScene(returnScene);
    }
    
    // Retomar cenas de sistema
    this.ensureSystemScenesActive();
    
    // Emitir evento com resultado do minigame
    this.game.events.emit('minigame-completed', result);
  }
  
  /**
   * Garante que todas as cenas de sistema necessárias estão ativas
   */
  ensureSystemScenesActive() {
    // Não iniciar cenas de sistema se estiver em auth
    if (this.currentState.auth) {
      return;
    }
    
    const sceneManager = this.getSceneManager();
    
    this.sceneCategories.system.forEach(sceneKey => {
      const isActive = sceneManager.isActive(sceneKey);
      const isPaused = sceneManager.isPaused(sceneKey);
      
      if (!isActive) {
        console.log(`[SceneManager] Launching system scene: ${sceneKey}`);
        this.launchScene(sceneKey);
        if (!this.currentState.system.includes(sceneKey)) {
          this.currentState.system.push(sceneKey);
        }
      } else if (isPaused) {
        console.log(`[SceneManager] Resuming system scene: ${sceneKey}`);
        this.resumeScene(sceneKey);
      }
    });
  }
  
  /**
   * Para todas as cenas exceto as especificadas
   * @param {Array<string>} exceptCategories - Categorias a não parar (ex: ['system'])
   */
  stopAllExcept(exceptCategories = []) {
    console.log(`[SceneManager] Stopping all scenes except: ${exceptCategories.join(', ')}`);
    
    const sceneManager = this.getSceneManager();
    
    Object.entries(this.sceneCategories).forEach(([category, scenes]) => {
      if (exceptCategories.includes(category)) {
        return;
      }
      
      scenes.forEach(sceneKey => {
        if (sceneManager.isActive(sceneKey)) {
          this.stopScene(sceneKey);
        }
      });
    });
  }
  
  /**
   * Inicia uma cena (usa game.scene.start)
   */
  startScene(sceneKey, data = {}) {
    console.log(`[SceneManager] Starting scene: ${sceneKey}`);
    this.game.scene.start(sceneKey, data);
  }
  
  /**
   * Lança uma cena em paralelo (usa game.scene.run)
   * Usado para cenas de overlay/UI
   */
  launchScene(sceneKey, data = {}) {
    console.log(`[SceneManager] Running scene: ${sceneKey}`);
    
    const sceneManager = this.getSceneManager();
    
    // Verificar se já está ativa antes de lançar
    if (sceneManager.isActive(sceneKey)) {
      console.log(`[SceneManager] Scene ${sceneKey} already active, skipping`);
      return;
    }
    
    // Usar run do SceneManager (equivalente a launch)
    this.game.scene.run(sceneKey, data);
  }
  
  /**
   * Para uma cena completamente
   */
  stopScene(sceneKey) {
    console.log(`[SceneManager] Stopping scene: ${sceneKey}`);
    
    if (this.game.scene.isActive(sceneKey)) {
      this.game.scene.stop(sceneKey);
    }
  }
  
  /**
   * Pausa uma cena (mantém estado, para update)
   */
  pauseScene(sceneKey) {
    console.log(`[SceneManager] Pausing scene: ${sceneKey}`);
    
    if (this.game.scene.isActive(sceneKey) && !this.game.scene.isPaused(sceneKey)) {
      this.game.scene.pause(sceneKey);
    }
  }
  
  /**
   * Retoma uma cena pausada
   */
  resumeScene(sceneKey) {
    console.log(`[SceneManager] Resuming scene: ${sceneKey}`);
    
    if (this.game.scene.isPaused(sceneKey)) {
      this.game.scene.resume(sceneKey);
    }
  }
  
  /**
   * Retorna o estado atual do gerenciador
   */
  getState() {
    return {
      ...this.currentState,
      activeScenes: this.game.scene.getScenes(true).map(s => s.scene.key)
    };
  }
  
  /**
   * Debug: imprime estado atual
   */
  debugState() {
    const state = this.getState();
    console.log('[SceneManager] Current State:', state);
    
    // Verificar visualmente cada cena de sistema
    console.log('[SceneManager] System Scenes Status:');
    this.sceneCategories.system.forEach(sceneKey => {
      const isActive = this.game.scene.isActive(sceneKey);
      const isPaused = this.game.scene.isPaused(sceneKey);
      const status = !isActive ? '❌ INACTIVE' : isPaused ? '⏸️ PAUSED' : '✅ ACTIVE';
      console.log(`  ${sceneKey}: ${status}`);
    });
    
    return state;
  }
}
