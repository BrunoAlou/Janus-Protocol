import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';

/**
 * ArchiveRoomScene - Sala de Arquivos
 */
export default class ArchiveRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.ARCHIVE_ROOM, 'hallway');
  }

  preload() {
    console.log('[ArchiveRoomScene] Preload started');
    
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets de forma padronizada e mapa via resolver
    preloadRegisteredTilesets(this);
    super.preload();
    
    console.log('[ArchiveRoomScene] Preload finished - loading archive room map');
  }

  init(data) {
    console.log('[ArchiveRoomScene] init() called with data:', data);
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false; // Reset flag de transição
  }

  create() {
    console.log('[ArchiveRoomScene] create() called');
    super.create();
    
    console.log('[ArchiveRoomScene] super.create() finished');
    
    // Fade in da câmera
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Criar zonas de transição
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    console.log('[ArchiveRoomScene] Archive Room loaded, spawn:', this.spawnPoint);
  }

  update() {
    // Chamar update da classe pai para manter movimento do player
    super.update();
    
    // Verificar proximidade do player com portas
    if (this.player && this.doorZones) {
      this.doorZones.forEach(doorData => {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          doorData.zone.x, doorData.zone.y
        );

        // Mostrar indicador se estiver próximo
        if (distance < doorData.proximityDistance) {
          doorData.indicator.setAlpha(1);
          
          // Animação de pulso
          if (!doorData.indicator.isTweening) {
            doorData.indicator.isTweening = true;
            this.tweens.add({
              targets: doorData.indicator,
              y: doorData.indicator.y - 5,
              duration: 400,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
          
          // Verificar se pressionou E
          if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('E'))) {
            doorData.action();
          }
        } else {
          doorData.indicator.setAlpha(0);
          if (doorData.indicator.isTweening) {
            this.tweens.killTweensOf(doorData.indicator);
            doorData.indicator.isTweening = false;
          }
        }
      });
    }
  }

  setupDoorTransitions() {
    // Porta no lado esquerdo (oeste) - volta para Reception
    // Mapa do hall: 16x16 tiles de 16px = 256x256 pixels
    // Porta na parede esquerda, mais abaixo para não ficar atrás da parede: x=8 (tile 0), y=200
    const receptionDoor = this.add.zone(10, 240, 16, 64).setOrigin(0.5);
    this.physics.world.enable(receptionDoor);
    receptionDoor.body.setAllowGravity(false);
    receptionDoor.body.moves = false;

    // Adicionar indicador visual (inicialmente invisível)
    const doorIndicator = this.add.container(30, 200);
    
    // Botão E
    const eButton = this.add.circle(0, -20, 12, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffff00);
    const eText = this.add.text(0, -20, 'E', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Texto de ação
    const actionText = this.add.text(0, 5, 'RECEPÇÃO', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    doorIndicator.add([eButton, eText, actionText]);
    doorIndicator.setDepth(1500);
    doorIndicator.setAlpha(0); // Começa invisível

    // Armazenar referências
    this.doorZones = this.doorZones || [];
    this.doorZones.push({
      zone: receptionDoor,
      indicator: doorIndicator,
      action: () => this.transitionToReception(),
      proximityDistance: 50 // Distância em pixels para mostrar indicador
    });

    console.log('[ArchiveRoomScene] Door transition zones created');
  }

  transitionToReception() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ArchiveRoomScene] Transitioning to Reception...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Usar SceneManager para mudar de sala
      window.sceneManager.goToMap(SCENE_NAMES.RECEPTION, {
        user: this.user,
        spawnPoint: 'fromArchiveRoom'
      });
    });
  }

  getSpawnX() {
    // Ajustar spawn baseado de onde o player veio
    if (this.spawnPoint === 'fromReception') {
      return 240; // Próximo à porta direita (vindo da recepção) - 16x16 mapa, porta no leste
    }
    return 128; // Centro do corredor (default)
  }

  getSpawnY() {
    // Ajustar spawn baseado de onde o player veio
    if (this.spawnPoint === 'fromReception') {
      return 200; // Meio da porta direita (ajustado para a nova posição da porta)
    }
    return 128; // Centro vertical (default)
  }

  setupNPCs() {
    // Corredor sem NPCs (área de passagem)
    this.npcs = [];
  }
}
