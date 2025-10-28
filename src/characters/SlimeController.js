// SlimeController: movimenta slime via teclas e alterna animações walk/idle
export default class SlimeController {
  constructor(scene, slime, options = {}) {
    this.scene = scene;
    this.slime = slime;
    this.speed = options.speed ?? 140;

    // Input: setas + WASD
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });

    this._moving = false;
  }

  isInputDown() {
    const c = this.cursors;
    const w = this.wasd;
    return c.left.isDown || c.right.isDown || c.up.isDown || c.down.isDown ||
           w.left.isDown || w.right.isDown || w.up.isDown || w.down.isDown;
  }

  update() {
    if (!this.slime || !this.slime.body) return;

    let dx = 0, dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      this.slime.body.setVelocity(Math.round(dx * this.speed), Math.round(dy * this.speed));

      // flip horizontal apenas se quiser feedback de direção
      if (dx < 0) this.slime.setFlipX(true); else if (dx > 0) this.slime.setFlipX(false);

      if (!this._moving) {
        this._moving = true;
        if (this.slime.startWalk) this.slime.startWalk();
      }
    } else {
      this.slime.body.setVelocity(0, 0);
      if (this._moving) {
        this._moving = false;
        if (this.slime.startIdle) this.slime.startIdle();
      }
    }
  }
}
