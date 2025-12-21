import BaseMinigame from './BaseMinigame.js';

/**
 * WhackAMoleGame - Jogo de reação onde robôs aparecem e devem ser clicados
 * Dificuldade aumenta progressivamente (velocidade e quantidade)
 */
export default class WhackAMoleGame extends BaseMinigame {
  constructor() {
    super('WhackAMoleGame');
    this.robots = [];
    this.robotsClicked = 0;
    this.robotsMissed = 0;
    this.spawnDelay = 1500; // Delay inicial entre spawns
    this.robotLifetime = 2000; // Tempo que o robô fica visível
    this.spawnTimer = null;
    this.level = 1;
    this.clicksToNextLevel = 10;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 80, 'WHACK-A-ROBOT', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 140, 'Clique nos robôs antes que desapareçam!', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Estatísticas
    this.statsText = this.add.text(width / 2, 190, '', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Nível
    this.levelText = this.add.text(width / 2, 220, '', {
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.updateStats();
    this.updateLevelDisplay();

    // Grid de posições (3x3)
    this.spawnPositions = [];
    const gridSize = 3;
    const cellWidth = 150;
    const cellHeight = 150;
    const startX = (width - (gridSize * cellWidth)) / 2 + cellWidth / 2;
    const startY = (height - (gridSize * cellHeight)) / 2 + cellHeight / 2 + 50;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = startX + col * cellWidth;
        const y = startY + row * cellHeight;
        this.spawnPositions.push({ x, y, occupied: false });

        // Desenhar "buraco" onde os robôs aparecem
        this.add.circle(x, y, 60, 0x1a1a1e).setStrokeStyle(3, 0x3a3a4e);
      }
    }

    // Iniciar spawn de robôs
    this.startSpawning();

    this.logTelemetry('whackamole_started', {
      initialDelay: this.spawnDelay,
      initialLifetime: this.robotLifetime
    });
  }

  startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: () => this.spawnRobot(),
      loop: true
    });
  }

  spawnRobot() {
    // Encontrar posição livre
    const freePositions = this.spawnPositions.filter(p => !p.occupied);
    if (freePositions.length === 0) return;

    const pos = Phaser.Utils.Array.GetRandom(freePositions);
    pos.occupied = true;

    // Criar robô (círculo com detalhes)
    const robot = this.add.container(pos.x, pos.y);
    robot.setSize(100, 100);
    robot.setInteractive(new Phaser.Geom.Circle(0, 0, 50), Phaser.Geom.Circle.Contains);

    // Corpo do robô (círculo principal)
    const body = this.add.circle(0, 0, 50, 0x4a9eff);
    
    // Olhos
    const eyeLeft = this.add.circle(-15, -10, 8, 0xffffff);
    const eyeRight = this.add.circle(15, -10, 8, 0xffffff);
    const pupilLeft = this.add.circle(-15, -10, 4, 0x000000);
    const pupilRight = this.add.circle(15, -10, 4, 0x000000);
    
    // Boca (sorriso)
    const mouth = this.add.graphics();
    mouth.lineStyle(3, 0x000000);
    mouth.arc(0, 10, 20, 0.2, Math.PI - 0.2);
    mouth.strokePath();
    
    // Antena
    const antenna = this.add.graphics();
    antenna.lineStyle(3, 0x333333);
    antenna.lineBetween(0, -50, 0, -70);
    antenna.fillStyle(0xff0000);
    antenna.fillCircle(0, -70, 5);

    robot.add([body, eyeLeft, eyeRight, pupilLeft, pupilRight, mouth, antenna]);

    // Animação de aparecer
    robot.setScale(0);
    this.tweens.add({
      targets: robot,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // Armazenar referência
    robot.position = pos;
    this.robots.push(robot);

    // Evento de clique
    robot.on('pointerdown', () => this.onRobotClicked(robot));

    // Efeito hover
    robot.on('pointerover', () => {
      this.tweens.add({
        targets: robot,
        scale: 1.1,
        duration: 100
      });
    });

    robot.on('pointerout', () => {
      this.tweens.add({
        targets: robot,
        scale: 1,
        duration: 100
      });
    });

    // Timer para desaparecer
    this.time.delayedCall(this.robotLifetime, () => {
      if (robot.active) {
        this.onRobotMissed(robot);
      }
    });
  }

  onRobotClicked(robot) {
    if (!robot.active) return;

    this.robotsClicked++;
    this.updateScore(100 + (this.level * 10)); // Mais pontos em níveis maiores
    this.updateStats();

    // Efeito de explosão
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const particle = this.add.circle(
        robot.x,
        robot.y,
        5,
        0x00ff00
      );
      
      particles.push(particle);
      
      this.tweens.add({
        targets: particle,
        x: robot.x + Math.cos(angle) * 100,
        y: robot.y + Math.sin(angle) * 100,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }

    // Remover robô
    this.removeRobot(robot);

    // Verificar aumento de nível
    if (this.robotsClicked >= this.clicksToNextLevel * this.level) {
      this.levelUp();
    }

    this.logTelemetry('robot_clicked', {
      level: this.level,
      totalClicked: this.robotsClicked
    });
  }

  onRobotMissed(robot) {
    if (!robot.active) return;

    this.robotsMissed++;
    this.updateStats();

    // Animação de desaparecer triste
    this.tweens.add({
      targets: robot,
      scale: 0,
      alpha: 0.5,
      duration: 300,
      onComplete: () => this.removeRobot(robot)
    });

    this.logTelemetry('robot_missed', {
      level: this.level,
      totalMissed: this.robotsMissed
    });
  }

  removeRobot(robot) {
    robot.position.occupied = false;
    const index = this.robots.indexOf(robot);
    if (index > -1) {
      this.robots.splice(index, 1);
    }
    robot.destroy();
  }

  levelUp() {
    this.level++;
    
    // Aumentar dificuldade
    this.spawnDelay = Math.max(400, this.spawnDelay - 150);
    this.robotLifetime = Math.max(500, this.robotLifetime - 150);

    // Reiniciar timer com nova velocidade
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.startSpawning();

    this.updateLevelDisplay();

    // Feedback visual
    const { width, height } = this.cameras.main;
    const levelUpText = this.add.text(width / 2, height / 2, `NÍVEL ${this.level}!`, {
      fontSize: '64px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: levelUpText,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      yoyo: true,
      onComplete: () => levelUpText.destroy()
    });

    this.logTelemetry('level_up', {
      newLevel: this.level,
      newSpawnDelay: this.spawnDelay,
      newLifetime: this.robotLifetime
    });
  }

  updateStats() {
    const accuracy = this.robotsClicked + this.robotsMissed > 0
      ? Math.round((this.robotsClicked / (this.robotsClicked + this.robotsMissed)) * 100)
      : 0;

    this.statsText.setText(
      `Acertos: ${this.robotsClicked} | Erros: ${this.robotsMissed} | Precisão: ${accuracy}%`
    );
  }

  updateLevelDisplay() {
    this.levelText.setText(`NÍVEL ${this.level}`);
  }

  shutdown() {
    // Limpar todos os robôs
    this.robots.forEach(robot => robot.destroy());
    this.robots = [];
    
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
  }
}
