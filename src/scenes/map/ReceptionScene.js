import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';

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
    
    // Carregar tilesets (sempre, pois podem ter sido descartados)
    this.load.image("1_generic_image", "/src/assets/1_Generic_32x32.png");
    this.load.image("5_classroom_image", "/src/assets/5_Classroom_and_library_32x32.png");
    this.load.image("generic_home_image", "/src/assets/Generic_Home_1_Layer_1_32x32.png");
    this.load.image("condo_layer1_image", "/src/assets/Condominium_Design_2_layer_1_32x32.png");
    this.load.image("condo_preview_image", "/src/assets/Condominium_Design_preview_32x32.png");
    this.load.image("modern_office_image", "/src/assets/Modern_Office_Shadowless_32x32.png");
    
    // Carregar mapa da reception
    this.load.tilemapTiledJSON("reception", "/src/assets/reception.json");
    
    console.log('[ReceptionScene] Preload finished - loading reception map');
  }

  init(data) {
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false; // Reset flag de transição
  }

  create() {
    super.create(); // Chama o create da BaseMapScene
    
    // Fade in da câmera
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Criar zona de transição para o hall (porta no fundo da recepção)
    this.setupDoorTransitions();
    
    // Mostrar diálogo de introdução apenas no spawn inicial (não ao voltar)
    if (this.spawnPoint === 'default') {
      this.showIntroductionDialogue();
    }
    
    console.log('[ReceptionScene] Reception loaded, spawn:', this.spawnPoint);
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
    this.doorZones = [];
    
    // === PORTA PARA ARQUIVO (lado direito) ===
    // Mapa da recepção: 40x30 tiles de 16x16px = 640x480px
    // Porta na parede direita: x=624, y=240
    const hallwayDoor = this.add.zone(624, 240, 16, 64).setOrigin(0.5);
    this.physics.world.enable(hallwayDoor);
    hallwayDoor.body.setAllowGravity(false);
    hallwayDoor.body.moves = false;

    const archiveIndicator = this.add.container(610, 240);
    const eButton1 = this.add.circle(0, -20, 12, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffff00);
    const eText1 = this.add.text(0, -20, 'E', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const actionText1 = this.add.text(0, 5, 'ARQUIVO', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    archiveIndicator.add([eButton1, eText1, actionText1]);
    archiveIndicator.setDepth(1500);
    archiveIndicator.setAlpha(0);

    this.doorZones.push({
      zone: hallwayDoor,
      indicator: archiveIndicator,
      action: () => this.transitionToArchiveRoom(),
      proximityDistance: 50
    });

    // === PORTA PARA SALA DE TI (lado esquerdo - simétrico ao arquivo) ===
    // Porta na parede esquerda: x=16, y=240 (mesma altura que arquivo)
    const itRoomDoor = this.add.zone(16, 240, 16, 64).setOrigin(0.5);
    this.physics.world.enable(itRoomDoor);
    itRoomDoor.body.setAllowGravity(false);
    itRoomDoor.body.moves = false;

    const itIndicator = this.add.container(30, 240);
    const eButton2 = this.add.circle(0, -20, 12, 0x000000, 0.8)
      .setStrokeStyle(2, 0x00ffff);
    const eText2 = this.add.text(0, -20, 'E', {
      fontSize: '14px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const actionText2 = this.add.text(0, 5, 'SALA TI', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000066',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    itIndicator.add([eButton2, eText2, actionText2]);
    itIndicator.setDepth(1500);
    itIndicator.setAlpha(0);

    this.doorZones.push({
      zone: itRoomDoor,
      indicator: itIndicator,
      action: () => this.transitionToItRoom(),
      proximityDistance: 50
    });

    console.log('[ReceptionScene] Door transitions: Archive (624,240), IT Room (16,240)');
  }

  transitionToArchiveRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ReceptionScene] Transitioning to Archive Room...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.ARCHIVE_ROOM, {
        user: this.user,
        spawnPoint: 'fromReception'
      });
    });
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
    if (this.spawnPoint === 'fromArchiveRoom') {
      return 600; // Próximo à porta direita
    }
    if (this.spawnPoint === 'fromItRoom') {
      return 50; // Próximo à porta esquerda
    }
    return 336; // Posição inicial (default)
  }

  getSpawnY() {
    if (this.spawnPoint === 'fromArchiveRoom') {
      return 240; // Meio da porta direita
    }
    if (this.spawnPoint === 'fromItRoom') {
      return 240; // Meio da porta esquerda
    }
    return 469; // Posição inicial na recepção (default)
  }

  setupNPCs() {
    // NPCs da recepção - temporariamente desabilitado até ter sprites
    this.npcs = [];
    
    // TODO: Adicionar NPCs quando sprites estiverem disponíveis
    // this.npcs = [
    //   NPCFactory.create(this, 320, 200, {
    //     ...NPCFactory.templates.receptionist,
    //     dialogues: [...]
    //   })
    // ];

    console.log('[ReceptionScene] Created', this.npcs.length, 'NPCs');
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
