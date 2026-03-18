import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import {
  createBakerAnimations,
  getBakerTextureKey,
  loadBakerAssets,
  resolveBakerAnimation
} from '../../npcs/bakerAnimations.js';
import { createCharacterCommandController } from '../../characters/CharacterCommandController.js';

/**
 * CoffeeRoomScene - Cena da cafeteria
 */
export default class CoffeeRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.COFFEE_ROOM, 'coffee');
    this.baker = null;
    this.bakerHome = { x: 320, y: 240 };
    this.bakerCommandController = null;
  }

  preload() {
    loadPlayerAssets(this);
    loadBakerAssets(this);
    preloadRegisteredTilesets(this);
    this.load.tilemapTiledJSON('coffee', '/src/assets/coffee.json');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    createBakerAnimations(this);

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

    this.startBakerAmbientBehavior(baker);
    this.baker = baker;

    this.npcs = [
      baker
    ];
  }

  applyBakerScaleRelativeToLeo(bakerSprite) {
    const playerScale = this.player?.scaleX ?? 1;
    bakerSprite.setScale(playerScale);
  }

  startBakerAmbientBehavior(bakerSprite) {
    this.playBakerStationaryAction(bakerSprite);

    this.time.addEvent({
      delay: 2800,
      loop: true,
      callback: () => {
        if (!bakerSprite?.active || bakerSprite._isWalking) {
          return;
        }

        const shouldWalk = Math.random() < 0.65;
        if (shouldWalk) {
          this.moveBakerRandomly(bakerSprite);
          return;
        }

        this.playBakerStationaryAction(bakerSprite);
      }
    });
  }

  moveBakerRandomly(bakerSprite) {
    const maxOffset = 96;
    const minX = 0;
    const minY = 0;
    const maxX = this.map?.widthInPixels ?? 1024;
    const maxY = this.map?.heightInPixels ?? 1024;

    const targetX = Math.max(minX, Math.min(maxX, this.bakerHome.x + (Math.random() * maxOffset * 2 - maxOffset)));
    const targetY = Math.max(minY, Math.min(maxY, this.bakerHome.y + (Math.random() * maxOffset * 2 - maxOffset)));

    const distance = Math.hypot(targetX - bakerSprite.x, targetY - bakerSprite.y);
    if (distance < 8) {
      this.playBakerStationaryAction(bakerSprite);
      return;
    }

    const speed = 36;
    const result = this.bakerCommandController.execute({
      action: 'walk',
      target: { x: targetX, y: targetY },
      speed
    });

    bakerSprite._isWalking = true;

    this.time.delayedCall(Math.max(600, result.estimatedDurationMs), () => {
      if (!bakerSprite?.active) {
        return;
      }

      bakerSprite.setVelocity(0, 0);
      bakerSprite._isWalking = false;
      this.playBakerStationaryAction(bakerSprite);
    });
  }

  playBakerStationaryAction(bakerSprite) {
    const actions = ['idle', 'read', 'lift'];
    const directions = ['right', 'up', 'left', 'down'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    this.bakerCommandController.execute({
      action,
      direction
    });
  }
}
