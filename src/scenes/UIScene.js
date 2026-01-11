import Phaser from "phaser";
import { SCENE_NAMES } from '../constants/SceneNames.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_NAMES.UI, active: false });
    this.minigamesMenuOpen = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Configurar câmera para ser estática e não seguir o mundo
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.ignore = [];

    console.log('[UIScene] Creating UI with dimensions:', width, 'x', height);

    // Criar retângulo de fundo para o menu UI (do canto esquerdo até o meio)
    const uiWidth = width / 2;
    this.menuBackground = this.add.rectangle(
      uiWidth / 2,
      25,
      uiWidth,
      50,
      0x1a1a2e,
      0.8
    );
    this.menuBackground.setOrigin(0.5, 0.5);
    this.menuBackground.setDepth(10000);

    console.log('[UIScene] Menu background created at:', this.menuBackground.x, this.menuBackground.y);

    // Botão de Minigames (lado esquerdo)
    this.minigamesButton = this.add.text(30, 20, '🎮 MINIGAMES', {
      fontSize: '20px',
      color: '#00d9ff',
      fontStyle: 'bold',
      backgroundColor: '#1a1a2e',
      padding: { x: 15, y: 8 }
    })
    .setOrigin(0, 0)
    .setDepth(10001)
    .setInteractive({ useHandCursor: true });

    // Efeitos hover
    this.minigamesButton.on('pointerover', () => {
      this.minigamesButton.setColor('#00ffff');
      this.minigamesButton.setScale(1.05);
    });

    this.minigamesButton.on('pointerout', () => {
      this.minigamesButton.setColor('#00d9ff');
      this.minigamesButton.setScale(1);
    });

    this.minigamesButton.on('pointerdown', () => {
      this.toggleMinigamesMenu();
    });

    console.log('[UIScene] Minigames button created at:', this.minigamesButton.x, this.minigamesButton.y);

    // Criar menu de minigames (inicialmente oculto)
    this.createMinigamesMenu();

    // Ajustar posicionamento quando a tela redimensionar
    this.scale.on('resize', this.resize, this);

    // Garantir que a cena está visível
    this.scene.setVisible(true);
    this.menuBackground.setVisible(true);
    this.minigamesButton.setVisible(true);

    console.log('[UIScene] UI Scene fully created and visible');
    
    // Debug: verificar estado da cena
    console.log('[UIScene] Scene state:', {
      active: this.scene.isActive('UIScene'),
      visible: this.scene.isVisible('UIScene'),
      menuBgVisible: this.menuBackground?.visible,
      buttonVisible: this.minigamesButton?.visible,
      depth: this.menuBackground?.depth
    });
  }

  createMinigamesMenu() {
    const { width, height } = this.cameras.main;

    // Container do menu (lado esquerdo)
    this.minigamesMenu = this.add.container(20, 70);
    this.minigamesMenu.setDepth(10002);
    this.minigamesMenu.setVisible(false);

    // Fundo do menu
    const menuBg = this.add.rectangle(0, 0, 280, 420, 0x1a1a2e, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0x00d9ff);

    // Título
    const title = this.add.text(140, 20, 'MINIGAMES', {
      fontSize: '24px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Linha divisória
    const line = this.add.graphics();
    line.lineStyle(2, 0x3a3a4e);
    line.lineBetween(20, 55, 260, 55);

    // Lista de minigames
    const minigames = [
      { key: 'WhackAMoleGame', name: '🤖 Whack-a-Robot', desc: 'Clique nos robôs!' },
      { key: 'TypingGame', name: '⌨️ Digitação Rápida', desc: 'Teste sua velocidade' },
      { key: 'TetrisGame', name: '📁 Organizar Arquivos', desc: 'Tetris temático' },
      { key: 'SnakeGame', name: '🐍 Snake Protocol', desc: 'Clássico da cobrinha' },
      { key: 'MemoryGame', name: '🧠 Memória', desc: 'Encontre os pares' },
      { key: 'PuzzleGame', name: '🧩 Puzzle', desc: 'Resolva o quebra-cabeça' },
      { key: 'QuizGame', name: '❓ Quiz', desc: 'Teste seus conhecimentos' }
    ];

    const buttons = [];
    let yPos = 75;

    minigames.forEach((game, index) => {
      // Container do botão
      const btnContainer = this.add.container(140, yPos);

      // Fundo do botão
      const btnBg = this.add.rectangle(0, 0, 240, 45, 0x2a2a3e)
        .setStrokeStyle(2, 0x4a4a5e);

      // Nome do jogo
      const gameName = this.add.text(-100, -8, game.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      // Descrição
      const gameDesc = this.add.text(-100, 10, game.desc, {
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      btnContainer.add([btnBg, gameName, gameDesc]);
      btnContainer.setSize(240, 45);
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(-120, -22.5, 240, 45), Phaser.Geom.Rectangle.Contains);

      // Eventos do botão
      btnContainer.on('pointerover', () => {
        btnBg.setFillStyle(0x3a3a4e);
        btnBg.setStrokeStyle(2, 0x00d9ff);
        gameName.setColor('#00ffff');
        this.input.setDefaultCursor('pointer');
      });

      btnContainer.on('pointerout', () => {
        btnBg.setFillStyle(0x2a2a3e);
        btnBg.setStrokeStyle(2, 0x4a4a5e);
        gameName.setColor('#ffffff');
        this.input.setDefaultCursor('default');
      });

      btnContainer.on('pointerdown', () => {
        this.startMinigame(game.key);
      });

      buttons.push(btnContainer);
      yPos += 52;
    });

    // Botão fechar
    const closeBtn = this.add.text(140, yPos + 10, '✕ FECHAR', {
      fontSize: '16px',
      color: '#ff6666',
      fontStyle: 'bold',
      backgroundColor: '#2a2a3e',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff9999'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerdown', () => this.toggleMinigamesMenu());

    // Adicionar tudo ao container
    this.minigamesMenu.add([menuBg, title, line, ...buttons, closeBtn]);
  }

  toggleMinigamesMenu() {
    this.minigamesMenuOpen = !this.minigamesMenuOpen;
    this.minigamesMenu.setVisible(this.minigamesMenuOpen);

    if (this.minigamesMenuOpen) {
      // Animar entrada
      this.minigamesMenu.setAlpha(0);
      this.tweens.add({
        targets: this.minigamesMenu,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    }
  }

  startMinigame(gameKey) {
    console.log('[UIScene] Starting minigame:', gameKey);

    // Fechar menu
    this.toggleMinigamesMenu();

    // Obter cena atual do jogo
    const activeScenes = this.scene.manager.getScenes(true);
    const gameScene = activeScenes.find(scene => 
      scene.scene.key !== 'UIScene' && 
      scene.scene.key !== 'DialogScene' && 
      scene.scene.key !== 'PauseMenuScene' &&
      scene.scene.key !== 'MinimapScene' &&
      !scene.scene.key.includes('Game')
    );

    // Obter dados do usuário (se disponível)
    const user = gameScene?.user || { name: 'Player' };

    // Usar SceneManager para iniciar minigame
    window.sceneManager.startMinigame(gameKey, {
      user: user,
      difficulty: 'normal'
    });

    console.log('[UIScene] Minigame started via SceneManager');
  }

  resize(gameSize) {
    const { width, height } = gameSize;

    console.log('[UIScene] Resizing to:', width, 'x', height);

    // Reposicionar fundo (do canto esquerdo até o meio)
    const uiWidth = width / 2;
    if (this.menuBackground) {
      this.menuBackground.setPosition(uiWidth / 2, 0);
      this.menuBackground.setSize(uiWidth, 50);
    }

    // Reposicionar botão de minigames
    if (this.minigamesButton) {
      this.minigamesButton.setPosition(30, 20);
    }

    // Reposicionar menu
    if (this.minigamesMenu) {
      this.minigamesMenu.setPosition(20, 70);
    }
  }

  shutdown() {
    this.scale.off('resize', this.resize, this);
  }
  
  update() {
    // Forçar renderização contínua
    if (this.menuBackground) {
      this.menuBackground.setVisible(true);
    }
    if (this.minigamesButton) {
      this.minigamesButton.setVisible(true);
    }
    
    // Debug ocasional (a cada segundo)
    if (this.game.loop.frame % 60 === 0) {
      console.log('[UIScene UPDATE] Active:', this.scene.isActive('UIScene'), 
                  'Visible:', this.scene.isVisible('UIScene'),
                  'MenuBg:', this.menuBackground?.visible);
    }
  }
}
