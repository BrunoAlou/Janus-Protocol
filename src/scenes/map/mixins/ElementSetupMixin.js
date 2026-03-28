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
    this.syncSpriteNpcsToElements();
    this.setupNpcContactFlags();

    if (window.debugEnabled === true) {
      this.elementManager.setDebugVisible(true);
    }

    console.log(`[${this.sceneKey}] Elements loaded for map: ${mapId}`);
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
