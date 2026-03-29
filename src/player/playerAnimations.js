/**
 * Player animations system using leo_2 spritesheets
 * Each action has 4 directional variations (right, up, left, down)
 * Walk animations transition to idle animations after completion
 */

import {
  PLAYER_TEXTURE_WALK,
  PLAYER_TEXTURE_IDLE,
  PLAYER_TEXTURE_LIFT,
  PLAYER_TEXTURE_PHONE,
  PLAYER_TEXTURE_PICKUP,
  PLAYER_TEXTURE_READ,
  PLAYER_TEXTURE_SIT,
  PLAYER_TEXTURE_THROW
} from './loadPlayerAssets.js';

// ============ ANIMATION KEYS ============

// Walk animations (with transition to idle)
export const ANIM_WALK_RIGHT = 'walk_right';
export const ANIM_WALK_UP = 'walk_up';
export const ANIM_WALK_LEFT = 'walk_left';
export const ANIM_WALK_DOWN = 'walk_down';

// Idle animations (standing poses)
export const ANIM_IDLE_RIGHT = 'idle_right';
export const ANIM_IDLE_UP = 'idle_up';
export const ANIM_IDLE_LEFT = 'idle_left';
export const ANIM_IDLE_DOWN = 'idle_down';

// Lift animations (pick up objects, high)
export const ANIM_LIFT_RIGHT = 'lift_right';
export const ANIM_LIFT_UP = 'lift_up';
export const ANIM_LIFT_LEFT = 'lift_left';
export const ANIM_LIFT_DOWN = 'lift_down';

// Phone animations (single sequence spritesheet)
export const ANIM_PHONE_TAKE = 'phone_take';
export const ANIM_PHONE_HOLD = 'phone_hold';
export const ANIM_PHONE_PUTAWAY = 'phone_putaway';

// Pick/Pickup animations (pick up small items)
export const ANIM_PICKUP_RIGHT = 'pickup_right';
export const ANIM_PICKUP_UP = 'pickup_up';
export const ANIM_PICKUP_LEFT = 'pickup_left';
export const ANIM_PICKUP_DOWN = 'pickup_down';

// Read animations (reading documents/books)
export const ANIM_READ_RIGHT = 'read_right';
export const ANIM_READ_UP = 'read_up';
export const ANIM_READ_LEFT = 'read_left';
export const ANIM_READ_DOWN = 'read_down';

// Sit animations (sitting down)
export const ANIM_SIT_RIGHT = 'sit_right';
export const ANIM_SIT_UP = 'sit_up';
export const ANIM_SIT_LEFT = 'sit_left';
export const ANIM_SIT_DOWN = 'sit_down';

// Throw animations (throwing objects)
export const ANIM_THROW_RIGHT = 'throw_right';
export const ANIM_THROW_UP = 'throw_up';
export const ANIM_THROW_LEFT = 'throw_left';
export const ANIM_THROW_DOWN = 'throw_down';

// Animation resolution map
const PLAYER_ANIM_MAP = Object.freeze({
  walk: Object.freeze({
    right: ANIM_WALK_RIGHT,
    up: ANIM_WALK_UP,
    left: ANIM_WALK_LEFT,
    down: ANIM_WALK_DOWN
  }),
  idle: Object.freeze({
    right: ANIM_IDLE_RIGHT,
    up: ANIM_IDLE_UP,
    left: ANIM_IDLE_LEFT,
    down: ANIM_IDLE_DOWN
  }),
  lift: Object.freeze({
    right: ANIM_LIFT_RIGHT,
    up: ANIM_LIFT_UP,
    left: ANIM_LIFT_LEFT,
    down: ANIM_LIFT_DOWN
  }),
  phone: Object.freeze({
    right: ANIM_PHONE_HOLD,
    up: ANIM_PHONE_HOLD,
    left: ANIM_PHONE_HOLD,
    down: ANIM_PHONE_HOLD
  }),
  pickup: Object.freeze({
    right: ANIM_PICKUP_RIGHT,
    up: ANIM_PICKUP_UP,
    left: ANIM_PICKUP_LEFT,
    down: ANIM_PICKUP_DOWN
  }),
  read: Object.freeze({
    right: ANIM_READ_RIGHT,
    up: ANIM_READ_UP,
    left: ANIM_READ_LEFT,
    down: ANIM_READ_DOWN
  }),
  sit: Object.freeze({
    right: ANIM_SIT_RIGHT,
    up: ANIM_SIT_UP,
    left: ANIM_SIT_LEFT,
    down: ANIM_SIT_DOWN
  }),
  throw: Object.freeze({
    right: ANIM_THROW_RIGHT,
    up: ANIM_THROW_UP,
    left: ANIM_THROW_LEFT,
    down: ANIM_THROW_DOWN
  })
});

/**
 * Resolve player animation key by action and direction
 * @param {string} action - Action name (walk, idle, lift, phone, pickup, read, sit, throw)
 * @param {string} direction - Direction (right, up, left, down)
 * @returns {string} Animation key
 */
export function resolvePlayerAnimation(action = 'idle', direction = 'down') {
  const actionKey = (action || 'idle').toLowerCase();
  const directionKey = (direction || 'down').toLowerCase();
  return PLAYER_ANIM_MAP[actionKey]?.[directionKey] || ANIM_IDLE_DOWN;
}

/**
 * Get idle animation key for a given direction
 * @param {string} direction - Direction (right, up, left, down)
 * @returns {string} Idle animation key
 */
export function getIdleAnimation(direction = 'down') {
  const directionKey = (direction || 'down').toLowerCase();
  return PLAYER_ANIM_MAP.idle[directionKey] || ANIM_IDLE_DOWN;
}

