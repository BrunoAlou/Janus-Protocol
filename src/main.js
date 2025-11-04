import Phaser from "phaser";

// Cenas de sistema
import LoginScene from "./scenes/LoginScene.js";
import UIScene from "./scenes/UIScene.js";
import DialogScene from "./scenes/DialogScene.js";
import PauseMenuScene from "./scenes/PauseMenuScene.js";
import MinimapScene from "./scenes/MinimapScene.js";

// Cenas de mapa
import ReceptionScene from "./scenes/map/ReceptionScene.js";
import OfficeScene from "./scenes/map/OfficeScene.js";
import LabScene from "./scenes/map/LabScene.js";
import MeetingRoomScene from "./scenes/map/MeetingRoomScene.js";
import HallwayScene from "./scenes/map/HallwayScene.js";
import ItRoomScene from "./scenes/map/ItRoomScene.js";
import RhRoomScene from "./scenes/map/RhRoomScene.js";
import ElevatorScene from "./scenes/map/ElevatorScene.js";
import GardenScene from "./scenes/map/GardenScene.js";
import BossRoomScene from "./scenes/map/BossRoomScene.js";

// Minigames
import PuzzleGame from "./scenes/minigames/PuzzleGame.js";
import QuizGame from "./scenes/minigames/QuizGame.js";
import MemoryGame from "./scenes/minigames/MemoryGame.js";
import TypingGame from "./scenes/minigames/TypingGame.js";

// Player assets
import loadPlayerAssets from './player/loadPlayerAssets.js';

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
  scene: [
    // Sistema (ordem importa - LoginScene primeiro!)
    LoginScene,
    UIScene,
    DialogScene,
    PauseMenuScene,
    MinimapScene,
    
    // Mapas
    ReceptionScene,
    OfficeScene,
    LabScene,
    MeetingRoomScene,
    HallwayScene,
    ItRoomScene,
    RhRoomScene,
    ElevatorScene,
    GardenScene,
    BossRoomScene,
    
    // Minigames
    PuzzleGame,
    QuizGame,
    MemoryGame,
    TypingGame
  ]
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