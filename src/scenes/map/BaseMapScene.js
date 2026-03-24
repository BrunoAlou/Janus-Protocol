import Phaser from 'phaser';
import { MapSetupMixin } from './mixins/MapSetupMixin.js';
import { PlayerSetupMixin } from './mixins/PlayerSetupMixin.js';
import { NpcSetupMixin } from './mixins/NpcSetupMixin.js';
import { ElementSetupMixin } from './mixins/ElementSetupMixin.js';
import { resolveMapPath } from '../../utils/AssetResolver.js';

/**
 * BaseMapScene - Classe base para todas as cenas de mapa
 * 
 * Orquestra a criação de:
 * - Mapa (tilesets, layers, colisões)
 * - Player (controller, câmera, debugger)
 * - NPCs (sprite-based)
 * - Elementos (ElementManager, door zones)
 * 
 * Usa Mixins para separar responsabilidades em módulos reutilizáveis
 */
export default class BaseMapScene extends Phaser.Scene {
  constructor(key, mapKey) {
    super(key);
    this.sceneKey = key;
    this.mapKey = mapKey;
    this.defaultZoom = 3.0;
    this.npcs = [];
    this.layers = null;
    this.resumePosition = null;
    this._positionPersistElapsed = 0;
    this._lastPersistedPosition = null;
  }

  init(data) {
    this.user = data.user;
    this.previousScene = data.previousScene;
    this.resumePosition = data.playerPosition || null;
    this._positionPersistElapsed = 0;
    this._lastPersistedPosition = null;
  }

  preload() {
    // Carregar mapa específico
    const mapUrl = resolveMapPath(this.mapKey);
    if (!mapUrl) {
      console.error(`[${this.sceneKey}] Map URL could not be resolved for key: ${this.mapKey}`);
      return;
    }

    this.load.tilemapTiledJSON(this.mapKey, mapUrl);
  }

  create() {
    // Notificar mudança de sala para o minimapa
    this.game.events.emit('room-changed', this.sceneKey);

    // Orquestrar setup na ordem correta
    this.setupMap();
    if (!this.map || !this.layers) {
      console.error(`[${this.sceneKey}] Scene aborted: map/layers could not be initialized`);
      return;
    }

    this.setupPlayer();
    this.setupNPCs();
    this.setupInteractions();
    this.setupElements();
    this.setupCamera();

    console.log(`[${this.sceneKey}] Scene created`);
    console.log(`[${this.sceneKey}] UI scenes managed by SceneManager`);

    this._registeredDoorZones = new Set();

    // Persistência de posição
    this._beforeUnloadHandler = () => {
      if (this.player && window.gameState?.setPlayerPosition) {
        window.gameState.setPlayerPosition(this.player.x, this.player.y, null, this.sceneKey);
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);

    this.events.once('shutdown', () => {
      if (this.player && window.gameState?.setPlayerPosition) {
        window.gameState.setPlayerPosition(this.player.x, this.player.y, null, this.sceneKey);
      }
      if (this._beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      }

      this.playerController?.destroy?.();
      this.interactionManager?.destroy?.();
      this.elementManager?.destroy?.();
      this.collisionDebugger?.destroy?.();

      this.playerController = null;
      this.interactionManager = null;
      this.elementManager = null;
      this.collisionDebugger = null;
    });
  }

  /**
   * Registra DoorZones no debugger de colisão
   * Chamado pelas cenas filhas após criar suas DoorZones
   */
  registerDoorZonesToDebugger() {
    if (!this.collisionDebugger || !this.doorZones) {
      return;
    }

    const allZones = Array.isArray(this.doorZones) ? this.doorZones : [this.doorZones];

    for (const zone of allZones) {
      if (!zone) {
        continue;
      }

      const key = `${zone.label}|${zone.x}|${zone.y}`;
      if (this._registeredDoorZones.has(key)) {
        continue;
      }

      this._registeredDoorZones.add(key);
      this.collisionDebugger.registerDoorZone(zone);
    }

    const total = this._registeredDoorZones.size;
    if (total > 0) {
      console.log(`[${this.sceneKey}] Registered ${total} door zones to debugger`);
    }
  }

  /**
   * Exemplos de posição inicial do player (sobrescrever em subclasses)
   */
  getSpawnX() {
    return 400;
  }

  getSpawnY() {
    return 520;
  }

  update(time, delta) {
    if (this.playerController) {
      this.playerController.update(time, delta);
    }
    if (this.interactionManager) {
      this.interactionManager.update();
    }
    if (this.elementManager) {
      this.elementManager.update(time, delta);
    }
    if (this.collisionDebugger) {
      this.collisionDebugger.update();
    }
    
    // Y-sorting: depth baseado na posição Y
    if (this.player) {
      this.player.setDepth(100 + Math.floor(this.player.y / 10));

      this._positionPersistElapsed += delta || 0;
      if (this._positionPersistElapsed >= 800 && window.gameState?.setPlayerPosition) {
        const prev = this._lastPersistedPosition;
        const movedEnough = !prev || Phaser.Math.Distance.Between(prev.x, prev.y, this.player.x, this.player.y) >= 4;

        if (movedEnough) {
          window.gameState.setPlayerPosition(this.player.x, this.player.y, null, this.sceneKey);
          this._lastPersistedPosition = { x: this.player.x, y: this.player.y };
        }

        this._positionPersistElapsed = 0;
      }
    }
    
    // Y-sorting para NPCs
    this.npcs.forEach(npc => {
      if (npc && npc.y !== undefined) {
        npc.setDepth(100 + Math.floor(npc.y / 10));
      }
      npc.updateElements?.();
    });
  }

  transitionTo(sceneKey, data = {}) {
    window.sceneManager.goToMap(sceneKey, { ...data, user: this.user, previousScene: this.sceneKey });
  }
}

// Aplicar mixins à classe para composição de funcionalidades
Object.assign(BaseMapScene.prototype, MapSetupMixin);
Object.assign(BaseMapScene.prototype, PlayerSetupMixin);
Object.assign(BaseMapScene.prototype, NpcSetupMixin);
Object.assign(BaseMapScene.prototype, ElementSetupMixin);
