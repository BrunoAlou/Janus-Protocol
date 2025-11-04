import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * RhRoomScene - Sala de RH / Recursos Humanos
 */
export default class RhRoomScene extends BaseMapScene {
  constructor() {
    super('RhRoomScene', 'rh_room');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 320, 220, {
        name: 'Gerente de RH',
        texture: 'npc_default',
        dialogues: [
          { text: 'Bem-vindo ao setor de Recursos Humanos!', emotion: 'professional' },
          { text: 'Aqui cuidamos do bem-estar dos funcionários.', emotion: 'happy' },
          { text: 'Precisa de alguma orientação?', emotion: 'neutral' }
        ]
      }),
      
      NPCFactory.create(this, 180, 280, {
        name: 'Assistente de RH',
        texture: 'npc_default',
        dialogues: [
          { text: 'Olá! Posso ajudar com documentação?', emotion: 'friendly' },
          { text: 'Estou aqui para auxiliar!', emotion: 'happy' }
        ]
      })
    ];
  }
}
