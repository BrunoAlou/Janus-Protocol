// Centralized player animations for Phaser 3
// Leo spritesheet: 24 frames (768x64px), each frame 32x64px
// Frame layout: right(0-5), up(6-11), left(12-17), down(18-23)

import { PLAYER_TEXTURE_KEY } from './loadPlayerAssets.js';

// Animation keys
export const ANIM_WALK_RIGHT = 'walk_right';
export const ANIM_WALK_UP = 'walk_up';
export const ANIM_WALK_LEFT = 'walk_left';
export const ANIM_WALK_DOWN = 'walk_down';
export const ANIM_IDLE = 'idle';

/**
 * Create all directional player animations from texture atlas
 * @param {Phaser.Scene} scene
 */
export function createPlayerAnimations(scene) {
  const key = PLAYER_TEXTURE_KEY;

  // Check if texture exists
  const tex = scene.textures.get(key);
  if (!tex || tex.key === '__MISSING') {
    console.warn(`[PlayerAnimations] Texture "${key}" not found`);
    return;
  }

  // Walk Right (frames 0-5)
  if (!scene.anims.exists(ANIM_WALK_RIGHT)) {
    scene.anims.create({
      key: ANIM_WALK_RIGHT,
      frames: [
        { key, frame: 'walk_right_01' },
        { key, frame: 'walk_right_02' },
        { key, frame: 'walk_right_03' },
        { key, frame: 'walk_right_04' },
        { key, frame: 'walk_right_05' },
        { key, frame: 'walk_right_06' }
      ],
      frameRate: 12,
      repeat: -1
    });
    console.log(`[PlayerAnimations] Created "${ANIM_WALK_RIGHT}" animation`);
  }

  // Walk Up (frames 6-11)
  if (!scene.anims.exists(ANIM_WALK_UP)) {
    scene.anims.create({
      key: ANIM_WALK_UP,
      frames: [
        { key, frame: 'walk_up_01' },
        { key, frame: 'walk_up_02' },
        { key, frame: 'walk_up_03' },
        { key, frame: 'walk_up_04' },
        { key, frame: 'walk_up_05' },
        { key, frame: 'walk_up_06' }
      ],
      frameRate: 12,
      repeat: -1
    });
    console.log(`[PlayerAnimations] Created "${ANIM_WALK_UP}" animation`);
  }

  // Walk Left (frames 12-17)
  if (!scene.anims.exists(ANIM_WALK_LEFT)) {
    scene.anims.create({
      key: ANIM_WALK_LEFT,
      frames: [
        { key, frame: 'walk_left_01' },
        { key, frame: 'walk_left_02' },
        { key, frame: 'walk_left_03' },
        { key, frame: 'walk_left_04' },
        { key, frame: 'walk_left_05' },
        { key, frame: 'walk_left_06' }
      ],
      frameRate: 12,
      repeat: -1
    });
    console.log(`[PlayerAnimations] Created "${ANIM_WALK_LEFT}" animation`);
  }

  // Walk Down (frames 18-23)
  if (!scene.anims.exists(ANIM_WALK_DOWN)) {
    scene.anims.create({
      key: ANIM_WALK_DOWN,
      frames: [
        { key, frame: 'walk_down_01' },
        { key, frame: 'walk_down_02' },
        { key, frame: 'walk_down_03' },
        { key, frame: 'walk_down_04' },
        { key, frame: 'walk_down_05' },
        { key, frame: 'walk_down_06' }
      ],
      frameRate: 12,
      repeat: -1
    });
    console.log(`[PlayerAnimations] Created "${ANIM_WALK_DOWN}" animation`);
  }

  // Idle (use first frame of walk_down as default idle)
  if (!scene.anims.exists(ANIM_IDLE)) {
    scene.anims.create({
      key: ANIM_IDLE,
      frames: [{ key, frame: 'walk_down_01' }],
      frameRate: 1,
      repeat: 0
    });
    console.log(`[PlayerAnimations] Created "${ANIM_IDLE}" animation`);
  }
}

