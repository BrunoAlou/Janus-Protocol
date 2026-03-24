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
    this.setupNpcContactFlags();

    console.log(`[${this.sceneKey}] Elements loaded for map: ${mapId}`);
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
