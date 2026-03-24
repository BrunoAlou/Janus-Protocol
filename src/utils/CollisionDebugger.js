/**
 * CollisionDebugger - Sistema de debug para visualizar colisões
 * Inclui visualização da hitbox do player com suporte a hitbox circular
 * e visualização das áreas de colisão das camadas do mapa
 */

export default class CollisionDebugger {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.activeCollisions = new Set();
    this.collisionText = null;
    this.enabled = false; // Desabilitado por padrão
    
    // Gráficos para visualização da hitbox
    this.hitboxGraphics = null;
    this.hitboxInfoText = null;
    
    // Gráficos para visualização das colisões das camadas
    this.layerCollisionGraphics = null;
    this.layerLegendText = null;
    
    // Debug de posição (para definir elementos)
    this.positionDebugText = null;
    this.positionMarker = null;
    this.clickedPositions = []; // Histórico de posições clicadas
    
    // Zonas de portas (DoorZone)
    this.doorZones = [];
    this.doorZonesGraphics = null;
    this.doorZoneTextLabels = {};

    // Menu de flags no estilo do menu de minigames
    this.flagsMenu = null;
    this.flagsListText = null;
    this.flagsClearButton = null;
    this.flagsClearButtonBg = null;
    this.flagsEmptyText = null;
    this.flagsMenuScene = null;
    this.flagItemRows = [];
    this._lastFlagsSignature = null;
    this.flagsPageIndex = 0;
    this.flagsPageSize = 9;
    this.flagsPrevPageBg = null;
    this.flagsNextPageBg = null;
    this.flagsPrevPageText = null;
    this.flagsNextPageText = null;
    this.flagsPageInfoText = null;
    
    // Cores para cada camada de colisão
    this.layerColors = {
      'Paredes': 0xff0000,      // Vermelho
      'paredes2': 0xff6600,     // Laranja
      'Objetos': 0x0066ff,      // Azul
      'Portas': 0x00ff00,       // Verde
      'default': 0xff00ff       // Magenta (fallback)
    };
    
    this.createDebugUI();
    this.createHitboxVisualization();
    this.createLayerCollisionVisualization();
    this.createPositionDebugUI();
    this.createDoorZonesVisualization();
    this.createFlagsDebugUI();
    console.log('[CollisionDebugger] Initialized with hitbox, layer collision, door zones and position debug');
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
    
    // Esconder por padrão (debug desativado)
    this.collisionText.setVisible(false);
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
    
