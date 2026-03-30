import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import {
  createBakerAnimations,
  getBakerTextureKey,
  loadBakerAssets,
  resolveBakerAnimation
} from '../../npcs/bakerAnimations.js';
import {
  createLouchGuyAnimations,
  getLouchGuyTextureKey,
  loadLouchGuyAssets,
  resolveLouchGuyAnimation
} from '../../npcs/louchGuyAnimations.js';
import { createCharacterCommandController } from '../../characters/CharacterCommandController.js';
import { AmbientMobileNpcService } from './services/npc/AmbientMobileNpcService.js';

/**
 * CoffeeRoomScene - Cena da cafeteria
 */
export default class CoffeeRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.COFFEE_ROOM, 'coffee');
    this.isTransitioning = false;
    this.useLegacyNpcInteractionManager = false;
    this.baker = null;
    this.bakerHome = { x: 320, y: 240 };
    this.bakerCommandController = null;
    this.ambientMobileNpcService = null;
  }

  init(data) {
    super.init(data);
    this.isTransitioning = false;
  }

  preload() {
    loadPlayerAssets(this);
    loadBakerAssets(this);
    loadLouchGuyAssets(this);
    preloadRegisteredTilesets(this);
    super.preload();
  }

  create() {
    super.create();
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
    return 400;
  }

  setupNPCs() {
    createBakerAnimations(this);
    createLouchGuyAnimations(this);

    if (!this.ambientMobileNpcService) {
      this.ambientMobileNpcService = new AmbientMobileNpcService(this);
    }

    const baker = NPCFactory.create(this, 320, 240, {
      name: 'Baker',
      texture: getBakerTextureKey(),
      frame: 18,
      scale: 1,
      dialogues: [
        { text: 'Bem-vindo a cafeteria!', emotion: 'happy' },
        { text: 'Hoje temos cafe fresco e pao quentinho.', emotion: 'friendly' }
      ]
    });

    this.applyBakerScaleRelativeToLeo(baker);
    
    // Aplicar mesmas colisões que o player respeita
    this.addCollisionsToSprite(baker, false);

    this.bakerCommandController = createCharacterCommandController(this, baker, {
      resolveAnimation: resolveBakerAnimation
    }, {
      defaultDirection: 'down'
    });

    this.ambientMobileNpcService.registerRandomWalker({
      sprite: baker,
      controller: this.bakerCommandController,
      home: this.bakerHome,
      roamRadius: 96,
      walkSpeed: 36,
      intervalMs: 2800,
      walkChance: 0.65,
      minWalkDistance: 8,
      idleActions: ['idle', 'read', 'lift'],
      directions: ['right', 'up', 'left', 'down'],
      boundsResolver: () => ({
        minX: 0,
        minY: 0,
        maxX: this.map?.widthInPixels ?? 1024,
        maxY: this.map?.heightInPixels ?? 1024
      })
    });

    this.baker = baker;

    const louchGuy = NPCFactory.create(this, 215, 358, {
      id: 'npc_louch_guy',
      name: 'Louch Guy',
      texture: getLouchGuyTextureKey(),
      frame: 9,
      scale: 1,
      dialogues: [
        { text: 'Esse cafe ajuda a organizar as ideias.', emotion: 'neutral' }
      ]
    });

    this.addCollisionsToSprite(louchGuy, false);

    const louchGuyController = createCharacterCommandController(this, louchGuy, {
      resolveAnimation: resolveLouchGuyAnimation
    }, {
      defaultDirection: 'down'
    });

    louchGuyController.execute({ action: 'sit', direction: 'right' });

    this.npcs = [
      baker,
      louchGuy
    ];
  }

  applyBakerScaleRelativeToLeo(bakerSprite) {
    const playerScale = this.player?.scaleX ?? 1;
    bakerSprite.setScale(playerScale);
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 256,
        y: 40,
        width: 78,
        height: 52,
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
        spawnPoint: 'fromCoffeeRoom'
      });
    });
  }
}
