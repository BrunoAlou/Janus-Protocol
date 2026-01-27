import Phaser from 'phaser';
import { SCENE_NAMES } from '../../constants/SceneNames.js';

/**
 * BaseMinigame - Classe base para todos os minigames
 * Fornece estrutura comum: fullscreen, telemetria, timer, etc.
 * Integrado com MinigameManager para tracking de tentativas.
 */
export default class BaseMinigame extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.minigameKey = key;
    this.startTime = 0;
    this.endTime = 0;
    this.score = 0;
    this.completed = false;
    this.telemetryEvents = [];
    this.metrics = {};
    this.fromMenu = false;
    this.isFirstAttempt = false;
  }

  init(data) {
    this.previousScene = data.previousScene || SCENE_NAMES.RECEPTION;
    this.user = data.user;
    this.difficulty = data.difficulty || 'normal';
    this.fromMenu = data.fromMenu || false;
    this.unlockContext = data.unlockContext || null;
    
    // Verificar se é primeira tentativa
    const manager = window.minigameManager;
    if (manager) {
      const progress = manager.progress.get(this.minigameKey);
      this.isFirstAttempt = !progress?.firstAttempt;
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    this.startTime = Date.now();
    this.metrics = {};

    // Fundo fullscreen
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);

    // HUD do minigame
    this.createHUD();

    // Botão de sair (canto superior direito)
    this.createExitButton();
    
    // Mostrar badge de primeira tentativa
    if (this.isFirstAttempt) {
      this.showFirstAttemptBadge();
    }

    // Iniciar telemetria
    this.logTelemetry('minigame_started', {
      minigame: this.minigameKey,
      difficulty: this.difficulty,
      user: this.user?.name || 'unknown',
      isFirstAttempt: this.isFirstAttempt,
      fromMenu: this.fromMenu
    });

    console.log('[BaseMinigame]', this.minigameKey, 'started', this.isFirstAttempt ? '(FIRST ATTEMPT)' : '');
  }
  
  /**
   * Mostra badge indicando primeira tentativa
   */
  showFirstAttemptBadge() {
    const { width } = this.cameras.main;
    
    const badge = this.add.container(width / 2, 80).setDepth(1001);
    
    const bg = this.add.rectangle(0, 0, 250, 30, 0x00aa00, 0.9)
      .setStrokeStyle(2, 0x00ff00);
    
    const text = this.add.text(0, 0, '⭐ PRIMEIRA TENTATIVA - VALE PARA AVALIAÇÃO', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    badge.add([bg, text]);
    
    // Animar e remover após 3 segundos
    this.tweens.add({
      targets: badge,
      alpha: 0,
      y: 60,
      delay: 3000,
      duration: 500,
      onComplete: () => badge.destroy()
    });
  }

  createHUD() {
    const { width } = this.cameras.main;

    // Timer
    this.timerText = this.add.text(width / 2, 30, 'Tempo: 0s', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1000);

    // Score
    this.scoreText = this.add.text(width - 20, 30, 'Pontos: 0', {
      fontSize: '20px',
      color: '#00d9ff'
    }).setOrigin(1, 0).setDepth(1000);

    // Atualizar timer
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateTimer(),
      loop: true
    });
  }

  createExitButton() {
    const { width } = this.cameras.main;
    
    const exitBtn = this.add.text(20, 30, '← SAIR', {
      fontSize: '18px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0).setDepth(1000)
      .setInteractive({ useHandCursor: true });

    exitBtn.on('pointerover', () => exitBtn.setColor('#ff5555'));
    exitBtn.on('pointerout', () => exitBtn.setColor('#ff0000'));
    exitBtn.on('pointerdown', () => this.exitMinigame(false));
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.timerText.setText(`Tempo: ${elapsed}s`);
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`Pontos: ${this.score}`);
    
    this.logTelemetry('score_updated', {
      newScore: this.score,
      pointsAdded: points
    });
  }

  /**
   * Finaliza o minigame com sucesso
   */
  completeMinigame() {
    this.completed = true;
    this.endTime = Date.now();
    const duration = Math.floor((this.endTime - this.startTime) / 1000);

    this.logTelemetry('minigame_completed', {
      duration,
      score: this.score,
      success: true
    });
    
    // Registrar tentativa no MinigameManager
    this.recordAttemptToManager(true, duration);

    // Mostrar tela de vitória
    this.showCompletionScreen(true, duration);
  }

  /**
   * Sai do minigame
   */
  exitMinigame(completed = false) {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    
    if (!completed) {
      this.logTelemetry('minigame_abandoned', {
        duration,
        score: this.score
      });
      
      // Registrar tentativa incompleta
      this.recordAttemptToManager(false, duration);
    }

    // Enviar telemetria para o servidor
    this.sendTelemetryToServer();

    // Usar SceneManager para finalizar minigame
    window.sceneManager.endMinigame({
      completed,
      score: this.score,
      duration
    });
  }
  
  /**
   * Registra a tentativa no MinigameManager
   */
  recordAttemptToManager(completed, duration) {
    const manager = window.minigameManager;
    if (!manager) {
      console.warn('[BaseMinigame] MinigameManager not available');
      return;
    }
    
    const result = {
      score: this.score,
      completed,
      duration: duration * 1000, // converter para ms
      metrics: this.metrics,
      difficulty: this.difficulty
    };
    
    manager.recordAttempt(this.minigameKey, result);
  }
  
  /**
   * Adiciona métrica específica
   * @param {string} key 
   * @param {any} value 
   */
  addMetric(key, value) {
    this.metrics[key] = value;
  }

  showCompletionScreen(success, duration) {
    const { width, height } = this.cameras.main;
    
    // Obter estatísticas do manager
    const manager = window.minigameManager;
    const stats = manager?.getStats(this.minigameKey);

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(2000);

    // Painel de resultado
    const resultPanel = this.add.container(width / 2, height / 2).setDepth(2001);

    const bg = this.add.rectangle(0, 0, 500, 480, 0x1a1a2e)
      .setStrokeStyle(3, success ? 0x00ff00 : 0xff0000);

    const title = this.add.text(0, -200, success ? '🎉 PARABÉNS!' : '😞 TENTE NOVAMENTE', {
      fontSize: '32px',
      color: success ? '#00ff00' : '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(0, -140, `Pontuação: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const timeLabel = this.add.text(0, -100, `Tempo: ${duration}s`, {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    resultPanel.add([bg, title, scoreLabel, timeLabel]);
    
    // Estatísticas comparativas
    if (stats) {
      let yOffset = -40;
      
      // Número de tentativas
      const attemptsLabel = this.add.text(0, yOffset, `Tentativa #${stats.numberAttempts}`, {
        fontSize: '16px',
        color: '#888888'
      }).setOrigin(0.5);
      resultPanel.add(attemptsLabel);
      yOffset += 35;
      
      // Melhor resultado
      if (stats.bestAttempt) {
        const bestLabel = this.add.text(0, yOffset, `Seu melhor: ${stats.bestAttempt.score} pts`, {
          fontSize: '18px',
          color: '#00d9ff'
        }).setOrigin(0.5);
        resultPanel.add(bestLabel);
        yOffset += 35;
      }
      
      // Média pessoal
      if (stats.average > 0) {
        const avgLabel = this.add.text(0, yOffset, `Sua média: ${Math.round(stats.average)} pts`, {
          fontSize: '16px',
          color: '#aaaaaa'
        }).setOrigin(0.5);
        resultPanel.add(avgLabel);
        yOffset += 35;
      }
      
      // Comparação com outros jogadores (só positiva)
      if (stats.comparison) {
        const compBg = this.add.rectangle(0, yOffset + 15, 400, 50, 0x0a3a0a)
          .setStrokeStyle(2, 0x00aa00);
        const compLabel = this.add.text(0, yOffset + 15, `✨ ${stats.comparison.message}`, {
          fontSize: '16px',
          color: stats.comparison.color,
          fontStyle: 'bold'
        }).setOrigin(0.5);
        resultPanel.add([compBg, compLabel]);
        yOffset += 60;
      }
      
      // Média pública
      if (stats.publicAverage) {
        const pubLabel = this.add.text(0, yOffset, `Média geral: ${Math.round(stats.publicAverage)} pts`, {
          fontSize: '14px',
          color: '#666666'
        }).setOrigin(0.5);
        resultPanel.add(pubLabel);
      }
    }

    // Botões
    const buttonY = 180;
    
    // Botão Jogar Novamente
    const retryBtn = this.add.text(-80, buttonY, '🔄 JOGAR NOVAMENTE', {
      fontSize: '18px',
      color: '#00d9ff',
      backgroundColor: '#2a2a3e',
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setBackgroundColor('#3a3a5e'));
    retryBtn.on('pointerout', () => retryBtn.setBackgroundColor('#2a2a3e'));
    retryBtn.on('pointerdown', () => this.restartMinigame());
    
    // Botão Continuar
    const continueBtn = this.add.text(120, buttonY, 'CONTINUAR →', {
      fontSize: '18px',
      color: '#00ff00',
      backgroundColor: '#1a3a1a',
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover', () => continueBtn.setBackgroundColor('#2a5a2a'));
    continueBtn.on('pointerout', () => continueBtn.setBackgroundColor('#1a3a1a'));
    continueBtn.on('pointerdown', () => this.exitMinigame(true));

    resultPanel.add([retryBtn, continueBtn]);
  }
  
  /**
   * Reinicia o minigame
   */
  restartMinigame() {
    this.scene.restart({
      previousScene: this.previousScene,
      user: this.user,
      difficulty: this.difficulty,
      fromMenu: this.fromMenu
    });
  }

  /**
   * Registra evento de telemetria
   */
  logTelemetry(eventType, data = {}) {
    const event = {
      timestamp: Date.now(),
      eventType,
      minigame: this.minigameKey,
      ...data
    };
    
    this.telemetryEvents.push(event);
    console.log('[Telemetry]', event);
  }

  /**
   * Envia telemetria para o servidor
   */
  async sendTelemetryToServer() {
    try {
      const payload = {
        user: this.user,
        minigame: this.minigameKey,
        events: this.telemetryEvents,
        summary: {
          completed: this.completed,
          score: this.score,
          duration: this.endTime - this.startTime
        }
      };

      // Substituir com seu endpoint real
      const response = await fetch('/api/telemetry/minigame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('[Telemetry] Data sent successfully');
      }
    } catch (err) {
      console.error('[Telemetry] Failed to send data:', err);
    }
  }
}
