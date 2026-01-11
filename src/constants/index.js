/**
 * Constantes centralizadas do Janus-Protocol
 * 
 * Uso:
 *   import { SCENE_NAMES, GAME_EVENTS, MAP_ASSETS } from './constants/index.js';
 */

// Re-exportar tudo
export * from './SceneNames.js';
export * from './GameEvents.js';
export * from './MapAssets.js';

// Imports para default exports
import SCENE_NAMES from './SceneNames.js';
import GAME_EVENTS from './GameEvents.js';
import MAP_ASSETS from './MapAssets.js';

// Export consolidado
export default {
  SCENE_NAMES,
  GAME_EVENTS,
  MAP_ASSETS
};
