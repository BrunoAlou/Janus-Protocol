/**
 * Player - Classe wrapper que encapsula a lógica do jogador
 * 
 * Esta classe envolve o sprite Phaser e fornece uma API limpa
 * para interagir com o player, sem anexar propriedades dinâmicas ao sprite.
 * 
 * Uso:
 *   const player = new Player(sprite, config);
 *   player.moveTo(100, 200);
 *   player.getState();
 */

import { PLAYER_EVENTS } from '../constants/GameEvents.js';

/**
 * @typedef {Object} PlayerState
 * @property {boolean} isMoving - Se o player está em movimento
 * @property {string} direction - Direção atual ('up', 'down', 'left', 'right')
 * @property {boolean} isInteracting - Se está em interação
 * @property {boolean} canMove - Se pode se mover
 */

/**
 * @typedef {Object} PlayerConfig
 * @property {number} speed - Velocidade de movimento
 * @property {number} scale - Escala do sprite
 * @property {number} depth - Profundidade de renderização
 * @property {Object} hitbox - Configuração de hitbox
 */

export class Player {
  /**
   * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite do Phaser
   * @param {PlayerConfig} config - Configuração do player
   */
  constructor(sprite, config = {}) {
    /** @type {Phaser.Physics.Arcade.Sprite} */
    this.sprite = sprite;
    
    /** @type {PlayerConfig} */
    this.config = {
      speed: config.speed || 160,
      scale: config.scale || 1,
      depth: config.depth || 4,
      hitbox: config.hitbox || null,
      ...config
    };
    
    /** @type {PlayerState} */
    this._state = {
      isMoving: false,
      direction: 'down',
      isInteracting: false,
      canMove: true
    };
    
    /** @type {Phaser.Scene} */
    this.scene = sprite.scene;
    
    /** @type {PlayerController|null} */
    this.controller = null;
    
    /** @type {Map<string, Function[]>} */
    this._eventListeners = new Map();
    
    // Marcar sprite com referência ao wrapper (para compatibilidade)
    sprite._playerWrapper = this;
  }
  
  // ============================================
  // GETTERS / SETTERS
  // ============================================
  
  /** @returns {number} */
  get x() {
    return this.sprite.x;
  }
  
  set x(value) {
    this.sprite.setX(value);
  }
  
  /** @returns {number} */
  get y() {
    return this.sprite.y;
  }
  
  set y(value) {
    this.sprite.setY(value);
  }
  
  /** @returns {Phaser.Physics.Arcade.Body} */
  get body() {
    return this.sprite.body;
  }
  
  /** @returns {boolean} */
  get isMoving() {
    return this._state.isMoving;
  }
  
  /** @returns {string} */
  get direction() {
    return this._state.direction;
  }
  
  /** @returns {boolean} */
  get canMove() {
    return this._state.canMove;
  }
  
  set canMove(value) {
    this._state.canMove = value;
  }
  
  // ============================================
  // MÉTODOS DE MOVIMENTO
  // ============================================
  
