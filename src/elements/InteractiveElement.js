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
import { logAction } from '../utils/telemetry.js';
import {
  getAvailableOptions as getAvailableOptionsUtil,
  checkCondition as checkConditionUtil,
  checkQuestCondition as checkQuestConditionUtil,
  checkItemCondition as checkItemConditionUtil,
  checkFlagCondition as checkFlagConditionUtil,
  checkStatCondition as checkStatConditionUtil,
  compareValues as compareValuesUtil,
  executeAction as executeActionUtil,
  executeDialogAction as executeDialogActionUtil,
  executeSceneAction as executeSceneActionUtil,
  executeMinigameAction as executeMinigameActionUtil,
  executeEventAction as executeEventActionUtil,
  executeItemAction as executeItemActionUtil,
  executeQuestAction as executeQuestActionUtil,
  executeCustomAction as executeCustomActionUtil
} from './interactive/actionUtils.js';

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

    /** @type {boolean} */
    this.visible = config.visible !== false;

    /** @type {boolean} */
    this.locked = config.locked === true;

    /** @type {string} */
    this.lockedMessage = config.lockedMessage || `${config.name} esta bloqueado no momento.`;

    /** @type {ElementOption[]} */
    this.options = config.options || [];

    /** @type {Object[]} */
    this.dialogues = config.dialogues || [];

    /** @type {Object[]} */
    this.clickDialogues = config.clickDialogues || [];

    /** @type {Phaser.GameObjects.Sprite|null} */
    this.followSprite = config.followSprite || null;

    /** @type {boolean} */
    this.ownsSprite = false;

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

    /** @type {Phaser.GameObjects.Rectangle|null} */
    this.indicatorBg = null;

    /** @type {Phaser.GameObjects.Text|null} */
    this.indicatorText = null;

    /** @type {string} */
    this.defaultIndicatorText = '[E]';

    /** @private */
    this._isHovered = false;
    this._isDestroyed = false;

    // Criar elementos visuais
    this._createVisuals();
    this._createInteractionZone();

    console.log(`[InteractiveElement] Created: ${this.id} (${this.type}) at (${this.area.x}, ${this.area.y})`);
  }

  /**
   * Envia telemetria de forma não bloqueante.
   * @param {string} actionName
   * @param {Object} extra
   * @private
   */
  _trackInteraction(actionName, extra = {}) {
    try {
      const payload = {
        actionName,
        elementId: this.id,
        elementType: this.type,
        elementName: this.name,
        scene: this.scene?.scene?.key,
        ...extra
      };

      const position = {
        x: Math.round(this.area?.x || 0),
        y: Math.round(this.area?.y || 0)
      };

      logAction('interaction', payload, position);
    } catch (error) {
      console.warn('[InteractiveElement] Telemetry tracking failed:', error?.message || error);
    }
  }

  /**
   * Persiste metricas de sessao para analise do report DEBUG.
   * @param {string} actionName
   * @param {Object} extra
   * @private
   */
  _trackSessionMetrics(actionName, extra = {}) {
    const gameState = window.gameState;
    if (!gameState || typeof gameState.setState !== 'function') {
      return;
    }

    const now = Date.now();
    const state = gameState.getState?.() || {};
    const player = state.player || {};
    const stats = { ...(player.stats || {}) };

    if (actionName === 'interact_start') {
      const interactionCount = Number(stats.session_interaction_count || 0) + 1;
      const lastInteractionAt = Number(stats.session_last_interaction_at_ms || 0);
      const previousGap = Number.isFinite(lastInteractionAt) && lastInteractionAt > 0 ? now - lastInteractionAt : null;

      stats.session_first_interaction_at_ms = Number(stats.session_first_interaction_at_ms || 0) || now;
      stats.session_last_interaction_at_ms = now;
      stats.session_interaction_count = interactionCount;

      if (previousGap !== null && previousGap >= 0) {
        stats.session_interaction_gap_sum_ms = Number(stats.session_interaction_gap_sum_ms || 0) + previousGap;
        stats.session_interaction_gap_count = Number(stats.session_interaction_gap_count || 0) + 1;
        stats.session_last_interaction_gap_ms = previousGap;

        const recentGaps = Array.isArray(stats.session_recent_interaction_gaps_ms)
          ? stats.session_recent_interaction_gaps_ms.slice(-9)
          : [];
        recentGaps.push(previousGap);
        stats.session_recent_interaction_gaps_ms = recentGaps;
      }

      const interactionTimeline = Array.isArray(stats.session_interaction_timeline)
        ? stats.session_interaction_timeline.slice(-24)
        : [];
      interactionTimeline.push({
        at: now,
        scene: this.scene?.scene?.key || null,
        elementId: this.id,
        elementName: this.name,
        interactionType: extra.interactionType || null
      });
      stats.session_interaction_timeline = interactionTimeline;
    }

    if (actionName === 'option_selected') {
      const axis = extra.optionAxis;
      if (axis && ['execution', 'collaboration', 'resilience', 'innovation'].includes(axis)) {
        if (typeof gameState.appendAxisChoiceEntry === 'function') {
          gameState.appendAxisChoiceEntry({
            at: now,
            axis,
            source: this.name,
            sourceId: this.id,
            label: extra.optionLabel || null,
            optionId: extra.optionId || null,
            scene: this.scene?.scene?.key || null,
            influenceType: 'option_selected'
          });
          return;
        }

        const axisTimeline = Array.isArray(stats.axis_choice_timeline)
          ? stats.axis_choice_timeline.slice(-29)
          : [];
        axisTimeline.push({
          at: now,
          axis,
          source: this.name,
          sourceId: this.id,
          label: extra.optionLabel || null,
          optionId: extra.optionId || null
        });
        stats.axis_choice_timeline = axisTimeline;
      }
    }

    gameState.setState({
      player: {
        ...player,
        stats
      }
    });
    gameState.saveProgress?.();
  }

  // ============================================
  // CRIAÇÃO DE ELEMENTOS VISUAIS
  // ============================================

  /**
   * Cria o sprite e indicador visual
   * @private
   */
  _createVisuals() {
    if (!this.visible) {
      return;
    }

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

        const matchPlayerScale = spriteConfig.matchPlayerScale === true;
        const fallbackScale = Number.isFinite(spriteConfig.scale) ? spriteConfig.scale : 1;
        const scaleMultiplier = Number.isFinite(spriteConfig.scaleMultiplier) ? spriteConfig.scaleMultiplier : 1;

        if (matchPlayerScale) {
          const playerScale = this.scene.player?.scaleX;
          const resolvedScale = Number.isFinite(playerScale) && playerScale > 0
            ? playerScale * scaleMultiplier
            : fallbackScale * scaleMultiplier;
          this.sprite.setScale(resolvedScale);
        } else if (spriteConfig.scale) {
          this.sprite.setScale(spriteConfig.scale);
        }
        
        if (spriteConfig.animation) {
          this.sprite.play(spriteConfig.animation);
        }

        if (typeof spriteConfig.flipX === 'boolean') {
          this.sprite.setFlipX(spriteConfig.flipX);
        }

        if (typeof spriteConfig.flipY === 'boolean') {
          this.sprite.setFlipY(spriteConfig.flipY);
        }
        
        this.sprite.setDepth(this.area.y); // Depth baseado em Y para ordenação
        this.sprite.setVisible(spriteConfig.visible !== false);
        this.ownsSprite = true;
        spriteCreated = true;
      } else {
        console.warn(`[InteractiveElement] Texture '${spriteConfig.key}' not found for ${this.id}`);
      }
    } else if (this.followSprite) {
      this.sprite = this.followSprite;
      spriteCreated = true;
    }

    // Criar retângulo de debug para todos os elementos interagíveis (invisível por padrão)
    // Será mostrado apenas quando o modo debug estiver ativo
    if (this.type !== 'trigger') {
      this.debugRect = this.scene.add.rectangle(
        this.area.x,
        this.area.y,
        this.area.width,
        this.area.height,
        0x00ff00, // Verde
        0.3 // Alpha
      );
      this.debugRect.setStrokeStyle(2, 0x00ff00);
      this.debugRect.setDepth((this.sprite?.depth || this.area.y) + 1);
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
      ).setOrigin(0.5).setDepth((this.sprite?.depth || this.area.y) + 2);
      this.debugText.setVisible(false); // Invisível por padrão
    }

    // Triggers não têm indicador visual (são automáticos)
    if (this.type === 'trigger') {
      this.indicator = null;
      return;
    }

    // Criar indicador de interação (apenas para elementos interagíveis manualmente)
    const indConfig = indicatorConfig || {};
    this.defaultIndicatorText = indConfig.text || '[E]';
    this.indicator = this.scene.add.container(this.area.x, this.area.y + (indConfig.offsetY || -40));
    
    // Fundo do indicador
    this.indicatorBg = this.scene.add.rectangle(0, 0, 44, 20, 0x06121f, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x3ab5f2, 0.9);
    
    // Texto do indicador
    this.indicatorText = this.scene.add.text(0, 0, this.defaultIndicatorText, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#cfefff'
    }).setOrigin(0.5);

    this.indicator.add([this.indicatorBg, this.indicatorText]);
    this.indicator.setDepth(1000);
    this.indicator.setVisible(false);
  }

  /**
   * Atualiza visual do indicador conforme estado (aproximação/hover)
   * @private
   */
  _refreshIndicator() {
    if (this._isDestroyed) {
      return;
    }

    if (!this.scene?.sys || !this.scene.sys.isActive?.()) {
      return;
    }

    if (!this.indicator || !this.indicatorText || !this.indicatorBg) {
      return;
    }

    const label = this._isHovered ? this.name : this.defaultIndicatorText;
    this.indicatorText.setText(label);
    this.indicatorText.setPosition(0, 0);

    const textWidth = this.indicatorText.width || 0;
    const textHeight = this.indicatorText.height || 0;
    this.indicatorBg.setSize(Math.max(44, textWidth + 14), Math.max(20, textHeight + 6));
    this.indicatorBg.setPosition(0, 0);

    if (this._isHovered) {
      this.indicatorBg.setFillStyle(0x11324a, 0.95);
      this.indicatorBg.setStrokeStyle(1, 0x82d8ff, 1);
      this.indicatorText.setColor('#eaf8ff');
    } else {
      this.indicatorBg.setFillStyle(0x06121f, 0.9);
      this.indicatorBg.setStrokeStyle(1, 0x3ab5f2, 0.9);
      this.indicatorText.setColor('#cfefff');
    }

    this.indicator.setVisible(this._isPlayerNearby || this._isHovered);
  }

  /**
   * Define se o mouse está em hover sobre o elemento
   * @param {boolean} hovered
   */
  setHovered(hovered) {
    if (this._isHovered === hovered) {
      return;
    }

    this._isHovered = hovered;
    this._refreshIndicator();
  }

  /**
   * Cria a zona de interação física
   * @private
   */
  _createInteractionZone() {
    if (!this.visible) {
      return;
    }

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
    this._refreshIndicator();
    
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
    this._refreshIndicator();
    
    // Resetar estado de interação quando player sai
    this._isInteracting = false;
    
    console.log(`[InteractiveElement] Player exited: ${this.name}`);
  }

  /**
   * Inicia a interação com tipo especificado
   * @param {string} [interactionType='keyboard'] - Tipo de interação ('keyboard' ou 'mouse')
   */
  interact(interactionType = 'keyboard') {
    if (!this.visible) {
      return;
    }

    if (this.locked) {
      this.showLockedFeedback();
      return;
    }

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
    
    console.log(`[InteractiveElement] Interacting with: ${this.name} (type: ${interactionType})`);
    this._trackInteraction('interact_start', { interactionType });
    this._trackSessionMetrics('interact_start', { interactionType });

    // Usar clickDialogues para interação por mouse, dialogues para teclado
    const dialoguesToUse = interactionType === 'mouse' && this.clickDialogues.length > 0
      ? this.clickDialogues
      : this.dialogues;

    console.log(`[InteractiveElement] Dialog choice for ${this.name}:`, {
      interactionType,
      clickDialoguesLength: this.clickDialogues.length,
      dialoguesLength: this.dialogues.length,
      usingClickDialogues: interactionType === 'mouse' && this.clickDialogues.length > 0,
      dialoguesToUseLength: dialoguesToUse.length,
      firstDialogue: dialoguesToUse[0]?.text || 'N/A'
    });

    // Se tem opções, mostrar menu de opções
    if (this.hasOptions) {
      this._isInteracting = true;
      this.showOptionsDialog();
    }
    // Se tem diálogos, mostrar diálogos sequenciais
    else if (dialoguesToUse.length > 0) {
      this._isInteracting = true;
      this.showDialogues(dialoguesToUse);
    }
    // Fallback: emitir evento genérico
    else {
      this.scene.events.emit('element-interact', { element: this });
    }
  }

  showLockedFeedback() {
    const dialogScene = this.scene.scene.get(SCENE_NAMES.DIALOG);
    if (dialogScene && typeof dialogScene.showDialog === 'function') {
      dialogScene.showDialog({
        name: this.name,
        dialogues: [{ text: this.lockedMessage, emotion: 'neutral' }]
      });
      return;
    }

    this.scene.events.emit('element-locked', {
      elementId: this.id,
      name: this.name,
      message: this.lockedMessage
    });
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

    this._openOptionsDialogWithRetry(dialogData, 0);
  }

  /**
   * Abre menu de opções aguardando o DialogScene estar pronto.
   * @param {Object} dialogData
   * @param {number} attempt
   * @private
   */
  _openOptionsDialogWithRetry(dialogData, attempt = 0) {
    const maxAttempts = 6;
    const dialogScene = this.scene.scene.get(SCENE_NAMES.DIALOG);
    const isActive = this.scene.scene.isActive(SCENE_NAMES.DIALOG);
    const isReady = !!dialogScene?.optionsContainer;

    if (!dialogScene || !isActive || !isReady) {
      if (!isActive) {
        this.scene.scene.launch(SCENE_NAMES.DIALOG);
      }

      if (attempt >= maxAttempts) {
        console.warn('[InteractiveElement] DialogScene not ready for options dialog:', this.id);
        this.endInteraction();
        return;
      }

      this.scene.time.delayedCall(120, () => {
        this._openOptionsDialogWithRetry(dialogData, attempt + 1);
      });
      return;
    }

    dialogScene.showOptionsDialog(dialogData);
  }

  /**
   * Mostra diálogos sequenciais (sem opções)
   * @param {Object[]} [dialogues] - Diálogos a exibir (usa this.dialogues se não fornecido)
   */
  showDialogues(dialogues = null) {
    const self = this; // Guardar referência para o callback
    const dialoguesToShow = dialogues || this.dialogues;
    
    const dialogData = {
      name: this.name,
      dialogues: dialoguesToShow,
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
    return getAvailableOptionsUtil(this);
  }

  /**
   * Verifica se uma condição é atendida
   * @param {Object} condition
   * @returns {boolean}
   */
  checkCondition(condition) {
    return checkConditionUtil(this, condition);
  }

  /** @private */
  _checkQuestCondition(gameState, id, operator, value) {
    return checkQuestConditionUtil(gameState, id, operator, value);
  }

  /** @private */
  _checkItemCondition(gameState, id, operator, value) {
    return checkItemConditionUtil(gameState, id, operator, value);
  }

  /** @private */
  _checkFlagCondition(gameState, id, operator, value) {
    return checkFlagConditionUtil(gameState, id, operator, value);
  }

  /** @private */
  _checkStatCondition(gameState, id, operator, value) {
    return checkStatConditionUtil(gameState, id, operator, value);
  }

  /** @private */
  _compareValues(a, operator, b) {
    return compareValuesUtil(a, operator, b);
  }

  /**
   * Processa a seleção de uma opção
   * @param {ElementOption} option
   */
  handleOptionSelect(option) {
    console.log(`[InteractiveElement] Option selected: ${option.label}`);
    const trackingPayload = {
      optionId: option?.id || null,
      optionLabel: option?.label || null,
      optionAxis: option?.axis || option?.action?.data?.axis || null,
      optionDisabled: !!option?.disabled
    };
    this._trackInteraction('option_selected', trackingPayload);
    this._trackSessionMetrics('option_selected', trackingPayload);

    this.scene.events.emit('interactive-option-selected', {
      elementId: this.id,
      elementName: this.name,
      optionId: option?.id || null,
      optionLabel: option?.label || null,
      optionAxis: trackingPayload.optionAxis,
      scene: this.scene?.scene?.key || null,
      at: Date.now()
    });

    if (window.dilemmaJourneyRuntime?.recordOptionSelection) {
      window.dilemmaJourneyRuntime.recordOptionSelection({
        optionId: option?.id || null,
        source: this.name,
        sourceId: this.id,
        label: option?.label || null,
        scene: this.scene?.scene?.key || null,
        at: Date.now()
      });
    }
    
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
    this._trackInteraction('execute_action', {
      actionType: action?.type || null,
      actionTarget: action?.target || null,
      optionId: option?.id || null,
      optionLabel: option?.label || null
    });

    executeActionUtil(this, action, option);
  }

  /** @private */
  _executeDialogAction(action) {
    executeDialogActionUtil(this, action);
  }

  /** @private */
  _executeSceneAction(action) {
    executeSceneActionUtil(this, action);
  }

  /** @private */
  _executeMinigameAction(action) {
    executeMinigameActionUtil(this, action);
  }

  /** @private */
  _executeEventAction(action, option) {
    executeEventActionUtil(this, action, option);
  }

  /** @private */
  _executeItemAction(action) {
    executeItemActionUtil(this, action);
  }

  /** @private */
  _executeQuestAction(action) {
    executeQuestActionUtil(this, action);
  }

  /** @private */
  _executeCustomAction(action, option) {
    executeCustomActionUtil(this, action, option);
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
    if (this.sprite) {
      this.area.x = this.sprite.x;
      this.area.y = this.sprite.y;

      if (this.interactionZone) {
        this.interactionZone.setPosition(this.sprite.x, this.sprite.y);
        if (typeof this.interactionZone.body?.updateFromGameObject === 'function') {
          this.interactionZone.body.updateFromGameObject();
        } else if (typeof this.interactionZone.body?.reset === 'function') {
          this.interactionZone.body.reset(this.interactionZone.x, this.interactionZone.y);
        }
      }

      if (this.debugRect) {
        this.debugRect.setPosition(this.sprite.x, this.sprite.y);
        this.debugRect.setDepth((this.sprite?.depth || this.area.y) + 1);
      }

      if (this.debugText) {
        this.debugText.setPosition(this.sprite.x, this.sprite.y);
        this.debugText.setDepth((this.sprite?.depth || this.area.y) + 2);
      }

      if (this.indicator) {
        const offsetY = this.config.indicator?.offsetY || -40;
        this.indicator.setPosition(this.sprite.x, this.sprite.y + offsetY);
        this.indicator.setDepth((this.sprite?.depth || this.area.y) + 3);
      }
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
    this._isDestroyed = true;

    if (this.ownsSprite) {
      this.sprite?.destroy();
    }
    this.indicator?.destroy();
    this.interactionZone?.destroy();
    this.debugRect?.destroy();
    this.debugText?.destroy();
    
    console.log(`[InteractiveElement] Destroyed: ${this.id}`);
  }
}
