import Phaser from "phaser";
import loadPlayerAssets from '../player/loadPlayerAssets.js';
import { createPlayer } from '../player/PlayerFactory.js';
import PlayerController from '../player/PlayerController.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    // Carregar as imagens dos tilesets
    this.load.image("1_generic_image", "./src/assets/1_Generic_32x32.png");
    this.load.image("5_classroom_image", "./src/assets/5_Classroom_and_library_32x32.png");
    this.load.image("generic_home_image", "./src/assets/Generic_Home_1_Layer_1_32x32.png");
    this.load.image("condo_layer1_image", "./src/assets/Condominium_Design_2_layer_1_32x32.png");
    this.load.image("condo_preview_image", "./src/assets/Condominium_Design_preview_32x32.png");
    
    // Carregar o tilemap JSON da recepção
    this.load.tilemapTiledJSON("reception", "./src/assets/reception.json");

    // Carregar spritesheet do PLAYER
    loadPlayerAssets(this);
  }



  create() {
    // Iniciar a cena da UI em paralelo
    this.scene.launch('UIScene');
    this.scene.launch('MinimapScene');

    // Notificar minimapa sobre a sala atual
    this.game.events.emit('room-changed', 'GameScene');

    // Criar texturas placeholder se as imagens de tileset não foram carregadas
    this.ensureTilesetTextures();

    // 1. CRIAR O MAPA E AS CAMADAS
    this.map = this.make.tilemap({ key: 'reception' });
    const tileset3 = this.map.addTilesetImage('1_Generic_32x32', '1_generic_image');
    const tileset4 = this.map.addTilesetImage('5_Classroom_and_library_32x32', '5_classroom_image');
    const tileset5 = this.map.addTilesetImage('Generic_Home_1_Layer_1_32x32', 'generic_home_image');
    const tileset6 = this.map.addTilesetImage('Condominium_Design_2_layer_1_32x32', 'condo_layer1_image');
    const tileset7 = this.map.addTilesetImage('Condominium_Design_2_preview_32x32', 'condo_preview_image');

    if (!tileset3 || !tileset4 || !tileset5 || !tileset6 || !tileset7) {
      console.error("Falha ao criar os tilesets. Adicione as imagens dos tilesets em src/assets/");
      return;
    }

    // Array com todos os tilesets para uso nas camadas
    const allTilesets = [tileset3, tileset4, tileset5, tileset6, tileset7];

    // Criar as camadas (novas layers da recepção)
    const debugNumbersLayer = this.map.createLayer('debug_numbers', allTilesets, 0, 0);
    const chaoLayer = this.map.createLayer('Chão', allTilesets, 0, 0);
    const paredes2Layer = this.map.createLayer('paredes2', allTilesets, 0, 0);
    const paredesLayer = this.map.createLayer('Paredes', allTilesets, 0, 0);
    const objetosLayer = this.map.createLayer('Objetos', allTilesets, 0, 0);
    const portasLayer = this.map.createLayer('Portas', allTilesets, 0, 0);
    const objetosSobrepostosLayer = this.map.createLayer('ObjetosSobrepostos', allTilesets, 0, 0);

    // Definir a ordem de renderização (profundidade)
    if (debugNumbersLayer) debugNumbersLayer.setDepth(0).setAlpha(0.3); // Debug layer semi-transparente
    chaoLayer.setDepth(1);
    paredes2Layer.setDepth(2);
    paredesLayer.setDepth(3);
    objetosLayer.setDepth(4);
    portasLayer.setDepth(5);
    objetosSobrepostosLayer.setDepth(6);

    // 2. CRIAR O PLAYER (personagem principal)
    const spawnPoint = this.getPlayerSpawnPoint();
    console.log('[GameScene] Spawn point:', spawnPoint);
    console.log('[GameScene] Map dimensions:', { 
      widthInPixels: this.map.widthInPixels, 
      heightInPixels: this.map.heightInPixels,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight,
      widthInTiles: this.map.width,
      heightInTiles: this.map.height
    });
    
    // DEFINA AQUI A POSIÇÃO INICIAL DO PLAYER EM PIXELS
    // Exemplo: playerX = 320, playerY = 240 (centro do mapa 40x30)
    const playerX = 320;  // Posição X em pixels (0 a 640)
    const playerY = 450;  // Posição Y em pixels (0 a 480)
    
    console.log('[GameScene] Player position set to:', { playerX, playerY });

    // Criar player principal
    this.player = createPlayer(this, playerX, playerY);
    // Configurar limites do mundo físico para impedir o player de sair do mapa
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    
    // Garantir que o player colida com os limites do mundo
    this.player.setCollideWorldBounds(true);

    // 3. DEFINIR COLISÕES (incluindo portas)
    paredesLayer.setCollisionByExclusion([-1]);
    paredes2Layer.setCollisionByExclusion([-1]);
    objetosLayer.setCollisionByExclusion([-1]);
    portasLayer.setCollisionByExclusion([-1]);

    // 4. CRIAR OS COLLIDERS
    const colliderParedes = this.physics.add.collider(this.player, paredesLayer);
    const colliderParedes2 = this.physics.add.collider(this.player, paredes2Layer);
    const colliderObjetos = this.physics.add.collider(this.player, objetosLayer);
    const colliderPortas = this.physics.add.collider(this.player, portasLayer);

    // 5. SISTEMA DE DEBUG DE COLISÕES
    this.collisionDebugger = new CollisionDebugger(this, this.player);
    this.collisionDebugger.registerCollider(colliderParedes, 'Paredes');
    this.collisionDebugger.registerCollider(colliderParedes2, 'Paredes2');
    this.collisionDebugger.registerCollider(colliderObjetos, 'Objetos');
    this.collisionDebugger.registerCollider(colliderPortas, 'Portas');

    // Tecla D para toggle do debug de colisões
    this.input.keyboard.on('keydown-D', () => {
      this.collisionDebugger.toggle();
    });

    // Controlador de input do player (velocidade ajustada para mapa menor)
    this.playerController = new PlayerController(this, this.player, { speed: 180 });

    // 5. CONFIGURAR A CÂMERA
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    
    // Aumentar zoom para que o mapa fique maior na tela
    // Com mapa 40x30 (640x480px), usar zoom 2.0 para melhor visualização
    this.cameras.main.setZoom(4.0);
  }

  getPlayerSpawnPoint() {
    const objectLayer = this.map.getObjectLayer('Objetos');
    if (objectLayer) {
      return objectLayer.objects.find(obj => obj.name === 'PlayerSpawn');
    }
    return null;
  }

  ensureTilesetTextures() {
    // Criar texturas placeholder se as imagens dos tilesets não foram carregadas
    if (!this.textures.exists('office_tiles_image')) {
      const canvas1 = document.createElement('canvas');
      canvas1.width = 256;
      canvas1.height = 848;
      const ctx1 = canvas1.getContext('2d');
      // Grid cinza para visualização
      ctx1.fillStyle = '#444444';
      ctx1.fillRect(0, 0, 256, 848);
      ctx1.strokeStyle = '#666666';
      for (let i = 0; i < 848; i += 16) {
        for (let j = 0; j < 256; j += 16) {
          ctx1.strokeRect(j, i, 16, 16);
        }
      }
      this.textures.addCanvas('office_tiles_image', canvas1);
      console.warn('Tileset placeholder criado para office_tiles_image');
    }
    
    if (!this.textures.exists('office_tiles_2_image')) {
      const canvas2 = document.createElement('canvas');
      canvas2.width = 256;
      canvas2.height = 224;
      const ctx2 = canvas2.getContext('2d');
      ctx2.fillStyle = '#555555';
      ctx2.fillRect(0, 0, 256, 224);
      ctx2.strokeStyle = '#777777';
      for (let i = 0; i < 224; i += 16) {
        for (let j = 0; j < 256; j += 16) {
          ctx2.strokeRect(j, i, 16, 16);
        }
      }
      this.textures.addCanvas('office_tiles_2_image', canvas2);
      console.warn('Tileset placeholder criado para office_tiles_2_image');
    }
  }
  
  update(time, delta) {
    if (this.playerController) this.playerController.update(time, delta);
  }
}
