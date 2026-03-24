/**
 * GameStateManager - Gerenciador centralizado de estado do jogo
 * 
 * Fornece gerenciamento de estado imutável com histórico,
 * eventos de mudança e validação.
 * 
 * Uso:
 *   const stateManager = new GameStateManager();
 *   stateManager.on('state-changed', (state) => console.log(state));
 *   stateManager.setCurrentScene('OfficeScene');
 *   const state = stateManager.getState();
 */

import { SCENE_NAMES, isValidSceneName } from '../constants/SceneNames.js';

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated
 * @property {Object|null} user
 * @property {string|null} provider
 */

/**
 * @typedef {Object} SceneState
 * @property {string|null} current
 * @property {string|null} previous
 * @property {string[]} active
 */

/**
 * @typedef {Object} MinigameState
 * @property {string|null} active
 * @property {number} score
 * @property {boolean} completed
 * @property {Object} stats
 */

/**
 * @typedef {Object} SettingsState
 * @property {number} volume
 * @property {string} difficulty
 * @property {boolean} musicEnabled
 * @property {boolean} sfxEnabled
 */

/**
 * @typedef {Object} GameState
 * @property {AuthState} auth
 * @property {SceneState} scenes
 * @property {MinigameState} minigame
 * @property {SettingsState} settings
 * @property {Object} player
 */

export default class GameStateManager {
  /**
   * @param {Partial<GameState>} initialState - Estado inicial opcional
   */
  constructor(initialState = {}) {
    /** @type {GameState} */
    this._state = this._mergeWithDefaults(initialState);
    
    /** @type {GameState[]} */
    this._history = [];
    
    /** @type {number} */
    this._maxHistory = 50;
    
    /** @type {Map<string, Function[]>} */
    this._listeners = new Map();
    
    /** @type {boolean} */
    this._debug = false;

    /** @type {string|null} */
    this._progressUserKey = null;
  }
  
  // ============================================
  // GETTERS
  // ============================================
  
  /**
   * Retorna uma cópia imutável do estado atual
   * @returns {Readonly<GameState>}
   */
  getState() {
    return Object.freeze(this._deepClone(this._state));
  }
  
