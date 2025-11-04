import Phaser from 'phaser';

/**
 * BaseMinigame - Classe base para todos os minigames
 * Fornece estrutura comum: fullscreen, telemetria, timer, etc.
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
  }

  init(data) {
    this.previousScene = data.previousScene || 'ReceptionScene';
    this.user = data.user;
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    const { width, height } = this.cameras.main;
    this.startTime = Date.now();

    // Fundo fullscreen
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);

    // HUD do minigame
    this.createHUD();

    // Botão de sair (canto superior direito)
    this.createExitButton();

    // Iniciar telemetria
    this.logTelemetry('minigame_started', {
      minigame: this.minigameKey,
      difficulty: this.difficulty,
      user: this.user?.name || 'unknown'
    });

    console.log('[BaseMinigame]', this.minigameKey, 'started');
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

    // Mostrar tela de vitória
    this.showCompletionScreen(true, duration);
  }

  /**
   * Sai do minigame
   */
  exitMinigame(completed = false) {
    if (!completed) {
      this.logTelemetry('minigame_abandoned', {
        duration: Math.floor((Date.now() - this.startTime) / 1000),
        score: this.score
      });
    }

    // Enviar telemetria para o servidor
    this.sendTelemetryToServer();

    // Voltar para cena anterior
    this.scene.start(this.previousScene, {
      minigameCompleted: completed,
      score: this.score
    });
  }

  showCompletionScreen(success, duration) {
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setDepth(2000);

    // Painel de resultado
    const resultPanel = this.add.container(width / 2, height / 2).setDepth(2001);

    const bg = this.add.rectangle(0, 0, 500, 400, 0x1a1a2e)
      .setStrokeStyle(3, success ? 0x00ff00 : 0xff0000);

    const title = this.add.text(0, -150, success ? '🎉 PARABÉNS!' : '😞 TENTE NOVAMENTE', {
      fontSize: '32px',
      color: success ? '#00ff00' : '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(0, -80, `Pontuação: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const timeLabel = this.add.text(0, -40, `Tempo: ${duration}s`, {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Botão continuar
    const continueBtn = this.add.text(0, 80, 'CONTINUAR', {
      fontSize: '24px',
      color: '#00d9ff',
      backgroundColor: '#2a2a3e',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => this.exitMinigame(true));

    resultPanel.add([bg, title, scoreLabel, timeLabel, continueBtn]);
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
