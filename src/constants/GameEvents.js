/**
 * GameEvents - Constantes centralizadas para eventos do jogo
 * 
 * Uso:
 *   import { GAME_EVENTS } from '../constants/GameEvents.js';
 *   this.game.events.emit(GAME_EVENTS.ROOM_CHANGED, sceneKey);
 */

// ============================================
// EVENTOS DE CENA / NAVEGAÇÃO
// ============================================

export const SCENE_EVENTS = Object.freeze({
  ROOM_CHANGED: 'room-changed',
  SCENE_READY: 'scene-ready',
  SCENE_TRANSITION_START: 'scene-transition-start',
  SCENE_TRANSITION_END: 'scene-transition-end'
});

// ============================================
// EVENTOS DE PLAYER
// ============================================

export const PLAYER_EVENTS = Object.freeze({
  MOVED: 'player-moved',
  STOPPED: 'player-stopped',
  DIRECTION_CHANGED: 'player-direction-changed',
  INTERACTED: 'player-interacted',
  DAMAGED: 'player-damaged',
  HEALED: 'player-healed'
});

// ============================================
// EVENTOS DE NPC
// ============================================

export const NPC_EVENTS = Object.freeze({
  INTERACTION_START: 'npc-interaction-start',
  INTERACTION_END: 'npc-interaction-end',
  DIALOGUE_START: 'npc-dialogue-start',
  DIALOGUE_END: 'npc-dialogue-end',
  PATROL_START: 'npc-patrol-start',
  PATROL_END: 'npc-patrol-end'
});

// ============================================
// EVENTOS DE MINIGAME
// ============================================

export const MINIGAME_EVENTS = Object.freeze({
  STARTED: 'minigame-started',
  COMPLETED: 'minigame-completed',
  FAILED: 'minigame-failed',
  PAUSED: 'minigame-paused',
  RESUMED: 'minigame-resumed',
  SCORE_CHANGED: 'minigame-score-changed',
  LEVEL_UP: 'minigame-level-up'
});

// ============================================
// EVENTOS DE UI
// ============================================

export const UI_EVENTS = Object.freeze({
  DIALOG_OPEN: 'ui-dialog-open',
  DIALOG_CLOSE: 'ui-dialog-close',
  MENU_OPEN: 'ui-menu-open',
  MENU_CLOSE: 'ui-menu-close',
  NOTIFICATION: 'ui-notification',
  TOOLTIP_SHOW: 'ui-tooltip-show',
  TOOLTIP_HIDE: 'ui-tooltip-hide'
});

// ============================================
// EVENTOS DE AUTENTICAÇÃO
// ============================================

export const AUTH_EVENTS = Object.freeze({
  LOGIN_START: 'auth-login-start',
  LOGIN_SUCCESS: 'auth-login-success',
  LOGIN_FAILED: 'auth-login-failed',
  LOGOUT: 'auth-logout',
  SESSION_EXPIRED: 'auth-session-expired'
});

// ============================================
// EVENTOS DE TELEMETRIA
// ============================================

export const TELEMETRY_EVENTS = Object.freeze({
  EVENT_TRACKED: 'telemetry-event-tracked',
  BATCH_SENT: 'telemetry-batch-sent',
  BATCH_FAILED: 'telemetry-batch-failed'
});

// ============================================
// TODOS OS EVENTOS (CONSOLIDADO)
// ============================================

export const GAME_EVENTS = Object.freeze({
  ...SCENE_EVENTS,
  ...PLAYER_EVENTS,
  ...NPC_EVENTS,
  ...MINIGAME_EVENTS,
  ...UI_EVENTS,
  ...AUTH_EVENTS,
  ...TELEMETRY_EVENTS
});

// ============================================
// EXPORT DEFAULT PARA COMPATIBILIDADE
// ============================================

export default GAME_EVENTS;
