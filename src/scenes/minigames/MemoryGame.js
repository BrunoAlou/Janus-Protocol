import BaseMinigame from './BaseMinigame.js';

/**
 * MemoryGame - Jogo da memória
 */
export default class MemoryGame extends BaseMinigame {
  constructor() {
    super('MemoryGame');
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 8;
    this.canFlip = true;
  }

  create() {
    super.create();

    const { width, height } = this.cameras.main;

    // Título
    this.add.text(width / 2, 100, 'JOGO DA MEMÓRIA', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruções
    this.add.text(width / 2, 160, 'Encontre todos os pares de cartas!', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Contador de pares
    this.pairsText = this.add.text(width / 2, 200, `Pares: 0/${this.totalPairs}`, {
      fontSize: '20px',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Criar grid de cartas
    this.createCardGrid();

    // Timer de 90 segundos
    this.timeLimit = 90;
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

  createCardGrid() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2 + 50;

    // 4x4 grid = 16 cartas (8 pares)
    const cardWidth = 80;
    const cardHeight = 100;
    const gap = 15;
    const cols = 4;
    const rows = 4;

    // Símbolos dos pares (8 símbolos × 2)
    const symbols = ['⭐', '🎯', '🔥', '💎', '🎨', '🎵', '⚡', '🌟'];
    const cardValues = [...symbols, ...symbols]; // Duplicar para criar pares
    
    // Embaralhar
    cardValues.sort(() => Math.random() - 0.5);

    this.cards = [];
    let cardIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = centerX - (cols * (cardWidth + gap)) / 2 + col * (cardWidth + gap) + cardWidth / 2;
        const y = centerY - (rows * (cardHeight + gap)) / 2 + row * (cardHeight + gap) + cardHeight / 2;

        const card = this.createCard(x, y, cardWidth, cardHeight, cardValues[cardIndex]);
        this.cards.push(card);
        cardIndex++;
      }
    }

    this.logTelemetry('cards_created', { totalCards: this.cards.length });
  }

  createCard(x, y, width, height, symbol) {
    const card = this.add.container(x, y);

    // Frente da carta (escondida inicialmente)
    const front = this.add.rectangle(0, 0, width, height, 0x2a2a3e)
      .setStrokeStyle(2, 0x00d9ff);
    
    const frontSymbol = this.add.text(0, 0, symbol, {
      fontSize: '40px'
    }).setOrigin(0.5);

    // Verso da carta (visível inicialmente)
    const back = this.add.rectangle(0, 0, width, height, 0x4a4a6e)
      .setStrokeStyle(2, 0xffffff);
    
    const backPattern = this.add.text(0, 0, '?', {
      fontSize: '50px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    card.add([front, frontSymbol, back, backPattern]);

    // Estado da carta
    card.isFlipped = false;
    card.isMatched = false;
    card.symbol = symbol;
    card.frontElements = [front, frontSymbol];
    card.backElements = [back, backPattern];

    // Esconder frente inicialmente
    front.setVisible(false);
    frontSymbol.setVisible(false);

    // Interatividade
    back.setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.onCardClick(card));
    back.on('pointerover', () => {
      if (!card.isFlipped && !card.isMatched) {
        back.setFillStyle(0x5a5a7e);
      }
    });
    back.on('pointerout', () => {
      if (!card.isFlipped && !card.isMatched) {
        back.setFillStyle(0x4a4a6e);
      }
    });

    return card;
  }

  onCardClick(card) {
    if (!this.canFlip || card.isFlipped || card.isMatched) return;
    if (this.flippedCards.length >= 2) return;

    // Virar carta
    this.flipCard(card, true);
    this.flippedCards.push(card);

    this.logTelemetry('card_flipped', { symbol: card.symbol });

    // Verificar se tem 2 cartas viradas
    if (this.flippedCards.length === 2) {
      this.canFlip = false;
      this.time.delayedCall(800, () => this.checkMatch());
    }
  }

  flipCard(card, showFront) {
    card.isFlipped = showFront;
    
    // Mostrar/esconder elementos
    card.frontElements.forEach(el => el.setVisible(showFront));
    card.backElements.forEach(el => el.setVisible(!showFront));
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;

    if (card1.symbol === card2.symbol) {
      // Par encontrado!
      card1.isMatched = true;
      card2.isMatched = true;
      
      // Efeito visual
      this.tweens.add({
        targets: [card1, card2],
        scale: 1.2,
        duration: 200,
        yoyo: true,
        onComplete: () => {
          card1.setAlpha(0.5);
          card2.setAlpha(0.5);
        }
      });

      this.matchedPairs++;
      this.updateScore(100);
      this.pairsText.setText(`Pares: ${this.matchedPairs}/${this.totalPairs}`);

      this.logTelemetry('pair_matched', { 
        symbol: card1.symbol,
        totalMatched: this.matchedPairs 
      });

      // Verificar vitória
      if (this.matchedPairs === this.totalPairs) {
        this.time.delayedCall(500, () => this.completeMinigame());
      }
    } else {
      // Não é par, desvirar
      this.time.delayedCall(400, () => {
        this.flipCard(card1, false);
        this.flipCard(card2, false);
      });
    }

    this.flippedCards = [];
    this.canFlip = true;
  }

  gameOver() {
    this.logTelemetry('game_over', { reason: 'timeout', pairsFound: this.matchedPairs });
    this.exitMinigame(false);
  }
}
