import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';

/**
 * BossRoomScene - Sala do Chefe / Diretor
 */
export default class BossRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.BOSS_ROOM, 'boss-room');
  }

  preload() {
    loadPlayerAssets(this);
    preloadRegisteredTilesets(this);
    super.preload();
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 420;
  }

  setupNPCs() {
    const diretor = NPCFactory.create(this, 320, 180, {
      name: 'Diretor',
      texture: 'npc_default',
      scale: 2.5,
      dialogues: [
        { text: 'Bem-vindo à minha sala.', emotion: 'serious' },
        { text: 'Vim aqui para ver seu progresso.', emotion: 'professional' },
        { text: 'Você tem se dedicado ao treinamento?', emotion: 'questioning' },
        { text: 'Continue assim e terá um futuro brilhante aqui.', emotion: 'proud' }
      ]
    });

    this.addCollisionsToSprite(diretor, false);
    this.npcs = [diretor];
  }
}
