import BaseMinigame from './BaseMinigame.js';

/**
 * TetrisGame - Jogo de Tetris temático para arquivar arquivos desorganizados
 * Blocos representam "arquivos" que precisam ser organizados
 */
export default class TetrisGame extends BaseMinigame {
  constructor() {
    super('TetrisGame');
    this.grid = [];
    this.gridWidth = 10;
    this.gridHeight = 20;
    this.cellSize = 30;
    this.currentPiece = null;
    this.nextPiece = null;
    this.fallSpeed = 800; // Milissegundos entre quedas
    this.fastFallSpeed = 50;
    this.isFastFalling = false;
    this.gameOver = false;
    this.linesCleared = 0;
    this.level = 1;
    this.linesForNextLevel = 10;
    
    // Definir tipos de "arquivos" (peças Tetris)
    this.pieceTypes = [
      { name: 'I-DOCS', shape: [[1,1,1,1]], color: 0x00ffff, icon: '📄' },
      { name: 'O-IMG', shape: [[1,1],[1,1]], color: 0xffff00, icon: '🖼️' },
      { name: 'T-CODE', shape: [[0,1,0],[1,1,1]], color: 0xff00ff, icon: '💻' },
      { name: 'S-DATA', shape: [[0,1,1],[1,1,0]], color: 0x00ff00, icon: '📊' },
      { name: 'Z-LOG', shape: [[1,1,0],[0,1,1]], color: 0xff0000, icon: '📋' },
      { name: 'J-PDF', shape: [[1,0,0],[1,1,1]], color: 0x0000ff, icon: '📕' },
      { name: 'L-ZIP', shape: [[0,0,1],[1,1,1]], color: 0xffa500, icon: '📦' }
    ];
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 80, 'ORGANIZE OS ARQUIVOS', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 140, '← → para mover | ↑ para girar | ↓ para acelerar', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Estatísticas
    this.levelText = this.add.text(width / 2, 180, '', {
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.linesText = this.add.text(width / 2, 210, '', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.updateStats();

    // Configurar grid
    this.gridOffsetX = (width - this.gridWidth * this.cellSize) / 2;
    this.gridOffsetY = 280;

    this.initializeGrid();
    this.drawGrid();

    // Área de próxima peça
    this.nextPieceArea = this.add.container(width - 200, 300);
    const nextLabel = this.add.text(0, -50, 'PRÓXIMO:', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const nextBg = this.add.rectangle(0, 20, 150, 150, 0x1a1a2e).setStrokeStyle(2, 0x3a3a4e);
    this.nextPieceArea.add([nextBg, nextLabel]);

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => this.rotatePiece());
    this.input.keyboard.on('keydown-UP', () => this.rotatePiece());

    // Iniciar jogo
    this.spawnPiece();
    this.startFalling();

    this.logTelemetry('tetris_started', {
      gridSize: `${this.gridWidth}x${this.gridHeight}`,
      initialFallSpeed: this.fallSpeed
    });
  }

  initializeGrid() {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  drawGrid() {
    const graphics = this.add.graphics();
    
    // Desenhar fundo do grid
    graphics.fillStyle(0x0a0a0a, 0.8);
    graphics.fillRect(
      this.gridOffsetX,
      this.gridOffsetY,
      this.gridWidth * this.cellSize,
      this.gridHeight * this.cellSize
    );

    // Desenhar linhas do grid
    graphics.lineStyle(1, 0x2a2a2a);
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

  spawnPiece() {
    if (this.gameOver) return;

    // Se já existe próxima peça, use ela
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      this.currentPiece = this.createPiece();
    }

    // Criar próxima peça
    this.nextPiece = this.createPiece();
    this.drawNextPiece();

    // Posição inicial no topo, centro
    this.currentPiece.x = Math.floor(this.gridWidth / 2) - 1;
    this.currentPiece.y = 0;

    // Verificar se pode spawnar (game over se não couber)
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.endGame();
      return;
    }

    this.drawCurrentPiece();
  }

  createPiece() {
    const type = Phaser.Utils.Array.GetRandom(this.pieceTypes);
    return {
      shape: JSON.parse(JSON.stringify(type.shape)), // Clone profundo
      color: type.color,
      icon: type.icon,
      name: type.name,
      graphics: null
    };
  }

  drawCurrentPiece() {
    if (this.currentPiece.graphics) {
      this.currentPiece.graphics.destroy();
    }

    this.currentPiece.graphics = this.add.container(0, 0);

    const shape = this.currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const screenX = this.gridOffsetX + (this.currentPiece.x + x) * this.cellSize;
          const screenY = this.gridOffsetY + (this.currentPiece.y + y) * this.cellSize;

          const block = this.add.rectangle(
            screenX + this.cellSize / 2,
            screenY + this.cellSize / 2,
            this.cellSize - 2,
            this.cellSize - 2,
            this.currentPiece.color
          ).setStrokeStyle(2, 0xffffff);

          // Ícone do arquivo
          const icon = this.add.text(
            screenX + this.cellSize / 2,
            screenY + this.cellSize / 2,
            this.currentPiece.icon,
            { fontSize: '16px' }
          ).setOrigin(0.5);

          this.currentPiece.graphics.add([block, icon]);
        }
      }
    }
  }

