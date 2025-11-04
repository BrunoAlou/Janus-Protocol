import BaseMinigame from './BaseMinigame.js';

/**
 * TypingGame - Jogo de digitação / teste de velocidade
 */
export default class TypingGame extends BaseMinigame {
  constructor() {
    super('TypingGame');
    this.currentWordIndex = 0;
    this.wordsTyped = 0;
    this.errors = 0;
    this.currentInput = '';
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 80, 'TESTE DE DIGITAÇÃO', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 140, 'Digite as palavras que aparecem na tela!', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Estatísticas
    this.statsContainer = this.add.container(width / 2, 190);
    
    this.wordsText = this.add.text(-150, 0, 'Palavras: 0', {
      fontSize: '16px',
      color: '#00ff00'
    }).setOrigin(0, 0.5);
    
    this.errorsText = this.add.text(0, 0, 'Erros: 0', {
      fontSize: '16px',
      color: '#ff0000'
    }).setOrigin(0.5);
    
    this.wpmText = this.add.text(150, 0, 'WPM: 0', {
      fontSize: '16px',
      color: '#ffff00'
    }).setOrigin(1, 0.5);
    
    this.statsContainer.add([this.wordsText, this.errorsText, this.wpmText]);

    // Lista de palavras
    this.words = [
      'javascript', 'python', 'phaser', 'codigo', 'programa',
      'desenvolvimento', 'software', 'algoritmo', 'funcao', 'variavel',
      'classe', 'objeto', 'array', 'string', 'boolean',
      'tecnologia', 'computador', 'teclado', 'mouse', 'monitor'
    ];
    
    // Embaralhar palavras
    this.words.sort(() => Math.random() - 0.5);
    this.totalWords = 10; // Objetivo: digitar 10 palavras

    // Área da palavra atual
    this.targetWordText = this.add.text(width / 2, height / 2 - 50, '', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#2a2a3e',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5);

    // Área de digitação
    this.inputText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: '42px',
      color: '#00d9ff',
      backgroundColor: '#1a1a2e',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5);

    // Cursor piscante
    this.cursor = this.add.text(width / 2, height / 2 + 50, '|', {
      fontSize: '42px',
      color: '#00d9ff'
    }).setOrigin(0, 0.5);
    
    this.tweens.add({
      targets: this.cursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Feedback
    this.feedbackText = this.add.text(width / 2, height / 2 + 120, '', {
      fontSize: '24px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Capturar teclas
    this.input.keyboard.on('keydown', (event) => this.handleKeyPress(event));

    // Mostrar primeira palavra
    this.showNextWord();

    // Timer de 60 segundos
    this.timeLimit = 60;
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLimit--;
        this.updateWPM();
        if (this.timeLimit <= 0) {
          this.gameOver();
        }
      },
      loop: true
    });

    this.logTelemetry('typing_started', { totalWords: this.totalWords });
  }

  showNextWord() {
    if (this.currentWordIndex >= this.totalWords) {
      // Completou todas as palavras!
      this.completeMinigame();
      return;
    }

    this.currentWord = this.words[this.currentWordIndex % this.words.length];
    this.targetWordText.setText(this.currentWord);
    this.currentInput = '';
    this.inputText.setText('');
    this.updateCursorPosition();
    this.feedbackText.setText('');

    console.log('[TypingGame] Next word:', this.currentWord);
  }

  handleKeyPress(event) {
    const key = event.key;

    // Ignorar teclas especiais
    if (key.length > 1 && key !== 'Backspace' && key !== 'Enter') return;

    if (key === 'Backspace') {
      // Apagar último caractere
      if (this.currentInput.length > 0) {
        this.currentInput = this.currentInput.slice(0, -1);
        this.inputText.setText(this.currentInput);
        this.updateCursorPosition();
      }
    } else if (key === 'Enter') {
      // Verificar palavra
      this.checkWord();
    } else if (key.length === 1) {
      // Adicionar caractere
      this.currentInput += key.toLowerCase();
      this.inputText.setText(this.currentInput);
      this.updateCursorPosition();

      // Verificar se digitou corretamente até agora
      if (!this.currentWord.startsWith(this.currentInput)) {
        this.inputText.setColor('#ff0000');
      } else {
        this.inputText.setColor('#00d9ff');
      }
    }
  }

  updateCursorPosition() {
    const inputWidth = this.inputText.width;
    this.cursor.setPosition(
      this.inputText.x + inputWidth / 2 + 5,
      this.inputText.y
    );
  }

  checkWord() {
    if (this.currentInput === this.currentWord) {
      // Acertou!
      this.wordsTyped++;
      this.currentWordIndex++;
      this.updateScore(100);
      
      this.feedbackText.setText('✓ CORRETO!');
      this.feedbackText.setColor('#00ff00');
      
      this.logTelemetry('word_correct', { 
        word: this.currentWord,
        wordsTyped: this.wordsTyped 
      });

      this.time.delayedCall(500, () => this.showNextWord());
    } else {
      // Errou!
      this.errors++;
      this.feedbackText.setText('✗ ERRADO! Tente novamente');
      this.feedbackText.setColor('#ff0000');
      
      this.logTelemetry('word_incorrect', { 
        word: this.currentWord,
        typed: this.currentInput 
      });

      // Resetar input
      this.currentInput = '';
      this.inputText.setText('');
      this.inputText.setColor('#00d9ff');
      this.updateCursorPosition();
    }

    // Atualizar estatísticas
    this.wordsText.setText(`Palavras: ${this.wordsTyped}`);
    this.errorsText.setText(`Erros: ${this.errors}`);
    this.updateWPM();
  }

  updateWPM() {
    // Calcular palavras por minuto
    const elapsedMinutes = (60 - this.timeLimit) / 60;
    const wpm = elapsedMinutes > 0 ? Math.round(this.wordsTyped / elapsedMinutes) : 0;
    this.wpmText.setText(`WPM: ${wpm}`);
  }

  gameOver() {
    this.logTelemetry('game_over', { 
      reason: 'timeout',
      wordsTyped: this.wordsTyped,
      errors: this.errors
    });
    
    if (this.wordsTyped >= 5) {
      // Completou pelo menos 5 palavras
      this.completeMinigame();
    } else {
      this.exitMinigame(false);
    }
  }
}
