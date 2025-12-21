import BaseMinigame from './BaseMinigame.js';

/**
 * SnakeGame - Jogo clássico da cobrinha com aumento progressivo de velocidade
 * Coleta itens enquanto cresce e aumenta a dificuldade
 */
export default class SnakeGame extends BaseMinigame {
  constructor() {
    super('SnakeGame');
    this.snake = [];
    this.food = null;
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.gridWidth = 20;
    this.gridHeight = 15;
    this.cellSize = 30;
    this.moveSpeed = 200; // Milissegundos entre movimentos
    this.gameOver = false;
    this.foodEaten = 0;
    this.speedIncreaseInterval = 5; // A cada 5 comidas, aumenta velocidade
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 80, 'SNAKE PROTOCOL', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 140, 'Use as setas para controlar a cobra', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Estatísticas
    this.foodText = this.add.text(width / 2, 180, '', {
      fontSize: '20px',
      color: '#00ff00'
    }).setOrigin(0.5);

    this.speedText = this.add.text(width / 2, 210, '', {
      fontSize: '18px',
      color: '#ffff00'
    }).setOrigin(0.5);

    this.updateStats();

    // Configurar grid
    this.gridOffsetX = (width - this.gridWidth * this.cellSize) / 2;
    this.gridOffsetY = 270;

    this.drawGrid();

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown', (event) => this.handleInput(event));

    // Inicializar cobra no centro
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];

    // Gerar primeira comida
    this.spawnFood();

    // Container para gráficos
    this.snakeGraphics = this.add.container(0, 0);
    this.foodGraphics = null;

    // Desenhar estado inicial
    this.drawSnake();
    this.drawFood();

    // Iniciar movimento
    this.startMoving();

