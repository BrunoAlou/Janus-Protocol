import { createPlayer } from '../../../player/PlayerFactory.js';
import PlayerController from '../../../player/PlayerController.js';
import CollisionDebugger from '../../../utils/CollisionDebugger.js';

/**
 * PlayerSetupMixin - Lógica genérica de setup do player
 * Pode ser usado em qualquer cena que herda de BaseMapScene
 * 
 * Funções:
 * - setupPlayer(): Cria o player, controller e debugger
 * - setupCamera(): Configura a câmera para seguir o player
 */
export const PlayerSetupMixin = {
  /**
   * Cria o player, configura controller, debugger e colisões
   */
  setupPlayer() {
    // Posição inicial (pode ser sobrescrita)
    const hasResumePosition =
      Number.isFinite(Number(this.resumePosition?.x)) &&
      Number.isFinite(Number(this.resumePosition?.y)) &&
      this.resumePosition?.scene === this.sceneKey;

    const spawnX = hasResumePosition ? Number(this.resumePosition.x) : this.getSpawnX();
    const spawnY = hasResumePosition ? Number(this.resumePosition.y) : this.getSpawnY();

    this.player = createPlayer(this, spawnX, spawnY);

    if (window.gameState?.setPlayerPosition) {
      window.gameState.setPlayerPosition(this.player.x, this.player.y, null, this.sceneKey);
      this._lastPersistedPosition = { x: this.player.x, y: this.player.y };
    }

    // Configurar debugger de colisões
    this.collisionDebugger = new CollisionDebugger(this, this.player);

    // Listener para toggle do debug (tecla P)
    this.input.keyboard.on('keydown-P', () => {
      // Toggle apenas o CollisionDebugger (nosso sistema customizado)
      if (this.collisionDebugger) {
        this.collisionDebugger.toggle();
        window.debugEnabled = this.collisionDebugger.isEnabled();
        
        // Atualizar visibilidade dos debug boxes dos elementos
        if (this.elementManager) {
          this.elementManager.setDebugVisible(window.debugEnabled);
        }
      }
    });

    // Configurar colisões do player
    this.addCollisionsToSprite(this.player, true);

    // Controller
    this.playerController = new PlayerController(this, this.player, { speed: 180 });
  },

  /**
   * Configura a câmera para seguir o player
   */
  setupCamera() {
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(this.defaultZoom); // Usar zoom da cena
  },

  /**
   * Retorna a posição X do spawn (sobrescrever em cenas filhas)
   * @returns {number}
   */
  getSpawnX() {
    return 0;
  },

  /**
   * Retorna a posição Y do spawn (sobrescrever em cenas filhas)
   * @returns {number}
   */
  getSpawnY() {
    return 0;
  }
};
