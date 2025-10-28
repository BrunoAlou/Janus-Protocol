// PlayerController: centraliza lógica de movimentação e controle de animações
// Inspirado nas boas práticas de Character-Generator-2.0 (entrada + animações/spritesheets)

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
    this._lastDir = { x: 0, y: 0 };

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

      // Flip sprite horizontally when moving left
      if (dx < 0) this.player.setFlipX(true);
      else if (dx > 0) this.player.setFlipX(false);

      // Play walk animation if not already
      if (this.player.anims && (!this.player.anims.currentAnim || this.player.anims.currentAnim.key !== 'walk')) {
        if (this.player.anims.exists('walk')) this.player.play('walk');
      }

      // movement started
      if (!this._moving) {
        this._moving = true;
        if (typeof this.opts.onMoveStart === 'function') this.opts.onMoveStart();
      }
    } else {
      // No input: stop movement
      this.player.body.setVelocity(0, 0);

      // Stop animation and show the initial frame (don't hardcode frame 4)
      if (this.player.anims && this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
      // Manter o frame atual ao parar (não forçar frame 4)
      // Se quiser um frame idle específico, use: this.player.setFrame('idleFrameNumber');

      // movement ended
      if (this._moving) {
        this._moving = false;
        if (typeof this.opts.onMoveEnd === 'function') this.opts.onMoveEnd();
      }
    }
  }
}
