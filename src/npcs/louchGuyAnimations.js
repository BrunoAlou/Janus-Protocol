const LOUCH_GUY_FRAME_WIDTH = 32;
const LOUCH_GUY_FRAME_HEIGHT = 64;

const LOUCH_GUY_TEXTURE_KEY = 'louch_guy_sit_sheet';

const DIRECTION_OFFSETS = Object.freeze({
  right: 0,
  up: 1,
  left: 2,
  down: 3
});

const LOUCH_GUY_ANIM_MAP = Object.freeze({
  sit: Object.freeze({
    right: 'louch_guy_sit_right',
    up: 'louch_guy_sit_up',
    left: 'louch_guy_sit_left',
    down: 'louch_guy_sit_down'
  })
});

export function loadLouchGuyAssets(scene) {
  scene.load.spritesheet(LOUCH_GUY_TEXTURE_KEY, new URL('../assets/louch-guy/louch_guy_sit.png', import.meta.url).href, {
    frameWidth: LOUCH_GUY_FRAME_WIDTH,
    frameHeight: LOUCH_GUY_FRAME_HEIGHT
  });
}

export function createLouchGuyAnimations(scene) {
  Object.entries(DIRECTION_OFFSETS).forEach(([direction, offset]) => {
    const key = LOUCH_GUY_ANIM_MAP.sit[direction];
    if (scene.anims.exists(key)) {
      return;
    }

    const start = offset * 3;
    const end = start + 2;

    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(LOUCH_GUY_TEXTURE_KEY, { start, end }),
      frameRate: 5,
      repeat: -1
    });
  });
}

export function resolveLouchGuyAnimation(action = 'sit', direction = 'down') {
  const directionKey = (direction || 'down').toLowerCase();
  return LOUCH_GUY_ANIM_MAP.sit[directionKey] || LOUCH_GUY_ANIM_MAP.sit.down;
}

export function getLouchGuyTextureKey() {
  return LOUCH_GUY_TEXTURE_KEY;
}
