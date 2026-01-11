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
        inventory: [],
        quests: []
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
   * Destrói o manager
   */
  destroy() {
    this._listeners.clear();
    this._history = [];
  }
}
