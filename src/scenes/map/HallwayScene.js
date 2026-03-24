import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import DoorZone from '../../components/DoorZone.js';
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

    if (this.player && this.doorZones) {
      this.doorZones.forEach((door) => door.update(this.player, this.input, this.tweens));
    }
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 10,
        y: 240,
        width: 16,
        height: 64,
        label: 'RECEPCAO',
        indicatorColor: 0xffff00,
        indicatorTextColor: '#ffff00',
        indicatorOffsetX: 14,
        onInteract: () => this.transitionToReception(),
        proximityDistance: 50
      })
    ];

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
