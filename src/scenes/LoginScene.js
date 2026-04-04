import Phaser from 'phaser';
import AuthManager from '../auth/AuthManager.js';
import { SCENE_NAMES } from '../constants/SceneNames.js';
import { isEndgameLocked } from '../state/objectiveProgress.js';

const LOGIN_INPUT_SESSION_KEY = 'janus_login_first_input_at';

/**
 * LoginScene - Tela de login com OAuth
 */
export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_NAMES.LOGIN, active: true }); // Primeira cena, inicia automaticamente
    this.authManager = new AuthManager();
    window.authManager = this.authManager;
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

    // Processar OAuth redirect to_session do backend
    if (this.authManager.processOAuthRedirect()) {
      console.log('[LoginScene] OAuth redirect processed, starting game...');
      this.startGame();
      return;
    }

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
    linkedInBtn.on('pointerdown', () => {
      this.markFirstLoginInput('linkedin');
      this.authManager.loginWithLinkedIn();
    });

    // Botão Google
    const googleBtn = this.createButton(
      width / 2,
      height / 2 + 80,
      'Login com Google',
      0xdb4437
    );
    googleBtn.on('pointerdown', () => {
      this.markFirstLoginInput('google');
      this.authManager.loginWithGoogle();
    });

    // Botão Dev (apenas desenvolvimento)
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      const devBtn = this.createButton(
        width / 2,
        height / 2 + 160,
        'Dev Login (Bypass)',
        0x666666
      );
      devBtn.on('pointerdown', () => {
        this.markFirstLoginInput('dev');
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

  markFirstLoginInput(source = 'unknown') {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    const existing = Number(window.sessionStorage.getItem(LOGIN_INPUT_SESSION_KEY) || 0);
    if (Number.isFinite(existing) && existing > 0) {
      return;
    }

    const now = Date.now();
    window.sessionStorage.setItem(LOGIN_INPUT_SESSION_KEY, String(now));
    console.log(`[LoginScene] first login input captured via ${source} at ${now}`);
  }

  resolveFirstLoginInputAt() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return Date.now();
    }

    const fromSession = Number(window.sessionStorage.getItem(LOGIN_INPUT_SESSION_KEY) || 0);
    if (Number.isFinite(fromSession) && fromSession > 0) {
      return fromSession;
    }

    const fallback = Date.now();
    window.sessionStorage.setItem(LOGIN_INPUT_SESSION_KEY, String(fallback));
    return fallback;
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
      const rgb = Phaser.Display.Color.IntegerToRGB(color);
      const hoverColor = Phaser.Display.Color.GetColor(
        Math.min(255, rgb.r + 30),
        Math.min(255, rgb.g + 30),
        Math.min(255, rgb.b + 30)
      );
      bg.setFillStyle(hoverColor);
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
      // Limpar URL ANTES de iniciar o jogo (importante para os assets carregarem corretamente)
      window.history.replaceState({}, document.title, '/');
      this.time.delayedCall(1000, () => this.startGame());
    } else {
      loadingText.setText('Erro no login: ' + result.error);
      loadingText.setColor('#ff0000');
      // Limpar URL
      window.history.replaceState({}, document.title, '/');
    }
  }

  startGame() {
    console.log('[LoginScene] User authenticated:', this.authManager.getUser());
    
    const user = this.authManager.getUser();
    const provider = this.authManager.provider || user?.provider || null;

    if (window.gameState) {
      window.gameState.setUser(user, provider);
      window.gameState.loadProgressForUser(user, provider);

      const firstLoginInputAt = this.resolveFirstLoginInputAt();
      if (!window.gameState.getStat('session_login_input_at_ms')) {
        window.gameState.setStat('session_login_input_at_ms', firstLoginInputAt);
      }
      window.gameState.setStat('session_last_auth_at_ms', Date.now());
    }

    if (isEndgameLocked(window.gameState)) {
      this.showEndgameLockedScreen(user);
      return;
    }

    const lastLocation = window.gameState?.getPlayerLastLocation?.();
    const lastPosition = window.gameState?.getPlayerPosition?.();
    const hasValidLastScene = !!lastLocation?.scene && !!window.sceneManager?.mapConfig?.[lastLocation.scene];
    const initialScene = hasValidLastScene ? lastLocation.scene : SCENE_NAMES.RECEPTION;
    const hasValidPositionForScene =
      !!lastPosition &&
      lastPosition.scene === initialScene &&
      Number.isFinite(Number(lastPosition.x)) &&
      Number.isFinite(Number(lastPosition.y));

    const initialData = {
      user,
      spawnPoint: lastLocation?.spawnPoint || 'default',
      playerPosition: hasValidPositionForScene
        ? {
            x: Number(lastPosition.x),
            y: Number(lastPosition.y),
            scene: lastPosition.scene
          }
        : null
    };
    
    // Usar SceneManager para iniciar gameplay
    window.sceneManager.startGameplay(initialScene, initialData);
    
    console.log('[LoginScene] Gameplay started via SceneManager');
  }

  showEndgameLockedScreen(user) {
    const { width, height } = this.cameras.main;

    this.children.removeAll();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(width / 2, height / 3, 'JORNADA FINALIZADA', {
      fontSize: '42px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 56, `Usuario: ${user?.name || 'Participante'}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 28, 'Esta sessao entrou em modo somente report.', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#b8d4ff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 6, 'Use o botao abaixo para abrir o report final.', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#b8d4ff'
    }).setOrigin(0.5);

    const reportBtn = this.createButton(width / 2, height / 2 + 95, 'Abrir Report Final', 0x00a67d);
    reportBtn.on('pointerdown', () => this.openEndgameReport());

    const logoutBtn = this.createButton(width / 2, height / 2 + 170, 'Sair e trocar conta', 0x666666);
    logoutBtn.on('pointerdown', () => {
      this.authManager.logout();
      this.scene.restart();
    });

    this.openEndgameReport();
  }

  async openEndgameReport() {
    try {
      const module = await import('../report/openBaseReport.js');
      const openBaseReportFromGame = module?.openBaseReportFromGame;
      if (typeof openBaseReportFromGame !== 'function') {
        throw new Error('openBaseReportFromGame not available');
      }

      openBaseReportFromGame({ mode: 'prod' });
    } catch (error) {
      console.error('[LoginScene] Falha ao abrir report final:', error);
    }
  }
}
