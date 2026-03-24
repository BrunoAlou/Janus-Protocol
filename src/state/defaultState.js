import { SCENE_NAMES } from '../constants/SceneNames.js';

/**
 * Base default state used to initialize/reset GameStateManager.
 * @returns {Object}
 */
export function createDefaultState() {
  return {
    auth: {
      isAuthenticated: false,
      user: null,
      provider: null
    },
    scenes: {
      current: SCENE_NAMES.LOGIN,
      previous: null,
      active: []
    },
    minigame: {
      active: null,
      score: 0,
      completed: false,
      stats: {}
    },
    settings: {
      volume: 1,
      difficulty: 'normal',
      musicEnabled: true,
      sfxEnabled: true
    },
    player: {
      position: { x: 0, y: 0 },
      inventory: {},
      quests: {},
      stats: {},
      flags: {
        contacted_receptionist: false,
        reception_intro_modal_seen: false,
        reception_intro_dialog_seen: false,
        reception_intro_modal_active: false,
        reception_intro_dialog_active: false,
        resetgame: true
      },
      lastLocation: null,
      lastPosition: null
    }
  };
}
