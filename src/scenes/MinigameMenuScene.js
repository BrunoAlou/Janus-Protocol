import Phaser from 'phaser';
import { SCENE_NAMES } from '../constants/SceneNames.js';

/**
 * MinigameMenuScene - Menu de minigames desbloqueados
 * 
 * Inicialmente vazio, mostra minigames conforme são desbloqueados.
 * Permite replay ilimitado e mostra estatísticas.
 */
export default class MinigameMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_NAMES.MINIGAME_MENU);
    
    this.minigameManager = null;
    this.selectedIndex = 0;
    this.minigameCards = [];
    this.scrollOffset = 0;
  }
  
  init(data) {
    this.previousScene = data.previousScene || SCENE_NAMES.RECEPTION;
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Obter MinigameManager
    this.minigameManager = window.minigameManager;
    
    // Fundo
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
    
    // Título
    this.add.text(width / 2, 50, '🎮 MINIGAMES', {
      fontSize: '36px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Subtítulo
    this.add.text(width / 2, 90, 'Pratique e melhore seu desempenho', {
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);
    
    // Container de cards
    this.cardsContainer = this.add.container(0, 140);
    
    // Criar cards dos minigames desbloqueados
    this.createMinigameCards();
    
    // Mensagem se vazio
    this.emptyMessage = this.add.text(width / 2, height / 2, 
      '🔒 Nenhum minigame desbloqueado ainda\n\nExplore o mapa e interaja com objetos\npara descobrir desafios!', {
      fontSize: '20px',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5);
    
    this.updateEmptyMessage();
    
    // Botão Voltar
    this.createBackButton();
    
    // Controles de teclado
    this.setupKeyboard();
    
    // Listener para atualizações
    if (this.minigameManager) {
      this.minigameManager.on('minigame-unlocked', () => this.refreshCards());
      this.minigameManager.on('attempt-recorded', () => this.refreshCards());
    }
  }
  
  /**
   * Cria os cards de minigames
   */
  createMinigameCards() {
    const { width } = this.cameras.main;
    const unlockedMinigames = this.minigameManager?.getUnlockedMinigames() || [];
    
    // Limpar cards anteriores
    this.minigameCards.forEach(card => card.destroy());
    this.minigameCards = [];
    
    const cardWidth = 320;
    const cardHeight = 180;
    const padding = 20;
    const cardsPerRow = Math.floor((width - 40) / (cardWidth + padding));
    const startX = (width - (cardsPerRow * (cardWidth + padding) - padding)) / 2;
    
    unlockedMinigames.forEach((minigame, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      
      const x = startX + col * (cardWidth + padding) + cardWidth / 2;
      const y = row * (cardHeight + padding) + cardHeight / 2;
      
      const card = this.createCard(x, y, cardWidth, cardHeight, minigame, index);
      this.cardsContainer.add(card);
      this.minigameCards.push(card);
    });
    
    this.updateSelection();
  }
  
  /**
   * Cria um card de minigame
   */
  createCard(x, y, width, height, minigame, index) {
    const container = this.add.container(x, y);
    container.setData('minigame', minigame);
    container.setData('index', index);
    
    const { config, progress } = minigame;
    const stats = this.minigameManager?.getStats(minigame.id);
    
    // Fundo do card
    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e)
      .setStrokeStyle(2, 0x333366);
    container.setData('bg', bg);
    
    // Ícone
    const icon = this.add.text(-width / 2 + 20, -height / 2 + 20, config.icon, {
      fontSize: '40px'
    });
    
    // Nome
    const name = this.add.text(-width / 2 + 80, -height / 2 + 25, config.displayName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    // Descrição
    const desc = this.add.text(-width / 2 + 20, -height / 2 + 70, config.description, {
      fontSize: '14px',
      color: '#888888',
      wordWrap: { width: width - 40 }
    });
    
    // Estatísticas
    let statsText = 'Não jogado ainda';
    let statsColor = '#666666';
    
    if (stats && stats.numberAttempts > 0) {
      statsText = `Tentativas: ${stats.numberAttempts}`;
      if (stats.bestAttempt) {
        statsText += ` | Melhor: ${stats.bestAttempt.score} pts`;
      }
      if (stats.comparison) {
        statsText += `\n${stats.comparison.message}`;
        statsColor = stats.comparison.color;
      }
      statsColor = '#00d9ff';
    }
    
    const statsLabel = this.add.text(-width / 2 + 20, height / 2 - 50, statsText, {
      fontSize: '12px',
      color: statsColor
    });
    
    // Badge de tentativas
    if (progress.totalAttempts > 0) {
      const badge = this.add.container(width / 2 - 30, -height / 2 + 30);
      const badgeBg = this.add.circle(0, 0, 18, 0x00d9ff);
      const badgeText = this.add.text(0, 0, String(progress.totalAttempts), {
        fontSize: '14px',
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      badge.add([badgeBg, badgeText]);
      container.add(badge);
    }
    
    // Botão Jogar
    const playBtn = this.add.text(0, height / 2 - 20, '▶ JOGAR', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#1a3a1a',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    playBtn.on('pointerover', () => {
      playBtn.setBackgroundColor('#2a5a2a');
    });
    
    playBtn.on('pointerout', () => {
      playBtn.setBackgroundColor('#1a3a1a');
    });
    
    playBtn.on('pointerdown', () => {
      this.launchMinigame(minigame.id);
    });
    
    container.add([bg, icon, name, desc, statsLabel, playBtn]);
    
    // Tornar container interativo
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      this.selectedIndex = index;
      this.updateSelection();
    });
    
    bg.on('pointerdown', () => {
      this.launchMinigame(minigame.id);
    });
    
    return container;
  }
  
  /**
   * Atualiza seleção visual
   */
  updateSelection() {
    this.minigameCards.forEach((card, index) => {
      const bg = card.getData('bg');
      if (index === this.selectedIndex) {
        bg.setStrokeStyle(3, 0x00d9ff);
        bg.setFillStyle(0x2a2a4e);
      } else {
        bg.setStrokeStyle(2, 0x333366);
        bg.setFillStyle(0x1a1a2e);
      }
    });
  }
  
  /**
   * Atualiza mensagem de vazio
   */
  updateEmptyMessage() {
    const hasUnlocked = this.minigameCards.length > 0;
    this.emptyMessage.setVisible(!hasUnlocked);
  }
  
  /**
   * Atualiza os cards
   */
  refreshCards() {
    this.createMinigameCards();
    this.updateEmptyMessage();
  }
  
  /**
   * Cria botão de voltar
   */
  createBackButton() {
    const { height } = this.cameras.main;
    
    const backBtn = this.add.text(40, height - 50, '← VOLTAR', {
      fontSize: '20px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => backBtn.setColor('#ff9999'));
    backBtn.on('pointerout', () => backBtn.setColor('#ff6666'));
    backBtn.on('pointerdown', () => this.closeMenu());
  }
  
  /**
   * Configura controles de teclado
   */
  setupKeyboard() {
    this.input.keyboard.on('keydown-ESC', () => {
      this.closeMenu();
    });
    
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.minigameCards.length > 0) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
      }
    });
    
    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.minigameCards.length > 0) {
        this.selectedIndex = Math.min(this.minigameCards.length - 1, this.selectedIndex + 1);
        this.updateSelection();
      }
    });
    
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.minigameCards.length > 0) {
        const card = this.minigameCards[this.selectedIndex];
        const minigame = card.getData('minigame');
        this.launchMinigame(minigame.id);
      }
    });
  }
  
  /**
   * Inicia um minigame
   */
  launchMinigame(minigameId) {
    const config = this.minigameManager?.getConfig(minigameId);
    if (!config) {
      console.error('[MinigameMenuScene] Unknown minigame:', minigameId);
      return;
    }
    
    console.log('[MinigameMenuScene] Launching:', minigameId);
    
    // Usar SceneManager para iniciar
    if (window.sceneManager) {
      window.sceneManager.startMinigame(minigameId, {
        previousScene: SCENE_NAMES.MINIGAME_MENU,
        fromMenu: true
      });
    } else {
      // Fallback direto
      this.scene.start(minigameId, {
        previousScene: SCENE_NAMES.MINIGAME_MENU,
        fromMenu: true
      });
    }
  }
  
  /**
   * Fecha o menu
   */
  closeMenu() {
    if (window.sceneManager) {
      window.sceneManager.switchToMap(this.previousScene);
    } else {
      this.scene.start(this.previousScene);
    }
  }
}
