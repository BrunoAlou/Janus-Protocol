import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    // Criar retângulo de fundo para o menu UI
    const menuBackground = this.add.rectangle(
      this.scale.width / 2,
      0,
      this.scale.width - (this.scale.width / 2),
      50,
      0x1a1a2e,
      0.8
    ).setOrigin(0, 0);

    // UI estática (não se move com a câmera)
    menuBackground.setScrollFactor(0);
  }
}
