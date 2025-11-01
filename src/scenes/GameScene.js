import Phaser from "phaser";
import loadPlayerAssets from '../assets/loadPlayerAssets.js';
import { createPlayer } from '../player/PlayerFactory.js';
import PlayerController from '../player/PlayerController.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    // Carregar as imagens dos tilesets
    this.load.image("office_tiles_image", "./src/assets/Modern_Office_Shadowless_16x16.png");
    this.load.image("office_tiles_2_image", "./src/assets/Room_Builder_Office_16x16.png");
    
    // Carregar o tilemap JSON
    this.load.tilemapTiledJSON("nivel_1", "./src/assets/nivel_1.json");

    // Carregar spritesheet do PLAYER
    loadPlayerAssets(this);
  }



  create() {
    // Iniciar a cena da UI em paralelo
    this.scene.launch('UIScene');

    // Criar texturas placeholder se as imagens de tileset não foram carregadas
    this.ensureTilesetTextures();

    // 1. CRIAR O MAPA E AS CAMADAS
    this.map = this.make.tilemap({ key: 'nivel_1' });
    const tileset1 = this.map.addTilesetImage('office_tiles', 'office_tiles_image');
    const tileset2 = this.map.addTilesetImage('office_tiles_2', 'office_tiles_2_image');

    if (!tileset1 || !tileset2) {
      console.error("Falha ao criar os tilesets. Adicione as imagens dos tilesets em src/assets/");
      return;
    }

    // Criar as camadas
    const chaoLayer = this.map.createLayer('Chão', [tileset1, tileset2], 0, 0);
    const paredes2Layer = this.map.createLayer('paredes2', [tileset1, tileset2], 0, 0);
    const paredesLayer = this.map.createLayer('Paredes', [tileset1, tileset2], 0, 0);
    const objetosLayer = this.map.createLayer('Objetos', [tileset1, tileset2], 0, 0);
    const objetosSobrepostosLayer = this.map.createLayer('ObjetosSobrepostos', [tileset1, tileset2], 0, 0);

    // Definir a ordem de renderização (profundidade)
    chaoLayer.setDepth(0);
    paredes2Layer.setDepth(1);
    paredesLayer.setDepth(2);
    objetosLayer.setDepth(3);
    objetosSobrepostosLayer.setDepth(5);

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
    
    const playerX = spawnPoint ? spawnPoint.x : this.map.widthInPixels / 2;
    const playerY = spawnPoint ? spawnPoint.y : this.map.heightInPixels / 2;
    console.log('[GameScene] Calculated player position:', { playerX, playerY });

    // Criar player principal
    this.player = createPlayer(this, playerX, playerY);

    // 3. DEFINIR COLISÕES
    paredesLayer.setCollisionByExclusion([-1]);
    paredes2Layer.setCollisionByExclusion([-1]);
    objetosLayer.setCollisionByExclusion([-1]);

    // 4. CRIAR OS COLLIDERS
    this.physics.add.collider(this.player, paredesLayer);
    this.physics.add.collider(this.player, paredes2Layer);
    this.physics.add.collider(this.player, objetosLayer);

    // Controlador de input do player
    this.playerController = new PlayerController(this, this.player, { speed: 200 });

    // 5. CONFIGURAR A CÂMERA
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(2);
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
