import Phaser from 'phaser';
import { createPlayer } from '../../player/PlayerFactory.js';
import PlayerController from '../../player/PlayerController.js';
import InteractionManager from '../../interactions/InteractionManager.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import CollisionDebugger from '../../utils/CollisionDebugger.js';
import { ElementManager } from '../../elements/index.js';
import { getTextureKeyForTileset } from '../../constants/TilesetAssets.js';

/**
 * BaseMapScene - Classe base para todas as cenas de mapa
 * Compartilha lógica comum: player, NPCs, colisões, etc.
 */
export default class BaseMapScene extends Phaser.Scene {
  constructor(key, mapKey) {
    super(key);
    this.sceneKey = key;
    this.mapKey = mapKey;
    this.defaultZoom = 3.0; // Zoom padrão - pode ser sobrescrito em subclasses
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

    // Configurar elementos interativos
    this.setupElements();

    // Configurar câmera
    this.setupCamera();

    console.log(`[${this.sceneKey}] Scene created`);
    
    // SceneManager já gerencia as cenas UI
    console.log(`[${this.sceneKey}] UI scenes managed by SceneManager`);
    
    // Manter rastreamento de DoorZones registradas para evitar duplicatas
    this._registeredDoorZones = new Set();
  }

  setupMap() {
    console.log(`[${this.sceneKey}] Setting up map with key: ${this.mapKey}`);
    
    // Verificar se o tilemap existe
    if (!this.cache.tilemap.has(this.mapKey)) {
      console.error(`[${this.sceneKey}] Tilemap "${this.mapKey}" not found in cache!`);
      console.log('Available tilemaps:', this.cache.tilemap.getKeys());
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
      tileHeight: this.map.tileHeight,
      layers: this.map.layers.map(l => l.name),
      tilesets: this.map.tilesets.map(ts => ({ name: ts.name, firstgid: ts.firstgid }))
    });
    
    // Adicionar tilesets baseado no que o mapa realmente usa
    console.log(`[${this.sceneKey}] Tentando adicionar tilesets...`);
    const allTilesets = [];
    
    // Para cada tileset no mapa, tentar adicionar
    this.map.tilesets.forEach(tilesetData => {
      const tilesetName = tilesetData.name;
      console.log(`[${this.sceneKey}] Procurando tileset: ${tilesetName}`);
      
      // Resolver chave de textura pelo registro central de tilesets
      const textureKey = getTextureKeyForTileset(tilesetName);
      
      if (textureKey) {
        console.log(`[${this.sceneKey}] Tentando adicionar ${tilesetName} com textura ${textureKey}`);
        const tileset = this.map.addTilesetImage(tilesetName, textureKey);
        if (tileset) {
          allTilesets.push(tileset);
          console.log(`[${this.sceneKey}] ✓ Tileset ${tilesetName} adicionado com sucesso`);
        } else {
          console.error(`[${this.sceneKey}] ✗ Falha ao adicionar tileset ${tilesetName}`);
        }
      } else {
        console.warn(`[${this.sceneKey}] Tileset ${tilesetName} não tem mapeamento de textura`);
      }
    });
    
    console.log(`[${this.sceneKey}] Tilesets criados: ${allTilesets.length}`);
    
    if (allTilesets.length === 0) {
      console.error(`[${this.sceneKey}] No valid tilesets created!`);
      console.error('Map tilesets expected:', this.map.tilesets?.map(ts => ts.name));
      return;
    }

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
    
    console.log(`[${this.sceneKey}] Layers created:`, Object.keys(this.layers).filter(k => this.layers[k] !== null));

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

    // Configurar debugger de colisões
    this.collisionDebugger = new CollisionDebugger(this, this.player);

    // Listener para toggle do debug (tecla P)
    this.input.keyboard.on('keydown-P', () => {
      // Toggle apenas o CollisionDebugger (nosso sistema customizado)
      if (this.collisionDebugger) {
        this.collisionDebugger.toggle();
        window.debugEnabled = this.collisionDebugger.isEnabled();
        
        // Atualizar visibilidade dos debug boxes dos elementos
        if (this.elementManager) {
          this.elementManager.setDebugVisible(window.debugEnabled);
        }
      }
    });

    // Configurar colisões do player
    this.addCollisionsToSprite(this.player, true);

