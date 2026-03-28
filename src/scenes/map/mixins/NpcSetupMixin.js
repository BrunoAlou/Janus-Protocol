import NPCFactory from '../../../npcs/NPCFactory.js';
import InteractionManager from '../../../interactions/InteractionManager.js';
import { NPC_TEXTS } from '../../../i18n/npcTexts.js';

/**
 * NpcSetupMixin - Lógica genérica de setup de NPCs
 * Pode ser usado em qualquer cena que herda de BaseMapScene
 * 
 * Funções:
 * - setupNPCs(): Cria NPCs da camada de objetos do Tiled
 * - setupSpriteNpcContactFlags(): Garante flags de contato para NPCs sprite
 * - setupInteractions(): Configura o InteractionManager
 * - createNPCsFromObjectLayer(): Cria array de NPCs a partir da camada de objetos
 * - createNPCFromObject(): Cria um NPC individual
 * - parseTiledProperties(): Converte propriedades do Tiled em objeto
 * - parseBooleanProperty(): Parse seguro de booleans do Tiled
 */
export const NpcSetupMixin = {
  /**
   * Setup de NPCs: cria NPCs da camada de objetos e flags de contato
   */
  setupNPCs() {
    this.npcs = this.createNPCsFromObjectLayer();
    this.setupSpriteNpcContactFlags();
    console.log(`[${this.sceneKey}] Created ${this.npcs.length} NPCs from map object layer`);
  },

  /**
   * Cria NPCs a partir de uma camada de objetos do Tiled.
   * Camada padrão: "NPCs" (fallback: "npcs").
   */
  createNPCsFromObjectLayer(layerNames = ['NPCs', 'npcs']) {
    if (!this.map) {
      return [];
    }

    const objectLayer = layerNames
      .map(layerName => this.map.getObjectLayer(layerName))
      .find(Boolean);

    if (!objectLayer || !Array.isArray(objectLayer.objects) || objectLayer.objects.length === 0) {
      return [];
    }

    const npcs = [];

    objectLayer.objects.forEach((obj, index) => {
      if (!obj || obj.visible === false) {
        return;
      }

      const npc = this.createNPCFromObject(obj, index);
      if (!npc) {
        return;
      }

      this.addCollisionsToSprite(npc, false);
      npcs.push(npc);
    });

    return npcs;
  },

  /**
   * Cria um NPC com base em um objeto da camada "NPCs" do Tiled.
   */
  createNPCFromObject(obj, index) {
    const props = this.parseTiledProperties(obj.properties);
    const isVisible = this.parseBooleanProperty(props.visible, true);
    if (!isVisible) {
      return null;
    }

    const templateKey = typeof props.template === 'string' ? props.template : null;
    const template = templateKey && NPCFactory.templates[templateKey]
      ? NPCFactory.templates[templateKey]
      : {};

    const rawDialogues =
      typeof props.dialoguesJson === 'string'
        ? props.dialoguesJson
        : typeof props.dialogues === 'string'
          ? props.dialogues
          : null;

    let dialogues = [];
    if (rawDialogues) {
      try {
        const parsed = JSON.parse(rawDialogues);
        if (Array.isArray(parsed)) {
          dialogues = parsed;
        }
      } catch (error) {
        console.warn(`[${this.sceneKey}] Invalid dialogues JSON for NPC "${obj.name || index}":`, error);
      }
    } else if (typeof props.dialogue === 'string' && props.dialogue.trim()) {
      dialogues = [{
        text: props.dialogue,
        emotion: typeof props.emotion === 'string' ? props.emotion : 'neutral'
      }];
    }

    const config = {
      ...template,
      id: String(props.id || obj.name || `npc_${index + 1}`),
      name: String(props.name || obj.name || template.name || `NPC ${index + 1}`),
      texture: String(props.texture || template.texture || 'npc_default'),
      frame: Number.isFinite(Number(props.frame)) ? Number(props.frame) : (template.frame || 0),
      scale: Number.isFinite(Number(props.scale)) ? Number(props.scale) : (template.scale || 4),
      depth: Number.isFinite(Number(props.depth)) ? Number(props.depth) : (template.depth || 4),
      interactionRadius: Number.isFinite(Number(props.interactionRadius))
        ? Number(props.interactionRadius)
        : (template.interactionRadius || 32),
      canMove: typeof props.canMove === 'boolean' ? props.canMove : (template.canMove || false),
      dialogues: dialogues.length > 0 ? dialogues : (template.dialogues || [])
    };

    const x = Number.isFinite(Number(obj.x)) ? Number(obj.x) : 0;
    const y = Number.isFinite(Number(obj.y)) ? Number(obj.y) : 0;

    const npc = NPCFactory.create(this, x, y, config);

    npc.visible = isVisible;
    npc.locked = this.parseBooleanProperty(props.locked, false);
    npc.lockedMessage = typeof props.lockedMessage === 'string'
      ? props.lockedMessage
      : NPC_TEXTS.defaults.lockedFallbackMessage;

    if (typeof props.animation === 'string' && props.animation && this.anims.exists(props.animation)) {
      npc.play(props.animation, true);
    }

    return npc;
  },

  /**
   * Converte a lista de propriedades do Tiled em um objeto simples.
   */
  parseTiledProperties(properties = []) {
    if (!Array.isArray(properties)) {
      return {};
    }

    return properties.reduce((acc, prop) => {
      if (!prop || typeof prop.name !== 'string') {
        return acc;
      }
      acc[prop.name] = prop.value;
      return acc;
    }, {});
  },

  /**
   * Parse seguro de propriedades booleanas do Tiled
   */
  parseBooleanProperty(value, fallback = false) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return fallback;
  },

  /**
   * Garante flags de contato para NPCs baseados em sprites (object layer).
   */
  setupSpriteNpcContactFlags() {
    if (!Array.isArray(this.npcs) || this.npcs.length === 0) {
      return;
    }

    if (!window.gameState?.setFlag || !window.gameState?.getFlag) {
      return;
    }

    this.npcs.forEach((npc) => {
      const npcId = npc?.npcId;
      if (!npcId) {
        return;
      }

      const contactFlagKey = `contacted_${npcId}`;
      npc.contactFlagKey = contactFlagKey;

      if (window.gameState.getFlag(contactFlagKey) === undefined) {
        window.gameState.setFlag(contactFlagKey, false);
      }
    });
  },

  /**
   * Configura o sistema de interações com NPCs
   */
  setupInteractions() {
    if (this.useLegacyNpcInteractionManager !== true) {
      this.interactionManager = null;
      return;
    }

    this.interactionManager = new InteractionManager(this, this.player);
    if (this.npcs.length > 0) {
      this.interactionManager.registerNPCs(this.npcs);
    }
  }
};
