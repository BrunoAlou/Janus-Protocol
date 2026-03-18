/**
 * SceneNames - Constantes centralizadas para nomes de cenas
 * 
 * Uso:
 *   import { SCENE_NAMES, MAP_SCENES, MINIGAME_SCENES } from '../constants/SceneNames.js';
 *   window.sceneManager.goToMap(SCENE_NAMES.OFFICE);
 */

// ============================================
// NOMES DE CENAS
// ============================================

export const SCENE_NAMES = Object.freeze({
  // Sistema
  LOGIN: 'LoginScene',
  UI: 'UIScene',
  DIALOG: 'DialogScene',
  PAUSE_MENU: 'PauseMenuScene',
  MINIMAP: 'MinimapScene',
  MINIGAME_MENU: 'MinigameMenuScene',
  
  // Mapas
  RECEPTION: 'ReceptionScene',
  OFFICE: 'OfficeScene',
  LAB: 'LabScene',
  MEETING_ROOM: 'MeetingRoomScene',
  ARCHIVE_ROOM: 'ArchiveRoomScene',
  IT_ROOM: 'ItRoomScene',
  RH_ROOM: 'RhRoomScene',
  ELEVATOR: 'ElevatorScene',
  GARDEN: 'GardenScene',
  COFFEE_ROOM: 'CoffeeRoomScene',
  BOSS_ROOM: 'BossRoomScene',
  HALLWAY: 'HallwayScene',
  
  // Minigames
  PUZZLE: 'PuzzleGame',
  QUIZ: 'QuizGame',
  MEMORY: 'MemoryGame',
  TYPING: 'TypingGame',
  WHACK_A_MOLE: 'WhackAMoleGame',
  TETRIS: 'TetrisGame',
  SNAKE: 'SnakeGame'
});

// ============================================
// CATEGORIAS DE CENAS
// ============================================

export const SYSTEM_SCENES = Object.freeze([
  SCENE_NAMES.UI,
  SCENE_NAMES.DIALOG,
  SCENE_NAMES.PAUSE_MENU,
  SCENE_NAMES.MINIMAP,
  SCENE_NAMES.MINIGAME_MENU
]);

export const AUTH_SCENES = Object.freeze([
  SCENE_NAMES.LOGIN
]);

export const MAP_SCENES = Object.freeze([
  SCENE_NAMES.RECEPTION,
  SCENE_NAMES.OFFICE,
  SCENE_NAMES.LAB,
  SCENE_NAMES.MEETING_ROOM,
  SCENE_NAMES.ARCHIVE_ROOM,
  SCENE_NAMES.IT_ROOM,
  SCENE_NAMES.RH_ROOM,
  SCENE_NAMES.ELEVATOR,
  SCENE_NAMES.GARDEN,
  SCENE_NAMES.COFFEE_ROOM,
  SCENE_NAMES.BOSS_ROOM,
  SCENE_NAMES.HALLWAY
]);

export const MINIGAME_SCENES = Object.freeze([
  SCENE_NAMES.PUZZLE,
  SCENE_NAMES.QUIZ,
  SCENE_NAMES.MEMORY,
  SCENE_NAMES.TYPING,
  SCENE_NAMES.WHACK_A_MOLE,
  SCENE_NAMES.TETRIS,
  SCENE_NAMES.SNAKE
]);

// ============================================
// VALIDADORES
// ============================================

/**
 * Verifica se uma string é um nome de cena válido
 * @param {string} name - Nome a verificar
 * @returns {boolean}
 */
export function isValidSceneName(name) {
  return Object.values(SCENE_NAMES).includes(name);
}

/**
 * Verifica se é uma cena de mapa
 * @param {string} name - Nome da cena
 * @returns {boolean}
 */
export function isMapScene(name) {
  return MAP_SCENES.includes(name);
}

/**
 * Verifica se é um minigame
 * @param {string} name - Nome da cena
 * @returns {boolean}
 */
export function isMinigameScene(name) {
  return MINIGAME_SCENES.includes(name);
}

/**
 * Verifica se é uma cena de sistema
 * @param {string} name - Nome da cena
 * @returns {boolean}
 */
export function isSystemScene(name) {
  return SYSTEM_SCENES.includes(name);
}

// ============================================
// EXPORT DEFAULT PARA COMPATIBILIDADE
// ============================================

export default SCENE_NAMES;
