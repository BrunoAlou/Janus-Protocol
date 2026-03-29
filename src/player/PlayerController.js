// PlayerController: centraliza logica de movimentacao e controle de animacoes
// Usa um controlador abstrato de comandos para permitir mesma interface entre player e NPCs

import { createCharacterCommandController } from '../characters/CharacterCommandController.js';
import {
  ANIM_PHONE_HOLD,
  ANIM_PHONE_PUTAWAY,
  ANIM_PHONE_TAKE,
  resolvePlayerAnimation
} from './playerAnimations.js';

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
    this.forcedAction = null;
    this.forcedDirection = null;
    this._phoneState = null;
    this._onAnimComplete = (anim) => {
      if (this.forcedAction !== 'phone') {
        return;
      }

      if (anim.key === ANIM_PHONE_TAKE) {
        this._phoneState = 'hold';
        this.player.play(ANIM_PHONE_HOLD, true);
        return;
      }

      if (anim.key === ANIM_PHONE_PUTAWAY) {
        const direction = this.forcedDirection || this.commandController.getLastDirection?.() || 'down';
        this.forcedAction = null;
        this.forcedDirection = null;
        this._phoneState = null;
        this.commandController.execute({ action: 'idle', direction });
      }
    };
    this.player.on('animationcomplete', this._onAnimComplete);

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

  isBlockedByDialog() {
    const dialogScene = this.scene?.scene?.get?.('DialogScene');
    return dialogScene?.isDialogOpen?.() === true;
  }

  update() {
    if (!this.player || !this.player.body) return;

    if (this.forcedAction === 'sit' && this.isInputDown()) {
      this.clearForcedAction();
    }

    if (this.forcedAction) {
      this.player.body.setVelocity(0, 0);

      if (this.forcedAction === 'phone') {
        if (!this.player.anims?.isPlaying && this._phoneState === 'hold') {
          this.player.play(ANIM_PHONE_HOLD, true);
        }
        return;
      }

      const forcedDirection = this.forcedDirection || this.commandController.getLastDirection?.() || 'down';
      const forcedAnimKey = resolvePlayerAnimation(this.forcedAction, forcedDirection);
      const currentAnimKey = this.player.anims?.currentAnim?.key || null;

      // For scripted actions (ex: phone), trigger once and keep the last frame.
      if (currentAnimKey !== forcedAnimKey) {
        this.commandController.execute({
          action: this.forcedAction,
          direction: forcedDirection
        });
      }
      return;
    }

    if (!this.enabled || this.isBlockedByDialog()) {
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

  setForcedAction(action, direction = null) {
    const normalizedAction = action || null;
    this.forcedAction = normalizedAction;
    this.forcedDirection = direction;

    if (normalizedAction === 'phone') {
      this._phoneState = 'take';
      if (this.player.body) {
        this.player.body.setVelocity(0, 0);
      }
      this.player.play(ANIM_PHONE_TAKE, true);
    }
  }

  clearForcedAction() {
    if (this.forcedAction === 'phone') {
      this._phoneState = 'putaway';
      if (this.player.body) {
        this.player.body.setVelocity(0, 0);
      }
      if (this.player.anims?.currentAnim?.key !== ANIM_PHONE_PUTAWAY) {
        this.player.play(ANIM_PHONE_PUTAWAY, true);
      }
      return;
    }

    this.forcedAction = null;
    this.forcedDirection = null;
    this._phoneState = null;
    this.commandController.execute({ action: 'idle' });
  }
}
