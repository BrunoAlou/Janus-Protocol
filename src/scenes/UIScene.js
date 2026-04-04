import Phaser from "phaser";
import { SCENE_NAMES } from '../constants/SceneNames.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_NAMES.UI, active: false });
    this.minigamesMenuOpen = false;
    this._unlockedSignature = null;
    this._showMinigameUI = false;
    this._lastSyncAt = 0;
    this._minigameEntries = [];
    this._minigameMenuData = [];
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

    // Botão de Desafios (lado esquerdo)
    this.minigamesButton = this.add.text(30, 20, '🎮 DESAFIOS', {
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

    // Criar menu de desafios (inicialmente oculto)
    this.createMinigamesMenu();

    // Sincronizar estado inicial e visibilidade
    this.refreshMinigamesUI(true);

    // Atualizar UI quando houver desbloqueio/tentativas/reset
    this.minigameManager = window.minigameManager;
    if (this.minigameManager) {
      this.minigameManager.on('minigame-unlocked', () => this.refreshMinigamesUI(true));
      this.minigameManager.on('attempt-recorded', () => this.refreshMinigamesUI(false));
      this.minigameManager.on('progress-reset', () => this.refreshMinigamesUI(true));
    }

    // Ajustar posicionamento quando a tela redimensionar
    this.scale.on('resize', this.resize, this);

    // Garantir que a cena está visível
    this.scene.setVisible(true);

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
    // Container do menu (lado esquerdo)
    this.minigamesMenu = this.add.container(20, 70);
    this.minigamesMenu.setDepth(10002);
    this.minigamesMenu.setVisible(false);

    // Fundo do menu
    const menuBg = this.add.rectangle(0, 0, 280, 420, 0x1a1a2e, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0x00d9ff);

    // Título
    const title = this.add.text(140, 20, 'DESAFIOS', {
      fontSize: '24px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Linha divisória
    const line = this.add.graphics();
    line.lineStyle(2, 0x3a3a4e);
    line.lineBetween(20, 55, 260, 55);

    this.minigamesEntriesContainer = this.add.container(0, 0);

    this.minigamesEmptyText = this.add.text(140, 170,
      'Nenhum desafio desbloqueado ainda', {
        fontSize: '14px',
        color: '#888888',
        align: 'center',
        wordWrap: { width: 240 }
      }
    ).setOrigin(0.5);

    // Botão fechar
    this.closeBtn = this.add.text(140, 378, '✕ FECHAR', {
      fontSize: '16px',
      color: '#ff6666',
      fontStyle: 'bold',
      backgroundColor: '#2a2a3e',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#ff9999'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#ff6666'));
    this.closeBtn.on('pointerdown', () => this.toggleMinigamesMenu());

    // Adicionar tudo ao container
    this.minigamesMenu.add([
      menuBg,
      title,
      line,
      this.minigamesEntriesContainer,
      this.minigamesEmptyText,
      this.closeBtn
    ]);

    this.rebuildUnlockedMinigameEntries();
  }

  refreshMinigamesUI(forceRebuild = false) {
    this.minigameManager = window.minigameManager;
    if (!this.minigameManager) {
      this._showMinigameUI = false;
      this.menuBackground?.setVisible(false);
      this.minigamesButton?.setVisible(false);
      this.minigamesMenu?.setVisible(false);
      return;
    }

    this.minigameManager.syncWithGameState?.();

    const unlocked = this.minigameManager.getUnlockedMinigames();
    const signature = unlocked.map(({ id }) => id).sort().join('|');
    const changed = signature !== this._unlockedSignature;

    if (changed || forceRebuild) {
      this._unlockedSignature = signature;
      this._minigameMenuData = unlocked;
      this.rebuildUnlockedMinigameEntries();
    }

    this._showMinigameUI = unlocked.length > 0;
    this.menuBackground?.setVisible(this._showMinigameUI);
    this.minigamesButton?.setVisible(this._showMinigameUI);

    if (!this._showMinigameUI) {
      this.minigamesMenuOpen = false;
      this.minigamesMenu?.setVisible(false);
    }
  }

  rebuildUnlockedMinigameEntries() {
    if (!this.minigamesEntriesContainer) return;

    this._minigameEntries.forEach((entry) => entry.destroy());
    this._minigameEntries = [];

    const unlocked = this._minigameMenuData || [];
    this.minigamesEmptyText?.setVisible(unlocked.length === 0);

    let yPos = 75;
    unlocked.forEach(({ id, config }) => {
      const btnContainer = this.add.container(140, yPos);

      const btnBg = this.add.rectangle(0, 0, 240, 45, 0x2a2a3e)
        .setStrokeStyle(2, 0x4a4a5e);

      const gameName = this.add.text(-100, -8, `${config.icon} ${config.displayName}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const gameDesc = this.add.text(-100, 10, config.description || 'Desafio desbloqueado', {
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      btnContainer.add([btnBg, gameName, gameDesc]);
      btnContainer.setSize(240, 45);
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(-120, -22.5, 240, 45), Phaser.Geom.Rectangle.Contains);

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
        this.startMinigame(id);
      });

      this.minigamesEntriesContainer.add(btnContainer);
      this._minigameEntries.push(btnContainer);
      yPos += 52;
    });
  }

  toggleMinigamesMenu() {
    if (!this._showMinigameUI) {
      return;
    }

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
    if (!this.minigameManager?.isUnlocked(gameKey)) {
      console.warn('[UIScene] Challenge not unlocked yet:', gameKey);
      return;
    }

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
    const now = this.time?.now || 0;
    if (now - this._lastSyncAt > 1000) {
      this._lastSyncAt = now;
      this.refreshMinigamesUI(false);
    }
  }
}
