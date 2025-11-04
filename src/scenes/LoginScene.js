import Phaser from 'phaser';
import AuthManager from '../auth/AuthManager.js';

/**
 * LoginScene - Tela de login com OAuth
 */
export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.authManager = new AuthManager();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Logo/Título
    this.add.text(width / 2, height / 3, 'JANUS PROTOCOL', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 60, 'Sistema de Treinamento Corporativo', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Verificar se já está logado
    if (this.authManager.checkSession()) {
      this.startGame();
      return;
    }

    // Botão LinkedIn
    const linkedInBtn = this.createButton(
      width / 2,
      height / 2,
      'Login com LinkedIn',
      0x0077b5
    );
    linkedInBtn.on('pointerdown', () => this.authManager.loginWithLinkedIn());

    // Botão Google
    const googleBtn = this.createButton(
      width / 2,
      height / 2 + 80,
      'Login com Google',
      0xdb4437
    );
    googleBtn.on('pointerdown', () => this.authManager.loginWithGoogle());

    // Botão Dev (apenas desenvolvimento)
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      const devBtn = this.createButton(
        width / 2,
        height / 2 + 160,
        'Dev Login (Bypass)',
        0x666666
      );
      devBtn.on('pointerdown', () => {
        const result = this.authManager.devLogin();
        if (result.success) {
          this.startGame();
        }
      });
    }

    // Processar callback OAuth se houver
    if (window.location.search.includes('code=')) {
      this.handleOAuthCallback();
    }
  }

  createButton(x, y, text, color) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 50, color)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff);

    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.add([bg, label]);

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.GetColor(
        ...Phaser.Display.Color.IntegerToRGB(color).map(c => Math.min(255, c + 30))
      ));
    });
    bg.on('pointerout', () => bg.setFillStyle(color));

    return bg;
  }

  async handleOAuthCallback() {
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      'Autenticando...',
      { fontSize: '16px', color: '#ffffff' }
    ).setOrigin(0.5);

    const result = await this.authManager.handleCallback();
    
    if (result.success) {
      loadingText.setText('Login realizado! Carregando...');
      this.time.delayedCall(1000, () => this.startGame());
    } else {
      loadingText.setText('Erro no login: ' + result.error);
      loadingText.setColor('#ff0000');
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  startGame() {
    console.log('[LoginScene] User authenticated:', this.authManager.getUser());
    this.scene.start('ReceptionScene', { user: this.authManager.getUser() });
  }
}
