import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import {
  createBossAnimations,
  getBossTextureKey,
  loadBossAssets,
  resolveBossAnimation
} from '../../npcs/bossAnimations.js';
import { createCharacterCommandController } from '../../characters/CharacterCommandController.js';

/**
 * BossRoomScene - Sala do Chefe / Diretor
 */
export default class BossRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.BOSS_ROOM, 'boss-room');
    this.isTransitioning = false;
    this.bossCommandController = null;
    this.bossAmbientTimer = null;
  }

  init(data) {
    super.init(data);
    this.isTransitioning = false;
  }

  preload() {
    loadPlayerAssets(this);
    loadBossAssets(this);
    preloadRegisteredTilesets(this);
    super.preload();
  }

  create() {
    super.create();
    window.gameState?.setFlag?.('objective_talk_to_boss_evidence', true);
    this.setupDoorTransitions();
    this.registerDoorZonesToDebugger();
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
    return 420;
  }

  setupNPCs() {
    createBossAnimations(this);

    const diretor = NPCFactory.create(this, 320, 180, {
      id: 'npc_boss',
      name: 'Diretor',
      texture: getBossTextureKey(),
      frame: 18,
      scale: 1,
      dialogues: [
        { text: 'Bem-vindo à minha sala.', emotion: 'serious' },
        { text: 'Vim aqui para ver seu progresso.', emotion: 'professional' },
        { text: 'Você tem se dedicado ao treinamento?', emotion: 'questioning' },
        { text: 'Continue assim e terá um futuro brilhante aqui.', emotion: 'proud' }
      ]
    });

    this.addCollisionsToSprite(diretor, false);
    this.bossCommandController = createCharacterCommandController(this, diretor, {
      resolveAnimation: resolveBossAnimation
    }, {
      defaultDirection: 'left'
    });

    this.bossCommandController.execute({ action: 'idle_phone', direction: 'left' });

    this.bossAmbientTimer?.remove?.();
    this.bossAmbientTimer = this.time.addEvent({
      delay: 5200,
      loop: true,
      callback: () => {
        if (!diretor?.active) {
          return;
        }

        const nextAction = Math.random() < 0.45 ? 'idle' : 'idle_phone';
        this.bossCommandController.execute({ action: nextAction, direction: 'left' });
      }
    });

    this.npcs = [diretor];
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 254,
        y: 42,
        width: 76,
        height: 54,
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
        spawnPoint: 'fromBossRoom'
      });
    });
  }
}
