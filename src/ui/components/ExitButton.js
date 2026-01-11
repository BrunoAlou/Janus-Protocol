/**
 * ExitButton - Componente de botão de sair para minigames
 * 
 * Uso:
 *   const exitBtn = new ExitButton(scene, {
 *     onExit: () => scene.scene.stop()
 *   });
 *   exitBtn.render();
 */

import UIComponent from './UIComponent.js';

export default class ExitButton extends UIComponent {
  /**
   * @param {Phaser.Scene} scene 
   * @param {Object} options - Opções de customização
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      x: options.x || 20,
      y: options.y || 30,
      text: options.text || '← SAIR',
      fontSize: options.fontSize || '18px',
      color: options.color || '#ff0000',
      hoverColor: options.hoverColor || '#ff6666',
      onExit: options.onExit || null,
      confirmExit: options.confirmExit !== false
    };
    
    /** @type {Phaser.GameObjects.Text} */
    this.button = null;
  }
  
  render() {
    this.button = this.createText(
      this.options.x,
      this.options.y,
      this.options.text,
      {
        fontSize: this.options.fontSize,
        color: this.options.color,
        fontStyle: 'bold'
      }
    );
    this.button.setOrigin(0);
    this.button.setInteractive({ useHandCursor: true });
    
    // Eventos
    this.button.on('pointerover', () => {
      this.button.setColor(this.options.hoverColor);
    });
    
    this.button.on('pointerout', () => {
      this.button.setColor(this.options.color);
    });
    
    this.button.on('pointerdown', () => {
      this._handleExit();
    });
  }
  
  /**
   * Handler de saída
   * @private
   */
  _handleExit() {
    if (this.options.confirmExit) {
      this._showConfirmDialog();
    } else {
      this._doExit();
    }
  }
  
  /**
   * Mostra diálogo de confirmação
   * @private
   */
  _showConfirmDialog() {
    const { width, height } = this.scene.cameras.main;
    
    // Overlay
    const overlay = this.scene.add.rectangle(
      width / 2, height / 2, 
      width, height, 
      0x000000, 0.7
    ).setDepth(9998);
    
    // Dialog
    const dialog = this.scene.add.container(width / 2, height / 2).setDepth(9999);
    
    const bg = this.scene.add.rectangle(0, 0, 300, 150, 0x2a2a3e);
    const title = this.scene.add.text(0, -40, 'Sair do jogo?', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const confirmBtn = this.scene.add.text(-50, 30, 'SIM', {
      fontSize: '18px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    const cancelBtn = this.scene.add.text(50, 30, 'NÃO', {
      fontSize: '18px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    dialog.add([bg, title, confirmBtn, cancelBtn]);
    
    // Eventos
    confirmBtn.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
      this._doExit();
    });
    
    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
    });
  }
  
  /**
   * Executa a saída
   * @private
   */
  _doExit() {
    if (this.options.onExit) {
      this.options.onExit();
    } else {
      // Comportamento padrão: usar SceneManager
      if (window.sceneManager) {
        window.sceneManager.endMinigame({ completed: false, reason: 'user_exit' });
      }
    }
  }
}
