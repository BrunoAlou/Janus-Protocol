/**
 * ServiceContainer - Container de Inversão de Controle (IoC)
 * 
 * Permite registrar e resolver dependências de forma centralizada,
 * facilitando testes e desacoplamento entre componentes.
 * 
 * Uso:
 *   const container = new ServiceContainer();
 *   container.register('logger', () => new Logger());
 *   container.singleton('sceneManager', () => new SceneManager(game));
 *   
 *   const logger = container.get('logger');
 */

export default class ServiceContainer {
  constructor() {
    /** @type {Map<string, {factory: Function, singleton: boolean}>} */
    this._services = new Map();
    
    /** @type {Map<string, any>} */
    this._singletons = new Map();
    
    /** @type {Set<string>} */
    this._resolving = new Set(); // Para detectar dependências circulares
  }
  
  // ============================================
  // REGISTRO DE SERVIÇOS
  // ============================================
  
  /**
   * Registra um serviço com factory
   * @param {string} name - Nome do serviço
   * @param {Function} factory - Função que cria a instância
   * @param {boolean} singleton - Se deve ser singleton
   * @returns {ServiceContainer} - Para encadeamento
   */
  register(name, factory, singleton = false) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory para '${name}' deve ser uma função`);
    }
    
    this._services.set(name, { factory, singleton });
    return this;
  }
  
  /**
   * Registra um serviço como singleton
   * @param {string} name - Nome do serviço
   * @param {Function} factory - Função que cria a instância
   * @returns {ServiceContainer} - Para encadeamento
   */
  singleton(name, factory) {
    return this.register(name, factory, true);
  }
  
  /**
   * Registra uma instância já criada (sempre singleton)
   * @param {string} name - Nome do serviço
   * @param {any} instance - Instância do serviço
   * @returns {ServiceContainer} - Para encadeamento
   */
  instance(name, instance) {
    this._singletons.set(name, instance);
    this._services.set(name, { factory: () => instance, singleton: true });
    return this;
  }
  
  // ============================================
  // RESOLUÇÃO DE SERVIÇOS
  // ============================================
  
  /**
   * Obtém um serviço pelo nome
   * @template T
   * @param {string} name - Nome do serviço
   * @returns {T} - Instância do serviço
   */
  get(name) {
    // Verificar se existe
    if (!this._services.has(name)) {
      throw new Error(`Serviço não encontrado: '${name}'`);
    }
    
    const service = this._services.get(name);
    
    // Retornar singleton se já existe
    if (service.singleton && this._singletons.has(name)) {
      return this._singletons.get(name);
    }
    
    // Detectar dependência circular
    if (this._resolving.has(name)) {
      throw new Error(`Dependência circular detectada: '${name}'`);
    }
    
    // Resolver
    this._resolving.add(name);
    
    try {
      const instance = service.factory(this);
      
      // Armazenar singleton
      if (service.singleton) {
        this._singletons.set(name, instance);
      }
      
      return instance;
    } finally {
      this._resolving.delete(name);
    }
  }
  
  /**
   * Verifica se um serviço existe
   * @param {string} name - Nome do serviço
   * @returns {boolean}
   */
  has(name) {
    return this._services.has(name);
  }
  
  /**
   * Tenta obter um serviço, retorna null se não existir
   * @template T
   * @param {string} name - Nome do serviço
   * @returns {T|null}
   */
  tryGet(name) {
    try {
      return this.get(name);
    } catch {
      return null;
    }
  }
  
  // ============================================
  // GERENCIAMENTO
  // ============================================
  
  /**
   * Remove um serviço
   * @param {string} name - Nome do serviço
   */
  remove(name) {
    this._services.delete(name);
    this._singletons.delete(name);
  }
  
  /**
   * Limpa o singleton de um serviço (força recriação)
   * @param {string} name - Nome do serviço
   */
  clearSingleton(name) {
    this._singletons.delete(name);
  }
  
  /**
   * Limpa todos os singletons
   */
  clearAllSingletons() {
    this._singletons.clear();
  }
  
  /**
   * Lista todos os serviços registrados
   * @returns {string[]}
   */
  getRegisteredServices() {
    return Array.from(this._services.keys());
  }
  
  /**
   * Destrói o container e limpa tudo
   */
  destroy() {
    // Chamar destroy em singletons que têm esse método
    this._singletons.forEach((instance, name) => {
      if (instance && typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (e) {
          console.warn(`Erro ao destruir serviço '${name}':`, e);
        }
      }
    });
    
    this._services.clear();
    this._singletons.clear();
  }
  
  // ============================================
  // FACTORY METHODS
  // ============================================
  
  /**
   * Cria um factory wrapper que injeta dependências automaticamente
   * @param {Function} ClassConstructor - Classe a ser instanciada
   * @param {string[]} dependencies - Nomes das dependências
   * @returns {Function} - Factory function
   */
  static createFactory(ClassConstructor, dependencies = []) {
    return (container) => {
      const deps = dependencies.map(dep => container.get(dep));
      return new ClassConstructor(...deps);
    };
  }
}

// ============================================
// SERVICE NAMES (para evitar magic strings)
// ============================================

export const SERVICE_NAMES = Object.freeze({
  // Core
  GAME: 'game',
  SCENE_MANAGER: 'sceneManager',
  STATE_MANAGER: 'stateManager',
  
  // Auth
  AUTH_MANAGER: 'authManager',
  
  // Factories
  PLAYER_FACTORY: 'playerFactory',
  NPC_FACTORY: 'npcFactory',
  
  // Utilities
  TELEMETRY: 'telemetry',
  LOGGER: 'logger',
  
  // UI
  DIALOG_MANAGER: 'dialogManager',
  NOTIFICATION_SERVICE: 'notificationService'
});
