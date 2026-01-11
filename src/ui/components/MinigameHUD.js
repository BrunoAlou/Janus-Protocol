/**
 * MinigameHUD - Componente de HUD para minigames (score, timer, etc.)
 * 
 * Uso:
 *   const hud = new MinigameHUD(scene);
 *   hud.render();
 *   hud.updateScore(100);
 *   hud.updateTime(30);
 */

import UIComponent from './UIComponent.js';

export default class MinigameHUD extends UIComponent {
  /**
   * @param {Phaser.Scene} scene 
   * @param {Object} options - Opções de customização
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      showTimer: options.showTimer !== false,
      showScore: options.showScore !== false,
      timerY: options.timerY || 30,
      scoreY: options.scoreY || 30,
      timerFormat: options.timerFormat || 'Tempo: {time}s',
      scoreFormat: options.scoreFormat || 'Pontos: {score}',
      timerStyle: {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        ...options.timerStyle
      },
      scoreStyle: {
        fontSize: '20px',
        color: '#00d9ff',
        ...options.scoreStyle
      }
    };
    
    /** @type {number} */
    this._score = 0;
    
    /** @type {number} */
    this._time = 0;
    
    /** @type {Phaser.GameObjects.Text} */
    this.timerText = null;
    
    /** @type {Phaser.GameObjects.Text} */
    this.scoreText = null;
    
    /** @type {Phaser.Time.TimerEvent} */
    this._timerEvent = null;
    
    /** @type {boolean} */
    this._timerRunning = false;
  }
  
  render() {
    const { width } = this.scene.cameras.main;
    
    // Timer (centro)
    if (this.options.showTimer) {
      this.timerText = this.createText(
        width / 2,
        this.options.timerY,
        this._formatTime(this._time),
        this.options.timerStyle
      );
      this.timerText.setOrigin(0.5);
    }
    
    // Score (direita)
    if (this.options.showScore) {
      this.scoreText = this.createText(
        width - 20,
        this.options.scoreY,
        this._formatScore(this._score),
        this.options.scoreStyle
      );
      this.scoreText.setOrigin(1, 0);
    }
  }
  
  // ============================================
  // MÉTODOS DE SCORE
  // ============================================
  
  /**
   * Atualiza o score
   * @param {number} value 
   */
  updateScore(value) {
    this._score = value;
    if (this.scoreText) {
      this.scoreText.setText(this._formatScore(value));
    }
  }
  
  /**
   * Adiciona ao score
   * @param {number} amount 
   */
  addScore(amount) {
    this.updateScore(this._score + amount);
  }
  
  /**
   * Obtém o score atual
   * @returns {number}
   */
  getScore() {
    return this._score;
  }
  
  /**
   * Reseta o score
   */
  resetScore() {
    this.updateScore(0);
  }
  
  // ============================================
  // MÉTODOS DE TIMER
  // ============================================
  
  /**
   * Atualiza o tempo exibido
   * @param {number} seconds 
   */
  updateTime(seconds) {
    this._time = seconds;
    if (this.timerText) {
      this.timerText.setText(this._formatTime(seconds));
    }
  }
  
  /**
   * Inicia o timer automático (incrementa a cada segundo)
   */
  startTimer() {
    if (this._timerRunning) return;
    
    this._timerRunning = true;
    this._timerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this._time++;
        this.updateTime(this._time);
      },
      loop: true
    });
  }
  
  /**
   * Inicia um timer de contagem regressiva
   * @param {number} seconds - Segundos iniciais
   * @param {Function} onComplete - Callback quando chegar a zero
   */
  startCountdown(seconds, onComplete) {
    if (this._timerRunning) return;
    
    this._time = seconds;
    this.updateTime(seconds);
    this._timerRunning = true;
    
    this._timerEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        this._time--;
        this.updateTime(this._time);
        
        if (this._time <= 0) {
          this.stopTimer();
          if (onComplete) onComplete();
        }
      },
      loop: true
    });
  }
  
  /**
   * Para o timer
   */
  stopTimer() {
    this._timerRunning = false;
    if (this._timerEvent) {
      this._timerEvent.destroy();
      this._timerEvent = null;
    }
  }
  
  /**
   * Pausa o timer
   */
  pauseTimer() {
    if (this._timerEvent) {
      this._timerEvent.paused = true;
    }
  }
  
  /**
   * Resume o timer
   */
  resumeTimer() {
    if (this._timerEvent) {
      this._timerEvent.paused = false;
    }
  }
  
  /**
   * Obtém o tempo atual
   * @returns {number}
   */
  getTime() {
    return this._time;
  }
  
  /**
   * Reseta o timer
   */
  resetTimer() {
    this.stopTimer();
    this.updateTime(0);
  }
  
  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================
  
  /**
   * Formata o tempo para exibição
   * @param {number} seconds 
   * @returns {string}
   * @private
   */
  _formatTime(seconds) {
    return this.options.timerFormat.replace('{time}', seconds);
  }
  
  /**
   * Formata o score para exibição
   * @param {number} score 
   * @returns {string}
   * @private
   */
  _formatScore(score) {
    return this.options.scoreFormat.replace('{score}', score);
  }
  
  // ============================================
  // OVERRIDE
  // ============================================
  
  destroy() {
    this.stopTimer();
    super.destroy();
  }
}
