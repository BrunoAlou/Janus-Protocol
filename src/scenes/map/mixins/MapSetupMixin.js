import { getTextureKeyForTileset } from '../../../constants/TilesetAssets.js';

/**
 * MapSetupMixin - Lógica genérica de setup de mapas
 * Pode ser usado em qualquer cena que herda de BaseMapScene
 * 
 * Funções:
 * - setupMap(): Carrega o tilemap e tilesets
 * - addCollisionsToSprite(): Adiciona colisões a um sprite
 */
export const MapSetupMixin = {
  /**
   * Setup do mapa: carrega tilemap, tilesets, cria layers e configura colisões
   */
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
    console.log(`[${this.sceneKey}] Loading tilesets...`);
    const allTilesets = [];
    
    // Para cada tileset no mapa, tentar adicionar
    this.map.tilesets.forEach(tilesetData => {
      const tilesetName = tilesetData.name;
      console.log(`[${this.sceneKey}] Looking for tileset: ${tilesetName}`);
      
      // Resolver chave de textura pelo registro central de tilesets
      const textureKey = getTextureKeyForTileset(tilesetName);
      
      if (textureKey) {
        console.log(`[${this.sceneKey}] Adding ${tilesetName} with texture ${textureKey}`);
        const tileset = this.map.addTilesetImage(tilesetName, textureKey);
        if (tileset) {
          allTilesets.push(tileset);
          console.log(`[${this.sceneKey}] ✓ Tileset ${tilesetName} added successfully`);
        } else {
          console.error(`[${this.sceneKey}] ✗ Failed to add tileset ${tilesetName}`);
        }
      } else {
        console.warn(`[${this.sceneKey}] Tileset ${tilesetName} has no texture mapping`);
      }
    });
    
    console.log(`[${this.sceneKey}] Tilesets created: ${allTilesets.length}`);
    
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
    this.layers.walls?.setDepth(2);
    this.layers.walls2?.setDepth(3);
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
  },

  /**
   * Adiciona colisões de sprite com camadas do mapa
   * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite para adicionar colisões
   * @param {boolean} isPlayer - Se true, registra colisões no debugger
   */
  addCollisionsToSprite(sprite, isPlayer = false) {
    if (!sprite || !sprite.body) {
      console.warn(`[${this.sceneKey}] Sprite without body cannot collide`);
      return;
    }

    sprite.setCollideWorldBounds(true);

    const layers = this.layers || {};
    const colliders = {
      walls: layers.walls ? this.physics.add.collider(sprite, layers.walls) : null,
      walls2: layers.walls2 ? this.physics.add.collider(sprite, layers.walls2) : null,
      objects: layers.objects ? this.physics.add.collider(sprite, layers.objects) : null,
      doors: layers.doors ? this.physics.add.collider(sprite, layers.doors) : null
    };

    // Registrar colisões no debugger apenas para o player
    if (isPlayer && this.collisionDebugger) {
      if (colliders.walls) this.collisionDebugger.registerCollider(colliders.walls, 'Paredes');
      if (colliders.walls2) this.collisionDebugger.registerCollider(colliders.walls2, 'Paredes2');
      if (colliders.objects) this.collisionDebugger.registerCollider(colliders.objects, 'Objetos');
      if (colliders.doors) this.collisionDebugger.registerCollider(colliders.doors, 'Portas');
    }

    console.log(`[${this.sceneKey}] Collisions added to sprite`);
  }
};
