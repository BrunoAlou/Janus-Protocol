import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';

/**
 * GardenScene - Jardim / Área Externa
 */
export default class GardenScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.GARDEN, 'garden');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 400, 250, {
        name: 'Jardineiro',
        texture: 'npc_default',
        dialogues: [
          { text: 'Que dia lindo, não acha?', emotion: 'happy' },
          { text: 'Cuido deste jardim com muito carinho.', emotion: 'proud' },
          { text: 'Às vezes é bom relaxar um pouco.', emotion: 'peaceful' }
        ]
      })
    ];
  }
}
