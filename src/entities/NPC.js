/**
 * NPC - Classe wrapper que encapsula a lógica de NPCs
 * 
 * Esta classe envolve o sprite Phaser e fornece uma API limpa
 * para interagir com NPCs, sem anexar propriedades dinâmicas ao sprite.
 * 
 * Uso:
 *   const npc = new NPC(sprite, config);
 *   npc.interact(player);
 *   npc.getDialogue();
 */

import { NPC_EVENTS } from '../constants/GameEvents.js';

/**
 * @typedef {Object} DialogueNode
 * @property {string} id - ID do nó de diálogo
 * @property {string} text - Texto do diálogo
 * @property {DialogueOption[]} [options] - Opções de resposta
 * @property {string} [next] - Próximo nó (se não houver opções)
 */

/**
 * @typedef {Object} DialogueOption
 * @property {string} text - Texto da opção
 * @property {string} next - ID do próximo nó
 * @property {Object} [effects] - Efeitos da escolha
 */
    
/**
 * @typedef {Object} PatrolConfig
 * @property {Array<{x: number, y: number}>} points - Pontos do patrulhamento
 * @property {number} speed - Velocidade de movimento
 * @property {boolean} loop - Se deve repetir
 */

/**
 * @typedef {Object} NPCConfig
 * @property {string} id - ID único do NPC
 * @property {string} name - Nome de exibição
 * @property {string} texture - Chave da textura
 * @property {number} [frame] - Frame inicial
 * @property {number} [scale] - Escala do sprite
 * @property {number} [depth] - Profundidade de renderização
 * @property {DialogueNode[]} [dialogues] - Diálogos do NPC
 * @property {boolean} [canMove] - Se pode se mover
 * @property {PatrolConfig} [patrol] - Configuração de patrulha
 * @property {number} [interactionRadius] - Raio de interação
 */

export class NPC {
  /**
   * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite do Phaser
   * @param {NPCConfig} config - Configuração do NPC
   */
  constructor(sprite, config) {
    // Validar configuração obrigatória
    if (!config.id) {
      throw new Error('NPC config must have an id');
    }
    if (!config.name) {
      throw new Error('NPC config must have a name');
    }
    
    /** @type {Phaser.Physics.Arcade.Sprite} */
    this.sprite = sprite;
    
    /** @type {string} */
    this.id = config.id;
    
    /** @type {string} */
    this.name = config.name;
    
    /** @type {NPCConfig} */
    this.config = {
      texture: config.texture || 'npc_default',
      frame: config.frame || 0,
      scale: config.scale || 2,
      depth: config.depth || 4,
      dialogues: config.dialogues || [],
      canMove: config.canMove || false,
      patrol: config.patrol || null,
      interactionRadius: config.interactionRadius || 32,
      ...config
    };
    
    /** @type {Phaser.Scene} */
    this.scene = sprite.scene;
    
    // Estado interno
    /** @private */
    this._currentDialogueIndex = 0;
    
    /** @private */
    this._isInteracting = false;
    
    /** @private */
    this._isPatrolling = false;
    
    /** @private */
    this._currentPatrolIndex = 0;
    
    /** @type {Map<string, Function[]>} */
    this._eventListeners = new Map();
    
    // Elementos visuais
    /** @type {Phaser.GameObjects.Arc|null} */
    this.interactionZone = null;
    
    /** @type {Phaser.GameObjects.Container|null} */
    this.interactionIndicator = null;
    
    /** @type {Phaser.GameObjects.Text|null} */
    this.nameTag = null;
    
    // Marcar sprite com referência ao wrapper
    sprite._npcWrapper = this;
  }
  
  // ============================================
  // GETTERS
  // ============================================
  
  /** @returns {number} */
  get x() {
    return this.sprite.x;
  }
  
  /** @returns {number} */
  get y() {
    return this.sprite.y;
  }
  
  /** @returns {boolean} */
  get isInteracting() {
    return this._isInteracting;
  }
  
  /** @returns {boolean} */
  get canMove() {
    return this.config.canMove;
  }
  
