/**
 * UIComponent - Classe base abstrata para componentes de UI reutilizáveis
 * 
 * Uso:
 *   class MyComponent extends UIComponent {
 *     render() {
 *       // Criar elementos
 *     }
 *   }
 */

export default class UIComponent {
  /**
   * @param {Phaser.Scene} scene - Cena onde o componente será renderizado
   */
  constructor(scene) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent é uma classe abstrata e não pode ser instanciada diretamente');
    }
    
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {Phaser.GameObjects.GameObject[]} */
    this.elements = [];
    
    /** @type {boolean} */
    this._isVisible = true;
    
    /** @type {boolean} */
    this._isRendered = false;
    
    /** @type {number} */
    this.depth = 1000;
  }
  
  // ============================================
  // MÉTODOS ABSTRATOS (devem ser implementados)
  // ============================================
  
  /**
   * Renderiza o componente. Deve ser implementado pelas subclasses.
   * @abstract
   */
  render() {
    throw new Error('Método render() deve ser implementado');
  }
  
  // ============================================
  // MÉTODOS DE VISIBILIDADE
  // ============================================
  
  /**
   * Mostra o componente
   */
  show() {
    this._isVisible = true;
    this.elements.forEach(el => {
      if (el?.setVisible) {
        el.setVisible(true);
      }
    });
  }
  
  /**
   * Esconde o componente
   */
  hide() {
    this._isVisible = false;
    this.elements.forEach(el => {
      if (el?.setVisible) {
        el.setVisible(false);
      }
    });
  }
  
  /**
   * Alterna visibilidade
   */
  toggle() {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Verifica se está visível
   * @returns {boolean}
   */
  isVisible() {
    return this._isVisible;
  }
  
  // ============================================
  // MÉTODOS DE GERENCIAMENTO
  // ============================================
  
  /**
   * Adiciona um elemento ao componente
   * @param {Phaser.GameObjects.GameObject} element 
   * @returns {Phaser.GameObjects.GameObject}
   */
  addElement(element) {
    if (element?.setDepth) {
      element.setDepth(this.depth);
    }
    this.elements.push(element);
    return element;
  }
  
  /**
   * Remove um elemento do componente
   * @param {Phaser.GameObjects.GameObject} element 
   */
  removeElement(element) {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      if (element?.destroy) {
        element.destroy();
      }
    }
  }
  
  /**
   * Define a profundidade de todos os elementos
   * @param {number} depth 
   */
  setDepth(depth) {
    this.depth = depth;
    this.elements.forEach(el => {
      if (el?.setDepth) {
        el.setDepth(depth);
      }
    });
  }
  
  /**
   * Define a posição de todos os elementos (offset)
   * @param {number} x 
   * @param {number} y 
   */
  setPosition(x, y) {
    this.elements.forEach(el => {
      if (el?.setPosition) {
        el.setPosition(el.x + x, el.y + y);
      }
    });
  }
  
  // ============================================
  // MÉTODOS DE CICLO DE VIDA
  // ============================================
  
  /**
   * Inicializa e renderiza o componente
   */
  init() {
    if (!this._isRendered) {
      this.render();
      this._isRendered = true;
    }
  }
  
  /**
   * Atualização chamada a cada frame (opcional)
   * @param {number} time 
   * @param {number} delta 
   */
  update(time, delta) {
    // Subclasses podem sobrescrever
  }
  
  /**
   * Destrói o componente e todos os elementos
   */
  destroy() {
    this.elements.forEach(el => {
      if (el?.destroy) {
        el.destroy();
      }
    });
    this.elements = [];
    this._isRendered = false;
  }
  
  // ============================================
  // HELPERS PARA CRIAÇÃO DE ELEMENTOS
  // ============================================
  
  /**
   * Cria um texto e adiciona ao componente
   * @param {number} x 
   * @param {number} y 
   * @param {string} text 
   * @param {Object} style 
   * @returns {Phaser.GameObjects.Text}
   */
  createText(x, y, text, style = {}) {
    const defaultStyle = {
      fontSize: '16px',
      color: '#ffffff'
    };
    
    const textObj = this.scene.add.text(x, y, text, { ...defaultStyle, ...style });
    return this.addElement(textObj);
  }
  
  /**
   * Cria um retângulo e adiciona ao componente
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {number} color 
   * @param {number} alpha 
   * @returns {Phaser.GameObjects.Rectangle}
   */
  createRectangle(x, y, width, height, color = 0x000000, alpha = 1) {
    const rect = this.scene.add.rectangle(x, y, width, height, color, alpha);
    return this.addElement(rect);
  }
  
  /**
   * Cria uma imagem e adiciona ao componente
   * @param {number} x 
   * @param {number} y 
   * @param {string} texture 
   * @param {string|number} frame 
   * @returns {Phaser.GameObjects.Image}
   */
  createImage(x, y, texture, frame) {
    const img = this.scene.add.image(x, y, texture, frame);
    return this.addElement(img);
  }
  
  /**
   * Cria um container e adiciona ao componente
   * @param {number} x 
   * @param {number} y 
   * @returns {Phaser.GameObjects.Container}
   */
  createContainer(x, y) {
    const container = this.scene.add.container(x, y);
    return this.addElement(container);
  }
}
