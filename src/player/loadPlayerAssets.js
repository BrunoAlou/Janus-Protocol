// Loader helper for the player assets
export const PLAYER_TEXTURE_KEY = 'leo';
export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 64;

export function loadPlayerAssets(scene) {
  scene.load.atlas(
    PLAYER_TEXTURE_KEY,
    './src/assets/leo.png',
    './src/assets/leo_atlas.json'
  );
  console.log('[loadPlayerAssets] Loading leo.png atlas with frame size', FRAME_WIDTH, 'x', FRAME_HEIGHT);
}

export default loadPlayerAssets;

