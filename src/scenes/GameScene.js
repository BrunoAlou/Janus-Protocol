import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    // Carregar assets depois
  }

  create() {
    this.add.text(300, 250, "Hello Phaser!", { fontSize: "32px", fill: "#fff" });
  }
}
