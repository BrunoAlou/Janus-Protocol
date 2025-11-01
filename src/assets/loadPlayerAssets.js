// Loader helper for the player assets
export const PLAYER_TEXTURE_KEY = 'personagem';
export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 64;

export function loadPlayerAssets(scene) {
  scene.load.spritesheet(PLAYER_TEXTURE_KEY, './src/assets/leo.png', {
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT
  });
  console.log('[loadPlayerAssets] Loading leo.png with frame size', FRAME_WIDTH, 'x', FRAME_HEIGHT);
}

export default loadPlayerAssets;

