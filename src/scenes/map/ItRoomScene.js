import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * ItRoomScene - Sala de TI / Informática
 */
export default class ItRoomScene extends BaseMapScene {
  constructor() {
    super('ItRoomScene', 'it_room');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 200, 200, {
        name: 'Técnico de TI',
        texture: 'npc_default',
        dialogues: [
          { text: 'Olá! Precisa de suporte técnico?', emotion: 'friendly' },
          { text: 'Estou aqui para resolver problemas de sistemas.', emotion: 'professional' },
          { text: 'Quer testar um puzzle de lógica?', emotion: 'excited' }
        ]
      }),
      
      NPCFactory.create(this, 440, 250, {
        name: 'Estagiário',
        texture: 'npc_default',
        dialogues: [
          { text: 'Oi! Também sou novo por aqui.', emotion: 'happy' },
          { text: 'Estou aprendendo muito!', emotion: 'excited' }
        ]
      })
    ];
  }
}
