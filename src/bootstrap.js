/**
 * Bootstrap - Inicialização de Serviços e Configuração
 * 
 * Este arquivo configura todos os serviços e dependências do jogo.
 * Deve ser importado uma única vez no início da aplicação (main.js).
 * 
 * @module bootstrap
 */

import { ServiceContainer, SERVICE_NAMES } from './services/ServiceContainer.js';
import { GameStateManager } from './state/GameStateManager.js';
import { SCENE_NAMES } from './constants/SceneNames.js';
import { GAME_EVENTS } from './constants/GameEvents.js';

/**
 * Container de serviços global
 * @type {ServiceContainer}
 */
let container = null;

/**
 * Inicializa todos os serviços do jogo
 * 
 * @param {Object} options - Opções de configuração
 * @param {Phaser.Game} [options.game] - Instância do jogo Phaser (opcional no boot)
 * @param {Object} [options.config] - Configurações customizadas
 * @returns {ServiceContainer} Container de serviços configurado
 * 
 * @example
 * // Em main.js
 * import { bootstrap } from './bootstrap.js';
 * 
 * const services = bootstrap();
 * const game = new Phaser.Game(config);
 * services.instance(SERVICE_NAMES.GAME, game);
 */
export function bootstrap(options = {}) {
  if (container) {
    console.warn('[Bootstrap] Services already initialized, returning existing container');
    return container;
  }

  console.log('[Bootstrap] Initializing services...');
  container = new ServiceContainer();

  // === Registrar singletons (criados sob demanda) ===

  // GameStateManager - Gerenciador de estado centralizado
  container.singleton(SERVICE_NAMES.STATE_MANAGER, () => {
    const stateManager = new GameStateManager({
      currentScene: null,
      player: null,
      settings: {
        musicVolume: 0.7,
        sfxVolume: 1.0,
        language: 'pt-BR'
      },
      session: {
        startTime: Date.now(),
        completedMinigames: [],
        visitedMaps: []
      }
    });

    console.log('[Bootstrap] GameStateManager created');
    return stateManager;
  });

  // === Registrar factories ===

  // Factory para criar eventos tipados
  container.register('eventFactory', () => ({
    create: (eventName, data = {}) => ({
      name: eventName,
      timestamp: Date.now(),
      data
    })
  }));

  // === Registrar instâncias passadas nas options ===

  if (options.game) {
    container.instance(SERVICE_NAMES.GAME, options.game);
  }

  if (options.config) {
    container.instance('config', options.config);
  }

  console.log('[Bootstrap] Services initialized:', container.getRegisteredServices());
  return container;
}

/**
 * Obtém o container de serviços global
 * 
 * @returns {ServiceContainer|null} Container ou null se não inicializado
 * @throws {Error} Se chamado antes de bootstrap()
 * 
 * @example
 * import { getContainer, SERVICE_NAMES } from './bootstrap.js';
 * 
 * const stateManager = getContainer().get(SERVICE_NAMES.STATE_MANAGER);
 */
export function getContainer() {
  if (!container) {
    throw new Error('[Bootstrap] Services not initialized. Call bootstrap() first.');
  }
  return container;
}

/**
 * Obtém um serviço diretamente
 * Atalho para getContainer().get(serviceName)
 * 
 * @param {string} serviceName - Nome do serviço
 * @returns {*} Instância do serviço
 * 
 * @example
 * import { getService, SERVICE_NAMES } from './bootstrap.js';
 * 
 * const stateManager = getService(SERVICE_NAMES.STATE_MANAGER);
 */
export function getService(serviceName) {
  return getContainer().get(serviceName);
}

/**
 * Registra a instância do jogo Phaser após criação
 * 
 * @param {Phaser.Game} game - Instância do jogo
 * 
 * @example
 * const game = new Phaser.Game(config);
 * registerGame(game);
 */
export function registerGame(game) {
  if (!container) {
    throw new Error('[Bootstrap] Services not initialized. Call bootstrap() first.');
  }
  container.instance(SERVICE_NAMES.GAME, game);
  console.log('[Bootstrap] Game instance registered');
}

/**
 * Registra o SceneManager para uso global
 * 
 * @param {SceneManager} sceneManager - Instância do SceneManager
 */
export function registerSceneManager(sceneManager) {
  if (!container) {
    throw new Error('[Bootstrap] Services not initialized. Call bootstrap() first.');
  }
  container.instance(SERVICE_NAMES.SCENE_MANAGER, sceneManager);
  console.log('[Bootstrap] SceneManager registered');
}

/**
 * Limpa todos os serviços (útil para testes ou reset)
 */
export function cleanup() {
  if (container) {
    container.clear();
    container = null;
    console.log('[Bootstrap] Services cleaned up');
  }
}

// Re-exportar constantes úteis
export { SERVICE_NAMES } from './services/ServiceContainer.js';
export { SCENE_NAMES } from './constants/SceneNames.js';
export { GAME_EVENTS } from './constants/GameEvents.js';

/**
 * Helper para uso em scenes Phaser
 * 
 * @example
 * // Em uma scene:
 * import { SceneHelper } from '../bootstrap.js';
 * 
 * create() {
 *   const helper = new SceneHelper(this);
 *   const state = helper.getStateManager();
 *   state.setState({ currentScene: this.scene.key });
 * }
 */
export class SceneHelper {
  /**
   * @param {Phaser.Scene} scene 
   */
  constructor(scene) {
    this.scene = scene;
    this._container = getContainer();
  }

  /**
   * Obtém o GameStateManager
   * @returns {GameStateManager}
   */
  getStateManager() {
    return this._container.get(SERVICE_NAMES.STATE_MANAGER);
  }

  /**
   * Obtém o SceneManager
   * @returns {SceneManager}
   */
  getSceneManager() {
    return this._container.get(SERVICE_NAMES.SCENE_MANAGER);
  }

  /**
   * Registra cleanup automático quando a scene for destruída
   * @param {Function} cleanupFn - Função de limpeza
   */
  onShutdown(cleanupFn) {
    this.scene.events.once('shutdown', cleanupFn);
  }

  /**
   * Emite evento de cena
   * @param {string} eventName 
   * @param {*} data 
   */
  emit(eventName, data) {
    this.scene.events.emit(eventName, data);
  }
}