  /**
   * Move o player para uma posição específica
   * @param {number} x 
   * @param {number} y 
   */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this._emit(PLAYER_EVENTS.MOVED, { x, y });
  }
  
  /**
   * Define a velocidade do player
   * @param {number} vx - Velocidade X
   * @param {number} vy - Velocidade Y
   */
  setVelocity(vx, vy) {
    if (!this._state.canMove) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    
    this.sprite.setVelocity(vx, vy);
    
    const wasMoving = this._state.isMoving;
    this._state.isMoving = vx !== 0 || vy !== 0;
    
    // Determinar direção
    if (this._state.isMoving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this._state.direction = vx > 0 ? 'right' : 'left';
      } else {
        this._state.direction = vy > 0 ? 'down' : 'up';
      }
      this._emit(PLAYER_EVENTS.DIRECTION_CHANGED, { direction: this._state.direction });
    }
    
    if (wasMoving && !this._state.isMoving) {
      this._emit(PLAYER_EVENTS.STOPPED, { x: this.x, y: this.y });
    }
  }
  
  /**
   * Para o movimento do player
   */
  stop() {
    this.sprite.setVelocity(0, 0);
    this._state.isMoving = false;
    this._emit(PLAYER_EVENTS.STOPPED, { x: this.x, y: this.y });
  }
  
  // ============================================
  // MÉTODOS DE INTERAÇÃO
  // ============================================
  
  /**
   * Inicia uma interação
   */
  startInteraction() {
    this._state.isInteracting = true;
    this._state.canMove = false;
    this.stop();
    this._emit(PLAYER_EVENTS.INTERACTED, { type: 'start' });
  }
  
  /**
   * Finaliza uma interação
   */
  endInteraction() {
    this._state.isInteracting = false;
    this._state.canMove = true;
    this._emit(PLAYER_EVENTS.INTERACTED, { type: 'end' });
  }
  
  /**
   * Verifica se está interagindo
   * @returns {boolean}
   */
  isInteracting() {
    return this._state.isInteracting;
  }
  
  // ============================================
  // MÉTODOS DE ANIMAÇÃO
  // ============================================
  
  /**
   * Reproduz uma animação
   * @param {string} animKey - Chave da animação
   * @param {boolean} ignoreIfPlaying - Ignorar se já estiver tocando
   */
  play(animKey, ignoreIfPlaying = true) {
    this.sprite.play(animKey, ignoreIfPlaying);
  }
  
  /**
   * Define o frame atual
   * @param {string|number} frame 
   */
  setFrame(frame) {
    this.sprite.setFrame(frame);
  }
  
  /**
   * Para a animação atual
   */
  stopAnimation() {
    this.sprite.stop();
  }
  
  // ============================================
  // MÉTODOS DE ESTADO
  // ============================================
  
  /**
   * Retorna uma cópia do estado atual
   * @returns {PlayerState}
   */
  getState() {
    return { ...this._state };
  }
  
  /**
   * Atualiza parcialmente o estado
   * @param {Partial<PlayerState>} updates 
   */
  setState(updates) {
    Object.assign(this._state, updates);
  }
  
  // ============================================
  // MÉTODOS DE FÍSICA
  // ============================================
  
  /**
   * Configura colisão com o mundo
   * @param {boolean} value 
   */
  setCollideWorldBounds(value) {
    this.sprite.setCollideWorldBounds(value);
  }
  
  /**
   * Define a profundidade de renderização
   * @param {number} depth 
   */
  setDepth(depth) {
    this.sprite.setDepth(depth);
    this.config.depth = depth;
  }
  
  /**
   * Define a escala
   * @param {number} scale 
   */
  setScale(scale) {
    this.sprite.setScale(scale);
    this.config.scale = scale;
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
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }
  
  /**
   * Remove um listener de evento
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    const listeners = this._eventListeners.get(event);
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
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
    
    // Também emitir no game para listeners globais
    if (this.scene?.game?.events) {
      this.scene.game.events.emit(event, { player: this, ...data });
    }
  }
  
  // ============================================
  // MÉTODOS DE CICLO DE VIDA
  // ============================================
  
  /**
   * Anexa um controller ao player
   * @param {PlayerController} controller 
   */
  attachController(controller) {
    this.controller = controller;
  }
  
  /**
   * Remove o controller
   */
  detachController() {
    this.controller = null;
  }
  
  /**
   * Atualização chamada a cada frame (se necessário)
   * @param {number} time 
   * @param {number} delta 
   */
  update(time, delta) {
    // Y-sorting baseado na posição Y
    if (this.sprite && this.sprite.body) {
      this.sprite.setDepth(this.y);
    }
  }
  
  /**
   * Destrói o player e limpa recursos
   */
  destroy() {
    this._eventListeners.clear();
    
    if (this.controller) {
      this.controller = null;
    }
    
    if (this.sprite) {
      this.sprite._playerWrapper = null;
      this.sprite.destroy();
      this.sprite = null;
    }
  }
  
  // ============================================
  // MÉTODOS ESTÁTICOS / UTILITÁRIOS
  // ============================================
  
  /**
   * Obtém o wrapper de um sprite (se existir)
   * @param {Phaser.Physics.Arcade.Sprite} sprite 
   * @returns {Player|null}
   */
  static fromSprite(sprite) {
    return sprite?._playerWrapper || null;
  }
}
