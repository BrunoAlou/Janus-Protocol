import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import { SceneDialogueFlowService } from './services/SceneDialogueFlowService.js';
import { GARDEN_TEXTS } from '../../i18n/gardenTexts.js';
import {
  createGardnerAnimations,
  getGardnerTextureKey,
  loadGardnerAssets,
  resolveGardnerAnimation
} from '../../npcs/gardnerAnimations.js';
import { createCharacterCommandController } from '../../characters/CharacterCommandController.js';
import { AmbientMobileNpcService } from './services/npc/AmbientMobileNpcService.js';

/**
 * GardenScene - Jardim / Área Externa
 */
export default class GardenScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.GARDEN, 'garden');
    this.isTransitioning = false;
    this.dialogueFlow = null;
    this._gardenPhoneTimer = null;
    this._gardenFlowRunning = false;
    this._gardenPhoneTriggered = false;
    this._gardenEntryFlowStarted = false;
    this.gardenContemplationFlagKey = 'garden_contemplation_completed';
    this.gardenPhoneTriggeredFlagKey = 'garden_phone_event_triggered';
    this.gardnerCommandController = null;
    this.ambientMobileNpcService = null;
  }

  init(data) {
    super.init(data);
    this.isTransitioning = false;
    this.dialogueFlow = new SceneDialogueFlowService(this);
    this._gardenFlowRunning = false;
    this._gardenPhoneTimer = null;
    this._gardenPhoneTriggered = false;
    this._gardenEntryFlowStarted = false;

    if (window.gameState?.getFlag?.(this.gardenContemplationFlagKey) === undefined) {
      window.gameState.setFlag(this.gardenContemplationFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.gardenPhoneTriggeredFlagKey) === undefined) {
      window.gameState.setFlag(this.gardenPhoneTriggeredFlagKey, false);
    }
  }

  preload() {
    loadPlayerAssets(this);
    loadGardnerAssets(this);
    preloadRegisteredTilesets(this);
    super.preload();
  }

  create() {
    super.create();
    this.setupDoorTransitions();
    this.registerDoorZonesToDebugger();

    // Fluxo automatico de contemplacao ao entrar no jardim.
    this.time.delayedCall(220, () => {
      if (this.scene.isActive() && !this._gardenEntryFlowStarted) {
        this._gardenEntryFlowStarted = true;
        this.startGardenContemplationFlow();
      }
    });

    this.events.once('shutdown', () => {
      if (this._gardenPhoneTimer) {
        this._gardenPhoneTimer.remove(false);
        this._gardenPhoneTimer = null;
      }
      this.playerController?.clearForcedAction?.();
    });
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.player && this.doorZones) {
      this.doorZones.forEach((door) => door.update(this.player, this.input, this.tweens));
    }
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  startGardenContemplationFlow() {
    if (this._gardenFlowRunning) {
      return;
    }

    this._gardenFlowRunning = true;

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: 'JARDIM',
      dialogues: GARDEN_TEXTS.contemplation.dialogues,
      onComplete: () => {
        this._gardenFlowRunning = false;
        window.gameState?.setFlag?.(this.gardenContemplationFlagKey, true);
        this.scheduleGardenPhoneEvent();
      }
    });
  }

  scheduleGardenPhoneEvent() {
    if (this._gardenPhoneTriggered) {
      return;
    }

    if (this._gardenPhoneTimer) {
      this._gardenPhoneTimer.remove(false);
    }

    this._gardenPhoneTimer = this.time.delayedCall(30000, () => {
      this.triggerGardenPhoneEvent();
    });
  }

  triggerGardenPhoneEvent() {
    if (this._gardenPhoneTriggered) {
      return;
    }

    this._gardenPhoneTriggered = true;
    window.gameState?.setFlag?.(this.gardenPhoneTriggeredFlagKey, true);

    const direction = this.playerController?.commandController?.getLastDirection?.() || 'down';
    this.playerController?.setForcedAction?.('phone', direction);

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: GARDEN_TEXTS.phoneEvent.caller,
      dialogues: GARDEN_TEXTS.phoneEvent.dialogues,
      onComplete: () => {
        this.playerController?.clearForcedAction?.();
      }
    });
  }

  setupNPCs() {
    createGardnerAnimations(this);

    if (!this.ambientMobileNpcService) {
      this.ambientMobileNpcService = new AmbientMobileNpcService(this);
    }

    const jardineiro = NPCFactory.create(this, 360, 360, {
      id: 'npc_gardner',
      name: 'Gardner',
      texture: getGardnerTextureKey(),
      frame: 18,
      scale: 1,
      dialogues: [
        { text: 'Que dia lindo, não acha?', emotion: 'happy' },
        { text: 'Cuido deste jardim com muito carinho.', emotion: 'proud' },
        { text: 'Às vezes é bom relaxar um pouco.', emotion: 'peaceful' }
      ]
    });

    this.addCollisionsToSprite(jardineiro, false);
    this.gardnerCommandController = createCharacterCommandController(this, jardineiro, {
      resolveAnimation: resolveGardnerAnimation
    }, {
      defaultDirection: 'down'
    });

    this.ambientMobileNpcService.registerRandomWalker({
      sprite: jardineiro,
      controller: this.gardnerCommandController,
      home: { x: 320, y: 320 },
      roamRadius: 84,
      walkSpeed: 34,
      intervalMs: 2600,
      walkChance: 0.62,
      minWalkDistance: 8,
      idleActions: ['idle'],
      directions: ['right', 'up', 'left', 'down'],
      boundsResolver: () => ({
        minX: 0,
        minY: 0,
        maxX: this.map?.widthInPixels ?? 1024,
        maxY: this.map?.heightInPixels ?? 1024
      })
    });

    this.npcs = [jardineiro];
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 272,
        y: 505,
        width: 85,
        height: 15,
        label: 'ELEVADOR',
        indicatorColor: 0x66ccff,
        indicatorTextColor: '#66ccff',
        onInteract: () => this.transitionToElevator(),
        proximityDistance: 56
      })
    ];
  }

  transitionToElevator() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.ELEVATOR, {
        user: this.user,
        spawnPoint: 'fromGarden'
      });
    });
  }
}
