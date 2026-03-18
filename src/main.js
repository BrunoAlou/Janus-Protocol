import Phaser from "phaser";

// Gerenciadores
import SceneManager from "./managers/SceneManager.js";
import MinigameManager from "./managers/MinigameManager.js";

// Cenas de sistema
import LoginScene from "./scenes/LoginScene.js";
import UIScene from "./scenes/UIScene.js";
import DialogScene from "./scenes/DialogScene.js";
import PauseMenuScene from "./scenes/PauseMenuScene.js";
import MinimapScene from "./scenes/MinimapScene.js";
import MinigameMenuScene from "./scenes/MinigameMenuScene.js";

// Cenas de mapa
import ReceptionScene from "./scenes/map/ReceptionScene.js";
import OfficeScene from "./scenes/map/OfficeScene.js";
import LabScene from "./scenes/map/LabScene.js";
import MeetingRoomScene from "./scenes/map/MeetingRoomScene.js";
import ArchiveRoomScene from "./scenes/map/HallwayScene.js";
import ItRoomScene from "./scenes/map/ItRoomScene.js";
import RhRoomScene from "./scenes/map/RhRoomScene.js";
import ElevatorScene from "./scenes/map/ElevatorScene.js";
import GardenScene from "./scenes/map/GardenScene.js";
import CoffeeRoomScene from "./scenes/map/CoffeeRoomScene.js";
import BossRoomScene from "./scenes/map/BossRoomScene.js";

// Minigames
import PuzzleGame from "./scenes/minigames/PuzzleGame.js";
import QuizGame from "./scenes/minigames/QuizGame.js";
import MemoryGame from "./scenes/minigames/MemoryGame.js";
import TypingGame from "./scenes/minigames/TypingGame.js";
import WhackAMoleGame from "./scenes/minigames/WhackAMoleGame.js";
import TetrisGame from "./scenes/minigames/TetrisGame.js";
import SnakeGame from "./scenes/minigames/SnakeGame.js";

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
      debug: false // Debug desativado por padrão - ativar via menu ESC
    }
  },
  scene: [
    // Sistema (ordem importa - LoginScene primeiro!)
    LoginScene,

    
    // Mapas
    ReceptionScene,
    OfficeScene,
    LabScene,
    MeetingRoomScene,
    ArchiveRoomScene,
    ItRoomScene,
    RhRoomScene,
    ElevatorScene,
    GardenScene,
    CoffeeRoomScene,
    BossRoomScene,
    
    MinimapScene,
    UIScene,
    DialogScene,
    PauseMenuScene,
    MinigameMenuScene,
    
    // Minigames
    PuzzleGame,
    QuizGame,
    MemoryGame,
    TypingGame,
    WhackAMoleGame,
    TetrisGame,
    SnakeGame
  ]
};

const game = new Phaser.Game(config);

// Inicializar MinigameManager global
window.minigameManager = new MinigameManager();

// Inicializar SceneManager global
window.sceneManager = new SceneManager(game);

// O Phaser já inicia LoginScene automaticamente (primeira da lista)
// Apenas sincronizar o estado do SceneManager
window.sceneManager.currentState.auth = 'LoginScene';

console.log('[Main] Game initialized with SceneManager and MinigameManager');

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