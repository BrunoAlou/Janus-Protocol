import Phaser from 'phaser';
import { SCENE_NAMES } from '../constants/SceneNames.js';

/**
 * PauseMenuScene - Menu de configurações (ESC)
 */
export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_NAMES.PAUSE_MENU, active: false });
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
    const menuBg = this.add.rectangle(0, 0, 400, 550, 0x1a1a2e, 1);
    menuBg.setStrokeStyle(3, 0x00d9ff);

    // Título
    const title = this.add.text(0, -220, 'CONFIGURAÇÕES', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Opções
    const resumeBtn = this.createMenuItem(0, -140, 'Continuar');
    const soundBtn = this.createMenuItem(0, -70, 'Som: Ligado');
    const musicBtn = this.createMenuItem(0, 0, 'Música: Ligada');
    const debugBtn = this.createMenuItem(0, 70, 'Debug: Desligado');
    const controlsBtn = this.createMenuItem(0, 140, 'Controles');
    const quitBtn = this.createMenuItem(0, 210, 'Sair do Jogo', 0xff0000);

    // Guardar referência ao botão de debug para atualizar texto
    this.debugBtn = debugBtn;

    // Eventos dos botões (usando o bg interno do container)
    resumeBtn.bg.on('pointerdown', () => this.resumeGame());
    soundBtn.bg.on('pointerdown', () => this.toggleSound(soundBtn));
    musicBtn.bg.on('pointerdown', () => this.toggleMusic(musicBtn));
    debugBtn.bg.on('pointerdown', () => this.toggleDebug(debugBtn));
    controlsBtn.bg.on('pointerdown', () => this.showControls());
    quitBtn.bg.on('pointerdown', () => this.quitGame());

    this.menuContainer.add([
      menuBg,
      title,
      resumeBtn,
      soundBtn,
      musicBtn,
      debugBtn,
      controlsBtn,
      quitBtn
    ]);

    // Esconder inicialmente
    this.setVisible(false);

    // Tecla ESC para abrir/fechar
    this.escKey = this.input.keyboard.addKey('ESC');
    this.escKey.on('down', () => this.handleEscKey());

    console.log('[PauseMenuScene] Created');
  }

  /**
   * Processa a tecla ESC - verifica se DialogScene está ativo antes de abrir menu
   */
  handleEscKey() {
    // Verificar se o DialogScene consumiu o ESC
    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);
    if (dialogScene) {
      // Verificar se diálogo está aberto OU se ESC foi consumido recentemente
      if (dialogScene.isDialogOpen?.() || dialogScene._escConsumed) {
        // DialogScene vai processar o ESC, não fazer nada aqui
        console.log('[PauseMenuScene] ESC ignorado - DialogScene está ativo');
        return;
      }
    }

    // Nenhum diálogo aberto, processar normalmente
    this.toggleMenu();
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

    // Guardar referência ao label no container para acesso posterior
    container.label = label;
    container.bg = bg;

    return container;
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
    // Pausar cena principal - usa a cena atual do SceneManager
    const currentMap = window.sceneManager?.currentState?.map;
    if (currentMap) {
      const mainScene = this.game.scene.getScene(currentMap);
      if (mainScene) {
        this.scene.pause(currentMap);
      }
    }
    console.log('[PauseMenuScene] Game paused');
  }

  resumeGame() {
    this.setVisible(false);
    
    // Retomar cena principal - usa a cena atual do SceneManager
    const currentMap = window.sceneManager?.currentState?.map;
    if (currentMap) {
      const mainScene = this.game.scene.getScene(currentMap);
      if (mainScene) {
        this.scene.resume(currentMap);
      }
    }
    console.log('[PauseMenuScene] Game resumed');
  }

  toggleSound(button) {
    // Implementar lógica de som
    const soundEnabled = this.game.sound.mute;
    this.game.sound.mute = !soundEnabled;
    
    // Pegar texto do botão via referência direta
    button.label.setText(soundEnabled ? 'Som: Ligado' : 'Som: Desligado');
    
    console.log('[PauseMenuScene] Sound:', soundEnabled ? 'ON' : 'OFF');
  }

  toggleMusic(button) {
    // Implementar lógica de música
    // Usar uma propriedade customizada para rastrear estado da música
    if (this.musicEnabled === undefined) {
      this.musicEnabled = true;
    }
    this.musicEnabled = !this.musicEnabled;
    
    button.label.setText(this.musicEnabled ? 'Música: Ligada' : 'Música: Desligada');
    
    console.log('[PauseMenuScene] Music:', this.musicEnabled ? 'ON' : 'OFF');
  }

  toggleDebug(button) {
    // Buscar a cena de mapa atual para acessar o collisionDebugger
    const currentMap = window.sceneManager?.currentState?.map;
    if (currentMap) {
      const mapScene = this.game.scene.getScene(currentMap);
      if (mapScene && mapScene.collisionDebugger) {
        // Toggle apenas o CollisionDebugger (nosso sistema customizado)
        mapScene.collisionDebugger.toggle();
        const isEnabled = mapScene.collisionDebugger.isEnabled();
        button.label.setText(isEnabled ? 'Debug: Ligado' : 'Debug: Desligado');
        window.debugEnabled = isEnabled;
        
        // Atualizar visibilidade dos debug boxes dos elementos
        if (mapScene.elementManager) {
          mapScene.elementManager.setDebugVisible(isEnabled);
        }
        
        console.log('[PauseMenuScene] Debug:', isEnabled ? 'ON' : 'OFF');
        return;
      }
    }
    
    // Fallback: tentar acessar via estado global
    const debugEnabled = window.debugEnabled || false;
    window.debugEnabled = !debugEnabled;
    button.label.setText(window.debugEnabled ? 'Debug: Ligado' : 'Debug: Desligado');
    console.log('[PauseMenuScene] Debug (global):', window.debugEnabled ? 'ON' : 'OFF');
  }

  showControls() {
    // Mostrar tela de controles
    alert('Controles:\nWASD / Setas - Movimento\nE - Interagir\nESC - Menu\nESPAÇO - Avançar diálogo\nP - Toggle Debug');
  }

  quitGame() {
    if (confirm('Deseja realmente sair do jogo?')) {
      // Limpar sessão local
      if (window.authManager) {
        window.authManager.logout();
      } else {
        // Fallback: limpar manualmente se authManager não estiver disponível
        localStorage.removeItem('janus_session');
        localStorage.removeItem('janus_oauth_state');
      }
      
      // Fechar menu de pausa
      this.setVisible(false);
      
      console.log('[PauseMenuScene] Session cleared, redirecting to login...');
      
      // Voltar para tela de login
      if (window.sceneManager) {
        window.sceneManager.switchToAuth(SCENE_NAMES.LOGIN);
      } else {
        // Fallback: usar Phaser diretamente
        // Coletar cenas ativas primeiro
        const activeScenes = this.game.scene.getScenes(true).map(s => s.scene.key);
        
        // Parar todas as cenas
        activeScenes.forEach(sceneKey => {
          this.game.scene.stop(sceneKey);
        });
        
        // Iniciar LoginScene e trazer para frente
        this.game.scene.start(SCENE_NAMES.LOGIN);
        this.game.scene.bringToTop(SCENE_NAMES.LOGIN);
      }
      
      console.log('[PauseMenuScene] Redirected to login');
    }
  }
}
