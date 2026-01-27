/**
 * InteractiveElement - Classe base para elementos interativos no mapa
 * 
 * Elementos interativos podem ser: NPCs, objetos, portas, terminais, itens, triggers
 * Cada elemento tem uma área de interação e opções que o jogador pode escolher.
 * 
 * Uso:
 *   const element = new InteractiveElement(scene, config);
 *   element.showOptions(); // Mostra menu de opções
 *   element.executeAction(action); // Executa uma ação
 */

import { SCENE_NAMES } from '../constants/SceneNames.js';

/**
 * @typedef {Object} ElementArea
 * @property {number} x - Posição X do centro
 * @property {number} y - Posição Y do centro
 * @property {number} width - Largura da área
 * @property {number} height - Altura da área
 */

/**
 * @typedef {Object} ElementAction
 * @property {'dialog'|'scene'|'minigame'|'event'|'item'|'quest'|'custom'} type
 * @property {string} [target] - Alvo da ação
 * @property {Object} [data] - Dados adicionais
 * @property {Object} [condition] - Condição para disponibilidade
 */

/**
 * @typedef {Object} ElementOption
 * @property {string} id - ID único
 * @property {string} label - Texto exibido
 * @property {string} [description] - Descrição/tooltip
 * @property {string} [icon] - Ícone
 * @property {ElementAction} action - Ação a executar
 * @property {Object} [condition] - Condição para disponibilidade
 * @property {boolean} [disabled] - Se está desabilitada
 * @property {string} [disabledReason] - Motivo
 */

/**
 * @typedef {Object} ElementConfig
 * @property {string} id - ID único
 * @property {'npc'|'object'|'door'|'terminal'|'item'|'trigger'} type - Tipo
 * @property {string} name - Nome de exibição
 * @property {string} [description] - Descrição
 * @property {ElementArea} area - Área de interação
 * @property {Object} [sprite] - Configuração visual
 * @property {Object} [indicator] - Indicador de interação
 * @property {string} [greeting] - Texto inicial
 * @property {ElementOption[]} [options] - Opções de interação
 * @property {Object[]} [dialogues] - Diálogos sequenciais
 * @property {boolean} [persistent] - Se persiste após interação
 * @property {number} [cooldown] - Cooldown em ms
 * @property {ElementAction} [onInteract] - Ação automática
 */

export default class InteractiveElement {
  /**
   * @param {Phaser.Scene} scene - Cena do Phaser
   * @param {ElementConfig} config - Configuração do elemento
   */
  constructor(scene, config) {
    if (!config.id) throw new Error('InteractiveElement: id é obrigatório');
    if (!config.type) throw new Error('InteractiveElement: type é obrigatório');
    if (!config.name) throw new Error('InteractiveElement: name é obrigatório');
    if (!config.area) throw new Error('InteractiveElement: area é obrigatória');

    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** @type {string} */
    this.id = config.id;

    /** @type {string} */
    this.type = config.type;

    /** @type {string} */
    this.name = config.name;

    /** @type {string} */
    this.description = config.description || '';

    /** @type {ElementArea} */
    this.area = config.area;

    /** @type {ElementConfig} */
    this.config = config;

    /** @type {ElementOption[]} */
    this.options = config.options || [];

    /** @type {Object[]} */
    this.dialogues = config.dialogues || [];

    /** @type {string} */
    this.greeting = config.greeting || '';

    // Estado
    /** @private */
    this._isPlayerNearby = false;

    /** @private */
    this._isInteracting = false;

    /** @private */
    this._lastInteractionTime = 0;

    /** @private */
    this._cooldown = config.cooldown || 0;

    // Elementos visuais
    /** @type {Phaser.GameObjects.Sprite|null} */
    this.sprite = null;

    /** @type {Phaser.GameObjects.Zone} */
    this.interactionZone = null;

    /** @type {Phaser.GameObjects.Container|null} */
    this.indicator = null;

    // Criar elementos visuais
    this._createVisuals();
    this._createInteractionZone();

    console.log(`[InteractiveElement] Created: ${this.id} (${this.type}) at (${this.area.x}, ${this.area.y})`);
  }

  // ============================================
  // CRIAÇÃO DE ELEMENTOS VISUAIS
  // ============================================

