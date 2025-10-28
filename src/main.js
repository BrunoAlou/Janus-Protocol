import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";
import UIScene from "./scenes/UIScene.js";

const getWidth = () => document.documentElement.clientWidth || window.innerWidth;
const getHeight = () => document.documentElement.clientHeight || window.innerHeight;

const config = {
  type: Phaser.AUTO,
  width: getWidth(),
  height: getHeight(),
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container'
  },
  backgroundColor: "#1d1d1d",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true // Ativar para ver hitboxes e identificar problemas visuais
    }
  },
  scene: [GameScene, UIScene] 
};

const game = new Phaser.Game(config);

// Garantir resize imediato e quando a janela for alterada
window.addEventListener('resize', () => {
  const w = getWidth();
  const h = getHeight();
  if (game && game.scale) {
    game.scale.resize(w, h);
  }
});

// Forçar um resize inicial (alguns navegadores precisam)
setTimeout(() => {
  const w = getWidth();
  const h = getHeight();
  if (game && game.scale) game.scale.resize(w, h);
}, 50);