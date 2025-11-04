import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import NPCFactory from '../../npcs/NPCFactory.js';

/**
 * ReceptionScene - Cena da recepção (antiga GameScene)
 */
export default class ReceptionScene extends BaseMapScene {
  constructor() {
    super('ReceptionScene', 'reception');
  }

  preload() {
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets
    this.load.image("1_generic_image", "./src/assets/1_Generic_32x32.png");
    this.load.image("5_classroom_image", "./src/assets/5_Classroom_and_library_32x32.png");
    this.load.image("generic_home_image", "./src/assets/Generic_Home_1_Layer_1_32x32.png");
    this.load.image("condo_layer1_image", "./src/assets/Condominium_Design_2_layer_1_32x32.png");
    this.load.image("condo_preview_image", "./src/assets/Condominium_Design_preview_32x32.png");
    
    // Carregar mapa
    this.load.tilemapTiledJSON("reception", "./src/assets/reception.json");
  }

  create() {
    super.create(); // Chama o create da BaseMapScene
    
    console.log('[ReceptionScene] Reception loaded');
  }

  getSpawnX() {
    return 320; // Posição inicial na recepção
  }

  getSpawnY() {
    return 450;
  }

  setupNPCs() {
    // NPCs da recepção
    this.npcs = [
      NPCFactory.create(this, 320, 200, {
        ...NPCFactory.templates.receptionist,
        dialogues: [
          { text: 'Bem-vindo ao Janus Protocol!', emotion: 'happy' },
          { text: 'Aqui começa sua jornada de treinamento.', emotion: 'professional' },
          { text: 'Use as portas para explorar outras áreas.', emotion: 'neutral' }
        ]
      })
    ];

    console.log('[ReceptionScene] Created', this.npcs.length, 'NPCs');
  }
}
