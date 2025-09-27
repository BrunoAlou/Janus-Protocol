import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";
import UIScene from "./scenes/UIScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1d1d1d",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Sem gravidade
      debug: true // Mudar para true para ver hitboxes
    }
  },
  scene: [GameScene, UIScene] 
};

new Phaser.Game(config);