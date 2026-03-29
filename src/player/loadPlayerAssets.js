import { resolveAssetPath } from '../utils/AssetResolver.js';

// Texture keys for player animations
export const PLAYER_TEXTURE_WALK = 'player_walk';
export const PLAYER_TEXTURE_IDLE = 'player_idle';
export const PLAYER_TEXTURE_LIFT = 'player_lift';
export const PLAYER_TEXTURE_PHONE = 'player_phone';
export const PLAYER_TEXTURE_PICKUP = 'player_pickup';
export const PLAYER_TEXTURE_READ = 'player_read';
export const PLAYER_TEXTURE_SIT = 'player_sit';
export const PLAYER_TEXTURE_THROW = 'player_throw';

// Legacy key for backwards compatibility (if needed)
export const PLAYER_TEXTURE_KEY = 'leo';
export const FRAME_WIDTH = 32;
export const FRAME_HEIGHT = 64;

/**
 * Load all player animation assets (leo_2 spritesheets)
 * @param {Phaser.Scene} scene - The scene to load assets into
 */
export function loadPlayerAssets(scene) {
  const animations = [
    { key: PLAYER_TEXTURE_WALK, file: 'player/player_walk' },
    { key: PLAYER_TEXTURE_IDLE, file: 'player/player_idle' },
    { key: PLAYER_TEXTURE_LIFT, file: 'player/player_lift' },
    { key: PLAYER_TEXTURE_PHONE, file: 'player/player_phone' },
    { key: PLAYER_TEXTURE_PICKUP, file: 'player/player_pickup' },
    { key: PLAYER_TEXTURE_READ, file: 'player/player_read' },
    { key: PLAYER_TEXTURE_SIT, file: 'player/player_sit' },
    { key: PLAYER_TEXTURE_THROW, file: 'player/player_throw' }
  ];

  animations.forEach(anim => {
    scene.load.atlas(
      anim.key,
      resolveAssetPath(`${anim.file}.png`),
      resolveAssetPath(`${anim.file}_atlas.json`)
    );
  });

  console.log('[loadPlayerAssets] Loading player animations from assets/player (32x64 frames)');
}

export default loadPlayerAssets;