  /**
   * Cria o sprite e indicador visual
   * @private
   */
  _createVisuals() {
    const { sprite: spriteConfig, indicator: indicatorConfig } = this.config;

    // Retângulo de debug (visível apenas no modo debug)
    this.debugRect = null;

    // Criar sprite se configurado E se a textura existe
    let spriteCreated = false;
    if (spriteConfig && spriteConfig.key) {
      // Verificar se a textura existe antes de criar o sprite
      if (this.scene.textures.exists(spriteConfig.key)) {
        this.sprite = this.scene.add.sprite(
          this.area.x,
          this.area.y,
          spriteConfig.key,
          spriteConfig.frame || 0
        );
        
        if (spriteConfig.scale) {
          this.sprite.setScale(spriteConfig.scale);
        }
        
        if (spriteConfig.animation) {
          this.sprite.play(spriteConfig.animation);
        }
        
        this.sprite.setDepth(this.area.y); // Depth baseado em Y para ordenação
        this.sprite.setVisible(spriteConfig.visible !== false);
        spriteCreated = true;
      } else {
        console.warn(`[InteractiveElement] Texture '${spriteConfig.key}' not found for ${this.id}`);
      }
    }

    // Criar retângulo de debug para elementos sem sprite (invisível por padrão)
    // Será mostrado apenas quando o modo debug estiver ativo
    if (!spriteCreated && this.type !== 'trigger') {
      this.debugRect = this.scene.add.rectangle(
        this.area.x,
        this.area.y,
        this.area.width,
        this.area.height,
        0x00ff00, // Verde
        0.3 // Alpha
      );
      this.debugRect.setStrokeStyle(2, 0x00ff00);
      this.debugRect.setDepth(this.area.y);
      this.debugRect.setVisible(false); // Invisível por padrão - só aparece no debug
      
      // Adicionar texto com nome do elemento (debug)
      this.debugText = this.scene.add.text(
        this.area.x,
        this.area.y,
        this.name,
        {
          fontSize: '10px',
          fontFamily: 'Arial',
          color: '#00ff00',
          backgroundColor: '#000000aa',
          padding: { x: 2, y: 1 }
        }
      ).setOrigin(0.5).setDepth(this.area.y + 1);
      this.debugText.setVisible(false); // Invisível por padrão
    }

    // Triggers não têm indicador visual (são automáticos)
    if (this.type === 'trigger') {
      this.indicator = null;
      return;
    }

    // Criar indicador de interação (apenas para elementos interagíveis manualmente)
    const indConfig = indicatorConfig || {};
    this.indicator = this.scene.add.container(this.area.x, this.area.y + (indConfig.offsetY || -40));
    
    // Fundo do indicador
    const indicatorBg = this.scene.add.rectangle(0, 0, 40, 24, 0x000000, 0.7)
      .setStrokeStyle(1, 0x00d9ff);
    
    // Texto do indicador
    const indicatorText = this.scene.add.text(0, 0, indConfig.text || '[E]', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#00d9ff'
    }).setOrigin(0.5);

