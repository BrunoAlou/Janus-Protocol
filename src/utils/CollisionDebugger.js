/**
 * CollisionDebugger - Sistema de debug para visualizar colisões
 */

export default class CollisionDebugger {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activeCollisions = new Set();
    this.collisionText = null;
    this.enabled = true;
    
    this.createDebugUI();
    console.log('[CollisionDebugger] Initialized');
  }

  createDebugUI() {
    const { width } = this.scene.cameras.main;
    
    // Texto de debug no topo da tela
    this.collisionText = this.scene.add.text(width / 2, 10, 'Colisões: Nenhuma', {
      fontSize: '16px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(10000).setScrollFactor(0);
  }

  /**
   * Registra um collider e adiciona callbacks de debug
   */
  registerCollider(collider, layerName) {
    if (!collider) return;

    // Callback quando começa a colidir
    collider.collideCallback = (player, tile) => {
      const collisionKey = `${layerName}_${tile.x}_${tile.y}`;
      
      if (!this.activeCollisions.has(collisionKey)) {
        this.activeCollisions.add(collisionKey);
        this.logCollision(layerName, tile);
        this.updateDebugText();
      }
    };

    // Processar callback a cada frame
    collider.overlapOnly = false;
    collider.active = true;

    console.log('[CollisionDebugger] Registered collider for:', layerName);
  }

  /**
   * Registra colisão com NPC
   */
  registerNPCCollider(collider, npcName) {
    if (!collider) return;

    collider.collideCallback = (player, npc) => {
      const collisionKey = `NPC_${npcName}`;
      
      if (!this.activeCollisions.has(collisionKey)) {
        this.activeCollisions.add(collisionKey);
        console.log(`[Collision] Player colidindo com NPC: ${npcName}`);
        this.updateDebugText();
      }
    };
  }

  /**
   * Registra colisão com limites do mundo
   */
  checkWorldBounds() {
    if (!this.player.body) return;

    const body = this.player.body;
    const touching = body.touching;
    const wasTouching = body.wasTouching;

    // Verificar cada direção
    if (touching.up && !wasTouching.up) {
      console.log('[Collision] Player colidiu com LIMITE SUPERIOR do mundo');
      this.showCollisionFeedback('Limite Superior', 0xff0000);
    }
    if (touching.down && !wasTouching.down) {
      console.log('[Collision] Player colidiu com LIMITE INFERIOR do mundo');
      this.showCollisionFeedback('Limite Inferior', 0xff0000);
    }
    if (touching.left && !wasTouching.left) {
      console.log('[Collision] Player colidiu com LIMITE ESQUERDO do mundo');
      this.showCollisionFeedback('Limite Esquerdo', 0xff0000);
    }
    if (touching.right && !wasTouching.right) {
      console.log('[Collision] Player colidiu com LIMITE DIREITO do mundo');
      this.showCollisionFeedback('Limite Direito', 0xff0000);
    }
  }

  /**
   * Loga informações sobre a colisão
   */
  logCollision(layerName, tile) {
    console.log(`[Collision] Player colidindo com:`, {
      layer: layerName,
      tileX: tile.x,
      tileY: tile.y,
      tileIndex: tile.index,
      worldX: tile.pixelX,
      worldY: tile.pixelY
    });

    // Feedback visual
    this.showCollisionFeedback(layerName);
  }

  /**
   * Mostra feedback visual da colisão
   */
  showCollisionFeedback(objectName, color = 0xff9900) {
    if (!this.enabled) return;

    // Criar texto flutuante
    const feedbackText = this.scene.add.text(
      this.player.x,
      this.player.y - 60,
      `Colidindo: ${objectName}`,
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#' + color.toString(16).padStart(6, '0'),
        padding: { x: 6, y: 3 }
      }
    ).setOrigin(0.5).setDepth(9999);

    // Animar e destruir
    this.scene.tweens.add({
      targets: feedbackText,
      y: feedbackText.y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => feedbackText.destroy()
    });
  }

  /**
   * Atualiza o texto de debug
   */
  updateDebugText() {
    if (!this.collisionText || !this.enabled) return;

    if (this.activeCollisions.size === 0) {
      this.collisionText.setText('Colisões: Nenhuma');
      this.collisionText.setBackgroundColor('#000000');
    } else {
      const collisions = Array.from(this.activeCollisions)
        .map(c => c.split('_')[0])
        .filter((v, i, a) => a.indexOf(v) === i) // Remover duplicados
        .join(', ');
      
      this.collisionText.setText(`Colisões Ativas: ${collisions}`);
      this.collisionText.setBackgroundColor('#ff0000');
    }
  }

  /**
   * Limpa colisões antigas (chamar no update)
   */
  update() {
    if (!this.player.body) return;

    // Verificar limites do mundo
    this.checkWorldBounds();

    // Limpar colisões que não estão mais ativas
    // (Phaser não tem callback de "parou de colidir", então limpamos periodicamente)
    if (this.scene.time.now % 500 < 16) { // A cada ~0.5s
      const touching = this.player.body.touching;
      
      // Se não está tocando em nada, limpar
      if (!touching.up && !touching.down && !touching.left && !touching.right) {
        if (this.activeCollisions.size > 0) {
          this.activeCollisions.clear();
          this.updateDebugText();
        }
      }
    }
  }

  /**
   * Ativa/desativa o debugger
   */
  toggle() {
    this.enabled = !this.enabled;
    this.collisionText.setVisible(this.enabled);
    console.log('[CollisionDebugger]', this.enabled ? 'ENABLED' : 'DISABLED');
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.collisionText?.destroy();
    this.activeCollisions.clear();
  }
}