    // Esconder por padrão
    this.hitboxInfoText.setVisible(false);
  }
  
  /**
   * Cria a visualização das áreas de colisão das camadas do mapa
   */
  createLayerCollisionVisualization() {
    // Gráficos para desenhar as áreas de colisão (abaixo do player mas acima do mapa)
    this.layerCollisionGraphics = this.scene.add.graphics();
    this.layerCollisionGraphics.setDepth(50); // Abaixo do player (depth ~100+)
    
    // Texto de legenda das cores
    const { height } = this.scene.cameras.main;
    this.layerLegendText = this.scene.add.text(10, height - 120, '', {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 6 },
      fontFamily: 'monospace',
      lineSpacing: 4
    }).setDepth(10000).setScrollFactor(0);
    
    this.layerLegendText.setVisible(false);
  }
  
  /**
   * Desenha as áreas de colisão de todas as camadas com colisão
   */
  drawLayerCollisions() {
    if (!this.layerCollisionGraphics || !this.enabled) {
      this.layerCollisionGraphics?.clear();
      this.layerLegendText?.setVisible(false);
      return;
    }
    
    this.layerCollisionGraphics.clear();
    
    // Obter as camadas da cena
    const layers = this.scene.layers;
    if (!layers) {
      console.warn('[CollisionDebugger] No layers found in scene');
      return;
    }
    
    const legendLines = ['=== COLISÕES DAS CAMADAS ==='];
    let totalCollisionTiles = 0;
    
    // Iterar pelas camadas que têm colisão
    const collisionLayers = ['walls', 'walls2', 'objects', 'doors'];
    const layerNameMap = {
      'walls': 'Paredes',
      'walls2': 'paredes2',
      'objects': 'Objetos',
      'doors': 'Portas'
    };
    
    collisionLayers.forEach(layerKey => {
      const layer = layers[layerKey];
      if (!layer || !layer.layer) return;
      
      const layerName = layerNameMap[layerKey] || layerKey;
      const color = this.layerColors[layerName] || this.layerColors.default;
      const colorHex = '#' + color.toString(16).padStart(6, '0');
      
      let tileCount = 0;
      
      // Iterar por todos os tiles da camada
      const tileWidth = layer.layer.tileWidth;
      const tileHeight = layer.layer.tileHeight;
      
      layer.layer.data.forEach((row, y) => {
        row.forEach((tile, x) => {
          // Verificar se o tile tem colisão (index > -1 significa que tem um tile)
          if (tile && tile.index !== -1 && tile.collides) {
            const worldX = x * tileWidth;
            const worldY = y * tileHeight;
            
            // Desenhar retângulo semi-transparente
            this.layerCollisionGraphics.fillStyle(color, 0.3);
            this.layerCollisionGraphics.fillRect(worldX, worldY, tileWidth, tileHeight);
            
            // Contorno
            this.layerCollisionGraphics.lineStyle(1, color, 0.8);
            this.layerCollisionGraphics.strokeRect(worldX, worldY, tileWidth, tileHeight);
            
            tileCount++;
          }
        });
      });
      
      if (tileCount > 0) {
        legendLines.push(`■ ${layerName}: ${tileCount} tiles (${colorHex})`);
        totalCollisionTiles += tileCount;
      }
    });
    
    legendLines.push(`─────────────────`);
    legendLines.push(`Total: ${totalCollisionTiles} tiles com colisão`);
    
    // Atualizar legenda
    this.layerLegendText.setText(legendLines.join('\n'));
    this.layerLegendText.setVisible(true);
    
    console.log('[CollisionDebugger] Layer collisions drawn:', totalCollisionTiles, 'tiles');
  }
  
  /**
   * Cria a UI de debug de posição (mouse + player + clique para copiar)
   */
  createPositionDebugUI() {
    const { width, height } = this.scene.cameras.main;
    
    // Texto no canto inferior direito com posições
    this.positionDebugText = this.scene.add.text(width - 10, height - 10, '', {
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 6 },
      fontFamily: 'monospace',
      align: 'right'
    }).setOrigin(1, 1).setDepth(10001).setScrollFactor(0);
    this.positionDebugText.setVisible(false);
    
    // Gráficos para marcadores de posição
    this.positionMarker = this.scene.add.graphics();
    this.positionMarker.setDepth(99998);
    
    // Container para marcadores de posição clicados
    this.clickedMarkersContainer = this.scene.add.container(0, 0);
    this.clickedMarkersContainer.setDepth(99997);
    
    // Listener de clique para marcar posições
    this.scene.input.on('pointerdown', (pointer) => {
      if (!this.enabled) return;
      
      // Converter para coordenadas do mundo (considerando câmera)
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = Math.round(worldPoint.x);
      const y = Math.round(worldPoint.y);
      
      // Adicionar ao histórico
      this.addClickedPosition(x, y);
      
      // Copiar para clipboard
      const coordText = `"x": ${x},\n"y": ${y}`;
      this.copyToClipboard(coordText);
      
      // Feedback visual
      this.showCopiedFeedback(x, y);
    });
  }
  
  /**
   * Cria a visualização das zonas de portas (DoorZone)
   */
  createDoorZonesVisualization() {
    // Gráficos para desenhar as zonas de portas
    this.doorZonesGraphics = this.scene.add.graphics();
    this.doorZonesGraphics.setDepth(98); // Acima das colisões de layer mas abaixo do player
    this.doorZonesGraphics.setVisible(false);
  }
  
  /**
   * Registra uma DoorZone para ser visualizada no debug
   * @param {DoorZone} doorZone - A zona de porta a registrar
   * @param {string} label - Rótulo da porta (ex: 'ARQUIVO', 'SALA TI')
   */
  registerDoorZone(doorZone, label) {
    this.doorZones.push({ doorZone, label });
    console.log(`[CollisionDebugger] Registered DoorZone: ${label}`);
  }
  
  /**
   * Desenha as zonas de portas no mapa
   */
  drawDoorZones() {
    if (!this.doorZonesGraphics || !this.enabled) {
      this.doorZonesGraphics?.clear();
      this.doorZonesGraphics?.setVisible(false);
      return;
    }
    
    this.doorZonesGraphics.clear();
    this.doorZonesGraphics.setVisible(true);
    
    // Cor para as zonas de portas
    const doorColor = 0x00ffff; // Ciano
    
    this.doorZones.forEach(({ doorZone, label }) => {
      // Suportar dois tipos de estrutura de DoorZone
      let zone, width, height;
      
      if (doorZone.zone) {
        // Tipo 1: DoorZone com .zone (objeto Phaser Zone)
        zone = doorZone.zone;
        // Tentar obter dimensões do body se disponível
        if (zone.body) {
          width = zone.body.width;
          height = zone.body.height;
        } else {
          width = zone.width || 16;
          height = zone.height || 64;
        }
      } else {
        // Tipo 2: objeto simples com x, y, width, height
        zone = doorZone;
        width = zone.width || 16;
        height = zone.height || 64;
      }
      
      if (!zone) return;
      
      // Calcular posição do retângulo (zona tem origin em 0.5, então é centrada)
      const x = zone.x - width / 2;
      const y = zone.y - height / 2;
      
      // Desenhar retângulo preenchido semi-transparente
      this.doorZonesGraphics.fillStyle(doorColor, 0.2);
      this.doorZonesGraphics.fillRect(x, y, width, height);
      
      // Contorno mais destacado
      this.doorZonesGraphics.lineStyle(3, doorColor, 0.9);
      this.doorZonesGraphics.strokeRect(x, y, width, height);
      
      // Desenhar cantos para melhor visualização
      this.doorZonesGraphics.fillStyle(doorColor, 0.6);
      const cornerSize = 4;
      // Canto superior esquerdo
      this.doorZonesGraphics.fillRect(x, y, cornerSize, cornerSize);
      // Canto superior direito
      this.doorZonesGraphics.fillRect(x + width - cornerSize, y, cornerSize, cornerSize);
      // Canto inferior esquerdo
      this.doorZonesGraphics.fillRect(x, y + height - cornerSize, cornerSize, cornerSize);
      // Canto inferior direito
      this.doorZonesGraphics.fillRect(x + width - cornerSize, y + height - cornerSize, cornerSize, cornerSize);
      
      // Texto com informações da porta (desenhado uma vez apenas)
      if (!this.doorZoneTextLabels) this.doorZoneTextLabels = {};
      
      const labelKey = `${label}_text`;
      if (!this.doorZoneTextLabels[labelKey]) {
        const labelText = this.scene.add.text(
          zone.x,
          y - 18,
          `[${label}] ${Math.round(width)}x${Math.round(height)}`,
          {
            fontSize: '11px',
            color: '#00ffff',
            backgroundColor: '#000000dd',
            padding: { x: 4, y: 2 },
            align: 'center',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5, 1).setDepth(99999);
        
        this.doorZoneTextLabels[labelKey] = labelText;
      } else {
        // Apenas atualizar visibilidade
        this.doorZoneTextLabels[labelKey].setVisible(true);
      }
    });
    
    console.log(`[CollisionDebugger] Drew ${this.doorZones.length} door zones`);
  }
  
  /**
   * Limpa os rótulos das portas
   */
  clearDoorZoneLabels() {
    if (this.doorZoneTextLabels) {
      Object.values(this.doorZoneTextLabels).forEach(text => text?.setVisible(false));
    }
    if (this.doorZonesGraphics) {
      this.doorZonesGraphics.clear();
      this.doorZonesGraphics.setVisible(false);
    }
  }
  
  /**
   * Adiciona uma posição clicada ao histórico visual
   */
  addClickedPosition(x, y) {
    // Limitar histórico a 10 posições
    if (this.clickedPositions.length >= 10) {
      const oldest = this.clickedPositions.shift();
      oldest.marker?.destroy();
      oldest.text?.destroy();
    }
    
    // Criar marcador visual
    const marker = this.scene.add.graphics();
    marker.fillStyle(0xff00ff, 0.5);
    marker.fillCircle(x, y, 8);
    marker.lineStyle(2, 0xff00ff, 1);
    marker.strokeCircle(x, y, 8);
    // Cruz no centro
    marker.lineStyle(1, 0xffffff, 1);
    marker.lineBetween(x - 12, y, x + 12, y);
    marker.lineBetween(x, y - 12, x, y + 12);
    marker.setDepth(99997);
    
    // Texto com coordenadas
    const text = this.scene.add.text(x + 12, y - 8, `(${x}, ${y})`, {
      fontSize: '10px',
      color: '#ff00ff',
      backgroundColor: '#000000cc',
      padding: { x: 3, y: 2 }
    }).setDepth(99998);
    
    this.clickedPositions.push({ x, y, marker, text });
  }
  
  /**
   * Mostra feedback visual de "copiado"
   */
  showCopiedFeedback(x, y) {
    const camera = this.scene.cameras.main;
    const screenPoint = {
      x: (x - camera.scrollX) * camera.zoom + camera.x,
      y: (y - camera.scrollY) * camera.zoom + camera.y
    };
    
    const feedback = this.scene.add.text(screenPoint.x, screenPoint.y - 30, '📋 Copiado!', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(10002).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: feedback,
      y: feedback.y - 20,
      alpha: 0,
      duration: 1000,
      onComplete: () => feedback.destroy()
    });
    
    console.log(`[PositionDebug] Posição copiada: x=${x}, y=${y}`);
  }
  
  /**
   * Copia texto para o clipboard
   */
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(err => {
        console.warn('[PositionDebug] Falha ao copiar:', err);
      });
    }
  }
  
  /**
   * Atualiza o texto de debug de posição
   */
  updatePositionDebug() {
    if (!this.positionDebugText || !this.enabled) {
      this.positionDebugText?.setVisible(false);
      this.positionMarker?.clear();
      return;
    }
    
    this.positionDebugText.setVisible(true);
    
    // Posição do mouse no mundo
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const mouseX = Math.round(worldPoint.x);
    const mouseY = Math.round(worldPoint.y);
    
    // Posição do player
    const playerX = Math.round(this.player.x);
    const playerY = Math.round(this.player.y);
    
    // Tile atual do mouse (assumindo tiles de 16px)
    const tileSize = this.scene.map?.tileWidth || 16;
    const tileX = Math.floor(mouseX / tileSize);
    const tileY = Math.floor(mouseY / tileSize);
    
    // Atualizar texto
    this.positionDebugText.setText([
      '=== POSITION DEBUG (P) ===',
      `🖱️ Mouse: (${mouseX}, ${mouseY})`,
      `📍 Tile: [${tileX}, ${tileY}]`,
      `🧍 Player: (${playerX}, ${playerY})`,
      ``,
      `💡 Clique para copiar posição`,
      `   Posições marcadas: ${this.clickedPositions.length}`
    ].join('\n'));
    
    // Desenhar crosshair no mouse
    this.positionMarker.clear();
    this.positionMarker.lineStyle(1, 0x00ffff, 0.8);
    this.positionMarker.lineBetween(mouseX - 20, mouseY, mouseX + 20, mouseY);
    this.positionMarker.lineBetween(mouseX, mouseY - 20, mouseX, mouseY + 20);
    
    // Círculo no ponto
    this.positionMarker.lineStyle(2, 0x00ffff, 1);
    this.positionMarker.strokeCircle(mouseX, mouseY, 5);
  }
  
  /**
   * Limpa todos os marcadores de posição
   */
  clearPositionMarkers() {
    this.clickedPositions.forEach(pos => {
      pos.marker?.destroy();
      pos.text?.destroy();
    });
    this.clickedPositions = [];
    console.log('[PositionDebug] Marcadores limpos');
  }

  /**
   * Cria painel visual de flags do jogo no modo debug
   */
  createFlagsDebugUI() {
    this.flagsMenuScene = this.scene.scene.get('UIScene') || this.scene;

    const previousOwner = this.flagsMenuScene.__flagsMenuOwner;
    if (previousOwner && previousOwner !== this && typeof previousOwner.destroyFlagsDebugUI === 'function') {
      previousOwner.destroyFlagsDebugUI();
    }

    this.flagsMenu = this.flagsMenuScene.add.container(20, 70);
    this.flagsMenu.setDepth(10050);
    this.flagsMenu.setScrollFactor(0);
    this.flagsMenu.setVisible(false);

    const menuBg = this.flagsMenuScene.add.rectangle(0, 0, 300, 360, 0x1a1a2e, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0x00d9ff)
      .setScrollFactor(0);

    const title = this.flagsMenuScene.add.text(150, 18, 'DEBUG FLAGS', {
      fontSize: '22px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const line = this.flagsMenuScene.add.graphics().setScrollFactor(0);
    line.lineStyle(2, 0x3a3a4e);
    line.lineBetween(20, 52, 280, 52);

    this.flagsListText = this.flagsMenuScene.add.text(20, 64, '', {
      fontSize: '13px',
      color: '#cfefff',
      fontFamily: 'monospace',
      lineSpacing: 3
    }).setScrollFactor(0);

    this.flagsPrevPageBg = this.flagsMenuScene.add.rectangle(210, 70, 24, 20, 0x2a2a3e)
      .setStrokeStyle(1, 0x5b6e89)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.flagsPrevPageText = this.flagsMenuScene.add.text(210, 70, '<', {
      fontSize: '14px',
      color: '#cfefff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.flagsNextPageBg = this.flagsMenuScene.add.rectangle(280, 70, 24, 20, 0x2a2a3e)
      .setStrokeStyle(1, 0x5b6e89)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.flagsNextPageText = this.flagsMenuScene.add.text(280, 70, '>', {
      fontSize: '14px',
      color: '#cfefff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.flagsPageInfoText = this.flagsMenuScene.add.text(245, 70, '1/1', {
      fontSize: '11px',
      color: '#9cc4ff',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);

    const prevPage = () => {
      if (!this.enabled || this.flagsPageIndex <= 0) return;
      this.flagsPageIndex -= 1;
      this._lastFlagsSignature = null;
      this.updateFlagsDebugUI();
    };

    const nextPage = () => {
      if (!this.enabled) return;
      this.flagsPageIndex += 1;
      this._lastFlagsSignature = null;
      this.updateFlagsDebugUI();
    };

    this.flagsPrevPageBg.on('pointerdown', prevPage);
    this.flagsNextPageBg.on('pointerdown', nextPage);

    this.flagsPrevPageBg.on('pointerover', () => this.flagsPrevPageBg?.setFillStyle(0x3a3a4e));
    this.flagsPrevPageBg.on('pointerout', () => this.flagsPrevPageBg?.setFillStyle(0x2a2a3e));
    this.flagsNextPageBg.on('pointerover', () => this.flagsNextPageBg?.setFillStyle(0x3a3a4e));
    this.flagsNextPageBg.on('pointerout', () => this.flagsNextPageBg?.setFillStyle(0x2a2a3e));

    this.flagsEmptyText = this.flagsMenuScene.add.text(150, 180, 'Nenhuma flag ativa', {
      fontSize: '16px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    this.flagsClearButtonBg = this.flagsMenuScene.add.rectangle(150, 322, 210, 34, 0x2a2a3e)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xff6666)
      .setInteractive({ useHandCursor: true });

    this.flagsClearButton = this.flagsMenuScene.add.text(150, 322, 'CLEAR ALL TAGS', {
      fontSize: '15px',
      color: '#ff6666',
      fontStyle: 'bold',
      padding: { x: 12, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0);

    this.flagsClearButtonBg.on('pointerover', () => {
      this.flagsClearButtonBg?.setFillStyle(0x3a3a4e);
      this.flagsClearButton?.setColor('#ff9999');
    });

    this.flagsClearButtonBg.on('pointerout', () => {
      this.flagsClearButtonBg?.setFillStyle(0x2a2a3e);
      this.flagsClearButton?.setColor('#ff6666');
    });

    this.flagsClearButtonBg.on('pointerdown', () => {
      console.log('[CollisionDebugger][FlagsMenu] Clear all clicked', { enabled: this.enabled });

      if (!this.enabled) {
        return;
      }

      if (window.gameState?.clearFlags) {
        window.gameState.clearFlags();
        this._lastFlagsSignature = null;
        this.updateFlagsDebugUI();
        this.showDebugToast('Flags limpas com sucesso', 0x00aa55);
      } else {
        this.showDebugToast('GameState indisponivel', 0xaa3333);
      }
    });

    this.flagsMenu.add([
      menuBg,
      title,
      line,
      this.flagsListText,
      this.flagsPrevPageBg,
      this.flagsPrevPageText,
      this.flagsPageInfoText,
      this.flagsNextPageBg,
      this.flagsNextPageText,
      this.flagsEmptyText,
      this.flagsClearButtonBg,
      this.flagsClearButton
    ]);

    this.layoutFlagsDebugUI();

    const bounds = this.flagsMenu.getBounds();
    console.log('[CollisionDebugger][FlagsMenu] Created', {
      hostScene: this.flagsMenuScene?.scene?.key || 'unknown',
      x: this.flagsMenu.x,
      y: this.flagsMenu.y,
      visible: this.flagsMenu.visible,
      depth: this.flagsMenu.depth,
      scrollFactorX: this.flagsMenu.scrollFactorX,
      scrollFactorY: this.flagsMenu.scrollFactorY,
      bounds
    });

    this.flagsMenuScene.__flagsMenuOwner = this;
  }

  /**
   * Limpa apenas a UI do menu de flags
   */
  destroyFlagsDebugUI() {
    this.clearFlagRows();
    this.flagsClearButtonBg?.destroy();
    this.flagsPrevPageBg?.destroy();
    this.flagsNextPageBg?.destroy();
    this.flagsPrevPageText?.destroy();
    this.flagsNextPageText?.destroy();
    this.flagsPageInfoText?.destroy();
    this.flagsMenu?.destroy();
    this.flagsMenu = null;
    this.flagsListText = null;
    this.flagsClearButton = null;
    this.flagsClearButtonBg = null;
    this.flagsEmptyText = null;
    this.flagsPrevPageBg = null;
    this.flagsNextPageBg = null;
    this.flagsPrevPageText = null;
    this.flagsNextPageText = null;
    this.flagsPageInfoText = null;

    if (this.flagsMenuScene && this.flagsMenuScene.__flagsMenuOwner === this) {
      this.flagsMenuScene.__flagsMenuOwner = null;
    }
  }

  /**
   * Atualiza conteúdo textual do painel de flags
   */
  updateFlagsDebugUI() {
    if (!this.flagsListText || !this.flagsEmptyText || !this.enabled) {
      this.flagsListText?.setVisible(false);
      this.flagsEmptyText?.setVisible(false);
      return;
    }

    this.layoutFlagsDebugUI();

    const flags = window.gameState?.getState?.()?.player?.flags || {};
    const allEntries = Object.entries(flags)
      .sort(([a], [b]) => a.localeCompare(b));

    const totalPages = Math.max(1, Math.ceil(allEntries.length / this.flagsPageSize));
    if (this.flagsPageIndex >= totalPages) {
      this.flagsPageIndex = totalPages - 1;
    }
    if (this.flagsPageIndex < 0) {
      this.flagsPageIndex = 0;
    }

    const signature = `${this.flagsPageIndex}|${allEntries.map(([key, value]) => `${key}:${String(value)}`).join('|')}`;
    if (signature === this._lastFlagsSignature) {
      return;
    }
    this._lastFlagsSignature = signature;

    this.clearFlagRows();

    if (allEntries.length === 0) {
      this.flagsListText.setVisible(false);
      this.flagsEmptyText.setVisible(true);
      return;
    }

    const activeCount = allEntries.filter(([, value]) => value === true).length;
    this.flagsListText.setText(`Flags: ${allEntries.length} (ativas: ${activeCount})`);
    this.flagsListText.setVisible(true);
    this.flagsEmptyText.setVisible(false);

    this.flagsPageInfoText?.setText(`${this.flagsPageIndex + 1}/${totalPages}`);
    this.flagsPrevPageBg?.setAlpha(this.flagsPageIndex > 0 ? 1 : 0.45);
    this.flagsPrevPageText?.setAlpha(this.flagsPageIndex > 0 ? 1 : 0.45);
    this.flagsNextPageBg?.setAlpha(this.flagsPageIndex < totalPages - 1 ? 1 : 0.45);
    this.flagsNextPageText?.setAlpha(this.flagsPageIndex < totalPages - 1 ? 1 : 0.45);

    const start = this.flagsPageIndex * this.flagsPageSize;
    const end = start + this.flagsPageSize;
    const pageEntries = allEntries.slice(start, end);

    pageEntries.forEach(([key, value], index) => {
      this.createFlagRow(key, value, index);
    });
  }

  /**
   * Cria linha com flag e botão de remoção individual
   */
  createFlagRow(flagKey, flagValue, index) {
    const y = 92 + (index * 22);
    const row = this.flagsMenuScene.add.container(20, y).setScrollFactor(0);

    const isActive = flagValue === true;
    const valueText = isActive ? 'true' : 'false';

    const labelText = `- ${this.truncateFlagText(flagKey, 18)}: ${valueText}`;
    const label = this.flagsMenuScene.add.text(0, 0, labelText, {
      fontSize: '12px',
      color: isActive ? '#cfefff' : '#8ea1b5',
      fontFamily: 'monospace'
    }).setOrigin(0, 0.5);

    const toggleBg = this.flagsMenuScene.add.rectangle(245, 0, 52, 18, isActive ? 0x1f5a3d : 0x5a1f2a)
      .setStrokeStyle(1, isActive ? 0x8dffc2 : 0xff7f9a)
      .setInteractive({ useHandCursor: true });

    const toggleTxt = this.flagsMenuScene.add.text(245, 0, isActive ? 'ON' : 'OFF', {
      fontSize: '11px',
      color: isActive ? '#d7ffe9' : '#ffd4dc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    toggleBg.on('pointerover', () => {
      toggleBg.setFillStyle(isActive ? 0x2a6f4f : 0x7a2736);
    });

    toggleBg.on('pointerout', () => {
      toggleBg.setFillStyle(isActive ? 0x1f5a3d : 0x5a1f2a);
    });

    toggleBg.on('pointerdown', () => {
      console.log('[CollisionDebugger][FlagsMenu] Toggle flag clicked', { flagKey, enabled: this.enabled, current: isActive });
      if (!this.enabled) return;

      if (window.gameState?.setFlag) {
        window.gameState.setFlag(flagKey, !isActive);
      } else if (window.gameState?.removeFlag) {
        window.gameState.removeFlag(flagKey);
      }

      this._lastFlagsSignature = null;
      this.updateFlagsDebugUI();
      this.showDebugToast(`Flag ${!isActive ? 'ativada' : 'desativada'}: ${flagKey}`, !isActive ? 0x2a6f4f : 0x6f2a2a);
    });

    row.add([label, toggleBg, toggleTxt]);
    this.flagsMenu.add(row);
    this.flagItemRows.push(row);
  }

  truncateFlagText(text, maxLength = 18) {
    const value = String(text || '');
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, Math.max(1, maxLength - 3))}...`;
  }

  /**
   * Limpa linhas dinâmicas de flags
   */
  clearFlagRows() {
    if (!this.flagItemRows || this.flagItemRows.length === 0) {
      return;
    }

    this.flagItemRows.forEach((row) => row?.destroy());
    this.flagItemRows = [];
  }

  /**
   * Toast rápido para ações do painel debug
   */
  showDebugToast(message, color = 0x222222) {
    const menuBounds = this.flagsMenu?.getBounds();
    const toastX = menuBounds ? menuBounds.centerX : 170;
    const toastY = menuBounds ? menuBounds.bottom + 12 : 285;

    const toastScene = this.flagsMenuScene || this.scene;
    const toast = toastScene.add.text(toastX, toastY, message, {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#' + color.toString(16).padStart(6, '0'),
      padding: { x: 6, y: 3 },
      fontFamily: 'monospace'
    }).setDepth(10003).setOrigin(0.5).setScrollFactor(0);

    toastScene.tweens.add({
      targets: toast,
      alpha: 0,
      y: toast.y - 8,
      duration: 900,
      onComplete: () => toast.destroy()
    });
  }

  /**
   * Reposiciona painel de flags de acordo com o viewport atual
   */
  layoutFlagsDebugUI() {
    if (!this.flagsMenu) return;

    const hostCamera = this.flagsMenuScene?.cameras?.main || this.scene.cameras.main;
    const { width } = hostCamera;
    const x = Math.max(12, Math.min(width - 312, 20));
    this.flagsMenu.setPosition(x, 70);
  }

  /**
   * Registra um collider e adiciona callbacks de debug
   */
  registerCollider(collider, layerName) {
    if (!collider) return;

    // Callback quando começa a colidir
    collider.collideCallback = (player, tile) => {
      if (!this.enabled) return; // Não executar se debug desativado
      
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
      if (!this.enabled) return; // Não executar se debug desativado
      
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
    if (!this.enabled) return; // Não executar se debug desativado
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
    if (!this.enabled) return; // Não executar se debug desativado
    
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
    
    // Atualizar debug de posição
    this.updatePositionDebug();

    // Atualizar painel de flags do estado
    this.updateFlagsDebugUI();
    
    // Desenhar zonas de portas
    if (this.enabled) {
      this.drawDoorZones();
    } else {
      this.clearDoorZoneLabels();
    }

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
    this.setEnabled(!this.enabled);
  }

  /**
   * Define o estado do debugger
   * @param {boolean} enabled - true para ativar, false para desativar
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.collisionText.setVisible(this.enabled);
    this.hitboxInfoText?.setVisible(this.enabled);
    this.positionDebugText?.setVisible(this.enabled);
    this.flagsMenu?.setVisible(this.enabled);

    if (this.flagsMenu) {
      const bounds = this.flagsMenu.getBounds();
      console.log('[CollisionDebugger][FlagsMenu] Toggle', {
        enabled: this.enabled,
        visible: this.flagsMenu.visible,
        x: this.flagsMenu.x,
        y: this.flagsMenu.y,
        depth: this.flagsMenu.depth,
        bounds
      });
    }
    
    if (!this.enabled) {
      if (this.hitboxGraphics) this.hitboxGraphics.clear();
      if (this.positionMarker) this.positionMarker.clear();
      if (this.layerCollisionGraphics) this.layerCollisionGraphics.clear();
      if (this.layerLegendText) this.layerLegendText.setVisible(false);
      if (this.doorZonesGraphics) this.doorZonesGraphics.clear();
      if (this.flagsListText) this.flagsListText.setVisible(false);
      if (this.flagsEmptyText) this.flagsEmptyText.setVisible(false);
      this.clearFlagRows();
      // Esconder marcadores clicados
      this.clickedPositions.forEach(pos => {
        pos.marker?.setVisible(false);
        pos.text?.setVisible(false);
      });
      // Esconder rótulos de portas
      if (this.doorZoneTextLabels) {
        Object.values(this.doorZoneTextLabels).forEach(text => text?.setVisible(false));
      }
    } else {
      // Mostrar marcadores clicados
      this.clickedPositions.forEach(pos => {
        pos.marker?.setVisible(true);
        pos.text?.setVisible(true);
      });
      // Mostrar rótulos de portas
      if (this.doorZoneTextLabels) {
        Object.values(this.doorZoneTextLabels).forEach(text => text?.setVisible(true));
      }
      // Desenhar colisões das camadas
      this.drawLayerCollisions();
      this._lastFlagsSignature = null;
      this.updateFlagsDebugUI();
    }
    
    // Atualizar estado global para acesso pelo menu de pausa
    window.debugEnabled = this.enabled;
    
    console.log('[CollisionDebugger]', this.enabled ? 'ENABLED' : 'DISABLED');
  }

  /**
   * Retorna se o debugger está ativo
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.collisionText?.destroy();
    this.hitboxGraphics?.destroy();
    this.hitboxInfoText?.destroy();
    this.layerCollisionGraphics?.destroy();
    this.layerLegendText?.destroy();
    this.positionDebugText?.destroy();
    this.positionMarker?.destroy();
    this.doorZonesGraphics?.destroy();
    this.destroyFlagsDebugUI();
    this.clearPositionMarkers();
    if (this.doorZoneTextLabels) {
      Object.values(this.doorZoneTextLabels).forEach(text => text?.destroy());
      this.doorZoneTextLabels = {};
    }
    this.activeCollisions.clear();
  }
}