    this.indicator.add([indicatorBg, indicatorText]);
    this.indicator.setDepth(1000);
    this.indicator.setVisible(false);
  }

  /**
   * Cria a zona de interação física
   * @private
   */
  _createInteractionZone() {
    // Criar zona de interação
    this.interactionZone = this.scene.add.zone(
      this.area.x,
      this.area.y,
      this.area.width,
      this.area.height
    );
    
    // Habilitar física na zona
    this.scene.physics.add.existing(this.interactionZone, true); // true = static body
    
    // Guardar referência ao elemento na zona
    this.interactionZone.elementRef = this;
  }

  // ============================================
  // DEBUG
  // ============================================

  /**
   * Define a visibilidade dos elementos de debug
   * @param {boolean} visible
   */
  setDebugVisible(visible) {
    if (this.debugRect) {
      this.debugRect.setVisible(visible);
    }
    if (this.debugText) {
      this.debugText.setVisible(visible);
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  /** @returns {boolean} */
  get isPlayerNearby() {
    return this._isPlayerNearby;
  }

  /** @returns {boolean} */
  get isInteracting() {
    return this._isInteracting;
  }

  /** @returns {boolean} */
  get canInteract() {
    if (this._cooldown > 0) {
      const now = Date.now();
      if (now - this._lastInteractionTime < this._cooldown) {
        return false;
      }
    }
    return true;
  }

  /** @returns {boolean} */
  get hasOptions() {
    return this.options.length > 0;
  }

  /** @returns {boolean} */
  get hasDialogues() {
    return this.dialogues.length > 0;
  }

  // ============================================
  // MÉTODOS DE INTERAÇÃO
  // ============================================

  /**
   * Chamado quando o jogador entra na área de interação
   * @param {Phaser.GameObjects.Sprite} player
   */
  onPlayerEnter(player) {
    if (this._isPlayerNearby) return;
    
    this._isPlayerNearby = true;
    this.indicator?.setVisible(true);
    
    console.log(`[InteractiveElement] Player entered: ${this.name}`);

    // Executar ação automática se configurada (não bloqueia interação manual)
    if (this.config.onInteract) {
      // Ações automáticas são fire-and-forget, não bloqueiam o elemento
      this.executeAction(this.config.onInteract);
    }
  }

  /**
   * Chamado quando o jogador sai da área de interação
   * @param {Phaser.GameObjects.Sprite} player
   */
  onPlayerExit(player) {
    if (!this._isPlayerNearby) return;
    
    this._isPlayerNearby = false;
    this.indicator?.setVisible(false);
    
    // Resetar estado de interação quando player sai
    this._isInteracting = false;
    
    console.log(`[InteractiveElement] Player exited: ${this.name}`);
  }

  /**
   * Inicia a interação (chamado quando jogador pressiona E)
   */
  interact() {
    if (!this.canInteract) {
      console.log(`[InteractiveElement] ${this.name} em cooldown`);
      return;
    }

    // Verificar se está em interação (apenas para elementos com opções/diálogos)
    if (this._isInteracting && (this.hasOptions || this.hasDialogues)) {
      console.log(`[InteractiveElement] ${this.name} já está em interação`);
      return;
    }

    this._lastInteractionTime = Date.now();
    
    console.log(`[InteractiveElement] Interacting with: ${this.name}`);

    // Se tem opções, mostrar menu de opções
    if (this.hasOptions) {
      this._isInteracting = true;
      this.showOptionsDialog();
    }
    // Se tem diálogos, mostrar diálogos sequenciais
    else if (this.hasDialogues) {
      this._isInteracting = true;
      this.showDialogues();
    }
    // Fallback: emitir evento genérico
    else {
      this.scene.events.emit('element-interact', { element: this });
    }
  }

  /**
   * Mostra o diálogo com opções
   */
  showOptionsDialog() {
    // Obter opções disponíveis (filtrar por condições)
    const availableOptions = this.getAvailableOptions();

    // Dados para o DialogScene
    const dialogData = {
      elementId: this.id,
      elementType: this.type,
      name: this.name,
      greeting: this.greeting,
      options: availableOptions,
      onSelect: (option) => this.handleOptionSelect(option),
      onClose: () => this.endInteraction()
    };

    // Emitir evento para DialogScene
    this.scene.events.emit('show-options-dialog', dialogData);
    
    // Também tentar chamar diretamente o DialogScene
    const dialogScene = this.scene.scene.get(SCENE_NAMES.DIALOG);
    if (dialogScene) {
      dialogScene.showOptionsDialog(dialogData);
    }
  }

  /**
   * Mostra diálogos sequenciais (sem opções)
   */
  showDialogues() {
    const self = this; // Guardar referência para o callback
    
    const dialogData = {
      name: this.name,
      dialogues: this.dialogues,
      onComplete: () => {
        console.log(`[InteractiveElement] Dialog completed for: ${self.name}`);
        self.endInteraction();
      }
    };

    // Chamar diretamente o DialogScene
    const dialogScene = this.scene.scene.get(SCENE_NAMES.DIALOG);
    
    console.log(`[InteractiveElement] Looking for DialogScene:`, {
      found: !!dialogScene,
      hasShowDialog: dialogScene ? typeof dialogScene.showDialog : 'N/A',
      isActive: dialogScene ? this.scene.scene.isActive(SCENE_NAMES.DIALOG) : false
    });
    
    if (dialogScene && typeof dialogScene.showDialog === 'function') {
      // Garantir que DialogScene está ativo
      if (!this.scene.scene.isActive(SCENE_NAMES.DIALOG)) {
        console.log('[InteractiveElement] Launching DialogScene...');
        this.scene.scene.launch(SCENE_NAMES.DIALOG);
      }
      
      console.log(`[InteractiveElement] Showing dialog via DialogScene for: ${this.name}`);
      dialogScene.showDialog(dialogData);
    } else {
      // Fallback: não há dialog disponível
      console.warn('[InteractiveElement] DialogScene not available');
      // Resetar interação já que não há dialog
      this.endInteraction();
    }
  }

  /**
   * Retorna as opções disponíveis (filtrando por condições)
   * @returns {ElementOption[]}
   */
  getAvailableOptions() {
    return this.options.map(option => {
      const available = this.checkCondition(option.condition);
      return {
        ...option,
        disabled: option.disabled || !available,
        disabledReason: !available ? 'Condição não atendida' : option.disabledReason
      };
    });
  }

  /**
   * Verifica se uma condição é atendida
   * @param {Object} condition
   * @returns {boolean}
   */
  checkCondition(condition) {
    if (!condition) return true;

    // Obter GameStateManager
    const gameState = window.gameState;
    if (!gameState) return true;

    const { type, id, operator, value } = condition;

    switch (type) {
      case 'quest':
        return this._checkQuestCondition(gameState, id, operator, value);
      case 'item':
        return this._checkItemCondition(gameState, id, operator, value);
      case 'flag':
        return this._checkFlagCondition(gameState, id, operator, value);
      case 'stat':
        return this._checkStatCondition(gameState, id, operator, value);
      default:
        return true;
    }
  }

  /** @private */
  _checkQuestCondition(gameState, id, operator, value) {
    const questStatus = gameState.getQuestStatus?.(id);
    return this._compareValues(questStatus, operator, value);
  }

  /** @private */
  _checkItemCondition(gameState, id, operator, value) {
    const hasItem = gameState.hasItem?.(id);
    if (operator === 'has') return hasItem;
    if (operator === '!has') return !hasItem;
    return this._compareValues(gameState.getItemCount?.(id) || 0, operator, value);
  }

  /** @private */
  _checkFlagCondition(gameState, id, operator, value) {
    const flagValue = gameState.getFlag?.(id);
    return this._compareValues(flagValue, operator, value);
  }

  /** @private */
  _checkStatCondition(gameState, id, operator, value) {
    const statValue = gameState.getStat?.(id) || 0;
    return this._compareValues(statValue, operator, value);
  }

  /** @private */
  _compareValues(a, operator, b) {
    switch (operator) {
      case '==': return a == b;
      case '!=': return a != b;
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      default: return a == b;
    }
  }

  /**
   * Processa a seleção de uma opção
   * @param {ElementOption} option
   */
  handleOptionSelect(option) {
    console.log(`[InteractiveElement] Option selected: ${option.label}`);
    
    if (option.disabled) {
      console.log(`[InteractiveElement] Option disabled: ${option.disabledReason}`);
      return;
    }

    // Executar ação da opção
    this.executeAction(option.action, option);
  }

  /**
   * Executa uma ação
   * @param {ElementAction} action
   * @param {ElementOption} [option] - Opção que originou a ação
   */
  executeAction(action, option = null) {
    if (!action) return;

    console.log(`[InteractiveElement] Executing action: ${action.type}`, action);

    switch (action.type) {
      case 'dialog':
        this._executeDialogAction(action);
        break;
      case 'scene':
        this._executeSceneAction(action);
        break;
      case 'minigame':
        this._executeMinigameAction(action);
        break;
      case 'event':
        this._executeEventAction(action, option);
        break;
      case 'item':
        this._executeItemAction(action);
        break;
      case 'quest':
        this._executeQuestAction(action);
        break;
      case 'custom':
        this._executeCustomAction(action, option);
        break;
      default:
        console.warn(`[InteractiveElement] Unknown action type: ${action.type}`);
    }
  }

  /** @private */
  _executeDialogAction(action) {
    // Mostrar diálogos adicionais
    const dialogData = {
      name: this.name,
      dialogues: action.data?.dialogues || [{ text: action.target }],
      onComplete: () => this.endInteraction()
    };
    
    // Chamar diretamente o DialogScene
    const dialogScene = this.scene.scene.get(SCENE_NAMES.DIALOG);
    if (dialogScene) {
      dialogScene.showDialog(dialogData);
    } else {
      // Fallback: emitir evento
      this.scene.events.emit('npc-interact', dialogData);
    }
  }

  /** @private */
  _executeSceneAction(action) {
    // Mudar de cena/mapa
    this.endInteraction();
    
    const sceneKey = action.target;
    const sceneData = action.data || {};

    if (window.sceneManager) {
      window.sceneManager.goToMap(sceneKey, sceneData);
    } else {
      this.scene.scene.start(sceneKey, sceneData);
    }
  }

  /** @private */
  _executeMinigameAction(action) {
    // Iniciar minigame
    const minigameKey = action.target;
    const minigameData = {
      ...action.data,
      returnScene: this.scene.scene.key,
      elementId: this.id,
      onComplete: (result) => {
        this.scene.events.emit('minigame-complete', {
          elementId: this.id,
          minigame: minigameKey,
          result
        });
      }
    };

    if (window.sceneManager) {
      window.sceneManager.startMinigame(minigameKey, minigameData);
    } else {
      this.scene.scene.launch(minigameKey, minigameData);
    }
  }

  /** @private */
  _executeEventAction(action, option) {
    // Emitir evento customizado
    const eventName = action.target;
    const eventData = {
      ...action.data,
      elementId: this.id,
      elementName: this.name,
      option
    };
    
    this.scene.events.emit(eventName, eventData);
    
    // Também emitir globalmente
    if (window.gameEvents) {
      window.gameEvents.emit(eventName, eventData);
    }
  }

  /** @private */
  _executeItemAction(action) {
    // Dar/remover item
    const itemId = action.target;
    const quantity = action.data?.quantity || 1;
    const remove = action.data?.remove || false;

    if (window.gameState) {
      if (remove) {
        window.gameState.removeItem(itemId, quantity);
      } else {
        window.gameState.addItem(itemId, quantity);
      }
    }
    
    // Emitir evento de item
    this.scene.events.emit('item-acquired', {
      itemId,
      quantity,
      removed: remove,
      elementId: this.id
    });
  }

  /** @private */
  _executeQuestAction(action) {
    // Atualizar quest
    const questId = action.target;
    const status = action.data?.status || 'started';

    if (window.gameState) {
      window.gameState.setQuestStatus(questId, status);
    }

    this.scene.events.emit('quest-updated', {
      questId,
      status,
      elementId: this.id
    });
  }

  /** @private */
  _executeCustomAction(action, option) {
    // Ação customizada - callback
    if (typeof action.data?.callback === 'function') {
      action.data.callback({
        element: this,
        option,
        scene: this.scene
      });
    }
  }

  /**
   * Finaliza a interação
   */
  endInteraction() {
    this._isInteracting = false;
    console.log(`[InteractiveElement] Ended interaction with: ${this.name}`);
    
    this.scene.events.emit('element-interaction-end', { element: this });
  }

  // ============================================
  // MÉTODOS DE ATUALIZAÇÃO
  // ============================================

  /**
   * Atualiza posição do indicador (para elementos móveis)
   */
  updateIndicatorPosition() {
    if (this.sprite && this.indicator) {
      const offsetY = this.config.indicator?.offsetY || -40;
      this.indicator.setPosition(this.sprite.x, this.sprite.y + offsetY);
    }
  }

  /**
   * Atualiza o elemento (chamado pelo ElementManager)
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    // Atualizar indicador se sprite se moveu
    this.updateIndicatorPosition();
  }

  // ============================================
  // DESTRUIÇÃO
  // ============================================

  /**
   * Destrói o elemento e limpa recursos
   */
  destroy() {
    this.sprite?.destroy();
    this.indicator?.destroy();
    this.interactionZone?.destroy();
    
    console.log(`[InteractiveElement] Destroyed: ${this.id}`);
  }
}
