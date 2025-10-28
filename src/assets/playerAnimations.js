// Centralized player animations for Phaser 3
// Assumptions:
// - The spritesheet is loaded with key defined in loadPlayerAssets.js
// - Walk animation mora na terceira linha do spritesheet

import { PLAYER_TEXTURE_KEY, FRAME_WIDTH, FRAME_HEIGHT } from './loadPlayerAssets.js';

export const WALK_ROW_INDEX = 2; // third row (zero-based)

export function createPlayerAnimations(scene) {
  if (scene.anims.exists('walk')) {
    console.log('[PlayerAnimations] Animation "walk" already exists');
    return;
  }

  const key = PLAYER_TEXTURE_KEY;
  const tex = scene.textures.get(key);
  if (!tex) {
    console.warn(`[PlayerAnimations] Texture "${key}" not found`);
    return;
  }

  const source = tex.source && tex.source[0];
  const sheetWidth = source ? source.width : FRAME_WIDTH;
  const sheetHeight = source ? source.height : FRAME_HEIGHT;
  const framesPerRow = Math.max(1, Math.floor(sheetWidth / FRAME_WIDTH));
  const totalRows = Math.max(1, Math.floor(sheetHeight / FRAME_HEIGHT));

  if (WALK_ROW_INDEX >= totalRows) {
    console.warn(`[PlayerAnimations] Row ${WALK_ROW_INDEX + 1} not available (only ${totalRows} rows)`);
    return;
  }

  const startIndex = WALK_ROW_INDEX * framesPerRow;
  const endIndex = startIndex + framesPerRow - 1;
  const totalFrames = tex.frameTotal || framesPerRow * totalRows;
  const clampedEnd = Math.min(endIndex, totalFrames - 1);

  const frames = scene.anims.generateFrameNumbers(key, {
    start: startIndex,
    end: clampedEnd
  });

  if (!frames || !frames.length) {
    console.warn(`[PlayerAnimations] Failed to generate frames for row ${WALK_ROW_INDEX + 1}`);
    return;
  }

  scene.anims.create({
    key: 'walk',
    frames,
    frameRate: 12,
    repeat: -1
  });
  
  console.log(`[PlayerAnimations] Animation "walk" created with ${frames.length} frames (row ${WALK_ROW_INDEX + 1})`);
}
