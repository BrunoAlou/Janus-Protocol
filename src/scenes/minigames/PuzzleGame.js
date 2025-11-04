import BaseMinigame from './BaseMinigame.js';

/**
 * PuzzleGame - Exemplo de minigame de puzzle
 */
export default class PuzzleGame extends BaseMinigame {
  constructor() {
    super('PuzzleGame');
  }

  create() {
    super.create(); // Chamar create da classe base

    const { width, height } = this.cameras.main;

    // Título do minigame
    this.add.text(width / 2, 100, 'PUZZLE DE LÓGICA', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 160, 'Resolva o puzzle antes do tempo acabar!', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Área do puzzle (exemplo simples)
    this.createPuzzle();

    // Timer de 60 segundos
    this.timeLimit = 60;
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLimit--;
        if (this.timeLimit <= 0) {
          this.gameOver();
        }
      },
      loop: true
    });
  }

  createPuzzle() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2 + 50;

    // Grid 3x3 de peças
    this.puzzlePieces = [];
    const pieceSize = 80;
    const gap = 10;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = centerX - pieceSize - gap + col * (pieceSize + gap);
        const y = centerY - pieceSize - gap + row * (pieceSize + gap);

        const piece = this.add.rectangle(x, y, pieceSize, pieceSize, 0x2a2a3e)
          .setStrokeStyle(2, 0x00d9ff)
          .setInteractive({ useHandCursor: true });

        const num = row * 3 + col + 1;
        const text = this.add.text(x, y, num.toString(), {
          fontSize: '32px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        piece.on('pointerdown', () => this.onPieceClick(num));

        this.puzzlePieces.push({ piece, text, num });
      }
    }

    // Embaralhar
    this.shufflePuzzle();
  }

  shufflePuzzle() {
    // Implementar lógica de embaralhamento
    console.log('[PuzzleGame] Puzzle shuffled');
  }

  onPieceClick(num) {
    console.log('[PuzzleGame] Piece clicked:', num);
    this.updateScore(10);
    
    // Verificar se completou
    if (this.checkCompletion()) {
      this.completeMinigame();
    }
  }

  checkCompletion() {
    // Implementar lógica de verificação
    // Retornar true se puzzle está completo
    return this.score >= 100; // Exemplo simples
  }

  gameOver() {
    this.logTelemetry('game_over', { reason: 'timeout' });
    this.exitMinigame(false);
  }
}
