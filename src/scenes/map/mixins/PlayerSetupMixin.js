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
    const camera = this.cameras.main;
    camera.setZoom(this.defaultZoom); // Usar zoom da cena

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    const viewWorldWidth = camera.width / camera.zoom;
    const viewWorldHeight = camera.height / camera.zoom;

    // Quando a viewport em unidades de mundo for maior que o mapa,
    // adiciona margens para permitir centralizacao correta.
    const marginX = Math.max(0, (viewWorldWidth - mapWidth) / 2);
    const marginY = Math.max(0, (viewWorldHeight - mapHeight) / 2);

    camera.setBounds(
      -marginX,
      -marginY,
      mapWidth + (marginX * 2),
      mapHeight + (marginY * 2)
    );

    camera.startFollow(this.player);
    camera.centerOn(this.player.x, this.player.y);
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
