import BaseMapScene from './BaseMapScene.js';
import DoorZone from '../../components/DoorZone.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import { resolveAssetPath } from '../../utils/AssetResolver.js';

/**
 * ElevatorScene - Cena do elevador (minimapa)
 */
export default class ElevatorScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.ELEVATOR, 'elevator');
    this.defaultZoom = 2.0; // Zoom menor = mapa menor aparece maior na tela (centralizado)
  }

  preload() {
    preloadRegisteredTilesets(this);
    // Carregar assets específicos do elevador, se houver
    this.load.image('elevator_minimap', resolveAssetPath('elevator_minimap_16x16.png'));
    // Carregar tilemap do elevador via resolver
    super.preload();
  }

  create() {
    super.create();

    if (!this.map || !this.layers) {
      console.error('[ElevatorScene] create aborted: map/layers indisponíveis');
      return;
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.setupDoorTransitions();
    // Centralizar câmera no mapa (override do setupCamera da base)
    this.setupCameraForMinimap();
    // Adicionar animações de partículas ao redor do elevador
    this.setupElevatorParticles();
    // Outras inicializações específicas do elevador
  }

  /**
   * Centraliza a câmera no mapa do elevador de forma correta
   */
  setupCameraForMinimap() {
    console.log('[ElevatorScene] setupCameraForMinimap() chamado');

    if (!this.map) {
      console.error('[ElevatorScene] setupCameraForMinimap abortado: this.map indefinido');
      return;
    }
    
    // Dados do mapa
    console.log('[ElevatorScene] Mapa info:', {
      width: this.map.width,
      height: this.map.height,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight,
      widthInPixels: this.map.widthInPixels,
      heightInPixels: this.map.heightInPixels
    });
    
    // Centro do mapa em pixels do mundo
    const mapCenterX = (this.map.width * this.map.tileWidth) / 2;
    const mapCenterY = (this.map.height * this.map.tileHeight) / 2;
    console.log('[ElevatorScene] Centro do mapa:', { mapCenterX, mapCenterY });
    
    // Parar de seguir o player
    this.cameras.main.stopFollow();
    console.log('[ElevatorScene] Camera stopFollow()');
    
    // Aplicar o zoom
    this.cameras.main.setZoom(this.defaultZoom);
    console.log('[ElevatorScene] Zoom aplicado:', this.defaultZoom);
    
    // Definir bounds MAIORES que o mapa para permitir espaço vazio ao redor
    // Isso permite que a câmera centralize o mapa pequeno
    const boundsMargin = Math.max(this.game.canvas.width, this.game.canvas.height);
    this.cameras.main.setBounds(
      -boundsMargin,
      -boundsMargin,
      this.map.widthInPixels + 2 * boundsMargin,
      this.map.heightInPixels + 2 * boundsMargin
    );
    console.log('[ElevatorScene] Camera bounds definidos com margem');
    
    // Centralizar a câmera no centro do mapa
    this.cameras.main.centerOn(mapCenterX, mapCenterY);
    console.log('[ElevatorScene] Camera centralized em:', { mapCenterX, mapCenterY });
    
    // Verificar posição final da câmera
    console.log('[ElevatorScene] Posição final da câmera:', {
      x: this.cameras.main.x,
      y: this.cameras.main.y,
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
      zoom: this.cameras.main.zoom
    });
    
    console.log('[ElevatorScene] Viewport visível:', {
      left: this.cameras.main.worldView.left,
      top: this.cameras.main.worldView.top,
      right: this.cameras.main.worldView.right,
      bottom: this.cameras.main.worldView.bottom,
      width: this.cameras.main.worldView.width,
      height: this.cameras.main.worldView.height
    });
  } 

  setupDoorTransitions() {
    // Zona de acesso rapido para o corredor e painel de destinos do elevador
    this.doorZones = [
      new DoorZone(this, {
        x: 8, y: 8, width: 16, height: 16, // Posição central do minimapa 16x16
        label: 'CORREDOR',
        indicatorColor: 0x00ff00,
        indicatorTextColor: '#00ff00',
        onInteract: () => this.transitionToHallway(),
        proximityDistance: 24
      }),
      new DoorZone(this, {
        x: 8,
        y: 24,
        width: 16,
        height: 16,
        label: 'DESTINOS',
        indicatorColor: 0xffcc00,
        indicatorTextColor: '#ffcc00',
        onInteract: () => this.openElevatorDestinations(),
        proximityDistance: 24
      })
    ];
  }

  openElevatorDestinations() {
    if (this.isTransitioning) return;

    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);
    if (!dialogScene) {
      console.warn('[ElevatorScene] DialogScene indisponivel para destinos');
      return;
    }

    if (!this.scene.isActive(SCENE_NAMES.DIALOG)) {
      this.scene.launch(SCENE_NAMES.DIALOG);
    }

    dialogScene.showOptionsDialog({
      name: 'Painel do Elevador',
      greeting: 'Selecione seu destino:',
      options: [
        {
          id: 'garden',
          label: 'Jardim',
          icon: '🌳',
          action: { type: 'scene', target: SCENE_NAMES.GARDEN }
        },
        {
          id: 'coffee-room',
          label: 'Cafeteria',
          icon: '☕',
          action: { type: 'scene', target: SCENE_NAMES.COFFEE_ROOM }
        },
        {
          id: 'boss-room',
          label: 'Sala do Chefe',
          icon: '👔',
          action: { type: 'scene', target: SCENE_NAMES.BOSS_ROOM }
        },
        {
          id: 'hallway',
          label: 'Corredor',
          icon: '🚪',
          action: { type: 'scene', target: SCENE_NAMES.HALLWAY }
        },
        {
          id: 'cancel',
          label: 'Cancelar',
          icon: '↩️',
          action: { type: 'cancel' }
        }
      ],
      onSelect: (option) => this.handleElevatorDestination(option)
    });
  }

  handleElevatorDestination(option) {
    if (!option?.action || option.action.type !== 'scene') return;

    const targetScene = option.action.target;
    if (!targetScene || this.isTransitioning) return;

    this.isTransitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(targetScene, {
        user: this.user,
        spawnPoint: 'fromElevator'
      });
    });
  }

  /**
   * Cria animações de linhas que sobem verticalmente
   */
  setupElevatorParticles() {
    console.log('[ElevatorScene] Configurando sistema de linhas ascendentes');

    // Pegar dimensões do minimapa (16x16 tiles * 16 pixels)
    const mapCenterX = (this.map.width * this.map.tileWidth) / 2;
    const mapCenterY = (this.map.height * this.map.tileHeight) / 2;
    const mapHalfWidth = (this.map.width * this.map.tileWidth) / 2;
    const mapHalfHeight = (this.map.height * this.map.tileHeight) / 2;

    // Configurar sistema de linhas que sobem
    this.risingLines = {
      container: this.add.container(),
      safeZoneX: { min: mapCenterX - mapHalfWidth, max: mapCenterX + mapHalfWidth },
      safeZoneY: { min: mapCenterY - mapHalfHeight, max: mapCenterY + mapHalfHeight },
      spawnCounter: 0
    };
    this.risingLines.container.setDepth(-2);

    console.log('[ElevatorScene] Sistema de linhas ascendentes criado');
  }

  createRisingLine() {
    if (!this.risingLines) return;

    const viewport = this.cameras.main.worldView;
    const safeZone = this.risingLines.safeZoneX;

    // Gerar posição X aleatória fora da zona segura
    let x;
    if (Math.random() > 0.5) {
      // Esquerda
      x = viewport.left + Math.random() * (safeZone.min - viewport.left);
    } else {
      // Direita
      x = safeZone.max + Math.random() * (viewport.right - safeZone.max);
    }

    const startY = viewport.bottom;
    const lineHeight = 50 + Math.random() * 150; // 50-200 pixels
    const duration = 2000 + Math.random() * 3000; // 2-5 segundos
    const grayTone = 0x333333 + Math.floor(Math.random() * 0x444444); // Tons cinza-escuro
    const alpha = 0.3 + Math.random() * 0.4; // 0.3-0.7 de opacidade

    // Criar graphics para a linha
    const graphics = this.make.graphics({ add: false });
    graphics.lineStyle(1, grayTone, alpha);
    graphics.lineBetween(0, 0, 0, lineHeight);
    graphics.setPosition(x, startY);
    graphics.setDepth(-2);

    this.risingLines.container.add(graphics);

    // Tweens para movimento e fade
    this.tweens.add({
      targets: graphics,
      y: viewport.top - lineHeight,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        graphics.destroy();
      }
    });

    // Fade out no final
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      ease: 'Linear'
    });
  }

  update() {
    super.update();
    
    // Criar novas linhas ascendentes a cada frame com probabilidade
    if (this.risingLines) {
      this.risingLines.spawnCounter++;
      // Criar uma linha a cada 10 frames aproximadamente (60fps = ~6 linhas/segundo)
      if (this.risingLines.spawnCounter >= 10) {
        this.createRisingLine();
        this.risingLines.spawnCounter = 0;
      }
    }
    
    if (this.player && this.doorZones) {
      this.doorZones.forEach(door => door.update(this.player, this.input, this.tweens));
    }
  }

  transitionToHallway() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.HALLWAY, {
        user: this.user,
        spawnPoint: 'fromElevator'
      });
    });
  }

  getSpawnX() {
    return 8; // Centro do minimapa 16x16
  }

  getSpawnY() {
    return 8;
  }

  setupNPCs() {
    this.npcs = [];
  }
}
