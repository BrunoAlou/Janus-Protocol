/**
 * ElementManager - Gerenciador de elementos interativos no mapa
 * 
 * Carrega, gerencia e controla todos os elementos interativos de uma cena.
 * Integra-se com o sistema de física do Phaser para detecção de proximidade.
 * 
 * Uso:
 *   const manager = new ElementManager(scene, player);
 *   await manager.loadFromFile('reception');
 *   // ou
 *   manager.loadFromConfig(elementsConfig);
 */

import InteractiveElement from './InteractiveElement.js';
import FloatingMenu from '../ui/FloatingMenu.js';

// Carrega os JSON de elementos no bundle para funcionar em dev e produção (GitHub Pages).
const ELEMENT_CONFIGS = import.meta.glob('../data/elements/*.json', {
  eager: true,
  import: 'default'
});

const ELEMENT_CONFIG_URLS = import.meta.glob('../data/elements/*.json', {
  eager: true,
  query: '?url',
  import: 'default'
});

function normalizeMapId(value) {
  return String(value || '')
    .replace(/\.json$/i, '')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function resolveBundledElementConfig(mapId) {
  const raw = String(mapId || '');
  const fileName = raw.endsWith('.json') ? raw : `${raw}.json`;
  const exactKey = `../data/elements/${fileName}`;

  if (ELEMENT_CONFIGS[exactKey]) {
    return { data: ELEMENT_CONFIGS[exactKey], url: ELEMENT_CONFIG_URLS[exactKey] || null };
  }

  const wanted = normalizeMapId(fileName);
  const matchedKey = Object.keys(ELEMENT_CONFIGS).find((key) => {
    const assetFile = key.split('/').pop() || '';
    return normalizeMapId(assetFile) === wanted;
  });

  if (!matchedKey) {
    return { data: null, url: null };
  }

  return {
    data: ELEMENT_CONFIGS[matchedKey],
    url: ELEMENT_CONFIG_URLS[matchedKey] || null
  };
}

export default class ElementManager {
  /**
   * @param {Phaser.Scene} scene - Cena do Phaser
   * @param {Phaser.Physics.Arcade.Sprite} player - Sprite do jogador
   */
  constructor(scene, player) {
    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** @type {Phaser.Physics.Arcade.Sprite} */
    this.player = player;

    /** @type {Map<string, InteractiveElement>} */
    this.elements = new Map();

    /** @type {InteractiveElement|null} */
    this.currentInteractable = null;

    /** @type {Set<InteractiveElement>} */
    this.nearbyElements = new Set();

    /** @type {Phaser.Input.Keyboard.Key} */
    this.interactKey = null;
    
    /** @type {Map<string, number>} - Último timestamp de entrada por elemento */
    this._lastEnterTime = new Map();
    
    /** @type {Map<string, number>} - Último timestamp de saída por elemento */
    this._lastExitTime = new Map();
    
    /** @type {number} - Debounce em ms para evitar flickering */
    this._debounceMs = 100;
    
    /** @type {number} - Margem extra para detecção de saída (histerese) */
    this._exitMargin = 8;

    /** @type {FloatingMenu} */
    this.floatingMenu = null;

    /** @type {Set<string>} - IDs de elementos com listeners de mouse */
    this._elementMouseListeners = new Set();

    // Configurar tecla de interação
    this._setupInteractKey();

    // Configurar listeners de mouse global
    this._setupMouseListeners();

    console.log('[ElementManager] Initialized for scene:', scene.scene.key);
  }

  // ============================================
  // CONFIGURAÇÃO
  // ============================================

  /**
   * Configura a tecla de interação (E)
   * @private
   */
  _setupInteractKey() {
    this.interactKey = this.scene.input.keyboard.addKey('E');
    this.interactKey.on('down', () => this.handleInteraction());
  }

  /**
   * Configura listeners de mouse para objetos
   * @private
   */
  _setupMouseListeners() {
    // Click esquerdo para interagir com objetos
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.button === 0) { // Left click
        this.handleMouseClick(pointer);
      }
    });

    // Click direito para menu contextual
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.button === 2) { // Right click
        pointer.event.preventDefault?.();
        this.handleRightClick(pointer);
      }
    });
  }

  /**
   * Processa click esquerdo do mouse em elementos (objetos) - sem restrição de proximidade
   * @param {Phaser.Input.Pointer} pointer
   * @private
   */
  handleMouseClick(pointer) {
    // Buscar objetos sob o cursor em QUALQUER distância (não respeita proximidade)
    for (const element of this.elements.values()) {
      if (element.type === 'object' && this._isPointerOverElement(pointer, element)) {
        console.log('[ElementManager] Object clicked via mouse:', element.name);
        element.interact('mouse');
        return;
      }
    }
  }

  /**
   * Processa click direito para menu contextual - sem restrição de proximidade
   * @param {Phaser.Input.Pointer} pointer
   * @private
   */
  handleRightClick(pointer) {
    // Buscar objetos sob o cursor em QUALQUER distância (não respeita proximidade)
    for (const element of this.elements.values()) {
      if (element.type === 'object' && this._isPointerOverElement(pointer, element)) {
        this.showContextMenu(pointer.x, pointer.y, element);
        return;
      }
    }
  }

  /**
   * Verifica se o ponteiro está sobre a zona de um elemento
   * @private
   */
  _isPointerOverElement(pointer, element) {
    if (!element.area) return false;

    const { x, y, width, height } = element.area;
    const halfW = width / 2;
    const halfH = height / 2;

    return (
      pointer.worldX >= x - halfW &&
      pointer.worldX <= x + halfW &&
      pointer.worldY >= y - halfH &&
      pointer.worldY <= y + halfH
    );
  }

  /**
   * Exibe menu contextual com as opções de um elemento
   * @param {number} x - Posição X do mouse
   * @param {number} y - Posição Y do mouse
   * @param {InteractiveElement} element - Elemento a interagir
   */
  showContextMenu(x, y, element) {
    if (!this.floatingMenu) {
      this.floatingMenu = new FloatingMenu(this.scene);
    }

    // Criar opções baseadas no elemento e suas reações
    const options = [];

    // Opção principal (interagir)
    if (element.options && element.options.length > 0) {
      element.options.forEach(opt => {
        options.push({
          label: opt.label || 'Interact',
          icon: opt.icon || '◎',
          disabled: opt.disabled || false,
          action: () => {
            if (opt.action && typeof opt.action === 'function') {
              opt.action();
            } else {
              element.interact('mouse');
            }
          }
        });
      });
    } else {
      // Opção padrão se não houver opções customizadas
      options.push({
        label: `Interact with ${element.name}`,
        icon: '◎',
        action: () => element.interact('mouse')
      });
    }

    // Adicionar separador
    if (options.length > 0) {
      options.push({ label: '', icon: '', disabled: true });
    }

    // Opções adicionais
    options.push({
      label: 'Examine',
      icon: '◉',
      action: () => {
        console.log(`[ElementManager] Examined: ${element.name}`);
        if (element.description) {
          // Aqui você pode mostrar uma UI com a descrição
          console.log(`Description: ${element.description}`);
        }
      }
    });

    options.push({
      label: 'Cancel',
      icon: '✕',
      action: () => {
        this.floatingMenu.hide();
      }
    });

    // Mostrar menu
    this.floatingMenu.show(x, y, options);
  }

  // ============================================
  // CARREGAMENTO DE ELEMENTOS
  // ============================================

  /**
   * Carrega elementos de um arquivo JSON
   * @param {string} mapId - ID do mapa (ex: 'reception')
   * @returns {Promise<InteractiveElement[]>}
   */
  async loadFromFile(mapId) {
    try {
      console.log(`[ElementManager] Attempting to load elements for map: ${mapId}`);
      
      // Tentar carregar do cache do Phaser primeiro
      const cacheKey = `elements_${mapId}`;
      let data = this.scene.cache.json.get(cacheKey);

      if (!data) {
        console.log('[ElementManager] Not in cache, loading bundled config...');

        // Primeiro tenta via import.meta.glob (compatível com Vite build/base path)
        const bundled = resolveBundledElementConfig(mapId);
        data = bundled.data;

        // Fallback para fetch relativo em cenários fora do fluxo do Vite
        if (!data) {
          if (!bundled.url) {
            console.warn(`[ElementManager] No bundled elements file for map: ${mapId}`);
            return [];
          }

          const response = await fetch(bundled.url);
          console.log(`[ElementManager] Fallback fetch response status: ${response.status}`);

          if (!response.ok) {
            console.warn(`[ElementManager] No elements file for map: ${mapId}`);
            return [];
          }
          data = await response.json();
        }

        // Cachear para evitar recarregamentos
        this.scene.cache.json.add(cacheKey, data);
        console.log('[ElementManager] Loaded data for map:', mapId, data);
      } else {
        console.log(`[ElementManager] Loaded from cache`);
      }

      return this.loadFromConfig(data);
    } catch (error) {
      console.error(`[ElementManager] Error loading elements for ${mapId}:`, error);
      return [];
    }
  }

  /**
   * Carrega elementos de uma configuração
   * @param {Object} config - Configuração de elementos
   * @returns {InteractiveElement[]}
   */
  loadFromConfig(config) {
    const { elements = [] } = config;
    const loadedElements = [];

    elements.forEach(elementConfig => {
      try {
        const element = this.createElement(elementConfig);
        loadedElements.push(element);
      } catch (error) {
        console.error(`[ElementManager] Error creating element ${elementConfig.id}:`, error);
      }
    });

    console.log(`[ElementManager] Loaded ${loadedElements.length} elements`);
    return loadedElements;
  }

  /**
   * Cria um elemento interativo
   * @param {Object} config - Configuração do elemento
   * @returns {InteractiveElement}
   */
  createElement(config) {
    const element = new InteractiveElement(this.scene, config);
    
    // Registrar no mapa
    this.elements.set(element.id, element);

    // Configurar detecção de colisão com player
    this._setupElementCollision(element);

    return element;
  }

  /**
   * Configura colisão entre player e zona de interação do elemento
   * @private
   */
  _setupElementCollision(element) {
    if (!element.interactionZone || !this.player) {
      console.warn(`[ElementManager] Cannot setup collision for ${element.id}`);
      return;
    }

    // Overlap entre player e zona de interação
    this.scene.physics.add.overlap(
      this.player,
      element.interactionZone,
      () => this._onPlayerOverlapElement(element),
      null,
      this
    );
  }

  /**
   * Callback quando player está sobreposto à zona de interação
   * @private
   */
  _onPlayerOverlapElement(element) {
    const now = Date.now();
    
    // Verificar se já está na lista de próximos
    if (!this.nearbyElements.has(element)) {
      // Verificar debounce - evitar reentrada rápida após saída
      const lastExit = this._lastExitTime.get(element.id) || 0;
      if (now - lastExit < this._debounceMs) {
        return; // Ignorar entrada muito rápida após saída (flickering)
      }
      
      this.nearbyElements.add(element);
      this._lastEnterTime.set(element.id, now);
      element.onPlayerEnter(this.player);
    }

    // Atualizar elemento interagível atual (priorizar o mais próximo)
    this._updateCurrentInteractable();
  }

  /**
   * Atualiza qual elemento é o atual interagível
   * @private
   */
  _updateCurrentInteractable() {
    // Filtrar apenas elementos que podem ser interagidos manualmente (não triggers)
    const interactableElements = [...this.nearbyElements].filter(e => e.type !== 'trigger');

    if (interactableElements.length === 0) {
      this.currentInteractable = null;
      return;
    }

    if (interactableElements.length === 1) {
      this.currentInteractable = interactableElements[0];
      return;
    }

    // Múltiplos elementos próximos - escolher o mais próximo (excluindo triggers)
    let closest = null;
    let closestDist = Infinity;

    for (const element of interactableElements) {
      const dx = this.player.x - element.area.x;
      const dy = this.player.y - element.area.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closest = element;
      }
    }

    this.currentInteractable = closest;
  }

  // ============================================
  // INTERAÇÃO
  // ============================================

  /**
   * Processa interação quando tecla E é pressionada - respeita proximidade
   * @returns {boolean} true se processou uma interação
   */
  handleInteraction() {
    if (!this.currentInteractable) {
      // Não logar aqui - deixar o InteractionManager tentar
      return false;
    }

    this.currentInteractable.interact('keyboard');
    return true;
  }

  // ============================================
  // ATUALIZAÇÃO
  // ============================================

  /**
   * Atualiza o gerenciador (chamado no update da cena)
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    const now = Date.now();
    
    // Verificar quais elementos o player saiu (com debounce e histerese)
    for (const element of this.nearbyElements) {
      if (this._checkPlayerExit(element)) {
        this.nearbyElements.delete(element);
        this._lastExitTime.set(element.id, now);
        element.onPlayerExit(this.player);
      }
    }

    // Atualizar elemento atual
    this._updateCurrentInteractable();

    // Atualizar cada elemento
    for (const element of this.elements.values()) {
      element.update(time, delta);
    }
  }

  /**
   * Verifica se o player está dentro da área de um elemento (com histerese para saída)
   * @private
   * @param {InteractiveElement} element
   * @param {boolean} [forExit=false] - Se true, usa margem extra para evitar flickering
   */
  _isPlayerInElement(element, forExit = false) {
    if (!this.player || !element.area) return false;

    const { x, y, width, height } = element.area;
    
    // Usar margem extra para verificação de saída (histerese)
    const margin = forExit ? this._exitMargin : 0;
    const halfW = (width / 2) + margin;
    const halfH = (height / 2) + margin;

    return (
      this.player.x >= x - halfW &&
      this.player.x <= x + halfW &&
      this.player.y >= y - halfH &&
      this.player.y <= y + halfH
    );
  }
  
  /**
   * Verifica se o player saiu de um elemento (com debounce)
   * @private
   */
  _checkPlayerExit(element) {
    const now = Date.now();
    
    // Verificar se está fora da área (com histerese)
    if (this._isPlayerInElement(element, true)) {
      return false; // Ainda dentro da área expandida
    }
    
    // Verificar debounce - evitar saída muito rápida após entrada
    const lastEnter = this._lastEnterTime.get(element.id) || 0;
    if (now - lastEnter < this._debounceMs) {
      return false; // Ignorar saída muito rápida após entrada (flickering)
    }
    
    return true; // Confirmado: player saiu
  }

  // ============================================
  // CONSULTAS
  // ============================================

  /**
   * Obtém um elemento pelo ID
   * @param {string} id
   * @returns {InteractiveElement|undefined}
   */
  getElement(id) {
    return this.elements.get(id);
  }

  /**
   * Obtém todos os elementos de um tipo
   * @param {string} type
   * @returns {InteractiveElement[]}
   */
  getElementsByType(type) {
    return [...this.elements.values()].filter(e => e.type === type);
  }

  /**
   * Obtém todos os NPCs
   * @returns {InteractiveElement[]}
   */
  getNPCs() {
    return this.getElementsByType('npc');
  }

  /**
   * Obtém todas as portas
   * @returns {InteractiveElement[]}
   */
  getDoors() {
    return this.getElementsByType('door');
  }

  /**
   * Obtém todos os objetos interativos
   * @returns {InteractiveElement[]}
   */
  getObjects() {
    return this.getElementsByType('object');
  }

  // ============================================
  // DEBUG
  // ============================================

  /**
   * Define a visibilidade dos elementos de debug em todos os elementos
   * @param {boolean} visible
   */
  setDebugVisible(visible) {
    for (const element of this.elements.values()) {
      element.setDebugVisible(visible);
    }
    console.log(`[ElementManager] Debug visibility: ${visible ? 'ON' : 'OFF'}`);
  }

  // ============================================
  // MODIFICAÇÃO
  // ============================================

  /**
   * Adiciona um elemento em runtime
   * @param {Object} config
   * @returns {InteractiveElement}
   */
  addElement(config) {
    return this.createElement(config);
  }

  /**
   * Remove um elemento
   * @param {string} id
   */
  removeElement(id) {
    const element = this.elements.get(id);
    if (element) {
      this.nearbyElements.delete(element);
      if (this.currentInteractable === element) {
        this.currentInteractable = null;
      }
      element.destroy();
      this.elements.delete(id);
      console.log(`[ElementManager] Removed element: ${id}`);
    }
  }

  // ============================================
  // DESTRUIÇÃO
  // ============================================

  /**
   * Destrói todos os elementos e limpa recursos
   */
  destroy() {
    for (const element of this.elements.values()) {
      element.destroy();
    }
    this.elements.clear();
    this.nearbyElements.clear();
    this.currentInteractable = null;

    if (this.floatingMenu) {
      this.floatingMenu.destroy();
      this.floatingMenu = null;
    }

    this._elementMouseListeners.clear();

    console.log('[ElementManager] Destroyed');
  }
}