  drawNextPiece() {
    // Limpar área anterior
    if (this.nextPieceGraphics) {
      this.nextPieceGraphics.destroy();
    }

    this.nextPieceGraphics = this.add.container(0, 0);
    
    const shape = this.nextPiece.shape;
    const blockSize = 25;
    const offsetX = this.nextPieceArea.x - (shape[0].length * blockSize) / 2;
    const offsetY = this.nextPieceArea.y + 20 - (shape.length * blockSize) / 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const block = this.add.rectangle(
            offsetX + x * blockSize + blockSize / 2,
            offsetY + y * blockSize + blockSize / 2,
            blockSize - 2,
            blockSize - 2,
            this.nextPiece.color
          );

          this.nextPieceGraphics.add(block);
        }
      }
    }
  }

  startFalling() {
    this.fallTimer = this.time.addEvent({
      delay: this.fallSpeed,
      callback: () => this.fallDown(),
      loop: true
    });
  }

  fallDown() {
    if (this.gameOver) return;

    const newY = this.currentPiece.y + 1;

    if (this.checkCollision(this.currentPiece.x, newY, this.currentPiece.shape)) {
      // Colidir: fixar peça no grid
      this.lockPiece();
      this.checkLines();
      this.spawnPiece();
    } else {
      // Continuar caindo
      this.currentPiece.y = newY;
      this.drawCurrentPiece();
    }
  }

  checkCollision(x, y, shape) {
    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (shape[py][px]) {
          const gridX = x + px;
          const gridY = y + py;

          // Fora dos limites
          if (gridX < 0 || gridX >= this.gridWidth || gridY >= this.gridHeight) {
            return true;
          }

          // Colisão com bloco existente
          if (gridY >= 0 && this.grid[gridY][gridX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  lockPiece() {
    const shape = this.currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const gridY = this.currentPiece.y + y;
          const gridX = this.currentPiece.x + x;
          if (gridY >= 0) {
            this.grid[gridY][gridX] = {
              color: this.currentPiece.color,
              icon: this.currentPiece.icon
            };
          }
        }
      }
    }

    // Redesenhar grid com peça fixada
    this.redrawGrid();
  }

  redrawGrid() {
    // Limpar todos os blocos visuais
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }

    this.gridGraphics = this.add.container(0, 0);

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x]) {
          const screenX = this.gridOffsetX + x * this.cellSize;
          const screenY = this.gridOffsetY + y * this.cellSize;

          const block = this.add.rectangle(
            screenX + this.cellSize / 2,
            screenY + this.cellSize / 2,
            this.cellSize - 2,
            this.cellSize - 2,
            this.grid[y][x].color
          ).setStrokeStyle(2, 0xffffff);

          const icon = this.add.text(
            screenX + this.cellSize / 2,
            screenY + this.cellSize / 2,
            this.grid[y][x].icon,
            { fontSize: '16px' }
          ).setOrigin(0.5);

          this.gridGraphics.add([block, icon]);
        }
      }
    }
  }

  checkLines() {
    let linesCleared = 0;
    const linesToClear = [];

    // Identificar linhas completas
    for (let y = this.gridHeight - 1; y >= 0; y--) {
      let isComplete = true;
      for (let x = 0; x < this.gridWidth; x++) {
        if (!this.grid[y][x]) {
          isComplete = false;
          break;
        }
      }
      if (isComplete) {
        linesToClear.push(y);
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      this.clearLines(linesToClear);
      this.linesCleared += linesCleared;
      
      // Pontuação: mais linhas simultâneas = mais pontos
      const points = [0, 100, 300, 500, 800][linesCleared];
      this.updateScore(points * this.level);

      this.updateStats();

      // Level up
      if (this.linesCleared >= this.linesForNextLevel * this.level) {
        this.levelUp();
      }

      this.logTelemetry('lines_cleared', {
        count: linesCleared,
        totalLines: this.linesCleared,
        level: this.level
      });
    }
  }

  clearLines(lines) {
    // Animação de linha clara (opcional - simplificado)
    lines.forEach(lineY => {
      // Remover linha
      this.grid.splice(lineY, 1);
      // Adicionar linha vazia no topo
      this.grid.unshift(Array(this.gridWidth).fill(null));
    });

    this.redrawGrid();
  }

  rotatePiece() {
    if (!this.currentPiece || this.gameOver) return;

    const rotated = this.rotateMatrix(this.currentPiece.shape);

    // Verificar se rotação é válida
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
      this.currentPiece.shape = rotated;
      this.drawCurrentPiece();
    }
  }

  rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const rotated = [];

    for (let x = 0; x < M; x++) {
      rotated[x] = [];
      for (let y = N - 1; y >= 0; y--) {
        rotated[x][N - 1 - y] = matrix[y][x];
      }
    }

    return rotated;
  }

  levelUp() {
    this.level++;
    this.fallSpeed = Math.max(100, this.fallSpeed - 100);

    // Reiniciar timer com nova velocidade
    if (this.fallTimer) {
      this.fallTimer.destroy();
    }
    this.startFalling();

    this.updateStats();

    // Feedback visual
    const { width, height } = this.cameras.main;
    const levelUpText = this.add.text(width / 2, height / 2, `NÍVEL ${this.level}!`, {
      fontSize: '64px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(3000);

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
      newFallSpeed: this.fallSpeed
    });
  }

  update() {
    if (this.gameOver) return;

    // Controles
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.movePiece(-1, 0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.movePiece(1, 0);
    }
    if (this.cursors.down.isDown && !this.isFastFalling) {
      this.isFastFalling = true;
      this.fallTimer.timeScale = this.fallSpeed / this.fastFallSpeed;
    }
    if (this.cursors.down.isUp && this.isFastFalling) {
      this.isFastFalling = false;
      this.fallTimer.timeScale = 1;
    }
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;

    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;

    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      this.drawCurrentPiece();
    }
  }

  updateStats() {
    this.levelText.setText(`NÍVEL ${this.level}`);
    this.linesText.setText(`Arquivos Organizados: ${this.linesCleared} linhas`);
  }

  endGame() {
    this.gameOver = true;
    
    if (this.fallTimer) {
      this.fallTimer.destroy();
    }

    this.logTelemetry('game_over', {
      finalLevel: this.level,
      linesCleared: this.linesCleared,
      finalScore: this.score
    });

    // Mostrar mensagem de game over
    const { width, height } = this.cameras.main;
    const gameOverText = this.add.text(width / 2, height / 2, 'ARQUIVOS DESORGANIZADOS!\nGAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(3000);

    this.time.delayedCall(3000, () => {
      this.completeMinigame();
    });
  }

  shutdown() {
    if (this.fallTimer) {
      this.fallTimer.destroy();
    }
    if (this.currentPiece && this.currentPiece.graphics) {
      this.currentPiece.graphics.destroy();
    }
  }
}
