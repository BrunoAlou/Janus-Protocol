// PlayerController: centraliza lógica de movimentação e controle de animações
// Supports directional animations (walk_right, walk_up, walk_left, walk_down)

import {
  ANIM_WALK_RIGHT,
  ANIM_WALK_UP,
  ANIM_WALK_LEFT,
  ANIM_WALK_DOWN,
  ANIM_IDLE
} from './playerAnimations.js';

export default class PlayerController {
  constructor(scene, player, options = {}) {
    this.scene = scene;
    this.player = player;

    console.log('[PlayerController] Initialized with player:', {
      x: player.x,
      y: player.y,
      frame: player.frame.name,
      displayWidth: player.displayWidth,
      displayHeight: player.displayHeight,
      originX: player.originX,
      originY: player.originY,
      bodyWidth: player.body ? player.body.width : 'no body',
      bodyHeight: player.body ? player.body.height : 'no body'
    });

    // Options with sensible defaults
    this.opts = Object.assign({
      speed: 200,
      acceleration: 0, // 0 = instant velocity (Arcade), >0 would implement smoothing
      drag: 0,
      keys: null, // optional custom key config
      onMoveStart: null,
      onMoveEnd: null
    }, options || {});

    // Input: cursors + WASD
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D'
    });

    this._moving = false;
    this._lastDirection = ANIM_WALK_DOWN; // Default facing direction

    // Ensure arcade body has zero drag by default unless configured
    if (this.player.body && this.player.body.setDrag) {
      this.player.body.setDrag(this.opts.drag, this.opts.drag);
    }
  }

  isInputDown() {
    return this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown ||
      this.wasd.left.isDown || this.wasd.right.isDown || this.wasd.up.isDown || this.wasd.down.isDown;
  }

  update(time, delta) {
    if (!this.player || !this.player.body) return;

    // Read input
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    // Normalize for diagonal movement
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx = dx / len;
      dy = dy / len;

      const vx = Math.round(dx * this.opts.speed);
      const vy = Math.round(dy * this.opts.speed);
      // Set velocity using Arcade physics
      this.player.body.setVelocity(vx, vy);

      // Determine animation based on primary movement direction
      let animKey;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement dominates
        animKey = dx > 0 ? ANIM_WALK_RIGHT : ANIM_WALK_LEFT;
      } else {
        // Vertical movement dominates
        animKey = dy > 0 ? ANIM_WALK_DOWN : ANIM_WALK_UP;
      }

      // Play appropriate directional animation
      // Use scene's global animation manager
      if (this.scene.anims.exists(animKey)) {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== animKey) {
          console.log('[PlayerController] Switching to animation:', animKey, 'dx:', dx.toFixed(2), 'dy:', dy.toFixed(2));
          this.player.play(animKey);
        }
        this._lastDirection = animKey;
      } else {
        // Debug: check scene anims manager
        const allAnims = Object.keys(this.scene.anims.anims.entries);
        console.warn('[PlayerController] Animation does not exist:', animKey);
        console.warn('[PlayerController] Available animations:', allAnims);
      }

      // movement started
      if (!this._moving) {
        this._moving = true;
        if (typeof this.opts.onMoveStart === 'function') this.opts.onMoveStart();
      }
    } else {
      // No input: stop movement
      this.player.body.setVelocity(0, 0);

      // Stop animation on current frame (mantém o último frame da direção)
      if (this.player.anims.isPlaying) {
        this.player.anims.stop();
        // Opcional: forçar o primeiro frame da última direção
        // this.player.anims.setCurrentFrame(this.player.anims.currentAnim.frames[0]);
      }

      // movement ended
      if (this._moving) {
        this._moving = false;
        if (typeof this.opts.onMoveEnd === 'function') this.opts.onMoveEnd();
      }
    }
  }
}

