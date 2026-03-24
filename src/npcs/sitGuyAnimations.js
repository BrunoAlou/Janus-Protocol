const SIT_GUY_FRAME_WIDTH = 32;
const SIT_GUY_FRAME_HEIGHT = 64;

const SIT_GUY_TEXTURE_KEY = 'sit_guy_reception';

export const SIT_GUY_ANIMS = Object.freeze({
  SIT: 'sit_guy_sit'
});

export function loadSitGuyAssets(scene) {
  scene.load.spritesheet(
    SIT_GUY_TEXTURE_KEY,
    new URL('../assets/sitguy_reception/sitguy_sit.png', import.meta.url).href,
    {
      frameWidth: SIT_GUY_FRAME_WIDTH,
      frameHeight: SIT_GUY_FRAME_HEIGHT
    }
  );
}

export function createSitGuyAnimations(scene) {
  if (scene.anims.exists(SIT_GUY_ANIMS.SIT)) {
    return;
  }

  scene.anims.create({
    key: SIT_GUY_ANIMS.SIT,
    // Mantem apenas a sequencia voltada para a direita.
    frames: scene.anims.generateFrameNumbers(SIT_GUY_TEXTURE_KEY, { start: 0, end: 2 }),
    frameRate: 8,
    repeat: -1
  });
}

export function resolveSitGuyAnimation(_action = 'sit', _direction = 'down') {
  return SIT_GUY_ANIMS.SIT;
}

export function getSitGuyTextureKey() {
  return SIT_GUY_TEXTURE_KEY;
}