  /** @returns {number} */
  get interactionRadius() {
    return this.config.interactionRadius;
  }
  
  // ============================================
  // MÉTODOS DE DIÁLOGO
  // ============================================
  
  /**
   * Obtém o diálogo atual
   * @returns {DialogueNode|null}
   */
  getCurrentDialogue() {
    return this.config.dialogues[this._currentDialogueIndex] || null;
  }
  
  /**
   * Obtém um diálogo por ID
   * @param {string} dialogueId 
   * @returns {DialogueNode|null}
   */
  getDialogueById(dialogueId) {
    return this.config.dialogues.find(d => d.id === dialogueId) || null;
  }
  
  /**
   * Avança para o próximo diálogo
   * @returns {DialogueNode|null}
   */
  nextDialogue() {
    if (this._currentDialogueIndex < this.config.dialogues.length - 1) {
      this._currentDialogueIndex++;
      return this.getCurrentDialogue();
    }
    return null;
  }
  
  /**
   * Reseta os diálogos para o início
   */
  resetDialogues() {
    this._currentDialogueIndex = 0;
  }
  
  /**
   * Verifica se há mais diálogos
   * @returns {boolean}
   */
  hasMoreDialogues() {
    return this._currentDialogueIndex < this.config.dialogues.length - 1;
  }
  
  /**
   * Seleciona uma opção de diálogo
   * @param {number} optionIndex 
   * @returns {DialogueNode|null}
   */
  selectDialogueOption(optionIndex) {
    const current = this.getCurrentDialogue();
    if (!current?.options?.[optionIndex]) {
      return null;
    }
    
    const option = current.options[optionIndex];
    const nextDialogue = this.getDialogueById(option.next);
    
    if (nextDialogue) {
      this._currentDialogueIndex = this.config.dialogues.indexOf(nextDialogue);
    }
    
    return nextDialogue;
  }
  
  // ============================================
  // MÉTODOS DE INTERAÇÃO
  // ============================================
  
  /**
   * Inicia uma interação com o player
   * @param {Player} player 
   */
  startInteraction(player) {
    if (this._isInteracting) {
      return;
    }
    
    this._isInteracting = true;
    this.stopPatrol();
    
    this._emit(NPC_EVENTS.INTERACTION_START, { npc: this, player });
    this._emit(NPC_EVENTS.DIALOGUE_START, { 
      npc: this, 
      dialogue: this.getCurrentDialogue() 
    });
  }
  
  /**
   * Finaliza a interação
   */
  endInteraction() {
    if (!this._isInteracting) {
      return;
    }
    
    this._isInteracting = false;
    
    this._emit(NPC_EVENTS.INTERACTION_END, { npc: this });
    this._emit(NPC_EVENTS.DIALOGUE_END, { npc: this });
  }
  
