import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';

/**
 * OfficeScene - Exemplo de cena de escritório
 */
export default class OfficeScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.OFFICE, 'office'); // key da cena, key do mapa
  }

  getSpawnX() {
    return 320; // Posição específica para este mapa
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    const gerente = NPCFactory.create(this, 200, 200, {
      ...NPCFactory.templates.manager,
      dialogues: [
        { text: 'Bem-vindo ao escritório!', emotion: 'happy' },
        { text: 'Aqui você pode acessar os relatórios.', emotion: 'professional' }
      ]
    });
    
    const colega = NPCFactory.create(this, 400, 300, {
      name: 'Colega',
      texture: 'npc_default',
      dialogues: [
        { text: 'Oi! Como vai o treinamento?', emotion: 'friendly' },
        { text: 'Qualquer coisa me avise!', emotion: 'happy' }
      ]
    });

    this.addCollisionsToSprite(gerente, false);
    this.addCollisionsToSprite(colega, false);
    this.npcs = [gerente, colega];

    console.log('[OfficeScene] Created', this.npcs.length, 'NPCs');
  }
}
