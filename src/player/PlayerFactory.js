import { createPlayerAnimations } from './playerAnimations.js';
import { PLAYER_TEXTURE_KEY, FRAME_WIDTH, FRAME_HEIGHT } from './loadPlayerAssets.js';
import { Player } from '../entities/Player.js';

/**
 * Configurações da hitbox do player
 * Seguindo boas práticas de jogos top-down:
 * - Hitbox reduzida para apenas os pés (terço inferior)
 * - Hitbox circular para movimentação fluida nas quinas
 * - Pivot point na base para Y-sorting correto
 */
export const PLAYER_HITBOX_CONFIG = {
  // Usar hitbox circular para colisões mais suaves
  useCircle: true,
  
  // Raio do círculo (apenas os pés do personagem)
  circleRadius: 8,
  
  // Offset do círculo para posicionar nos pés
  // (baseado no frame 64x64)
  circleOffsetX: -16,  // Centralizado horizontalmente
  circleOffsetY: 12, // Próximo à base do sprite
  
  // Fallback para hitbox retangular (se useCircle = false)
  rectWidth: 16,
  rectHeight: 12,
  rectOffsetX: 24,  // (64 - 16) / 2 = 24
  rectOffsetY: 50,  // 64 - 12 - 2 = 50 (próximo à base)
};

