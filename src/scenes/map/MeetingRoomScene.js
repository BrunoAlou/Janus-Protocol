import BaseMapScene from './BaseMapScene.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * MeetingRoomScene - Sala de Reuniões
 */
export default class MeetingRoomScene extends BaseMapScene {
  constructor() {
    super('MeetingRoomScene', 'meeting_room');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 400;
  }

  setupNPCs() {
    this.npcs = [
      NPCFactory.create(this, 320, 200, {
        ...NPCFactory.templates.manager,
        dialogues: [
          { text: 'Esta é nossa sala de reuniões.', emotion: 'professional' },
          { text: 'Aqui discutimos estratégias importantes.', emotion: 'neutral' }
        ]
      })
    ];
  }
}
