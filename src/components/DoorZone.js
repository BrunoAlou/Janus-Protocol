export default class DoorZone {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} config
   *   - x, y: posição da zona
   *   - width, height: dimensões da zona
   *   - indicatorConfig: { label, color, ... }
   *   - onInteract: função chamada ao pressionar E
   *   - proximityDistance: distância para mostrar indicador
   */
  constructor(scene, config) {
    this.scene = scene;
    this.visible = config.visible !== false;
    this.locked = config.locked === true;
    this.lockedMessage = config.lockedMessage || 'Esta porta esta trancada.';

    this.zone = scene.add.zone(config.x, config.y, config.width, config.height).setOrigin(0.5);
    scene.physics.world.enable(this.zone);
    this.zone.body.setAllowGravity(false);
    this.zone.body.moves = false;

    // Cria indicador visual
    this.indicator = scene.add.container(
      config.x + (config.indicatorOffsetX || 0),
      config.y
    );
    const eButton = scene.add.circle(0, -20, 12, 0x000000, 0.8)
      .setStrokeStyle(2, config.indicatorColor || 0xffff00);
    const eText = scene.add.text(0, -20, 'E', {
      fontSize: '14px',
      color: config.indicatorTextColor || '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const actionText = scene.add.text(0, 5, config.label || '', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: config.labelBg || '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.indicator.add([eButton, eText, actionText]);
    this.indicator.setDepth(1500);
    this.indicator.setAlpha(0);
    this.indicator.setVisible(this.visible);

    this.onInteract = config.onInteract;
    this.label = config.label || 'Porta';
    this.proximityDistance = config.proximityDistance || 50;
    this.isTweening = false;

    if (!this.visible && this.zone.body) {
      this.zone.body.enable = false;
    }
  }

  showLockedFeedback() {
    const dialogScene = this.scene.scene.get('DialogScene');
    if (dialogScene && typeof dialogScene.showDialog === 'function') {
      dialogScene.showDialog({
        name: this.label,
        dialogues: [{ text: this.lockedMessage, emotion: 'neutral' }]
      });
    }
  }

  update(player, input, tweens) {
    if (!this.visible || !this.zone?.body?.enable) {
      this.indicator?.setVisible(false);
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.zone.x, this.zone.y
    );
    if (distance < this.proximityDistance) {
      this.indicator.setAlpha(1);
      if (!this.isTweening) {
        this.isTweening = true;
        tweens.add({
          targets: this.indicator,
          y: this.indicator.y - 5,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      if (Phaser.Input.Keyboard.JustDown(input.keyboard.addKey('E'))) {
        if (this.locked) {
          this.showLockedFeedback();
          return;
        }
        this.onInteract && this.onInteract();
      }
    } else {
      this.indicator.setAlpha(0);
      if (this.isTweening) {
        tweens.killTweensOf(this.indicator);
        this.isTweening = false;
      }
    }
  }
}
