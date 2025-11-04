import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * LabScene - Laboratório / Sala de Tecnologia
 */
export default class LabScene extends BaseMapScene {
  constructor() {
    super('LabScene', 'lab');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 250, 250, {
        name: 'Cientista',
        texture: 'npc_default',
        dialogues: [
          { text: 'Bem-vindo ao laboratório!', emotion: 'excited' },
          { text: 'Aqui testamos novas tecnologias.', emotion: 'professional' },
          { text: 'Quer fazer um teste de digitação?', emotion: 'happy' }
        ]
      })
    ];
  }
}