    // Controller
    this.playerController = new PlayerController(this, this.player, { speed: 180 });
  }

  /**
   * Adiciona colisões de sprite com camadas do mapa
   * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite para adicionar colisões
   * @param {boolean} isPlayer - Se true, registra colisões no debugger
   */
  addCollisionsToSprite(sprite, isPlayer = false) {
    if (!sprite || !sprite.body) {
      console.warn(`[${this.sceneKey}] Sprite sem body não pode colisionar`);
      return;
    }

    sprite.setCollideWorldBounds(true);

    const colliders = {
      walls: this.layers.walls ? this.physics.add.collider(sprite, this.layers.walls) : null,
      walls2: this.layers.walls2 ? this.physics.add.collider(sprite, this.layers.walls2) : null,
      objects: this.layers.objects ? this.physics.add.collider(sprite, this.layers.objects) : null,
      doors: this.layers.doors ? this.physics.add.collider(sprite, this.layers.doors) : null
    };

    // Registrar colisões no debugger apenas para o player
    if (isPlayer && this.collisionDebugger) {
      if (colliders.walls) this.collisionDebugger.registerCollider(colliders.walls, 'Paredes');
      if (colliders.walls2) this.collisionDebugger.registerCollider(colliders.walls2, 'Paredes2');
      if (colliders.objects) this.collisionDebugger.registerCollider(colliders.objects, 'Objetos');
      if (colliders.doors) this.collisionDebugger.registerCollider(colliders.doors, 'Portas');
    }

    console.log(`[${this.sceneKey}] Colisões adicionadas ao sprite`);
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

  /**
   * Configura elementos interativos do mapa
   * Carrega elementos de arquivo JSON baseado no mapKey
   */
  async setupElements() {
    // Criar ElementManager
    this.elementManager = new ElementManager(this, this.player);

    // Carregar elementos do arquivo JSON
    const mapId = this.mapKey || this.sceneKey.toLowerCase().replace('scene', '');
    await this.elementManager.loadFromFile(mapId);

    console.log(`[${this.sceneKey}] Elements loaded for map: ${mapId}`);
  }

  setupCamera() {
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setZoom(this.defaultZoom); // Usar zoom da cena
  }

  /**
   * Registra DoorZones no debugger de colisão
   * Chamado pelas cenas filhas após criar suas DoorZones com setupDoorTransitions()
   * Suporta dois formatos de DoorZone:
   *   - Classe DoorZone com propriedade .label
   *   - Objeto JSON com propriedades .zone, .indicator, .proximityDistance etc
   */
  registerDoorZonesToDebugger() {
    if (!this.collisionDebugger || !this.doorZones) {
      return;
    }

    // Registrar cada DoorZone, evitando duplicatas
    this.doorZones.forEach(doorZone => {
      if (!this._registeredDoorZones.has(doorZone)) {
        // Obter label do DoorZone (pode ser .label ou nome genérico)
        let label;
        if (doorZone instanceof Object) {
          // Se tem propriedade label, usar ela
          label = doorZone.label || `Porta ${this._registeredDoorZones.size + 1}`;
        } else {
          label = doorZone.label || 'Porta';
        }
        
        this.collisionDebugger.registerDoorZone(doorZone, label);
        this._registeredDoorZones.add(doorZone);
      }
    });

    console.log(`[${this.sceneKey}] Registered ${this.doorZones.length} door zones to debugger`);
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
    // Atualizar ElementManager (elementos interativos)
    if (this.elementManager) {
      this.elementManager.update(time, delta);
    }
    // Atualizar debugger de colisões
    if (this.collisionDebugger) {
      this.collisionDebugger.update();
    }
    
    // === Y-SORTING ===
    // Atualizar depth do player baseado na posição Y
    // Quanto maior o Y (mais para baixo), mais "na frente" o objeto está
    if (this.player) {
      // Usar a posição Y do player para determinar a profundidade
      // Base depth de 100 + Y garante que objetos com Y maior ficam na frente
      // Dividir por 10 para não explodir o número
      this.player.setDepth(100 + Math.floor(this.player.y / 10));
    }
    
    // Y-sorting para NPCs também
    this.npcs.forEach(npc => {
      if (npc && npc.y !== undefined) {
        npc.setDepth(100 + Math.floor(npc.y / 10));
      }
      npc.updateElements?.();
    });
  }

  /**
   * Transição para outra cena
   */
  transitionTo(sceneKey, data = {}) {
    window.sceneManager.goToMap(sceneKey, { ...data, user: this.user, previousScene: this.sceneKey });
  }
}
