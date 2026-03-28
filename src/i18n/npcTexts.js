import { NPC_DEFAULT_TEXTS } from './npcs/npcDefaults.js';
import {
  RECEPTIONIST_TEMPLATE_TEXTS,
  RECEPTIONIST_RECEPTION_TEXTS
} from './npcs/receptionistTexts.js';
import { CAIO_RECEPTION_TEXTS } from './npcs/caioTexts.js';
import { MANAGER_TEMPLATE_TEXTS } from './npcs/managerTexts.js';
import { TRAINER_TEMPLATE_TEXTS } from './npcs/trainerTexts.js';
import {
  IT_ROOM_JOURNEY_TEXTS,
  IT_ROOM_NPC_DIALOGUES,
  IT_ROOM_UI_TEXTS
} from './npcs/itRoomTexts.js';

export const NPC_TEXTS = {
  defaults: NPC_DEFAULT_TEXTS,
  templates: {
    receptionist: RECEPTIONIST_TEMPLATE_TEXTS,
    manager: MANAGER_TEMPLATE_TEXTS,
    trainer: TRAINER_TEMPLATE_TEXTS
  },
  reception: {
    receptionist: RECEPTIONIST_RECEPTION_TEXTS,
    caio: CAIO_RECEPTION_TEXTS
  },
  itRoom: {
    dialogues: IT_ROOM_NPC_DIALOGUES,
    journey: IT_ROOM_JOURNEY_TEXTS,
    ui: IT_ROOM_UI_TEXTS
  }
};
