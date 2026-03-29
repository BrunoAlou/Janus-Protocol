const READER_FRAME_WIDTH = 32;
const READER_FRAME_HEIGHT = 64;

const READER_TEXTURE_KEYS = Object.freeze({
  idle: 'reader_idle_sheet',
  read: 'reader_read_sheet',
  walk: 'reader_walk_sheet'
});

const DIRECTION_OFFSETS = Object.freeze({
  right: 0,
  up: 1,
  left: 2,
  down: 3
});

const READER_ANIM_MAP = Object.freeze({
  walk: Object.freeze({
    right: 'reader_walk_right',
    up: 'reader_walk_up',
    left: 'reader_walk_left',
    down: 'reader_walk_down'
  }),
  idle: Object.freeze({
    right: 'reader_idle_right',
    up: 'reader_idle_up',
    left: 'reader_idle_left',
    down: 'reader_idle_down'
  }),
  read: Object.freeze({
    right: 'reader_read_right',
    up: 'reader_read_up',
    left: 'reader_read_left',
    down: 'reader_read_down'
  })
});

function createDirectionalSet(scene, action, textureKey, framesPerDirection, frameRate) {
  Object.entries(DIRECTION_OFFSETS).forEach(([direction, offset]) => {
    const animKey = READER_ANIM_MAP[action][direction];
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

export function loadReaderAssets(scene) {
  scene.load.spritesheet(READER_TEXTURE_KEYS.idle, new URL('../assets/reader/reader_idle.png', import.meta.url).href, {
    frameWidth: READER_FRAME_WIDTH,
    frameHeight: READER_FRAME_HEIGHT
  });

  scene.load.spritesheet(READER_TEXTURE_KEYS.read, new URL('../assets/reader/reader_read.png', import.meta.url).href, {
    frameWidth: READER_FRAME_WIDTH,
    frameHeight: READER_FRAME_HEIGHT
  });

  scene.load.spritesheet(READER_TEXTURE_KEYS.walk, new URL('../assets/reader/reader_walk.png', import.meta.url).href, {
    frameWidth: READER_FRAME_WIDTH,
    frameHeight: READER_FRAME_HEIGHT
  });
}

export function createReaderAnimations(scene) {
  createDirectionalSet(scene, 'idle', READER_TEXTURE_KEYS.idle, 6, 6);
  createDirectionalSet(scene, 'read', READER_TEXTURE_KEYS.read, 3, 5);
  createDirectionalSet(scene, 'walk', READER_TEXTURE_KEYS.walk, 6, 10);
}

export function resolveReaderAnimation(action = 'idle', direction = 'down') {
  const actionKey = (action || 'idle').toLowerCase();
  const directionKey = (direction || 'down').toLowerCase();
  return READER_ANIM_MAP[actionKey]?.[directionKey] || READER_ANIM_MAP.idle.down;
}

export function getReaderTextureKey() {
  return READER_TEXTURE_KEYS.idle;
}
