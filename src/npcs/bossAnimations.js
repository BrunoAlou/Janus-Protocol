const BOSS_FRAME_WIDTH = 32;
const BOSS_FRAME_HEIGHT = 64;

const BOSS_TEXTURE_KEYS = Object.freeze({
  idle: 'boss_idle_sheet',
  phone: 'boss_phone_sheet',
  sit: 'boss_sit_sheet'
});

const DIRECTION_OFFSETS = Object.freeze({
  right: 0,
  up: 1,
  left: 2,
  down: 3
});

const BOSS_ANIM_MAP = Object.freeze({
  idle: Object.freeze({
    right: 'boss_idle_right',
    up: 'boss_idle_up',
    left: 'boss_idle_left',
    down: 'boss_idle_down'
  }),
  idle_phone: Object.freeze({
    right: 'boss_idle_phone_right',
    up: 'boss_idle_phone_up',
    left: 'boss_idle_phone_left',
    down: 'boss_idle_phone_down'
  }),
  sit: Object.freeze({
    right: 'boss_sit_right',
    up: 'boss_sit_up',
    left: 'boss_sit_left',
    down: 'boss_sit_down'
  })
});

function createDirectionalSet(scene, action, textureKey, framesPerDirection, frameRate) {
  Object.entries(DIRECTION_OFFSETS).forEach(([direction, offset]) => {
    const animKey = BOSS_ANIM_MAP[action][direction];
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

export function loadBossAssets(scene) {
  scene.load.spritesheet(BOSS_TEXTURE_KEYS.idle, new URL('../assets/boss/boss_idle.png', import.meta.url).href, {
    frameWidth: BOSS_FRAME_WIDTH,
    frameHeight: BOSS_FRAME_HEIGHT
  });

  scene.load.spritesheet(BOSS_TEXTURE_KEYS.phone, new URL('../assets/boss/boss_phone.png', import.meta.url).href, {
    frameWidth: BOSS_FRAME_WIDTH,
    frameHeight: BOSS_FRAME_HEIGHT
  });

  scene.load.spritesheet(BOSS_TEXTURE_KEYS.sit, new URL('../assets/boss/boss_sit.png', import.meta.url).href, {
    frameWidth: BOSS_FRAME_WIDTH,
    frameHeight: BOSS_FRAME_HEIGHT
  });
}

export function createBossAnimations(scene) {
  createDirectionalSet(scene, 'idle', BOSS_TEXTURE_KEYS.idle, 6, 6);
  createDirectionalSet(scene, 'idle_phone', BOSS_TEXTURE_KEYS.phone, 3, 6);
  createDirectionalSet(scene, 'sit', BOSS_TEXTURE_KEYS.sit, 3, 5);
}

export function resolveBossAnimation(action = 'idle_phone', direction = 'down') {
  const actionKey = (action || 'idle_phone').toLowerCase();
  const directionKey = (direction || 'down').toLowerCase();
  return BOSS_ANIM_MAP[actionKey]?.[directionKey] || BOSS_ANIM_MAP.idle_phone.down;
}

export function getBossTextureKey() {
  return BOSS_TEXTURE_KEYS.idle;
}