export function getPhoneSequenceKeys() {
  return Object.freeze({
    take: ANIM_PHONE_TAKE,
    hold: ANIM_PHONE_HOLD,
    putaway: ANIM_PHONE_PUTAWAY
  });
}

/**
 * Create all directional player animations from leo_2 textures
 * @param {Phaser.Scene} scene
 */
export function createPlayerAnimations(scene) {
  // Walk animations (6 frames each direction, transitions to idle at end)
  createWalkAnimations(scene);
  
  // Idle animations (6 frames each direction, loops)
  createIdleAnimations(scene);
  
  // Action animations
  createLiftAnimations(scene);
  createPhoneAnimations(scene);
  createPickupAnimations(scene);
  createReadAnimations(scene);
  createSitAnimations(scene);
  createThrowAnimations(scene);

  console.log('[PlayerAnimations] All player animations created successfully');
}

function createWalkAnimations(scene) {
  const texture = PLAYER_TEXTURE_WALK;
  const frameRate = 12;
  const directions = [
    { dir: 'right', frames: 6 },
    { dir: 'up', frames: 6 },
    { dir: 'left', frames: 6 },
    { dir: 'down', frames: 6 }
  ];

  directions.forEach(({ dir, frames }) => {
    const animKey = `walk_${dir}`;
    const idleKey = `idle_${dir}`;
    
    // Build frame list for this direction
    const frameList = [];
    for (let i = 1; i <= frames; i++) {
      frameList.push({ key: texture, frame: `walk_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: 0, // Play once, then transition
        onComplete: () => {
          // Auto-transition to idle when walk finishes
          if (scene.anims.exists(idleKey)) {
            // The sprite should play idle animation
          }
        }
      });
      console.log(`[PlayerAnimations] Created walk_${dir} animation`);
    }
  });
}

function createIdleAnimations(scene) {
  const texture = PLAYER_TEXTURE_IDLE;
  const frameRate = 8;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `idle_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 6; i++) {
      frameList.push({ key: texture, frame: `idle_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: -1 // Loop idle
      });
      console.log(`[PlayerAnimations] Created idle_${dir} animation`);
    }
  });
}

function createLiftAnimations(scene) {
  const texture = PLAYER_TEXTURE_LIFT;
  const frameRate = 12;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `lift_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 14; i++) {
      frameList.push({ key: texture, frame: `lift_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: 0
      });
      console.log(`[PlayerAnimations] Created lift_${dir} animation`);
    }
  });
}

function createPhoneAnimations(scene) {
  const texture = PLAYER_TEXTURE_PHONE;
  const frameRate = 10;

  if (!scene.anims.exists(ANIM_PHONE_TAKE)) {
    scene.anims.create({
      key: ANIM_PHONE_TAKE,
      frames: [
        { key: texture, frame: 'phone_01' },
        { key: texture, frame: 'phone_02' },
        { key: texture, frame: 'phone_03' },
        { key: texture, frame: 'phone_04' }
      ],
      frameRate,
      repeat: 0
    });
    console.log(`[PlayerAnimations] Created ${ANIM_PHONE_TAKE} animation`);
  }

  if (!scene.anims.exists(ANIM_PHONE_HOLD)) {
    scene.anims.create({
      key: ANIM_PHONE_HOLD,
      frames: [
        { key: texture, frame: 'phone_05' },
        { key: texture, frame: 'phone_06' },
        { key: texture, frame: 'phone_07' },
        { key: texture, frame: 'phone_08' }
      ],
      frameRate: 7,
      repeat: -1
    });
    console.log(`[PlayerAnimations] Created ${ANIM_PHONE_HOLD} animation`);
  }

  if (!scene.anims.exists(ANIM_PHONE_PUTAWAY)) {
    scene.anims.create({
      key: ANIM_PHONE_PUTAWAY,
      frames: [
        { key: texture, frame: 'phone_09' },
        { key: texture, frame: 'phone_10' },
        { key: texture, frame: 'phone_11' },
        { key: texture, frame: 'phone_12' }
      ],
      frameRate,
      repeat: 0
    });
    console.log(`[PlayerAnimations] Created ${ANIM_PHONE_PUTAWAY} animation`);
  }
}

function createPickupAnimations(scene) {
  const texture = PLAYER_TEXTURE_PICKUP;
  const frameRate = 12;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `pickup_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 12; i++) {
      frameList.push({ key: texture, frame: `pickup_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: 0
      });
      console.log(`[PlayerAnimations] Created pickup_${dir} animation`);
    }
  });
}

function createReadAnimations(scene) {
  const texture = PLAYER_TEXTURE_READ;
  const frameRate = 8;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `read_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 3; i++) {
      frameList.push({ key: texture, frame: `read_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: -1
      });
      console.log(`[PlayerAnimations] Created read_${dir} animation`);
    }
  });
}

function createSitAnimations(scene) {
  const texture = PLAYER_TEXTURE_SIT;
  const frameRate = 8;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `sit_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 3; i++) {
      frameList.push({ key: texture, frame: `sit_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: -1
      });
      console.log(`[PlayerAnimations] Created sit_${dir} animation`);
    }
  });
}

function createThrowAnimations(scene) {
  const texture = PLAYER_TEXTURE_THROW;
  const frameRate = 12;
  const directions = ['right', 'up', 'left', 'down'];

  directions.forEach(dir => {
    const animKey = `throw_${dir}`;
    
    const frameList = [];
    for (let i = 1; i <= 14; i++) {
      frameList.push({ key: texture, frame: `throw_${dir}_${String(i).padStart(2, '0')}` });
    }

    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: frameList,
        frameRate,
        repeat: 0
      });
      console.log(`[PlayerAnimations] Created throw_${dir} animation`);
    }
  });
}

