/**
 * InteractionManager - Gerencia interações com NPCs e objetos
 */

import { logAction } from '../utils/telemetry.js';
import { NPC_TEXTS } from '../i18n/npcTexts.js';

export default class InteractionManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.nearbyNPCs = new Set();
    this.registeredNPCs = [];
    this.currentInteractable = null;
    this.hoveredNPC = null;
    
    // Tecla E para interação
    this.interactKey = scene.input.keyboard.addKey('E');
    this.interactKey.on('down', () => this.handleInteraction());

    this._setupMouseListeners();

    console.log('[InteractionManager] Initialized');
  }

  _setupMouseListeners() {
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) {
        return;
      }

      this.handleMouseClick(pointer);
    });
  }

  _getPointerWorldPoint(pointer) {
    const camera = this.scene.cameras?.main;
    if (camera && typeof camera.getWorldPoint === 'function') {
      return camera.getWorldPoint(pointer.x, pointer.y);
    }

    return {
      x: pointer.worldX,
      y: pointer.worldY
    };
  }

  _isPointerOverNPC(pointer, npc) {
    if (!npc || !npc.active || !npc.visible || typeof npc.getBounds !== 'function') {
      return false;
    }

    const worldPoint = this._getPointerWorldPoint(pointer);
    const bounds = npc.getBounds();
    return bounds.contains(worldPoint.x, worldPoint.y);
  }

  _getHoveredNPC(pointer) {
    let hoveredNpc = null;

    for (const npc of this.registeredNPCs) {
      if (!this._isPointerOverNPC(pointer, npc)) {
        continue;
      }

      if (!hoveredNpc || (npc.depth || 0) >= (hoveredNpc.depth || 0)) {
        hoveredNpc = npc;
      }
    }

    return hoveredNpc;
  }

  _updateHoveredNPC() {
    const pointer = this.scene.input?.activePointer;
    const nextHoveredNpc = pointer ? this._getHoveredNPC(pointer) : null;

    if (this.hoveredNPC === nextHoveredNpc) {
      return;
    }

    if (this.hoveredNPC && !this.nearbyNPCs.has(this.hoveredNPC)) {
      this.hoveredNPC.interactionIndicator?.setVisible(false);
    }

    this.hoveredNPC = nextHoveredNpc;

    if (this.hoveredNPC) {
      this.hoveredNPC.interactionIndicator?.setVisible(true);
    }
  }

  handleMouseClick(pointer) {
    if (this._isInteractionBlocked()) {
      return;
    }

    // Mantém prioridade para elementos quando o cursor está sobre eles.
    if (this.scene.elementManager?._hoveredElement) {
      return;
    }

    const npc = this._getHoveredNPC(pointer);
    if (!npc) {
      return;
    }

    this.currentInteractable = npc;
    this._interactWithNpc(npc, { ignoreElementPriority: true });
  }

  /**
   * Registra NPCs para interação
   */
  registerNPCs(npcs) {
    if (!Array.isArray(npcs)) npcs = [npcs];
    this.registeredNPCs = [...npcs];

    npcs.forEach(npc => {
      if (!npc.interactionZone) {
        console.warn('[InteractionManager] NPC without interaction zone:', npc);
        return;
      }

      // Overlap entre player e zona de interação
      this.scene.physics.add.overlap(
        this.player,
        npc.interactionZone,
        () => this.onPlayerEnterNPCZone(npc),
        null,
        this
      );
    });

    console.log('[InteractionManager] Registered', npcs.length, 'NPCs');
  }

  /**
   * Quando player entra na zona de interação
   */
  onPlayerEnterNPCZone(npc) {
    if (!this.nearbyNPCs.has(npc)) {
      this.nearbyNPCs.add(npc);
      npc.interactionIndicator?.setVisible(true);
      console.log('[InteractionManager] Player near NPC:', npc.npcName);
    }
    this.currentInteractable = npc;
  }

  /**
   * Quando player sai da zona de interação
   */
  onPlayerExitNPCZone(npc) {
    if (this.nearbyNPCs.has(npc)) {
      this.nearbyNPCs.delete(npc);
      npc.interactionIndicator?.setVisible(false);
      console.log('[InteractionManager] Player left NPC:', npc.npcName);
    }
    if (this.currentInteractable === npc) {
      this.currentInteractable = null;
    }
  }

  /**
   * Verifica se interações devem ser bloqueadas (onboarding/dialog/options).
   * @returns {boolean}
   * @private
   */
  _isInteractionBlocked() {
    if (typeof this.scene.isInteractionBlocked === 'function' && this.scene.isInteractionBlocked()) {
      return true;
    }

    const dialogScene = this.scene.scene.get('DialogScene');
    if (dialogScene && typeof dialogScene.isDialogOpen === 'function' && dialogScene.isDialogOpen()) {
      return true;
    }

    return false;
  }

  /**
   * Processa interação quando tecla E é pressionada
   */
  handleInteraction() {
    if (this._isInteractionBlocked()) {
      return;
    }

    if (!this.currentInteractable) {
      // Só logar se não houver nada em nenhum dos sistemas
      if (!this.scene.elementManager || this.scene.elementManager.elements.size === 0) {
        console.log('[InteractionManager] No interactable nearby');
      }
      return;
    }

    const npc = this.currentInteractable;
    this._interactWithNpc(npc);
  }

  _interactWithNpc(npc, options = {}) {
    if (!npc) {
      return;
    }

    const { ignoreElementPriority = false } = options;

    // Quando há elemento e NPC próximos, prioriza o mais perto do player.
    if (!ignoreElementPriority) {
      const currentElement = this.scene.elementManager?.currentInteractable;
      if (currentElement) {
        const npcDistance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          npc.x,
          npc.y
        );

        const elementCenterX = Number.isFinite(currentElement.area?.x)
          ? currentElement.area.x
          : currentElement.x;
        const elementCenterY = Number.isFinite(currentElement.area?.y)
          ? currentElement.area.y
          : currentElement.y;

        const elementDistance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          elementCenterX,
          elementCenterY
        );

        if (Number.isFinite(elementDistance) && elementDistance < npcDistance) {
          return;
        }
      }
    }

    if (npc?.contactFlagKey && window.gameState?.setFlag) {
      window.gameState.setFlag(npc.contactFlagKey, true);
    }

    if (npc.locked) {
      const dialogScene = this.scene.scene.get('DialogScene');
      if (dialogScene && typeof dialogScene.showDialog === 'function') {
        dialogScene.showDialog({
          name: npc.npcName || NPC_TEXTS.defaults.fallbackName,
          dialogues: [{
            text: npc.lockedMessage || NPC_TEXTS.defaults.lockedFallbackMessage,
            emotion: 'neutral'
          }]
        });
      }
      return;
    }
    
    if (npc.isInteracting) {
      console.log('[InteractionManager] NPC already interacting');
      return;
    }

    console.log('[InteractionManager] Interacting with:', npc.npcName);

    try {
      logAction('interaction', {
        actionName: 'npc_interaction',
        npcName: npc.npcName,
        scene: this.scene?.scene?.key
      }, {
        x: Math.round(npc.x || 0),
        y: Math.round(npc.y || 0)
      });
    } catch (error) {
      console.warn('[InteractionManager] Telemetry tracking failed:', error?.message || error);
    }
    
    // Emitir evento de interação
    this.scene.events.emit('npc-interact', {
      npc: npc,
      dialogues: npc.dialogues,
      name: npc.npcName
    });

    npc.isInteracting = true;
  }

  /**
   * Finaliza interação atual
   */
  endInteraction() {
    if (this.currentInteractable) {
      this.currentInteractable.isInteracting = false;
      console.log('[InteractionManager] Interaction ended');
    }
  }

  /**
   * Atualiza distâncias (chamar no update)
   */
  update() {
    this._updateHoveredNPC();

    if (this._isInteractionBlocked()) {
      if (this.currentInteractable?.interactionIndicator) {
        this.currentInteractable.interactionIndicator.setVisible(false);
      }

      if (this.hoveredNPC?.interactionIndicator && this.hoveredNPC !== this.currentInteractable) {
        this.hoveredNPC.interactionIndicator.setVisible(false);
      }

      this.hoveredNPC = null;
      this.currentInteractable = null;
      return;
    }

    // Verificar distância de todos os NPCs próximos
    const toRemove = [];
    
    this.nearbyNPCs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );

      // Se ficou longe, remover
      if (distance > npc.interactionZone.body.radius + 10) {
        toRemove.push(npc);
      }
    });

    toRemove.forEach(npc => this.onPlayerExitNPCZone(npc));
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.interactKey?.destroy();
    this.nearbyNPCs.clear();
    this.registeredNPCs = [];
    this.hoveredNPC = null;
    this.currentInteractable = null;
  }
}
