import { createPlayerAnimations } from './playerAnimations.js';
import { PLAYER_TEXTURE_KEY, FRAME_WIDTH, FRAME_HEIGHT } from './loadPlayerAssets.js';

export function createPlayer(scene, x, y) {
  console.log('[PlayerFactory] createPlayer called with position:', { x, y });
  
  // For texture atlas, use default frame (walk_down_01)
  const preferredFrame = 'walk_down_01';
  
  // Create physics sprite with idle frame
  const sprite = scene.physics.add.sprite(x, y, PLAYER_TEXTURE_KEY, preferredFrame);
  console.log('[PlayerFactory] Sprite created at:', { x: sprite.x, y: sprite.y, frame: sprite.frame.name });
  
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(4);
  
  const tileWidth = scene.map?.tileWidth ?? FRAME_WIDTH;
  const tileHeight = scene.map?.tileHeight ?? FRAME_HEIGHT;
  // Player ocupa 3x3 tiles para melhor proporção
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
    scale
  });

  if (sprite.body) {
    // Hitbox pequena e centralizada (apenas os pés do personagem)
    // Frame original: 32x64 pixels
    const bodyWidth = 12;   // Hitbox bem estreita
    const bodyHeight = 35;   // Hitbox bem baixa (só os pés)
    
    // Ajustar offset para compensar o deslocamento
    const offsetX = 10;  // Movido mais para a esquerda (era 10)
    const offsetY = FRAME_HEIGHT - bodyHeight;  // 64-8 = 56px do topo
    
    sprite.body.setSize(bodyWidth, bodyHeight);
    sprite.body.setOffset(offsetX, offsetY);
    console.log('[PlayerFactory] Hitbox size:', { 
      bodyWidth, 
      bodyHeight, 
      offsetX, 
      offsetY,
      frameOriginal: `${FRAME_WIDTH}x${FRAME_HEIGHT}`
    });
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
