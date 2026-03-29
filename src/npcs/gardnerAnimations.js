const GARDNER_FRAME_WIDTH = 32;
const GARDNER_FRAME_HEIGHT = 64;

const GARDNER_TEXTURE_KEYS = Object.freeze({
  idle: 'gardner_idle_sheet',
  walk: 'gardner_walk_sheet'
});

const DIRECTION_OFFSETS = Object.freeze({
  right: 0,
  up: 1,
  left: 2,
  down: 3
});

const GARDNER_ANIM_MAP = Object.freeze({
  walk: Object.freeze({
    right: 'gardner_walk_right',
    up: 'gardner_walk_up',
    left: 'gardner_walk_left',
    down: 'gardner_walk_down'
  }),
  idle: Object.freeze({
    right: 'gardner_idle_right',
    up: 'gardner_idle_up',
    left: 'gardner_idle_left',
    down: 'gardner_idle_down'
  })
});

function createDirectionalSet(scene, action, textureKey, framesPerDirection, frameRate) {
  Object.entries(DIRECTION_OFFSETS).forEach(([direction, offset]) => {
    const animKey = GARDNER_ANIM_MAP[action][direction];
    if (scene.anims.exists(animKey)) {
      return;
    }

    const start = offset * framesPerDirection;
    const end = start + framesPerDirection - 1;

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate,
      repeat: -1
    });
  });
}

export function loadGardnerAssets(scene) {
  scene.load.spritesheet(GARDNER_TEXTURE_KEYS.idle, new URL('../assets/gardner/gardner_idle.png', import.meta.url).href, {
    frameWidth: GARDNER_FRAME_WIDTH,
    frameHeight: GARDNER_FRAME_HEIGHT
  });

  scene.load.spritesheet(GARDNER_TEXTURE_KEYS.walk, new URL('../assets/gardner/gardner_walk.png', import.meta.url).href, {
    frameWidth: GARDNER_FRAME_WIDTH,
    frameHeight: GARDNER_FRAME_HEIGHT
  });
}

export function createGardnerAnimations(scene) {
  createDirectionalSet(scene, 'idle', GARDNER_TEXTURE_KEYS.idle, 6, 6);
  createDirectionalSet(scene, 'walk', GARDNER_TEXTURE_KEYS.walk, 6, 10);
}

export function resolveGardnerAnimation(action = 'idle', direction = 'down') {
  const actionKey = (action || 'idle').toLowerCase();
  const directionKey = (direction || 'down').toLowerCase();
  return GARDNER_ANIM_MAP[actionKey]?.[directionKey] || GARDNER_ANIM_MAP.idle.down;
}

export function getGardnerTextureKey() {
  return GARDNER_TEXTURE_KEYS.idle;
}