  /**
   * Obtém um valor específico do estado
   * @param {string} path - Caminho separado por ponto (ex: 'auth.user.name')
   * @returns {any}
   */
  get(path) {
    const parts = path.split('.');
    let value = this._state;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Obtém o estado de autenticação
   * @returns {AuthState}
   */
  getAuth() {
    return { ...this._state.auth };
  }
  
  /**
   * Obtém o estado das cenas
   * @returns {SceneState}
   */
  getScenes() {
    return { ...this._state.scenes };
  }
  
  /**
   * Obtém a cena atual
   * @returns {string|null}
   */
  getCurrentScene() {
    return this._state.scenes.current;
  }
  
  /**
   * Obtém o estado do minigame
   * @returns {MinigameState}
   */
  getMinigame() {
    return { ...this._state.minigame };
  }
  
  /**
   * Obtém as configurações
   * @returns {SettingsState}
   */
  getSettings() {
    return { ...this._state.settings };
  }
  
  // ============================================
  // SETTERS
  // ============================================
  
  /**
   * Atualiza o estado com validação
   * @param {Partial<GameState>} updates - Atualizações parciais
   */
  setState(updates) {
    // Salvar no histórico
    this._pushHistory();
    
    // Merge profundo
    this._state = this._deepMerge(this._state, updates);
    
    // Notificar listeners
    this._emit('state-changed', this.getState());
    
    if (this._debug) {
      console.log('[GameStateManager] State updated:', this._state);
    }
  }
  
  /**
   * Define a cena atual
   * @param {string} sceneName 
   */
  setCurrentScene(sceneName) {
    if (!isValidSceneName(sceneName)) {
      console.warn(`[GameStateManager] Cena inválida: ${sceneName}`);
    }
    
    const previousScene = this._state.scenes.current;
    
    this.setState({
      scenes: {
        ...this._state.scenes,
        previous: previousScene,
        current: sceneName
      }
    });
    
    this._emit('scene-changed', { previous: previousScene, current: sceneName });
  }
  
  /**
   * Adiciona uma cena às ativas
   * @param {string} sceneName 
   */
  addActiveScene(sceneName) {
    if (!this._state.scenes.active.includes(sceneName)) {
      this.setState({
        scenes: {
          ...this._state.scenes,
          active: [...this._state.scenes.active, sceneName]
        }
      });
    }
  }
  
  /**
   * Remove uma cena das ativas
   * @param {string} sceneName 
   */
  removeActiveScene(sceneName) {
    this.setState({
      scenes: {
        ...this._state.scenes,
        active: this._state.scenes.active.filter(s => s !== sceneName)
      }
    });
  }
  
  /**
   * Define o usuário autenticado
   * @param {Object} user 
   * @param {string} provider 
   */
  setUser(user, provider = null) {
    this.setState({
      auth: {
        isAuthenticated: !!user,
        user,
        provider
      }
    });

    this._progressUserKey = this._resolveUserProgressKey(user, provider);
    
    this._emit('auth-changed', this._state.auth);
  }
  
  /**
   * Limpa o usuário (logout)
   */
  clearUser() {
    this.setState({
      auth: {
        isAuthenticated: false,
        user: null,
        provider: null
      }
    });

    this._progressUserKey = null;
    
    this._emit('auth-changed', this._state.auth);
  }
  
  /**
   * Define o minigame ativo
   * @param {string} minigameName 
   */
  setActiveMinigame(minigameName) {
    this.setState({
      minigame: {
        ...this._state.minigame,
        active: minigameName,
        score: 0,
        completed: false,
        stats: {}
      }
    });
    
    this._emit('minigame-started', minigameName);
  }
  
  /**
   * Atualiza o score do minigame
   * @param {number} score 
   */
  setMinigameScore(score) {
    this.setState({
      minigame: {
        ...this._state.minigame,
        score
      }
    });
    
    this._emit('score-changed', score);
  }
  
  /**
   * Finaliza o minigame
   * @param {boolean} completed 
   * @param {Object} stats 
   */
  endMinigame(completed, stats = {}) {
    const result = {
      minigame: this._state.minigame.active,
      score: this._state.minigame.score,
      completed,
      stats
    };
    
    this.setState({
      minigame: {
        active: null,
        score: 0,
        completed: false,
        stats: {}
      }
    });
    
    this._emit('minigame-ended', result);
  }
  
  /**
   * Atualiza configurações
   * @param {Partial<SettingsState>} settings 
   */
  updateSettings(settings) {
    this.setState({
      settings: {
        ...this._state.settings,
        ...settings
      }
    });
    
    this._emit('settings-changed', this._state.settings);
  }

  // ============================================
  // PLAYER PROGRESS / FLAGS
  // ============================================

  /**
   * Define um flag global do jogador
   * @param {string} id
   * @param {any} value
   */
  setFlag(id, value = true) {
    if (!id) return;

    this.setState({
      player: {
        ...this._state.player,
        flags: {
          ...(this._state.player.flags || {}),
          [id]: value
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Obtém um flag global do jogador
   * @param {string} id
   * @returns {any}
   */
  getFlag(id) {
    return this._state.player.flags?.[id];
  }

  /**
   * Limpa todas as flags do jogador
   */
  clearFlags() {
    const existingFlags = this._state.player.flags || {};
    const wasResetGameEnabled = existingFlags.resetgame === true;
    const clearedFlags = Object.keys(existingFlags).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    this.setState({
      player: {
        ...this._state.player,
        flags: clearedFlags
      }
    });

    this.saveProgress();

    if (wasResetGameEnabled && clearedFlags.resetgame === false) {
      this._emit('resetgame-triggered', { source: 'clear-flags' });
    }
  }

  /**
   * Remove uma flag específica do jogador
   * @param {string} id
   */
  removeFlag(id) {
    if (!id) return;

    const currentFlags = this._state.player.flags || {};
    const previousValue = currentFlags[id];
    if (!(id in currentFlags)) {
      return;
    }

    this.setState({
      player: {
        ...this._state.player,
        flags: {
          ...currentFlags,
          [id]: false
        }
      }
    });

    this.saveProgress();

    if (id === 'resetgame' && previousValue === true) {
      this._emit('resetgame-triggered', { source: 'remove-flag' });
    }
  }

  /**
   * Limpa dados de sessão/progresso mantendo autenticação opcionalmente
   * @param {{preserveAuth?: boolean}} options
   */
  resetSessionData(options = {}) {
    const { preserveAuth = true } = options;

    const authSnapshot = preserveAuth
      ? { ...this._state.auth }
      : { isAuthenticated: false, user: null, provider: null };

    const defaultState = this._mergeWithDefaults({});

    this.setState({
      scenes: {
        ...defaultState.scenes,
        current: this._state.scenes?.current || defaultState.scenes.current,
        previous: null,
        active: []
      },
      minigame: { ...defaultState.minigame },
      settings: { ...this._state.settings },
      player: {
        ...defaultState.player,
        flags: {
          ...defaultState.player.flags,
          resetgame: true
        }
      },
      auth: authSnapshot
    });

    this.clearHistory();

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = this._getCandidateProgressStorageKeys(authSnapshot.user, authSnapshot.provider);
      keys.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.removeItem('janus_minigame_progress');
    }

    if (authSnapshot.user) {
      this._progressUserKey = this._resolveUserProgressKey(authSnapshot.user, authSnapshot.provider);
      this.saveProgress();
    }

    this._emit('session-reset', { preserveAuth });
  }

  /**
   * Define status de quest
   * @param {string} questId
   * @param {string} status
   */
  setQuestStatus(questId, status = 'started') {
    if (!questId) return;

    this.setState({
      player: {
        ...this._state.player,
        quests: {
          ...(this._state.player.quests || {}),
          [questId]: status
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Obtém status de quest
   * @param {string} questId
   * @returns {string|null}
   */
  getQuestStatus(questId) {
    return this._state.player.quests?.[questId] ?? null;
  }

  /**
   * Adiciona item ao inventário
   * @param {string} itemId
   * @param {number} quantity
   */
  addItem(itemId, quantity = 1) {
    if (!itemId) return;

    const current = Number(this._state.player.inventory?.[itemId] || 0);
    const next = Math.max(0, current + Number(quantity || 0));

    this.setState({
      player: {
        ...this._state.player,
        inventory: {
          ...(this._state.player.inventory || {}),
          [itemId]: next
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Remove item do inventário
   * @param {string} itemId
   * @param {number} quantity
   */
  removeItem(itemId, quantity = 1) {
    this.addItem(itemId, -Math.abs(Number(quantity || 1)));
  }

  /**
   * Verifica se possui item
   * @param {string} itemId
   * @returns {boolean}
   */
  hasItem(itemId) {
    return this.getItemCount(itemId) > 0;
  }

  /**
   * Obtém quantidade de item
   * @param {string} itemId
   * @returns {number}
   */
  getItemCount(itemId) {
    return Number(this._state.player.inventory?.[itemId] || 0);
  }

  /**
   * Define stat do jogador
   * @param {string} id
   * @param {number} value
   */
  setStat(id, value) {
    if (!id) return;

    this.setState({
      player: {
        ...this._state.player,
        stats: {
          ...(this._state.player.stats || {}),
          [id]: value
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Obtém stat do jogador
   * @param {string} id
   * @returns {number}
   */
  getStat(id) {
    return Number(this._state.player.stats?.[id] || 0);
  }

  /**
   * Atualiza última localização do jogador
   * @param {string} scene
   * @param {string} [spawnPoint='default']
   */
  setPlayerLastLocation(scene, spawnPoint = 'default') {
    if (!scene) return;

    this.setState({
      player: {
        ...this._state.player,
        lastLocation: {
          scene,
          spawnPoint,
          timestamp: Date.now()
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Obtém última localização do jogador
   * @returns {{scene:string,spawnPoint:string,timestamp:number}|null}
   */
  getPlayerLastLocation() {
    return this._state.player.lastLocation || null;
  }

  /**
   * Atualiza última posição exata do jogador
   * @param {number} x
   * @param {number} y
   * @param {string|null} direction
   * @param {string|null} scene
   */
  setPlayerPosition(x, y, direction = null, scene = null) {
    if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
      return;
    }

    this.setState({
      player: {
        ...this._state.player,
        lastPosition: {
          x: Number(x),
          y: Number(y),
          direction: direction || null,
          scene: scene || this._state.player.lastLocation?.scene || null,
          timestamp: Date.now()
        }
      }
    });

    this.saveProgress();
  }

  /**
   * Obtém última posição exata do jogador
   * @returns {{x:number,y:number,direction:string|null,scene:string|null,timestamp:number}|null}
   */
  getPlayerPosition() {
    return this._state.player.lastPosition || null;
  }

  /**
   * Persiste progresso por usuário
   */
  saveProgress() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const storageKey = this._getProgressStorageKey();
    if (!storageKey) {
      return;
    }

    const payload = {
      version: 1,
      savedAt: Date.now(),
      player: this._deepClone(this._state.player)
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('[GameStateManager] Falha ao salvar progresso:', error?.message || error);
    }
  }

  /**
   * Carrega progresso por usuário
   * @param {Object|null} user
   * @param {string|null} provider
   * @returns {boolean}
   */
  loadProgressForUser(user = null, provider = null) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const resolvedUser = user || this._state.auth.user;
    const resolvedProvider = provider || this._state.auth.provider;
    this._progressUserKey = this._resolveUserProgressKey(resolvedUser, resolvedProvider);

    const storageKeys = this._getCandidateProgressStorageKeys(resolvedUser, resolvedProvider);
    if (storageKeys.length === 0) {
      return false;
    }

    let raw = null;
    for (const key of storageKeys) {
      raw = window.localStorage.getItem(key);
      if (raw) {
        break;
      }
    }

    if (!raw) {
      return false;
    }

    try {
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== 'object') {
        return false;
      }

      const playerProgress = payload.player || {};
      this.setState({
        player: {
          ...this._state.player,
          ...playerProgress,
          flags: {
            resetgame: true,
            ...(playerProgress.flags || {})
          },
          inventory: { ...(playerProgress.inventory || {}) },
          quests: { ...(playerProgress.quests || {}) },
          stats: { ...(playerProgress.stats || {}) }
        }
      });

      return true;
    } catch (error) {
      console.warn('[GameStateManager] Falha ao carregar progresso:', error?.message || error);
      return false;
    }
  }
  
  // ============================================
  // HISTÓRICO (Time Travel)
  // ============================================
  
  /**
   * Desfaz a última mudança de estado
   * @returns {boolean} - Se conseguiu desfazer
   */
  undo() {
    if (this._history.length === 0) {
      return false;
    }
    
    this._state = this._history.pop();
    this._emit('state-changed', this.getState());
    this._emit('state-undo', this.getState());
    
    return true;
  }
  
  /**
   * Limpa o histórico
   */
  clearHistory() {
    this._history = [];
  }
  
  /**
   * Obtém o tamanho do histórico
   * @returns {number}
   */
  getHistoryLength() {
    return this._history.length;
  }
  
  // ============================================
  // SISTEMA DE EVENTOS
  // ============================================
  
  /**
   * Registra um listener de evento
   * @param {string} event 
   * @param {Function} callback 
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }
  
  /**
   * Remove um listener de evento
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emite um evento
   * @param {string} event 
   * @param {any} data 
   * @private
   */
  _emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[GameStateManager] Erro no listener de '${event}':`, e);
        }
      });
    }
  }
  
  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================
  
  /**
   * Adiciona estado atual ao histórico
   * @private
   */
  _pushHistory() {
    const snapshot = this._deepClone(this._state);
    this._history.push(snapshot);
    
    // Limitar tamanho do histórico
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }
  
  /**
   * Merge profundo de objetos
   * @param {Object} target 
   * @param {Object} source 
   * @returns {Object}
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Cria uma cópia profunda
   * @param {any} obj 
   * @returns {any}
   * @private
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this._deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
      cloned[key] = this._deepClone(obj[key]);
    }
    return cloned;
  }
  
  /**
   * Merge com valores padrão
   * @param {Partial<GameState>} updates 
   * @returns {GameState}
   * @private
   */
  _mergeWithDefaults(updates) {
    const defaults = {
      auth: {
        isAuthenticated: false,
        user: null,
        provider: null
      },
      scenes: {
        current: SCENE_NAMES.LOGIN,
        previous: null,
        active: []
      },
      minigame: {
        active: null,
        score: 0,
        completed: false,
        stats: {}
      },
      settings: {
        volume: 1,
        difficulty: 'normal',
        musicEnabled: true,
        sfxEnabled: true
      },
      player: {
        position: { x: 0, y: 0 },
        inventory: {},
        quests: {},
        stats: {},
        flags: {
          contacted_receptionist: false,
          reception_intro_modal_seen: false,
          reception_intro_dialog_seen: false,
          reception_intro_modal_active: false,
          reception_intro_dialog_active: false,
          resetgame: true
        },
        lastLocation: null,
        lastPosition: null
      }
    };
    
    return this._deepMerge(defaults, updates);
  }
  
  // ============================================
  // UTILITÁRIOS
  // ============================================
  
  /**
   * Ativa modo debug
   * @param {boolean} enabled 
   */
  setDebug(enabled) {
    this._debug = enabled;
  }
  
  /**
   * Reseta o estado para os valores padrão
   */
  reset() {
    this._pushHistory();
    this._state = this._mergeWithDefaults({});
    this._emit('state-reset', this.getState());
  }
  
  /**
   * Exporta o estado para JSON (para salvar)
   * @returns {string}
   */
  export() {
    return JSON.stringify(this._state);
  }
  
  /**
   * Importa estado de JSON (para carregar)
   * @param {string} json 
   */
  import(json) {
    try {
      const state = JSON.parse(json);
      this._pushHistory();
      this._state = this._mergeWithDefaults(state);
      this._emit('state-imported', this.getState());
    } catch (e) {
      console.error('[GameStateManager] Erro ao importar estado:', e);
    }
  }

  /**
   * @private
   */
  _resolveUserProgressKey(user, provider = null) {
    if (!user) {
      return null;
    }

    const candidate =
      user.id ||
      user.sub ||
      user.email ||
      user.username ||
      user.name;

    if (!candidate) {
      return null;
    }

    const normalized = String(candidate).toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
    // Chave estável por identidade do usuário (independente de provider)
    return `user:${normalized}`;
  }

  /**
   * @private
   */
  _getProgressStorageKey() {
    return this._progressUserKey ? `janus_progress_${this._progressUserKey}` : null;
  }

  /**
   * @private
   */
  _getCandidateProgressStorageKeys(user, provider = null) {
    const keys = [];
    const stable = this._resolveUserProgressKey(user, provider);
    if (stable) {
      keys.push(`janus_progress_${stable}`);
    }

    // Compatibilidade com formato legado: "provider:identity"
    if (user) {
      const candidate =
        user.id ||
        user.sub ||
        user.email ||
        user.username ||
        user.name;

      if (candidate) {
        const normalized = String(candidate).toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
        const providerCandidates = [
          provider,
          user.provider,
          this._state?.auth?.provider,
          'google',
          'linkedin',
          'dev',
          'local'
        ].filter(Boolean);

        providerCandidates.forEach((prefix) => {
          keys.push(`janus_progress_${prefix}:${normalized}`);
        });
      }
    }

    return [...new Set(keys)];
  }
  
  /**
   * Destrói o manager
   */
  destroy() {
    this._listeners.clear();
    this._history = [];
  }
}
