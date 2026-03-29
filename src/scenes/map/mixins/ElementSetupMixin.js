import { ElementManager } from '../../../elements/index.js';

/**
 * ElementSetupMixin - Lógica genérica de setup de elementos interativos
 * Pode ser usado em qualquer cena que herda de BaseMapScene
 * 
 * Funções:
 * - setupElements(): Carrega elementos do arquivo JSON
 * - setupNpcContactFlags(): Garante flags de contato para elementos NPC
 */
export const ElementSetupMixin = {
  /**
   * Configura elementos interativos do mapa
   * Carrega elementos de arquivo JSON baseado no mapKey
   */
  async setupElements() {
    // Criar ElementManager
    this.elementManager = new ElementManager(this, this.player);

    // Carregar elementos do arquivo JSON
    const mapId = this.mapKey || this.sceneKey.toLowerCase().replace('scene', '');
    await this.elementManager.loadFromFile(mapId);
    this.setupSofaSitOptions();
    this.syncSpriteNpcsToElements();
    this.setupNpcContactFlags();

    if (window.debugEnabled === true) {
      this.elementManager.setDebugVisible(true);
    }

    console.log(`[${this.sceneKey}] Elements loaded for map: ${mapId}`);
  },

  setupSofaSitOptions() {
    if (!this.elementManager?.getObjects) {
      return;
    }

    const objects = this.elementManager.getObjects();
    objects.forEach((element) => {
      if (!element || element.type !== 'object') {
        return;
      }

      const identifier = `${element.id || ''} ${element.name || ''} ${element.description || ''}`.toLowerCase();
      const isSofa = identifier.includes('sofa');
      if (!isSofa) {
        return;
      }

      const hasSitOption = Array.isArray(element.options)
        && element.options.some((opt) => String(opt?.id || '').startsWith('opt_sit_'));

      if (hasSitOption) {
        return;
      }

      if (!Array.isArray(element.options)) {
        element.options = [];
      }

      element.options.unshift({
        id: `opt_sit_${element.id}`,
        label: 'Sentar',
        icon: '🪑',
        action: {
          type: 'event',
          target: 'player-sit-on-element',
          data: {
            direction: this.resolveSofaSitDirection(element),
            offsetY: 10
          }
        }
      });
    });
  },

  resolveSofaSitDirection(element) {
    const id = String(element?.id || '').toLowerCase();
    const sceneKey = String(this.sceneKey || '').toLowerCase();

    if (sceneKey === 'receptionscene') {
      if (id === 'couch_1' || id === 'couch_2') {
        return 'right';
      }

      if (id === 'couch_3') {
        return 'left';
      }
    }

    return 'down';
  },

  /**
   * Converte NPCs baseados em sprite para o pipeline do ElementManager.
   * Isso garante UX unificada com recepcao: hover, indicador [E], debug e interacao.
   */
  syncSpriteNpcsToElements() {
    if (!this.elementManager || !Array.isArray(this.npcs) || this.npcs.length === 0) {
      return;
    }

    this.npcs.forEach((npc, index) => {
      if (!npc || npc.visible === false) {
        return;
      }

      const elementId = String(npc.npcId || npc.name || `sprite_npc_${index + 1}`);

      // Desativa UI de interacao legado para evitar divergir da UX do InteractiveElement.
      npc.interactionZone?.destroy?.();
      npc.interactionZone = null;
      npc.interactionIndicator?.destroy?.();
      npc.interactionIndicator = null;
      npc.nameTag?.destroy?.();
      npc.nameTag = null;
      npc.elementInteractionId = elementId;

      if (this.elementManager.getElement(elementId)) {
        return;
      }

      const displayWidth = Number.isFinite(npc.displayWidth) ? npc.displayWidth : 32;
      const displayHeight = Number.isFinite(npc.displayHeight) ? npc.displayHeight : 64;
      const configuredAreaWidth = Number.isFinite(npc.interactionAreaWidth) ? npc.interactionAreaWidth : 0;
      const configuredAreaHeight = Number.isFinite(npc.interactionAreaHeight) ? npc.interactionAreaHeight : 0;
      const areaWidth = configuredAreaWidth > 0
        ? configuredAreaWidth
        : Math.max(28, Math.round(displayWidth * 0.7));
      const areaHeight = configuredAreaHeight > 0
        ? configuredAreaHeight
        : Math.max(44, Math.round(displayHeight * 0.9));

      this.elementManager.addElement({
        id: elementId,
        type: 'npc',
        name: String(npc.npcName || npc.name || `NPC ${index + 1}`),
        area: {
          x: npc.x,
          y: npc.y,
          width: areaWidth,
          height: areaHeight
        },
        indicator: {
          text: '[E]',
          offsetY: -Math.max(40, Math.round(displayHeight * 0.65))
        },
        dialogues: Array.isArray(npc.dialogues) ? npc.dialogues : [],
        clickDialogues: Array.isArray(npc.clickDialogues) ? npc.clickDialogues : [],
        locked: npc.locked === true,
        lockedMessage: npc.lockedMessage,
        followSprite: npc,
        persistent: true
      });
    });
  },

  /**
   * Garante flag de contato para todo NPC interativo e marca automaticamente no primeiro contato.
   * Padrão da flag: contacted_<npcElementId>
   */
  setupNpcContactFlags() {
    const npcElements = this.elementManager?.getNPCs?.() || [];
    if (!Array.isArray(npcElements) || npcElements.length === 0) {
      return;
    }

    npcElements.forEach((npcElement) => {
      if (!npcElement?.id || !window.gameState?.setFlag || !window.gameState?.getFlag) {
        return;
      }

      const contactFlagKey = `contacted_${npcElement.id}`;
      npcElement.contactFlagKey = contactFlagKey;

      if (window.gameState.getFlag(contactFlagKey) === undefined) {
        window.gameState.setFlag(contactFlagKey, false);
      }

      if (npcElement._hasContactFlagWrapper) {
        return;
      }

      const originalInteract = npcElement.interact.bind(npcElement);
      npcElement.interact = (trigger = 'manual') => {
        window.gameState.setFlag(contactFlagKey, true);
        return originalInteract(trigger);
      };
      npcElement._hasContactFlagWrapper = true;
    });
  }
};
