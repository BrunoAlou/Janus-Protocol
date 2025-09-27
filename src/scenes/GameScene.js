import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    console.log('Iniciando carregamento dos assets...');
    
    // Carregar as imagens dos tilesets (usando as imagens em assets)
    this.load.image("office_tiles_image", "./src/assets/Modern_Office_Shadowless_16x16.png");
    this.load.image("office_tiles_2_image", "./src/assets/Room_Builder_Office_16x16.png");
    
    // Carregar o tilemap JSON
    this.load.tilemapTiledJSON("nivel_1", "./src/assets/nivel_1.json");
    
    // Adicionar listeners para debug
    this.load.on('complete', () => {
      console.log('Todos os assets foram carregados!');
    });
    
    this.load.on('filecomplete', (key, type, data) => {
      console.log(`Asset carregado: ${key} (${type})`);
    });
    
    this.load.on('loaderror', (file) => {
      console.error('Erro ao carregar asset:', file);
      console.error('Detalhes do erro:', {
        key: file.key,
        url: file.url,
        type: file.type
      });
    });
  }

  create() {
    console.log('Iniciando create()...');

    // SOLUÇÃO: Iniciar a cena da UI para que ela rode em paralelo.
    this.scene.launch('UIScene');
    console.log('GameScene: Comandando o início da UIScene.');

    // 1. CRIAR O MAPA E AS CAMADAS PRIMEIRO
    const map = this.make.tilemap({ key: 'nivel_1' });
    const tileset1 = map.addTilesetImage('office_tiles', 'office_tiles_image');
    const tileset2 = map.addTilesetImage('office_tiles_2', 'office_tiles_2_image');

    if (!tileset1 || !tileset2) {
      console.error("Falha ao criar os tilesets. Verifique os nomes no Tiled e no código.");
      return;
    }

    // Criar as camadas
    const chaoLayer = map.createLayer('Chão', [tileset1, tileset2], 0, 0);
    const paredes2Layer = map.createLayer('paredes2', [tileset1, tileset2], 0, 0);
    const paredesLayer = map.createLayer('Paredes', [tileset1, tileset2], 0, 0);
    const objetosLayer = map.createLayer('Objetos', [tileset1, tileset2], 0, 0);
    const objetosSobrepostosLayer = map.createLayer('ObjetosSobrepostos', [tileset1, tileset2], 0, 0);

    // Definir a ordem de renderização (profundidade)
    chaoLayer.setDepth(0);
    paredes2Layer.setDepth(1);
    paredesLayer.setDepth(2);
    objetosLayer.setDepth(3);
    objetosSobrepostosLayer.setDepth(5); // Maior para ficar sobre o jogador

    // 2. CRIAR O JOGADOR
    
    // MELHORIA: Verificar se a camada de objetos existe antes de procurar o spawn point.
    // Isso remove o aviso do console. No editor Tiled, certifique-se de que "Objetos"
    // seja uma "Camada de Objetos", não uma "Camada de Tiles".
    let spawnPoint = null;
    const objectLayer = map.getObjectLayer('Objetos');
    if (objectLayer) {
        spawnPoint = objectLayer.objects.find(obj => obj.name === "PlayerSpawn");
    }

    const playerX = spawnPoint ? spawnPoint.x : map.widthInPixels / 2;
    const playerY = spawnPoint ? spawnPoint.y : map.heightInPixels / 2;

    this.player = this.physics.add.sprite(playerX, playerY, null); // Usamos um sprite para física
    this.player.body.setSize(16, 16); // Tamanho da hitbox
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(4); // Renderiza acima dos objetos, mas abaixo dos "ObjetosSobrepostos"

    // Adiciona o visual do retângulo vermelho ao sprite físico
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1.0);
    graphics.fillRect(-8, -8, 16, 16); // Desenha o retângulo centrado
    this.player.setData('graphics', graphics); // Guarda a referência
    
    // Sincroniza a posição do gráfico com o sprite
    graphics.x = this.player.x;
    graphics.y = this.player.y;

    // 3. DEFINIR QUAIS TILES VÃO COLIDIR
    paredesLayer.setCollisionByExclusion([-1]);
    paredes2Layer.setCollisionByExclusion([-1]);
    objetosLayer.setCollisionByExclusion([-1]);

    // 4. CRIAR OS COLLIDERS AGORA QUE TUDO EXISTE
    this.physics.add.collider(this.player, paredesLayer);
    this.physics.add.collider(this.player, paredes2Layer);
    this.physics.add.collider(this.player, objetosLayer);

    // Configurar a câmera para seguir o jogador
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(2); // Dê um zoom para ver melhor

    // Configurar controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.playerSpeed = 200;
    
    console.log('Create() finalizado com sucesso!');
  }

  // A função createPlayer() não é mais necessária, pois a criação está dentro de create()
  
  update() {
    if (!this.player || !this.player.body) {
      return;
    }

    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.playerSpeed);
    }

    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-this.playerSpeed);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(this.playerSpeed);
    }

    // Atualiza a posição do gráfico para seguir o corpo físico
    const graphics = this.player.getData('graphics');
    if (graphics) {
        graphics.x = this.player.x;
        graphics.y = this.player.y;
    }
  }
}
