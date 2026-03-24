import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import {
  createSitGuyAnimations,
  loadSitGuyAssets
} from '../../npcs/sitGuyAnimations.js';

/**
 * ReceptionScene - Cena da recepção (antiga GameScene)
 */
export default class ReceptionScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.RECEPTION, 'reception');
  }

  preload() {
    console.log('[ReceptionScene] Preload started');
    
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets de forma padronizada pelo registro central
    preloadRegisteredTilesets(this);
    // Carregar mapa via resolver compatível com Vite/GitHub Pages
    super.preload();
    loadSitGuyAssets(this);
    
    console.log('[ReceptionScene] Preload finished - loading reception map');
  }

  init(data) {
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false; // Reset flag de transição
  }

  create() {
    createSitGuyAnimations(this);

    super.create(); // Chama o create da BaseMapScene

    this.registerStoryEvents();
    
    // Fade in da câmera
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Criar zona de transição para o hall (porta no fundo da recepção)
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    // Mostrar diálogo de introdução apenas no spawn inicial (não ao voltar)
    if (this.spawnPoint === 'default') {
      this.showIntroductionDialogue();
    }
    
    console.log('[ReceptionScene] Reception loaded, spawn:', this.spawnPoint);
  }

  registerStoryEvents() {
    this.events.on('meet-it-team', () => {
      if (window.gameState?.setFlag) {
        window.gameState.setFlag('met_it_team', true);
        window.gameState.setFlag('reception_ti_door_unlocked', true);
      }

      const dialogScene = this.scene.get('DialogScene');
      if (dialogScene && this.scene.isActive('DialogScene')) {
        dialogScene.showDialog({
          name: 'Recepcionista',
          dialogues: [
            { text: 'Perfeito! Ja registrei sua visita para conhecer a equipe de TI.' },
            { text: 'A porta da esquerda foi liberada. Pode seguir.' }
          ]
        });
      }
    });
  }

  update() {
    // Chamar update da classe pai para manter movimento do player
    super.update();
    if (this.player && this.doorZones) {
      this.doorZones.forEach(door => door.update(this.player, this.input, this.tweens));
    }
  }

  setupNPCs() {
    // Reception usa NPCs interativos via ElementManager (reception.json).
    // Evita duplicar sprites da object layer do Tiled.
    this.npcs = [];
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 624,
        y: 240,
        width: 16,
        height: 64,
        label: 'ENTRADA ELEVADOR',
        indicatorColor: 0xff7777,
        indicatorTextColor: '#ffcccc',
        indicatorOffsetX: -14,
        locked: true,
        lockedMessage: 'A entrada do elevador ainda nao esta disponivel para voce.',
        onInteract: () => {},
        proximityDistance: 50
      }),
      new DoorZone(this, {
        x: 16, y: 240, width: 16, height: 64,
        label: 'SALA TI',
        indicatorColor: 0x00ffff,
        indicatorTextColor: '#00ffff',
        labelBg: '#000066',
        indicatorOffsetX: 14,
        locked: true,
        lockedCondition: () => {
          const unlocked =
            window.gameState?.getFlag?.('reception_ti_door_unlocked') === true ||
            window.gameState?.getFlag?.('met_it_team') === true;
          return !unlocked;
        },
        lockedMessageResolver: () =>
          'A porta da TI esta bloqueada. Fale com a recepcionista e selecione "Conhecer equipe de TI".',
        onInteract: () => this.transitionToItRoom(),
        proximityDistance: 50
      })
    ];
    console.log('[ReceptionScene] Door transitions: Elevator (locked), IT Room (conditional)');
  }

  transitionToItRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ReceptionScene] Transitioning to IT Room...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.IT_ROOM, {
        user: this.user,
        spawnPoint: 'fromReception'
      });
    });
  }

  getSpawnX() {
    // Ajustar spawn baseado de onde o player veio
    if (this.spawnPoint === 'fromItRoom') {
      return 50; // Próximo à porta esquerda
    }
    return 336; // Posição inicial (default)
  }

  getSpawnY() {
    if (this.spawnPoint === 'fromItRoom') {
      return 240; // Meio da porta esquerda
    }
    return 469; // Posição inicial na recepção (default)
  }

  /**
   * Mostrar diálogo de introdução ao chegar na recepção
   */
  showIntroductionDialogue() {
    // Esperar o fade in completar antes de mostrar o diálogo
    this.time.delayedCall(600, () => {
      const dialogScene = this.scene.get('DialogScene');
      
      console.log('[ReceptionScene] Trying to show intro dialogue');
      console.log('[ReceptionScene] DialogScene:', dialogScene);
      console.log('[ReceptionScene] DialogScene active?', this.scene.isActive('DialogScene'));
      
      if (dialogScene && this.scene.isActive('DialogScene')) {
        const introData = {
          name: 'Introdução',
          dialogues: [
            {
              text: 'Você chega à recepção do Empire Tech.',
              emotion: 'neutral'
            },
            {
              text: 'Hoje é o grande dia - sua entrevista para a vaga de trainee.',
              emotion: 'neutral'
            },
            {
              text: 'Nervoso, mas confiante. É hora de causar uma boa impressão.',
              emotion: 'determined'
            },
            {
              text: 'Use as setas (↑ ← ↓ →) ou WASD para se movimentar.',
              emotion: 'neutral'
            },
            {
              text: 'Pressione [E] próximo a portas e objetos para interagir.',
              emotion: 'neutral'
            }
          ]
        };

        dialogScene.showDialog(introData);
        console.log('[ReceptionScene] Introduction dialogue started');
      } else {
        console.error('[ReceptionScene] DialogScene not found or not active!');
      }
    });
  }
}