    this.logTelemetry('snake_started', {
      gridSize: `${this.gridWidth}x${this.gridHeight}`,
      initialSpeed: this.moveSpeed
    });
  }

  drawGrid() {
    const graphics = this.add.graphics();
    
    // Fundo do grid
    graphics.fillStyle(0x0a0a0a, 0.8);
    graphics.fillRect(
      this.gridOffsetX,
      this.gridOffsetY,
      this.gridWidth * this.cellSize,
      this.gridHeight * this.cellSize
    );

    // Linhas do grid (sutis)
    graphics.lineStyle(1, 0x1a1a1a);
    for (let x = 0; x <= this.gridWidth; x++) {
      graphics.lineBetween(
        this.gridOffsetX + x * this.cellSize,
        this.gridOffsetY,
        this.gridOffsetX + x * this.cellSize,
        this.gridOffsetY + this.gridHeight * this.cellSize
      );
    }
    for (let y = 0; y <= this.gridHeight; y++) {
      graphics.lineBetween(
        this.gridOffsetX,
        this.gridOffsetY + y * this.cellSize,
        this.gridOffsetX + this.gridWidth * this.cellSize,
        this.gridOffsetY + y * this.cellSize
      );
    }

    // Borda externa
    graphics.lineStyle(3, 0x4a4a4e);
    graphics.strokeRect(
      this.gridOffsetX,
      this.gridOffsetY,
      this.gridWidth * this.cellSize,
      this.gridHeight * this.cellSize
    );
  }

  startMoving() {
    this.moveTimer = this.time.addEvent({
      delay: this.moveSpeed,
      callback: () => this.move(),
      loop: true
    });
  }

  handleInput(event) {
    const key = event.key;

    // Prevenir direção oposta
    switch(key) {
      case 'ArrowUp':
        if (this.direction.y === 0) {
          this.nextDirection = { x: 0, y: -1 };
        }
        break;
      case 'ArrowDown':
        if (this.direction.y === 0) {
          this.nextDirection = { x: 0, y: 1 };
        }
        break;
      case 'ArrowLeft':
        if (this.direction.x === 0) {
          this.nextDirection = { x: -1, y: 0 };
        }
        break;
      case 'ArrowRight':
        if (this.direction.x === 0) {
          this.nextDirection = { x: 1, y: 0 };
        }
        break;
    }
  }

  move() {
    if (this.gameOver) return;

    // Atualizar direção
    this.direction = { ...this.nextDirection };

    // Calcular nova posição da cabeça
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Verificar colisão com paredes
    if (newHead.x < 0 || newHead.x >= this.gridWidth ||
        newHead.y < 0 || newHead.y >= this.gridHeight) {
      this.endGame();
      return;
    }

    // Verificar colisão com próprio corpo
    for (let segment of this.snake) {
      if (segment.x === newHead.x && segment.y === newHead.y) {
        this.endGame();
        return;
      }
    }

    // Adicionar nova cabeça
    this.snake.unshift(newHead);

    // Verificar se comeu a comida
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.eatFood();
    } else {
      // Remover cauda se não comeu
      this.snake.pop();
    }

    // Redesenhar
    this.drawSnake();
  }

  eatFood() {
    this.foodEaten++;
    this.updateScore(100 + (this.foodEaten * 10));
    this.updateStats();

    // Aumentar velocidade progressivamente
    if (this.foodEaten % this.speedIncreaseInterval === 0) {
      this.increaseSpeed();
    }

    // Gerar nova comida
    this.spawnFood();
    this.drawFood();

    this.logTelemetry('food_eaten', {
      foodCount: this.foodEaten,
      snakeLength: this.snake.length,
      currentSpeed: this.moveSpeed
    });
  }

  spawnFood() {
    // Encontrar posição livre
    let validPosition = false;
    let newFood;

    while (!validPosition) {
      newFood = {
        x: Phaser.Math.Between(0, this.gridWidth - 1),
        y: Phaser.Math.Between(0, this.gridHeight - 1)
      };

      // Verificar se não está na cobra
      validPosition = true;
      for (let segment of this.snake) {
        if (segment.x === newFood.x && segment.y === newFood.y) {
          validPosition = false;
          break;
        }
      }
    }

    this.food = newFood;
  }

  drawSnake() {
    // Limpar gráficos anteriores
    this.snakeGraphics.removeAll(true);

    // Desenhar cada segmento
    this.snake.forEach((segment, index) => {
      const x = this.gridOffsetX + segment.x * this.cellSize;
      const y = this.gridOffsetY + segment.y * this.cellSize;

      const isHead = index === 0;
      const color = isHead ? 0x00ff00 : 0x00aa00;
      
      const block = this.add.rectangle(
        x + this.cellSize / 2,
        y + this.cellSize / 2,
        this.cellSize - 4,
        this.cellSize - 4,
        color
      ).setStrokeStyle(2, 0xffffff);

      // Olhos na cabeça
      if (isHead) {
        const eyeSize = 4;
        let eyeOffsetX = 0;
        let eyeOffsetY = 0;

        // Posicionar olhos baseado na direção
        if (this.direction.x === 1) { // Direita
          eyeOffsetX = 8;
          eyeOffsetY = -6;
        } else if (this.direction.x === -1) { // Esquerda
          eyeOffsetX = -8;
          eyeOffsetY = -6;
        } else if (this.direction.y === 1) { // Baixo
          eyeOffsetX = -6;
          eyeOffsetY = 8;
        } else { // Cima
          eyeOffsetX = -6;
          eyeOffsetY = -8;
        }

        const eye1 = this.add.circle(
          x + this.cellSize / 2 + eyeOffsetX,
          y + this.cellSize / 2 + eyeOffsetY,
          eyeSize,
          0xffffff
        );

        const eye2 = this.add.circle(
          x + this.cellSize / 2 - eyeOffsetX,
          y + this.cellSize / 2 - eyeOffsetY,
          eyeSize,
          0xffffff
        );

        this.snakeGraphics.add([block, eye1, eye2]);
      } else {
        this.snakeGraphics.add(block);
      }
    });
  }

  drawFood() {
    if (this.foodGraphics) {
      this.foodGraphics.destroy();
    }

    const x = this.gridOffsetX + this.food.x * this.cellSize;
    const y = this.gridOffsetY + this.food.y * this.cellSize;

    this.foodGraphics = this.add.container(x + this.cellSize / 2, y + this.cellSize / 2);

    // Desenhar comida como um círculo pulsante
    const foodCircle = this.add.circle(0, 0, this.cellSize / 3, 0xff0000);
    this.foodGraphics.add(foodCircle);

    // Animação de pulsar
    this.tweens.add({
      targets: foodCircle,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  increaseSpeed() {
    this.moveSpeed = Math.max(50, this.moveSpeed - 20);

    // Reiniciar timer com nova velocidade
    if (this.moveTimer) {
      this.moveTimer.destroy();
    }
    this.startMoving();

    // Feedback visual
    const { width, height } = this.cameras.main;
    const speedText = this.add.text(
      width / 2,
      height / 2,
      'VELOCIDADE AUMENTADA!',
      {
        fontSize: '48px',
        color: '#ff8800',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setAlpha(0).setDepth(3000);

    this.tweens.add({
      targets: speedText,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      yoyo: true,
      onComplete: () => speedText.destroy()
    });

    this.updateStats();

    this.logTelemetry('speed_increased', {
      newSpeed: this.moveSpeed,
      foodEaten: this.foodEaten
    });
  }

  updateStats() {
    this.foodText.setText(`Comida: ${this.foodEaten} | Tamanho: ${this.snake.length}`);
    
    const speedLevel = Math.floor((200 - this.moveSpeed) / 20) + 1;
    this.speedText.setText(`Velocidade: Nível ${speedLevel}`);
  }

  endGame() {
    this.gameOver = true;
    
    if (this.moveTimer) {
      this.moveTimer.destroy();
    }

    this.logTelemetry('game_over', {
      foodEaten: this.foodEaten,
      finalLength: this.snake.length,
      finalScore: this.score,
      finalSpeed: this.moveSpeed
    });

    // Animação de game over
    const { width, height } = this.cameras.main;
    const gameOverText = this.add.text(
      width / 2,
      height / 2,
      'GAME OVER!\nColidiu!',
      {
        fontSize: '64px',
        color: '#ff0000',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5).setDepth(3000);

    // Piscar a cobra
    this.tweens.add({
      targets: this.snakeGraphics,
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 3
    });

    this.time.delayedCall(3000, () => {
      if (this.foodEaten >= 5) {
        this.completeMinigame();
      } else {
        this.exitMinigame(false);
      }
    });
  }

  shutdown() {
    if (this.moveTimer) {
      this.moveTimer.destroy();
    }
    if (this.snakeGraphics) {
      this.snakeGraphics.destroy();
    }
    if (this.foodGraphics) {
      this.foodGraphics.destroy();
    }
  }
}
