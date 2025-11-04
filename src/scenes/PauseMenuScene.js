import Phaser from 'phaser';

/**
 * PauseMenuScene - Menu de configurações (ESC)
 */
export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenuScene', active: false });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Overlay escuro
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.overlay.setDepth(999);

    // Container do menu
    this.menuContainer = this.add.container(width / 2, height / 2);
    this.menuContainer.setDepth(1000);

    // Painel do menu
    const menuBg = this.add.rectangle(0, 0, 400, 500, 0x1a1a2e, 1);
    menuBg.setStrokeStyle(3, 0x00d9ff);

    // Título
    const title = this.add.text(0, -220, 'CONFIGURAÇÕES', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Opções
    const resumeBtn = this.createMenuItem(0, -120, 'Continuar');
    const soundBtn = this.createMenuItem(0, -40, 'Som: Ligado');
    const musicBtn = this.createMenuItem(0, 40, 'Música: Ligada');
    const controlsBtn = this.createMenuItem(0, 120, 'Controles');
    const quitBtn = this.createMenuItem(0, 200, 'Sair do Jogo', 0xff0000);

    // Eventos dos botões
    resumeBtn.on('pointerdown', () => this.resumeGame());
    soundBtn.on('pointerdown', () => this.toggleSound(soundBtn));
    musicBtn.on('pointerdown', () => this.toggleMusic(musicBtn));
    controlsBtn.on('pointerdown', () => this.showControls());
    quitBtn.on('pointerdown', () => this.quitGame());

    this.menuContainer.add([
      menuBg,
      title,
      resumeBtn,
      soundBtn,
      musicBtn,
      controlsBtn,
      quitBtn
    ]);

    // Esconder inicialmente
    this.setVisible(false);

    // Tecla ESC para abrir/fechar
    this.escKey = this.input.keyboard.addKey('ESC');
    this.escKey.on('down', () => this.toggleMenu());

    console.log('[PauseMenuScene] Created');
  }

  createMenuItem(x, y, text, color = 0xffffff) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 50, 0x2a2a3e)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x00d9ff);

    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    container.add([bg, label]);

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(0x3a3a4e);
      container.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a2a3e);
      container.setScale(1);
    });

    return bg;
  }

  toggleMenu() {
    const isVisible = this.overlay.visible;
    this.setVisible(!isVisible);

    if (!isVisible) {
      this.pauseGame();
    } else {
      this.resumeGame();
    }
  }

  setVisible(visible) {
    this.overlay.setVisible(visible);
    this.menuContainer.setVisible(visible);
  }

  pauseGame() {
    // Pausar cena principal
    const mainScene = this.game.scene.getScene('ReceptionScene');
    if (mainScene) {
      this.scene.pause('ReceptionScene');
    }
    console.log('[PauseMenuScene] Game paused');
  }

  resumeGame() {
    this.setVisible(false);
    
    // Retomar cena principal
    const mainScene = this.game.scene.getScene('ReceptionScene');
    if (mainScene) {
      this.scene.resume('ReceptionScene');
    }
    console.log('[PauseMenuScene] Game resumed');
  }

  toggleSound(button) {
    // Implementar lógica de som
    const soundEnabled = this.game.sound.mute;
    this.game.sound.mute = !soundEnabled;
    
    const label = button.list[1]; // Pegar texto do botão
    label.setText(soundEnabled ? 'Som: Ligado' : 'Som: Desligado');
    
    console.log('[PauseMenuScene] Sound:', soundEnabled ? 'ON' : 'OFF');
  }

  toggleMusic(button) {
    // Implementar lógica de música
    // Similar ao toggleSound
    console.log('[PauseMenuScene] Music toggled');
  }

  showControls() {
    // Mostrar tela de controles
    alert('Controles:\nWASD / Setas - Movimento\nE - Interagir\nESC - Menu\nESPAÇO - Avançar diálogo');
  }

  quitGame() {
    if (confirm('Deseja realmente sair do jogo?')) {
      // Voltar para tela de login
      this.scene.stop('ReceptionScene');
      this.scene.stop('PauseMenuScene');
      this.scene.start('LoginScene');
      console.log('[PauseMenuScene] Quit game');
    }
  }
}
