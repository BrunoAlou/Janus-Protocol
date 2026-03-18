import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';

/**
 * GardenScene - Jardim / Área Externa
 */
export default class GardenScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.GARDEN, 'garden');
  }

  preload() {
    loadPlayerAssets(this);
    preloadRegisteredTilesets(this);
    this.load.tilemapTiledJSON('garden', '/src/assets/garden.json');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    const jardineiro = NPCFactory.create(this, 400, 250, {
      name: 'Jardineiro',
      texture: 'npc_default',
      dialogues: [
        { text: 'Que dia lindo, não acha?', emotion: 'happy' },
        { text: 'Cuido deste jardim com muito carinho.', emotion: 'proud' },
        { text: 'Às vezes é bom relaxar um pouco.', emotion: 'peaceful' }
      ]
    });

    this.addCollisionsToSprite(jardineiro, false);
    this.npcs = [jardineiro];
  }
}
