/**
 * Button - Componente de botão reutilizável
 * 
 * Uso:
 *   const btn = new Button(scene, 100, 200, 'Clique aqui', {
 *     onClick: () => console.log('clicou!')
 *   });
 *   btn.render();
 */

import UIComponent from './UIComponent.js';

export default class Button extends UIComponent {
  /**
   * @param {Phaser.Scene} scene 
   * @param {number} x - Posição X
   * @param {number} y - Posição Y
   * @param {string} text - Texto do botão
   * @param {Object} options - Opções de customização
   */
  constructor(scene, x, y, text, options = {}) {
    super(scene);
    
    this.x = x;
    this.y = y;
    this.text = text;
    
    this.options = {
      width: options.width || 200,
      height: options.height || 50,
      backgroundColor: options.backgroundColor || 0x2a2a3e,
      hoverColor: options.hoverColor || 0x3a3a5e,
      disabledColor: options.disabledColor || 0x1a1a2e,
      textColor: options.textColor || '#ffffff',
      fontSize: options.fontSize || '18px',
      borderRadius: options.borderRadius || 8,
      onClick: options.onClick || null,
      onHover: options.onHover || null,
      onHoverOut: options.onHoverOut || null
    };
    
    /** @type {Phaser.GameObjects.Rectangle} */
    this.background = null;
    
    /** @type {Phaser.GameObjects.Text} */
    this.label = null;
    
    /** @type {boolean} */
    this._isDisabled = false;
    
    /** @type {boolean} */
    this._isHovered = false;
  }
  
  render() {
    // Background
    this.background = this.createRectangle(
      this.x,
      this.y,
      this.options.width,
      this.options.height,
      this.options.backgroundColor
    );
    this.background.setOrigin(0.5);
    
    // Texto
    this.label = this.createText(this.x, this.y, this.text, {
      fontSize: this.options.fontSize,
      color: this.options.textColor,
      fontStyle: 'bold'
    });
    this.label.setOrigin(0.5);
    
    // Interatividade
    this.background.setInteractive({ useHandCursor: true });
    
    this.background.on('pointerover', () => this._onHover());
    this.background.on('pointerout', () => this._onHoverOut());
    this.background.on('pointerdown', () => this._onClick());
  }
  
  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================
  
  /**
   * Atualiza o texto do botão
   * @param {string} newText 
   */
  setText(newText) {
    this.text = newText;
    if (this.label) {
      this.label.setText(newText);
    }
  }
  
  /**
   * Desabilita o botão
   */
  disable() {
    this._isDisabled = true;
    if (this.background) {
      this.background.setFillStyle(this.options.disabledColor);
      this.background.disableInteractive();
    }
    if (this.label) {
      this.label.setAlpha(0.5);
    }
  }
  
  /**
   * Habilita o botão
   */
  enable() {
    this._isDisabled = false;
    if (this.background) {
      this.background.setFillStyle(this.options.backgroundColor);
      this.background.setInteractive({ useHandCursor: true });
    }
    if (this.label) {
      this.label.setAlpha(1);
    }
  }
  
  /**
   * Verifica se está desabilitado
   * @returns {boolean}
   */
  isDisabled() {
    return this._isDisabled;
  }
  
  /**
   * Define o callback de clique
   * @param {Function} callback 
   */
  setOnClick(callback) {
    this.options.onClick = callback;
  }
  
  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================
  
  /** @private */
  _onHover() {
    if (this._isDisabled) return;
    
    this._isHovered = true;
    if (this.background) {
      this.background.setFillStyle(this.options.hoverColor);
    }
    
    if (this.options.onHover) {
      this.options.onHover(this);
    }
  }
  
  /** @private */
  _onHoverOut() {
    if (this._isDisabled) return;
    
    this._isHovered = false;
    if (this.background) {
      this.background.setFillStyle(this.options.backgroundColor);
    }
    
    if (this.options.onHoverOut) {
      this.options.onHoverOut(this);
    }
  }
  
  /** @private */
  _onClick() {
    if (this._isDisabled) return;
    
    if (this.options.onClick) {
      this.options.onClick(this);
    }
  }
}
