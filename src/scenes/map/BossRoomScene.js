import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * BossRoomScene - Sala do Chefe / Diretor
 */
export default class BossRoomScene extends BaseMapScene {
  constructor() {
    super('BossRoomScene', 'boss_room');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 420;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 320, 180, {
        name: 'Diretor',
        texture: 'npc_default',
        scale: 2.5, // Um pouco maior que os outros
        dialogues: [
          { text: 'Bem-vindo à minha sala.', emotion: 'serious' },
          { text: 'Vim aqui para ver seu progresso.', emotion: 'professional' },
          { text: 'Você tem se dedicado ao treinamento?', emotion: 'questioning' },
          { text: 'Continue assim e terá um futuro brilhante aqui.', emotion: 'proud' }
        ]
      })
    ];
  }
}
