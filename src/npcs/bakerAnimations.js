const BAKER_FRAME_WIDTH = 32;
const BAKER_FRAME_HEIGHT = 64;

const BAKER_TEXTURE_KEYS = Object.freeze({
  idle: 'baker_idle_sheet',
  walk: 'baker_walk_sheet',
  read: 'baker_read_sheet',
  lift: 'baker_lift_sheet'
});

const DIRECTION_OFFSETS = Object.freeze({
  right: 0,
  up: 1,
  left: 2,
  down: 3
});

const ANIMATION_CONFIG = Object.freeze({
  idle: { framesPerDirection: 6, frameRate: 6 },
  walk: { framesPerDirection: 6, frameRate: 10 },
  read: { framesPerDirection: 3, frameRate: 5 },
  lift: { framesPerDirection: 14, frameRate: 10 }
});

export const BAKER_ANIMS = Object.freeze({
  IDLE_RIGHT: 'baker_idle_right',
  IDLE_UP: 'baker_idle_up',
  IDLE_LEFT: 'baker_idle_left',
  IDLE_DOWN: 'baker_idle_down',
  WALK_RIGHT: 'baker_walk_right',
  WALK_UP: 'baker_walk_up',
  WALK_LEFT: 'baker_walk_left',
  WALK_DOWN: 'baker_walk_down',
  READ_RIGHT: 'baker_read_right',
  READ_UP: 'baker_read_up',
  READ_LEFT: 'baker_read_left',
  READ_DOWN: 'baker_read_down',
  LIFT_RIGHT: 'baker_lift_right',
  LIFT_UP: 'baker_lift_up',
  LIFT_LEFT: 'baker_lift_left',
  LIFT_DOWN: 'baker_lift_down'
});

function buildDirectionalAnimKey(baseName, direction) {
  return `baker_${baseName}_${direction}`;
}

function createDirectionalAnimationSet(scene, baseName, textureKey, framesPerDirection, frameRate) {
  Object.entries(DIRECTION_OFFSETS).forEach(([direction, offsetIndex]) => {
    const animKey = buildDirectionalAnimKey(baseName, direction);
    if (scene.anims.exists(animKey)) {
      return;
    }

    const start = offsetIndex * framesPerDirection;
    const end = start + framesPerDirection - 1;

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate,
      repeat: -1
    });
  });
}

export function loadBakerAssets(scene) {
  scene.load.spritesheet(BAKER_TEXTURE_KEYS.idle, '/src/assets/baker/baker_idle.png', {
    frameWidth: BAKER_FRAME_WIDTH,
    frameHeight: BAKER_FRAME_HEIGHT
  });

  scene.load.spritesheet(BAKER_TEXTURE_KEYS.walk, '/src/assets/baker/baker_walk.png', {
    frameWidth: BAKER_FRAME_WIDTH,
    frameHeight: BAKER_FRAME_HEIGHT
  });

  scene.load.spritesheet(BAKER_TEXTURE_KEYS.read, '/src/assets/baker/baker_read.png', {
    frameWidth: BAKER_FRAME_WIDTH,
    frameHeight: BAKER_FRAME_HEIGHT
  });

  scene.load.spritesheet(BAKER_TEXTURE_KEYS.lift, '/src/assets/baker/baker_lift.png', {
    frameWidth: BAKER_FRAME_WIDTH,
    frameHeight: BAKER_FRAME_HEIGHT
  });
}

export function createBakerAnimations(scene) {
  createDirectionalAnimationSet(
    scene,
    'idle',
    BAKER_TEXTURE_KEYS.idle,
    ANIMATION_CONFIG.idle.framesPerDirection,
    ANIMATION_CONFIG.idle.frameRate
  );

  createDirectionalAnimationSet(
    scene,
    'walk',
    BAKER_TEXTURE_KEYS.walk,
    ANIMATION_CONFIG.walk.framesPerDirection,
    ANIMATION_CONFIG.walk.frameRate
  );

  createDirectionalAnimationSet(
    scene,
    'read',
    BAKER_TEXTURE_KEYS.read,
    ANIMATION_CONFIG.read.framesPerDirection,
    ANIMATION_CONFIG.read.frameRate
  );

  createDirectionalAnimationSet(
    scene,
    'lift',
    BAKER_TEXTURE_KEYS.lift,
    ANIMATION_CONFIG.lift.framesPerDirection,
    ANIMATION_CONFIG.lift.frameRate
  );
}

const BAKER_ANIM_MAP = Object.freeze({
  walk: Object.freeze({
    right: BAKER_ANIMS.WALK_RIGHT,
    up: BAKER_ANIMS.WALK_UP,
    left: BAKER_ANIMS.WALK_LEFT,
    down: BAKER_ANIMS.WALK_DOWN
  }),
  idle: Object.freeze({
    right: BAKER_ANIMS.IDLE_RIGHT,
    up: BAKER_ANIMS.IDLE_UP,
    left: BAKER_ANIMS.IDLE_LEFT,
    down: BAKER_ANIMS.IDLE_DOWN
  }),
  read: Object.freeze({
    right: BAKER_ANIMS.READ_RIGHT,
    up: BAKER_ANIMS.READ_UP,
    left: BAKER_ANIMS.READ_LEFT,
    down: BAKER_ANIMS.READ_DOWN
  }),
  lift: Object.freeze({
    right: BAKER_ANIMS.LIFT_RIGHT,
    up: BAKER_ANIMS.LIFT_UP,
    left: BAKER_ANIMS.LIFT_LEFT,
    down: BAKER_ANIMS.LIFT_DOWN
  })
});

export function resolveBakerAnimation(action = 'idle', direction = 'down') {
  const actionKey = (action || 'idle').toLowerCase();
  const directionKey = (direction || 'down').toLowerCase();
  return BAKER_ANIM_MAP[actionKey]?.[directionKey] || BAKER_ANIMS.IDLE_DOWN;
}

export function getBakerTextureKey() {
  return BAKER_TEXTURE_KEYS.idle;
}