export function createPlayer(scene, x, y) {
  console.log('[PlayerFactory] createPlayer called with position:', { x, y });
  
  // For texture atlas, use default frame (walk_down_01)
  const preferredFrame = 'walk_down_01';
  
  // Create physics sprite with idle frame
  const sprite = scene.physics.add.sprite(x, y, PLAYER_TEXTURE_KEY, preferredFrame);
  console.log('[PlayerFactory] Sprite created at:', { x: sprite.x, y: sprite.y, frame: sprite.frame.name });
  
  // === PIVOT POINT NA BASE ===
  // Definir origem na parte inferior central do sprite
  // Isso facilita o Y-sorting e alinha a posição com os pés
  sprite.setOrigin(0.5, 1); // Centro horizontal, base vertical
  
  sprite.setCollideWorldBounds(true);
  
  // Depth será controlado dinamicamente pelo Y-sorting
  sprite.setDepth(4);
  
  const tileWidth = scene.map?.tileWidth ?? FRAME_WIDTH;
  const tileHeight = scene.map?.tileHeight ?? FRAME_HEIGHT;
  // Player ocupa 4x4 tiles para melhor proporção
  const desiredTilesWide = 4;
  const desiredTilesTall = 4;
  const scaleX = (tileWidth * desiredTilesWide) / FRAME_WIDTH;
  const scaleY = (tileHeight * desiredTilesTall) / FRAME_HEIGHT;
  const scale = Number.isFinite(scaleX) && Number.isFinite(scaleY)
    ? Math.max(0.1, Math.min(scaleX, scaleY))
    : 1;
  sprite.setScale(scale);

  console.log('[PlayerFactory] Sprite dimensions:', { 
    width: sprite.width,
    height: sprite.height,
    displayWidth: sprite.displayWidth, 
    displayHeight: sprite.displayHeight,
    scale,
    origin: { x: sprite.originX, y: sprite.originY }
  });

  if (sprite.body) {
    const config = PLAYER_HITBOX_CONFIG;
    
    if (config.useCircle) {
      // === HITBOX CIRCULAR ===
      // Colisão circular permite "escorregar" pelas quinas
      // tornando a movimentação mais fluida e orgânica
      sprite.body.setCircle(
        config.circleRadius,
        (FRAME_WIDTH / 2) - config.circleRadius + config.circleOffsetX,  // Centralizar círculo
        FRAME_HEIGHT - (config.circleRadius * 2) - 4 + config.circleOffsetY  // Base do sprite - offset ajustado para origin na base
      );
      
      console.log('[PlayerFactory] Circular hitbox (feet):', {
        radius: config.circleRadius,
        offsetX: (FRAME_WIDTH / 2) - config.circleRadius + config.circleOffsetX,
        offsetY: FRAME_HEIGHT - (config.circleRadius * 2) - 4 + config.circleOffsetY,
        frameOriginal: `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
        pivotPoint: 'bottom-center'
      });
    } else {
      // === HITBOX RETANGULAR (fallback) ===
      // Hitbox pequena apenas nos pés do personagem
      sprite.body.setSize(config.rectWidth, config.rectHeight);
      sprite.body.setOffset(config.rectOffsetX, config.rectOffsetY);
      
      console.log('[PlayerFactory] Rectangular hitbox (feet):', {
        width: config.rectWidth,
        height: config.rectHeight,
        offsetX: config.rectOffsetX,
        offsetY: config.rectOffsetY,
        frameOriginal: `${FRAME_WIDTH}x${FRAME_HEIGHT}`,
        pivotPoint: 'bottom-center'
      });
    }
  }

  // Register animations
  createPlayerAnimations(scene);
  
  // Start with idle animation
  if (sprite.anims && sprite.anims.exists('idle')) {
    sprite.play('idle');
    console.log('[PlayerFactory] Playing idle animation');
  }

  return sprite;
}

export function attachFrameInspector(scene, player) {
  // small helper to add the inspector to any scene
  // toggle with I (single frame preview) and G (frame grid)
  scene._debugInspect = false;
  scene._debugFrameIndex = player.frame && typeof player.frame.index !== 'undefined' ? player.frame.index : 0;
  scene._debugPreview = scene.add.sprite(80, 60, PLAYER_TEXTURE_KEY, scene._debugFrameIndex)
    .setScale(3)
    .setScrollFactor(0)
    .setDepth(1000)
    .setVisible(false);
  scene._debugText = scene.add.text(150, 40, '', { fontSize: '14px', color: '#ff0', backgroundColor: 'rgba(0,0,0,0.6)' })
    .setScrollFactor(0)
    .setDepth(1000)
    .setVisible(false);

  scene.input.keyboard.on('keydown-I', () => {
    scene._debugInspect = !scene._debugInspect;
    scene._debugPreview.setVisible(scene._debugInspect);
    scene._debugText.setVisible(scene._debugInspect);
    if (scene._debugInspect) updateDebugInfo();
  });

  function updateDebugInfo() {
    const idx = scene._debugFrameIndex;
  const tex = scene.textures.get(PLAYER_TEXTURE_KEY);
    const frameObj = tex ? tex.get(idx) : null;
    let info = `frame: ${idx}`;
    if (frameObj) {
      info += `  cutX:${frameObj.cutX} cutY:${frameObj.cutY} w:${frameObj.width} h:${frameObj.height}`;
    } else {
      info += '  (no frame data)';
    }
    scene._debugText.setText(info);
    scene._debugPreview.setFrame(idx);
  }

  // Frame grid (toggle with G)
  scene._frameGrid = null;
  scene.input.keyboard.on('keydown-G', () => {
    console.log('[FrameInspector] G key pressed, grid state:', scene._frameGrid ? 'visible' : 'hidden');
    if (scene._frameGrid) {
      hideFrameGrid();
    } else {
      showFrameGrid();
    }
  });

  function showFrameGrid() {
    if (scene._frameGrid) return;
    console.log('[FrameInspector] showFrameGrid called');
  const tex = scene.textures.get(PLAYER_TEXTURE_KEY);
    if (!tex) {
      console.warn(`[FrameInspector] texture ${PLAYER_TEXTURE_KEY} not found`);
      return;
    }
    let names = typeof tex.getFrameNames === 'function' ? tex.getFrameNames() : Object.keys(tex.frames || {});
  names = names.filter(n => n !== '__BASE' && n !== PLAYER_TEXTURE_KEY);
    names.sort((a, b) => Number(a) - Number(b));
    console.log('[FrameInspector] found', names.length, 'frames:', names.slice(0, 5));
    if (!names.length) return;

    const cols = 8;
    const thumbSize = 32;
    const padding = 4;
    const startX = 20;
    const startY = 80;

    // Always render in GameScene (not UIScene) to ensure input events work correctly
    const targetScene = scene;
    console.log('[FrameInspector] rendering grid in scene:', targetScene.scene.key);

    // CORREÇÃO: Com zoom 2x, precisamos ajustar a posição para viewport coordinates
    // Criar elementos individuais em vez de container pode ser mais confiável
    scene._frameGrid = { elements: [], cleanup: null };
    
    const colsCount = cols;
    const rowsCount = Math.ceil(names.length / colsCount);
    const bgW = colsCount * (thumbSize + padding) + startX * 2;
    const bgH = rowsCount * (thumbSize + padding) + startY + 10;
    
    // Criar fundo fixo (não move com câmera)
    const bg = targetScene.add.rectangle(bgW / 2, bgH / 2, bgW, bgH, 0x000000, 0.95)
      .setScrollFactor(0)
      .setDepth(10000)
      .setOrigin(0.5, 0.5)
      .setInteractive();
    scene._frameGrid.elements.push(bg);
    
    console.log('[FrameInspector] Background created at:', { x: bg.x, y: bg.y, w: bgW, h: bgH });

    names.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (thumbSize + padding);
      const y = startY + row * (thumbSize + padding);
  const img = targetScene.add.image(x, y, PLAYER_TEXTURE_KEY, f)
        .setDisplaySize(thumbSize, thumbSize)
        .setScrollFactor(0)
        .setDepth(10001)
        .setInteractive({ useHandCursor: true });
      
      scene._frameGrid.elements.push(img);
      
      // Add debug logs for click events
      img.on('pointerdown', () => {
        console.log('[FrameInspector] Frame clicked:', f, '(type:', typeof f, ')');
        console.log('[FrameInspector] Setting player frame to:', f);
        player.setFrame(f);
        if (typeof f === 'string' && !isNaN(Number(f))) scene._debugFrameIndex = Number(f);
        else scene._debugFrameIndex = 0;
        console.log('[FrameInspector] Player frame now:', player.frame.name);
        updateDebugInfo();
        hideFrameGrid();
      });
      
      // Add hover feedback
      img.on('pointerover', () => {
        img.setTint(0x00ff00);
      });
      img.on('pointerout', () => {
        img.clearTint();
      });
    });

    const hint = targetScene.add.text(startX, startY - 30, 'Click a frame to set player. Press G to close.', { 
      fontSize: '14px', 
      color: '#fff', 
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 8, y: 4 }
    })
      .setScrollFactor(0)
      .setDepth(10002);
    scene._frameGrid.elements.push(hint);
    
    console.log('[FrameInspector] Grid created with', names.length, 'frames,', scene._frameGrid.elements.length, 'total elements');
  }

  function hideFrameGrid() {
    if (!scene._frameGrid) return;
    console.log('[FrameInspector] Hiding frame grid, destroying', scene._frameGrid.elements ? scene._frameGrid.elements.length : 0, 'elements');
    
    if (scene._frameGrid.elements) {
      scene._frameGrid.elements.forEach(el => {
        if (el && el.destroy) el.destroy();
      });
    } else if (scene._frameGrid.destroy) {
      scene._frameGrid.destroy(true);
    }
    
    scene._frameGrid = null;
  }

  // expose util for tests
  return {
    updateDebugInfo,
    showFrameGrid,
    hideFrameGrid
  };
}

/**
 * Cria uma entidade Player encapsulada (versão OOP melhorada)
 * 
 * Esta função cria o sprite usando createPlayer() e retorna uma
 * instância da classe Player que encapsula o sprite e adiciona
 * funcionalidades extras de forma organizada.
 * 
 * @param {Phaser.Scene} scene - A cena onde o player será criado
 * @param {number} x - Posição X inicial
 * @param {number} y - Posição Y inicial
 * @param {Object} config - Configurações adicionais do player
 * @param {string} [config.id] - ID único do player
 * @param {string} [config.name] - Nome do player
 * @param {number} [config.maxHealth] - Vida máxima
 * @param {number} [config.speed] - Velocidade de movimento
 * @returns {Player} Instância da classe Player
 * 
 * @example
 * // Uso básico
 * const player = createPlayerEntity(this, 100, 200);
 * 
 * // Com configuração
 * const player = createPlayerEntity(this, 100, 200, {
 *   id: 'player_1',
 *   name: 'Jogador',
 *   speed: 180
 * });
 * 
 * // Na update:
 * player.setVelocity(velocityX, velocityY);
 */
export function createPlayerEntity(scene, x, y, config = {}) {
  // Usar a factory existente para criar o sprite
  const sprite = createPlayer(scene, x, y);
  
  // Criar e retornar a entidade wrapper
  const playerEntity = new Player(scene, sprite, {
    id: config.id || `player_${Date.now()}`,
    name: config.name || 'Jogador',
    maxHealth: config.maxHealth || 100,
    speed: config.speed || 160,
    ...config
  });
  
  console.log('[PlayerFactory] Created Player entity:', {
    id: playerEntity.getId(),
    name: playerEntity.getName(),
    position: playerEntity.getPosition()
  });
  
  return playerEntity;
}
