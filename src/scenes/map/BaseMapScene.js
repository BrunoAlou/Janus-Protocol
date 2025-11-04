import Phaser from 'phaser';
import { createPlayer } from '../../player/PlayerFactory.js';
import PlayerController from '../../player/PlayerController.js';
import InteractionManager from '../../interactions/InteractionManager.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import CollisionDebugger from '../../utils/CollisionDebugger.js';

/**
 * BaseMapScene - Classe base para todas as cenas de mapa
 * Compartilha lógica comum: player, NPCs, colisões, etc.
 */
export default class BaseMapScene extends Phaser.Scene {
  constructor(key, mapKey) {
    super(key);
    this.sceneKey = key;
    this.mapKey = mapKey;
  }

  init(data) {
    this.user = data.user;
    this.previousScene = data.previousScene;
  }

  preload() {
    // Carregar mapa específico (sobrescrever em cada cena)
    this.load.tilemapTiledJSON(this.mapKey, `./src/assets/${this.mapKey}.json`);
    
    // Tilesets comuns já carregados no BootScene
  }

  create() {
    // Lançar cenas de UI
    this.scene.launch('UIScene');
    this.scene.launch('DialogScene');
    this.scene.launch('PauseMenuScene');
    this.scene.launch('MinimapScene');

    // Notificar mudança de sala para o minimapa
    this.game.events.emit('room-changed', this.sceneKey);

    // Criar mapa
    this.setupMap();

    // Criar player
    this.setupPlayer();

    // Criar NPCs
    this.setupNPCs();

    // Configurar interações
    this.setupInteractions();

    // Configurar câmera
    this.setupCamera();

    console.log(`[${this.sceneKey}] Scene created`);
  }

  setupMap() {
    this.map = this.make.tilemap({ key: this.mapKey });
    
    // Adicionar tilesets (mesmos para todas as cenas)
    const tileset1 = this.map.addTilesetImage('1_Generic_32x32', '1_generic_image');
    const tileset2 = this.map.addTilesetImage('5_Classroom_and_library_32x32', '5_classroom_image');
    const tileset3 = this.map.addTilesetImage('Generic_Home_1_Layer_1_32x32', 'generic_home_image');
    const tileset4 = this.map.addTilesetImage('Condominium_Design_2_layer_1_32x32', 'condo_layer1_image');
    const tileset5 = this.map.addTilesetImage('Condominium_Design_2_preview_32x32', 'condo_preview_image');

    const allTilesets = [tileset1, tileset2, tileset3, tileset4, tileset5];

    // Criar camadas (nomes padrão)
    this.layers = {
      debug: this.map.createLayer('debug_numbers', allTilesets, 0, 0),
      floor: this.map.createLayer('Chão', allTilesets, 0, 0),
      walls2: this.map.createLayer('paredes2', allTilesets, 0, 0),
      walls: this.map.createLayer('Paredes', allTilesets, 0, 0),
      objects: this.map.createLayer('Objetos', allTilesets, 0, 0),
      doors: this.map.createLayer('Portas', allTilesets, 0, 0),
      objectsOver: this.map.createLayer('ObjetosSobrepostos', allTilesets, 0, 0)
    };

    // Configurar depths
    if (this.layers.debug) this.layers.debug.setDepth(0).setAlpha(0.3);
    this.layers.floor?.setDepth(1);
    this.layers.walls2?.setDepth(2);
    this.layers.walls?.setDepth(3);
    this.layers.objects?.setDepth(4);
    this.layers.doors?.setDepth(5);
    this.layers.objectsOver?.setDepth(6);

    // Configurar colisões
    this.layers.walls?.setCollisionByExclusion([-1]);
    this.layers.walls2?.setCollisionByExclusion([-1]);
    this.layers.objects?.setCollisionByExclusion([-1]);
    this.layers.doors?.setCollisionByExclusion([-1]);
    // ObjetosSobrepostos NÃO deve ter colisão (camada visual apenas)

    // Limites do mundo
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  setupPlayer() {
    // Posição inicial (pode ser sobrescrita)
    const spawnX = this.getSpawnX();
    const spawnY = this.getSpawnY();

    this.player = createPlayer(this, spawnX, spawnY);
    this.player.setCollideWorldBounds(true);

    // Adicionar colisões e armazenar referências
    const colliderWalls = this.layers.walls ? this.physics.add.collider(this.player, this.layers.walls) : null;
    const colliderWalls2 = this.layers.walls2 ? this.physics.add.collider(this.player, this.layers.walls2) : null;
    const colliderObjects = this.layers.objects ? this.physics.add.collider(this.player, this.layers.objects) : null;
    const colliderDoors = this.layers.doors ? this.physics.add.collider(this.player, this.layers.doors) : null;
    // ObjetosSobrepostos NÃO deve ter collider (camada visual apenas)

    // Configurar debugger de colisões
    this.collisionDebugger = new CollisionDebugger(this, this.player);
    if (colliderWalls) this.collisionDebugger.registerCollider(colliderWalls, 'Paredes');
    if (colliderWalls2) this.collisionDebugger.registerCollider(colliderWalls2, 'Paredes2');
    if (colliderObjects) this.collisionDebugger.registerCollider(colliderObjects, 'Objetos');
    if (colliderDoors) this.collisionDebugger.registerCollider(colliderDoors, 'Portas');

    // Listener para toggle do debug (tecla D)
    this.input.keyboard.on('keydown-D', () => {
      if (this.collisionDebugger) {
        this.collisionDebugger.toggle();
      }
    });

    // Controller
    this.playerController = new PlayerController(this, this.player, { speed: 180 });
  }

  setupNPCs() {
    // Sobrescrever em cada cena para adicionar NPCs específicos
    this.npcs = [];
  }

  setupInteractions() {
    this.interactionManager = new InteractionManager(this, this.player);
    if (this.npcs.length > 0) {
      this.interactionManager.registerNPCs(this.npcs);
    }
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(4.0); // Zoom padrão
  }

  getSpawnX() {
    return this.map.widthInPixels / 2;
  }

  getSpawnY() {
    return this.map.heightInPixels / 2;
  }

  update(time, delta) {
    if (this.playerController) {
      this.playerController.update(time, delta);
    }
    if (this.interactionManager) {
      this.interactionManager.update();
    }
    // Atualizar debugger de colisões
    if (this.collisionDebugger) {
      this.collisionDebugger.update();
    }
    // Atualizar posição de elementos dos NPCs
    this.npcs.forEach(npc => npc.updateElements?.());
  }

  /**
   * Transição para outra cena
   */
  transitionTo(sceneKey, data = {}) {
    this.scene.start(sceneKey, { ...data, user: this.user, previousScene: this.sceneKey });
  }
}