  /**
   * Verifica se o player está no raio de interação
   * @param {Player} player 
   * @returns {boolean}
   */
  isPlayerInRange(player) {
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );
    return distance <= this.config.interactionRadius;
  }
  
  // ============================================
  // MÉTODOS DE MOVIMENTO / PATRULHA
  // ============================================
  
  /**
   * Move o NPC para uma posição
   * @param {number} x 
   * @param {number} y 
   */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
    this._updateVisualElements();
  }
  
  /**
   * Inicia a patrulha
   */
  startPatrol() {
    if (!this.config.patrol || !this.config.canMove) {
      return;
    }
    
    this._isPatrolling = true;
    this._currentPatrolIndex = 0;
    this._emit(NPC_EVENTS.PATROL_START, { npc: this });
    this._moveToNextPatrolPoint();
  }
  
  /**
   * Para a patrulha
   */
  stopPatrol() {
    this._isPatrolling = false;
    this.sprite.setVelocity(0, 0);
    this._emit(NPC_EVENTS.PATROL_END, { npc: this });
  }
  
  /**
   * Move para o próximo ponto de patrulha
   * @private
   */
  _moveToNextPatrolPoint() {
    if (!this._isPatrolling || !this.config.patrol) {
      return;
    }
    
    const points = this.config.patrol.points;
    const target = points[this._currentPatrolIndex];
    const speed = this.config.patrol.speed || 50;
    
    // Calcular direção
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.sprite.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // Verificar chegada
    const checkArrival = () => {
      if (!this._isPatrolling) return;
      
      const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      if (distance < 5) {
        this._currentPatrolIndex++;
        
        if (this._currentPatrolIndex >= points.length) {
          if (this.config.patrol.loop) {
            this._currentPatrolIndex = 0;
          } else {
            this.stopPatrol();
            return;
          }
        }
        
        this._moveToNextPatrolPoint();
      } else {
        this.scene.time.delayedCall(100, checkArrival);
      }
    };
    
    this.scene.time.delayedCall(100, checkArrival);
  }
  
  // ============================================
  // MÉTODOS DE ELEMENTOS VISUAIS
  // ============================================
  
  /**
   * Cria os elementos visuais (zona de interação, nome, etc.)
   */
  createVisualElements() {
    // Zona de interação
    this.interactionZone = this.scene.add.circle(
      this.x, this.y, 
      this.config.interactionRadius, 
      0x00ff00, 0
    );
    this.scene.physics.add.existing(this.interactionZone);
    this.interactionZone.body.setCircle(this.config.interactionRadius);
    
    // Indicador de interação (tecla E)
    this.interactionIndicator = this.scene.add.container(this.x, this.y - 50);
    const indicatorBg = this.scene.add.circle(0, 0, 12, 0x000000, 0.7);
    const indicatorText = this.scene.add.text(0, 0, 'E', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.interactionIndicator.add([indicatorBg, indicatorText]);
    this.interactionIndicator.setDepth(10);
    this.interactionIndicator.setVisible(false);
    
    // Nome do NPC
    this.nameTag = this.scene.add.text(this.x, this.y - 35, this.name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(10);
  }
  
  /**
   * Mostra o indicador de interação
   */
  showInteractionIndicator() {
    if (this.interactionIndicator) {
      this.interactionIndicator.setVisible(true);
    }
  }
  
  /**
   * Esconde o indicador de interação
   */
  hideInteractionIndicator() {
    if (this.interactionIndicator) {
      this.interactionIndicator.setVisible(false);
    }
  }
  
  /**
   * Atualiza posição dos elementos visuais
   * @private
   */
  _updateVisualElements() {
    if (this.interactionZone) {
      this.interactionZone.setPosition(this.x, this.y);
    }
    if (this.interactionIndicator) {
      this.interactionIndicator.setPosition(this.x, this.y - 50);
    }
    if (this.nameTag) {
      this.nameTag.setPosition(this.x, this.y - 35);
    }
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
    
    // Também emitir no game
    if (this.scene?.game?.events) {
      this.scene.game.events.emit(event, data);
    }
  }
  
  // ============================================
  // MÉTODOS DE CICLO DE VIDA
  // ============================================
  
  /**
   * Atualização chamada a cada frame
   * @param {number} time 
   * @param {number} delta 
   */
  update(time, delta) {
    this._updateVisualElements();
    
    // Y-sorting
    if (this.sprite) {
      this.sprite.setDepth(this.y);
    }
  }
  
  /**
   * Destrói o NPC e limpa recursos
   */
  destroy() {
    this._eventListeners.clear();
    
    if (this.interactionZone) {
      this.interactionZone.destroy();
      this.interactionZone = null;
    }
    
    if (this.interactionIndicator) {
      this.interactionIndicator.destroy();
      this.interactionIndicator = null;
    }
    
    if (this.nameTag) {
      this.nameTag.destroy();
      this.nameTag = null;
    }
    
    if (this.sprite) {
      this.sprite._npcWrapper = null;
      this.sprite.destroy();
      this.sprite = null;
    }
  }
  
  // ============================================
  // MÉTODOS ESTÁTICOS
  // ============================================
  
  /**
   * Obtém o wrapper de um sprite (se existir)
   * @param {Phaser.Physics.Arcade.Sprite} sprite 
   * @returns {NPC|null}
   */
  static fromSprite(sprite) {
    return sprite?._npcWrapper || null;
  }
}
