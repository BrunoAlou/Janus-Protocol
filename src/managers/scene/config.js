import { SCENE_NAMES } from '../../constants/SceneNames.js';

export function createMapConfig() {
  return {
    [SCENE_NAMES.RECEPTION]: { sceneKey: SCENE_NAMES.RECEPTION, mapKey: 'reception' },
    [SCENE_NAMES.OFFICE]: { sceneKey: SCENE_NAMES.OFFICE, mapKey: 'office' },
    [SCENE_NAMES.LAB]: { sceneKey: SCENE_NAMES.LAB, mapKey: 'lab' },
    [SCENE_NAMES.MEETING_ROOM]: { sceneKey: SCENE_NAMES.MEETING_ROOM, mapKey: 'meeting-room' },
    [SCENE_NAMES.ARCHIVE_ROOM]: { sceneKey: SCENE_NAMES.ARCHIVE_ROOM, mapKey: 'archive-room' },
    [SCENE_NAMES.IT_ROOM]: { sceneKey: SCENE_NAMES.IT_ROOM, mapKey: 'it-room' },
    [SCENE_NAMES.RH_ROOM]: { sceneKey: SCENE_NAMES.RH_ROOM, mapKey: 'rh-room' },
    [SCENE_NAMES.ELEVATOR]: { sceneKey: SCENE_NAMES.ELEVATOR, mapKey: 'elevator' },
    [SCENE_NAMES.GARDEN]: { sceneKey: SCENE_NAMES.GARDEN, mapKey: 'garden' },
    [SCENE_NAMES.COFFEE_ROOM]: { sceneKey: SCENE_NAMES.COFFEE_ROOM, mapKey: 'coffee' },
    [SCENE_NAMES.BOSS_ROOM]: { sceneKey: SCENE_NAMES.BOSS_ROOM, mapKey: 'boss-room' }
  };
}

export function createSceneCategories(mapConfig) {
  return {
    system: [SCENE_NAMES.UI, SCENE_NAMES.DIALOG, SCENE_NAMES.PAUSE_MENU, SCENE_NAMES.MINIMAP],
    auth: [SCENE_NAMES.LOGIN],
    map: Object.keys(mapConfig),
    minigame: [
      SCENE_NAMES.PUZZLE,
      SCENE_NAMES.QUIZ,
      SCENE_NAMES.MEMORY,
      SCENE_NAMES.TYPING,
      SCENE_NAMES.WHACK_A_MOLE,
      SCENE_NAMES.TETRIS,
      SCENE_NAMES.SNAKE
    ]
  };
}
