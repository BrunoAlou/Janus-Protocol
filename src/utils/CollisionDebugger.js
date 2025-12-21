/**
 * CollisionDebugger - Sistema de debug para visualizar colisões
 * Inclui visualização da hitbox do player com suporte a hitbox circular
 */

export default class CollisionDebugger {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activeCollisions = new Set();
    this.collisionText = null;
    this.enabled = true;
    
    // Gráficos para visualização da hitbox
    this.hitboxGraphics = null;
    this.hitboxInfoText = null;
    
    this.createDebugUI();
    this.createHitboxVisualization();
    console.log('[CollisionDebugger] Initialized with hitbox visualization');
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
   * Cria a visualização gráfica da hitbox do player
   */
  createHitboxVisualization() {
    // Gráficos que seguem o player
    this.hitboxGraphics = this.scene.add.graphics();
    this.hitboxGraphics.setDepth(99999); // Sempre no topo
    
    // Texto com informações da hitbox
    this.hitboxInfoText = this.scene.add.text(10, 60, '', {
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
      fontFamily: 'monospace'
    }).setDepth(10000).setScrollFactor(0);
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

    // Atualizar visualização da hitbox
    this.updateHitboxVisualization();

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
   * Atualiza a visualização gráfica da hitbox do player
   */
  updateHitboxVisualization() {
    if (!this.hitboxGraphics || !this.enabled) {
      if (this.hitboxGraphics) this.hitboxGraphics.clear();
      if (this.hitboxInfoText) this.hitboxInfoText.setVisible(false);
      return;
    }
    
    const body = this.player.body;
    if (!body) return;
    
    this.hitboxGraphics.clear();
    this.hitboxInfoText.setVisible(true);
    
    // Detectar se é hitbox circular ou retangular
    const isCircle = body.isCircle;
    
    // Cores para debug
    const fillColor = 0x00ff00;  // Verde para área da hitbox
    const strokeColor = 0xffff00; // Amarelo para contorno
    const pivotColor = 0xff0000;  // Vermelho para pivot point
    const spriteColor = 0x0088ff; // Azul para área total do sprite
    
    // Posição do body no mundo
    const bodyX = body.x;
    const bodyY = body.y;
    
    // Área total do sprite (contorno azul pontilhado)
    this.hitboxGraphics.lineStyle(1, spriteColor, 0.5);
    const spriteLeft = this.player.x - (this.player.displayWidth * this.player.originX);
    const spriteTop = this.player.y - (this.player.displayHeight * this.player.originY);
    this.hitboxGraphics.strokeRect(
      spriteLeft,
      spriteTop,
      this.player.displayWidth,
      this.player.displayHeight
    );
    
    if (isCircle) {
      // === HITBOX CIRCULAR ===
      const radius = body.radius;
      const centerX = bodyX + radius;
      const centerY = bodyY + radius;
      
      // Preenchimento semi-transparente
      this.hitboxGraphics.fillStyle(fillColor, 0.3);
      this.hitboxGraphics.fillCircle(centerX, centerY, radius);
      
      // Contorno sólido
      this.hitboxGraphics.lineStyle(2, strokeColor, 1);
      this.hitboxGraphics.strokeCircle(centerX, centerY, radius);
      
      // Linha indicando o raio
      this.hitboxGraphics.lineStyle(1, 0xffffff, 0.8);
      this.hitboxGraphics.lineBetween(centerX, centerY, centerX + radius, centerY);
      
      // Atualizar texto informativo
      this.hitboxInfoText.setText([
        '=== HITBOX DEBUG (D) ===',
        `Tipo: CÍRCULO (pés)`,
        `Raio: ${radius.toFixed(1)}px`,
        `Centro: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`,
        `Player Y: ${this.player.y.toFixed(0)}`,
        `Depth: ${this.player.depth}`,
        `Pivot: (${this.player.originX}, ${this.player.originY})`,
        `Touching: ${this.getTouchingString()}`,
        '\n[VERDE] Hitbox | [AZUL] Sprite',
        '[VERMELHO] Pivot point'
      ].join('\n'));
      
    } else {
      // === HITBOX RETANGULAR ===
      const width = body.width;
      const height = body.height;
      
      // Preenchimento semi-transparente
      this.hitboxGraphics.fillStyle(fillColor, 0.3);
      this.hitboxGraphics.fillRect(bodyX, bodyY, width, height);
      
      // Contorno sólido
      this.hitboxGraphics.lineStyle(2, strokeColor, 1);
      this.hitboxGraphics.strokeRect(bodyX, bodyY, width, height);
      
      // Atualizar texto informativo
      this.hitboxInfoText.setText([
        '=== HITBOX DEBUG (D) ===',
        `Tipo: RETÂNGULO (pés)`,
        `Tamanho: ${width.toFixed(0)}x${height.toFixed(0)}px`,
        `Posição: (${bodyX.toFixed(0)}, ${bodyY.toFixed(0)})`,
        `Player Y: ${this.player.y.toFixed(0)}`,
        `Depth: ${this.player.depth}`,
        `Pivot: (${this.player.originX}, ${this.player.originY})`,
        `Touching: ${this.getTouchingString()}`,
        '\n[VERDE] Hitbox | [AZUL] Sprite',
        '[VERMELHO] Pivot point'
      ].join('\n'));
    }
    
    // Marcar pivot point do player (origem)
    this.hitboxGraphics.fillStyle(pivotColor, 1);
    this.hitboxGraphics.fillCircle(this.player.x, this.player.y, 3);
    
    // Cruz no pivot para melhor visibilidade
    this.hitboxGraphics.lineStyle(1, pivotColor, 1);
    this.hitboxGraphics.lineBetween(this.player.x - 6, this.player.y, this.player.x + 6, this.player.y);
    this.hitboxGraphics.lineBetween(this.player.x, this.player.y - 6, this.player.x, this.player.y + 6);
  }
  
  /**
   * Retorna string das direções que estão colidindo
   */
  getTouchingString() {
    if (!this.player.body) return 'N/A';
    const t = this.player.body.touching;
    const dirs = [];
    if (t.up) dirs.push('↑');
    if (t.down) dirs.push('↓');
    if (t.left) dirs.push('←');
    if (t.right) dirs.push('→');
    return dirs.length > 0 ? dirs.join(' ') : 'Nenhuma';
  }

  /**
   * Ativa/desativa o debugger
   */
  toggle() {
    this.enabled = !this.enabled;
    this.collisionText.setVisible(this.enabled);
    this.hitboxInfoText?.setVisible(this.enabled);
    
    if (!this.enabled && this.hitboxGraphics) {
      this.hitboxGraphics.clear();
    }
    
    console.log('[CollisionDebugger]', this.enabled ? 'ENABLED' : 'DISABLED');
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.collisionText?.destroy();
    this.hitboxGraphics?.destroy();
    this.hitboxInfoText?.destroy();
    this.activeCollisions.clear();
  }
}
