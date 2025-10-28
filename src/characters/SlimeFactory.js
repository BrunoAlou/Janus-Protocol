import { logAction } from '../utils/telemetry.js';

// Procedural slime frames (32x32) using Canvas textures
// We generate N frames with squash & stretch for a cute bouncy animation
const SLIME_KEY_BASE = 'slime';
const SLIME_W = 32;
const SLIME_H = 32;
const SLIME_FRAMES = 8; // number of frames for a full cycle

function ensureSlimeTextures(scene) {
  if (scene.textures.exists(`${SLIME_KEY_BASE}_0`)) return; // already created

  for (let i = 0; i < SLIME_FRAMES; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = SLIME_W;
    canvas.height = SLIME_H;
    const ctx = canvas.getContext('2d');

    // background transparent
    ctx.clearRect(0, 0, SLIME_W, SLIME_H);

    // cycle t in [0,1]
    const t = i / SLIME_FRAMES;
    // squash-stretch factor using sine
    const stretch = Math.sin(t * Math.PI * 2) * 0.25; // -0.25..0.25
    const rx = Math.floor((SLIME_W * 0.45) * (1 - stretch));
    const ry = Math.floor((SLIME_H * 0.35) * (1 + stretch));

    // base color & outline
    const baseColor = '#32cd32'; // limegreen
    const dark = '#1e8a1e';
    const light = '#9cf59c';

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const shw = Math.max(8, Math.floor(rx * 1.1));
    ctx.beginPath();
    ctx.ellipse(SLIME_W/2, SLIME_H - 5, shw, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.ellipse(SLIME_W/2, SLIME_H/2 + 2, rx, ry, 0, 0, Math.PI*2);
    const grad = ctx.createLinearGradient(0, 0, 0, SLIME_H);
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fill();

  // Sem rosto: não desenhar olhos/boca

    scene.textures.addCanvas(`${SLIME_KEY_BASE}_${i}`, canvas);
  }
}

function ensureSlimeAnimations(scene) {
  if (scene.anims.exists('slime_idle') && scene.anims.exists('slime_walk')) return;

  const framesForward = Array.from({ length: SLIME_FRAMES }, (_, i) => ({ key: `${SLIME_KEY_BASE}_${i}` }));
  const framesLoop = framesForward.concat([...framesForward].reverse());

  if (!scene.anims.exists('slime_idle')) {
    scene.anims.create({ key: 'slime_idle', frames: framesLoop, frameRate: 10, repeat: -1 });
  }
  if (!scene.anims.exists('slime_walk')) {
    scene.anims.create({ key: 'slime_walk', frames: framesLoop, frameRate: 14, repeat: -1 });
  }
}

export function createSlime(scene, x, y) {
  ensureSlimeTextures(scene);
  ensureSlimeAnimations(scene);

  // Use the first frame texture to create the sprite; animations reference per-frame keys
  const sprite = scene.physics.add.sprite(x, y, `${SLIME_KEY_BASE}_0`);
  sprite.setDepth(4);
  sprite.setCollideWorldBounds(true);

  // Scale to fit roughly 2x2 tiles, consistent with player size logic
  const tileW = scene.map?.tileWidth ?? 16;
  const tileH = scene.map?.tileHeight ?? 16;
  const desiredTiles = 2; // 2 tiles across
  const sX = (tileW * desiredTiles) / SLIME_W;
  const sY = (tileH * desiredTiles) / SLIME_H;
  const scale = Math.min(sX, sY);
  sprite.setScale(scale);

  // Hitbox a little smaller than visual
  if (sprite.body) {
    sprite.body.setSize(SLIME_W * 0.8, SLIME_H * 0.6);
    sprite.body.setOffset(SLIME_W * 0.1, SLIME_H * 0.3);
  }

  // Idle por padrão; passará para walk via controlador quando houver input
  sprite.play('slime_idle');

  // Telemetry: spawn
  try { logAction('slime_spawn', { frames: SLIME_FRAMES, keyBase: SLIME_KEY_BASE }, { x, y }); } catch (_) {}

  // Helper to switch to walk during motion
  // APIs opcionais para alternar animação, caso queira no futuro
  sprite.startWalk = () => {
    if (sprite.anims.currentAnim?.key !== 'slime_walk') {
      sprite.play('slime_walk');
      try { logAction('slime_animation', { state: 'walk' }, { x: sprite.x, y: sprite.y }); } catch (_) {}
    }
  };
  sprite.startIdle = () => {
    if (sprite.anims.currentAnim?.key !== 'slime_idle') {
      sprite.play('slime_idle');
      try { logAction('slime_animation', { state: 'idle' }, { x: sprite.x, y: sprite.y }); } catch (_) {}
    }
  };

  return sprite;
}

export default { createSlime };
