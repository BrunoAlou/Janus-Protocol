// PlayerController: centraliza logica de movimentacao e controle de animacoes
// Usa um controlador abstrato de comandos para permitir mesma interface entre player e NPCs

import { createCharacterCommandController } from '../characters/CharacterCommandController.js';
import { resolvePlayerAnimation } from './playerAnimations.js';

export default class PlayerController {
  constructor(scene, player, options = {}) {
    this.scene = scene;
    this.player = player;
    this.enabled = true;

    // Options with sensible defaults
    this.opts = Object.assign({
      speed: 200,
      acceleration: 0,
      drag: 0,
      keys: null,
      onMoveStart: null,
      onMoveEnd: null
    }, options || {});

    // Input: cursors + WASD
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D'
    });

    this._moving = false;

    // Leo passa comandos vindos do teclado para o mesmo controlador usado por NPCs
    this.commandController = createCharacterCommandController(scene, player, {
      resolveAnimation: resolvePlayerAnimation
    }, {
      defaultDirection: 'down'
    });

    if (this.player.body && this.player.body.setDrag) {
      this.player.body.setDrag(this.opts.drag, this.opts.drag);
    }
  }

  isInputDown() {
    return this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown ||
      this.wasd.left.isDown || this.wasd.right.isDown || this.wasd.up.isDown || this.wasd.down.isDown;
  }

  update() {
    if (!this.player || !this.player.body) return;

    if (!this.enabled) {
      this.player.body.setVelocity(0, 0);
      this.commandController.execute({ action: 'idle' });
      return;
    }

    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;

      const vx = Math.round(dx * this.opts.speed);
      const vy = Math.round(dy * this.opts.speed);

      this.commandController.execute({
        action: 'walk',
        velocity: { x: vx, y: vy }
      });

      if (!this._moving) {
        this._moving = true;
        if (typeof this.opts.onMoveStart === 'function') this.opts.onMoveStart();
      }
    } else {
      this.player.body.setVelocity(0, 0);
      this.commandController.execute({ action: 'idle' });

      if (this._moving) {
        this._moving = false;
        if (typeof this.opts.onMoveEnd === 'function') this.opts.onMoveEnd();
      }
    }
  }
}
