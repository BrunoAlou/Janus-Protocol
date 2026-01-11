/**
 * MinigameHeader - Componente de cabeçalho para minigames
 * 
 * Uso:
 *   const header = new MinigameHeader(scene, 'QUIZ', 'Teste seus conhecimentos');
 *   header.render();
 */

import UIComponent from './UIComponent.js';

export default class MinigameHeader extends UIComponent {
  /**
   * @param {Phaser.Scene} scene 
   * @param {string} title - Título principal
   * @param {string} subtitle - Subtítulo/descrição
   * @param {Object} options - Opções de customização
   */
  constructor(scene, title, subtitle = '', options = {}) {
    super(scene);
    
    this.title = title;
    this.subtitle = subtitle;
    
    this.options = {
      titleY: options.titleY || 80,
      subtitleY: options.subtitleY || 140,
      titleStyle: {
        fontSize: '36px',
        color: '#00d9ff',
        fontStyle: 'bold',
        ...options.titleStyle
      },
      subtitleStyle: {
        fontSize: '16px',
        color: '#ffffff',
        ...options.subtitleStyle
      }
    };
    
    /** @type {Phaser.GameObjects.Text} */
    this.titleText = null;
    
    /** @type {Phaser.GameObjects.Text} */
    this.subtitleText = null;
  }
  
  render() {
    const { width } = this.scene.cameras.main;
    
    // Título
    this.titleText = this.createText(
      width / 2, 
      this.options.titleY, 
      this.title, 
      this.options.titleStyle
    );
    this.titleText.setOrigin(0.5);
    
    // Subtítulo (se houver)
    if (this.subtitle) {
      this.subtitleText = this.createText(
        width / 2, 
        this.options.subtitleY, 
        this.subtitle, 
        this.options.subtitleStyle
      );
      this.subtitleText.setOrigin(0.5);
    }
  }
  
  /**
   * Atualiza o título
   * @param {string} newTitle 
   */
  setTitle(newTitle) {
    this.title = newTitle;
    if (this.titleText) {
      this.titleText.setText(newTitle);
    }
  }
  
  /**
   * Atualiza o subtítulo
   * @param {string} newSubtitle 
   */
  setSubtitle(newSubtitle) {
    this.subtitle = newSubtitle;
    if (this.subtitleText) {
      this.subtitleText.setText(newSubtitle);
    }
  }
}
