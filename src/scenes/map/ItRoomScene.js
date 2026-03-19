import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { getTextureKeyForTileset, preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import { resolveMapPath } from '../../utils/AssetResolver.js';

/**
 * ItRoomScene - Sala de TI / Informática
 */
export default class ItRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.IT_ROOM, 'ti_map');
  }

  preload() {
    console.log('[ItRoomScene] Preload started');
    
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets de forma padronizada pelo registro central
    preloadRegisteredTilesets(this);
    
    // Carregar mapa da sala de TI
    this.load.tilemapTiledJSON('ti_map', resolveMapPath('Ti.json'));
    
    console.log('[ItRoomScene] Preload finished');
  }

  init(data) {
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false;
  }

  create() {
    super.create();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Configurar zonas de transição
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    console.log('[ItRoomScene] IT Room loaded, spawn:', this.spawnPoint);
  }

  setupMap() {
    console.log(`[${this.sceneKey}] Setting up TI map`);
    
    if (!this.cache.tilemap.has(this.mapKey)) {
      console.error(`[${this.sceneKey}] Tilemap "${this.mapKey}" not found!`);
      return;
    }
    
    this.map = this.make.tilemap({ key: this.mapKey });
    
    if (!this.map) {
      console.error(`[${this.sceneKey}] Failed to create tilemap!`);
      return;
    }
    
    console.log(`[${this.sceneKey}] Map created:`, {
      width: this.map.width,
      height: this.map.height,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight
    });
    
    // Adicionar tilesets
    const allTilesets = [];
    
    this.map.tilesets.forEach(tilesetData => {
      const tilesetName = tilesetData.name;
      const textureKey = getTextureKeyForTileset(tilesetName);
      
      if (textureKey) {
        const tileset = this.map.addTilesetImage(tilesetName, textureKey);
        if (tileset) {
          allTilesets.push(tileset);
          console.log(`[${this.sceneKey}] ✓ Tileset ${tilesetName} adicionado`);
        }
      }
    });
    
    if (allTilesets.length === 0) {
      console.error(`[${this.sceneKey}] No valid tilesets!`);
      return;
    }

    // Criar camadas
    this.layers = {
      debug: this.map.createLayer('debug_numbers', allTilesets, 0, 0),
      floor: this.map.createLayer('Chão', allTilesets, 0, 0),
      walls2: this.map.createLayer('paredes2', allTilesets, 0, 0),
      walls: this.map.createLayer('Paredes', allTilesets, 0, 0),
      objects: this.map.createLayer('Objetos', allTilesets, 0, 0),
      doors: this.map.createLayer('Portas', allTilesets, 0, 0),
      objectsOver: this.map.createLayer('ObjetosSobrepostos', allTilesets, 0, 0)
    };

    // Depths
    if (this.layers.debug) this.layers.debug.setDepth(0).setAlpha(0.3);
    this.layers.floor?.setDepth(1);
    this.layers.walls2?.setDepth(2);
    this.layers.walls?.setDepth(3);
    this.layers.objects?.setDepth(4);
    this.layers.doors?.setDepth(5);
    this.layers.objectsOver?.setDepth(6);

    // Colisões
    this.layers.walls?.setCollisionByExclusion([-1]);
    this.layers.walls2?.setCollisionByExclusion([-1]);
    this.layers.objects?.setCollisionByExclusion([-1]);
    this.layers.doors?.setCollisionByExclusion([-1]);

    // Limites do mundo
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  setupDoorTransitions() {
    // Mapa Ti: 32x32 tiles de 16x16 = 512x512px
    // Porta de saída (voltar para recepção) - parte inferior
    const exitDoor = this.add.zone(256, 500, 64, 16).setOrigin(0.5);
    this.physics.world.enable(exitDoor);
    exitDoor.body.setAllowGravity(false);
    exitDoor.body.moves = false;

    // Indicador visual
    const doorIndicator = this.add.container(256, 480);
    const eButton = this.add.circle(0, -20, 12, 0x000000, 0.8)
      .setStrokeStyle(2, 0xffff00);
    const eText = this.add.text(0, -20, 'E', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const actionText = this.add.text(0, 5, 'RECEPÇÃO', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    doorIndicator.add([eButton, eText, actionText]);
    doorIndicator.setDepth(1500);
    doorIndicator.setAlpha(0);

    this.doorZones = [{
      zone: exitDoor,
      indicator: doorIndicator,
      action: () => this.transitionToReception(),
      proximityDistance: 50
    }];
  }

  update(time, delta) {
    super.update(time, delta);
    
    // Verificar proximidade com portas
    if (this.player && this.doorZones) {
      this.doorZones.forEach(doorData => {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          doorData.zone.x, doorData.zone.y
        );

        if (distance < doorData.proximityDistance) {
          doorData.indicator.setAlpha(1);
          
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

  transitionToReception() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ItRoomScene] Transitioning to Reception...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.RECEPTION, {
        user: this.user,
        spawnPoint: 'fromItRoom'
      });
    });
  }

  getSpawnX() {
    if (this.spawnPoint === 'fromReception') {
      return 256; // Centro da sala
    }
    return 256;
  }

  getSpawnY() {
    if (this.spawnPoint === 'fromReception') {
      return 450; // Próximo à entrada
    }
    return 300;
  }

  setupNPCs() {
    // NPCs desabilitados por enquanto
    this.npcs = [];
    console.log('[ItRoomScene] NPCs disabled for now');
  }
}
