/**
 * MapAssets - Configuração centralizada de assets de mapas
 * 
 * Uso:
 *   import { MAP_ASSETS, getMapAsset, getResolvedMapPath } from '../constants/MapAssets.js';
 *   const config = getMapAsset('ReceptionScene');
 *   const url = getResolvedMapPath('ReceptionScene');
 */

import { SCENE_NAMES } from './SceneNames.js';
import { resolveMapPath } from '../utils/AssetResolver.js';

// ============================================
// CONFIGURAÇÃO DE MAPAS
// ============================================

export const MAP_ASSETS = Object.freeze({
  [SCENE_NAMES.RECEPTION]: {
    sceneKey: SCENE_NAMES.RECEPTION,
    mapKey: 'reception',
    path: './src/assets/reception.json',
    displayName: 'Recepção',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.OFFICE]: {
    sceneKey: SCENE_NAMES.OFFICE,
    mapKey: 'office',
    path: './src/assets/office.json',
    displayName: 'Escritório',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.LAB]: {
    sceneKey: SCENE_NAMES.LAB,
    mapKey: 'lab',
    path: './src/assets/lab.json',
    displayName: 'Laboratório',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.MEETING_ROOM]: {
    sceneKey: SCENE_NAMES.MEETING_ROOM,
    mapKey: 'meeting-room',
    path: './src/assets/meeting-room.json',
    displayName: 'Sala de Reunião',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.ARCHIVE_ROOM]: {
    sceneKey: SCENE_NAMES.ARCHIVE_ROOM,
    mapKey: 'archive-room',
    path: './src/assets/archive-room.json',
    displayName: 'Arquivo',
    spawnX: 21,
    spawnY: 240
  },
  
  [SCENE_NAMES.IT_ROOM]: {
    sceneKey: SCENE_NAMES.IT_ROOM,
    mapKey: 'Ti',
    path: './src/assets/Ti.json',
    displayName: 'Sala de TI',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.RH_ROOM]: {
    sceneKey: SCENE_NAMES.RH_ROOM,
    mapKey: 'rh-room',
    path: './src/assets/rh-room.json',
    displayName: 'Recursos Humanos',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.ELEVATOR]: {
    sceneKey: SCENE_NAMES.ELEVATOR,
    mapKey: 'elevator',
    path: './src/assets/elevator.json',
    displayName: 'Elevador',
    spawnX: 320,
    spawnY: 300
  },
  
  [SCENE_NAMES.GARDEN]: {
    sceneKey: SCENE_NAMES.GARDEN,
    mapKey: 'garden',
    path: './src/assets/garden.json',
    displayName: 'Jardim',
    spawnX: 320,
    spawnY: 400
  },

  [SCENE_NAMES.COFFEE_ROOM]: {
    sceneKey: SCENE_NAMES.COFFEE_ROOM,
    mapKey: 'coffee',
    path: './src/assets/coffee.json',
    displayName: 'Cafeteria',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.BOSS_ROOM]: {
    sceneKey: SCENE_NAMES.BOSS_ROOM,
    mapKey: 'boss-room',
    path: './src/assets/boss-room.json',
    displayName: 'Sala do Chefe',
    spawnX: 320,
    spawnY: 400
  },
  
  [SCENE_NAMES.HALLWAY]: {
    sceneKey: SCENE_NAMES.HALLWAY,
    mapKey: 'hallway',
    path: './src/assets/hallway.json',
    displayName: 'Corredor',
    spawnX: 21,
    spawnY: 240
  }
});

// ============================================
// HELPERS
// ============================================

/**
 * Obtém configuração de um mapa por sceneKey
 * @param {string} sceneKey - Chave da cena
 * @returns {Object|null}
 */
export function getMapAsset(sceneKey) {
  return MAP_ASSETS[sceneKey] || null;
}

/**
 * Obtém todas as chaves de mapas disponíveis
 * @returns {string[]}
 */
export function getAvailableMapKeys() {
  return Object.keys(MAP_ASSETS);
}

/**
 * Obtém o path do JSON de um mapa
 * @param {string} sceneKey - Chave da cena
 * @returns {string|null}
 */
export function getMapPath(sceneKey) {
  return MAP_ASSETS[sceneKey]?.path || null;
}

/**
 * Obtém o path resolvido (URL completa) do JSON de um mapa
 * Funciona com Vite e GitHub Pages
 * @param {string} sceneKey - Chave da cena
 * @returns {string|null}
 */
export function getResolvedMapPath(sceneKey) {
  const asset = MAP_ASSETS[sceneKey];
  if (!asset) return null;
  // Extract just the filename from the path
  const match = asset.path.match(/\/([^/]+\.json)$/);
  if (!match) return null;
  return resolveMapPath(match[1]);
}

/**
 * Obtém a posição de spawn de um mapa
 * @param {string} sceneKey - Chave da cena
 * @returns {{x: number, y: number}|null}
 */
export function getSpawnPosition(sceneKey) {
  const asset = MAP_ASSETS[sceneKey];
  if (!asset) return null;
  return { x: asset.spawnX, y: asset.spawnY };
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default MAP_ASSETS;
