export function createFlagsDebugUI(d) {
  d.flagsMenuScene = d.scene.scene.get('UIScene') || d.scene;

  const previousOwner = d.flagsMenuScene.__flagsMenuOwner;
  if (previousOwner && previousOwner !== d && typeof previousOwner.destroyFlagsDebugUI === 'function') {
    previousOwner.destroyFlagsDebugUI();
  }

  d.flagsMenu = d.flagsMenuScene.add.container(20, 70);
  d.flagsMenu.setDepth(10050);
  d.flagsMenu.setScrollFactor(0);
  d.flagsMenu.setVisible(false);

  const menuBg = d.flagsMenuScene.add.rectangle(0, 0, 300, 360, 0x1a1a2e, 0.96)
    .setOrigin(0, 0)
    .setStrokeStyle(3, 0x00d9ff)
    .setScrollFactor(0);

  const title = d.flagsMenuScene.add.text(150, 18, 'DEBUG FLAGS', {
    fontSize: '22px',
    color: '#00d9ff',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0).setScrollFactor(0);

  const line = d.flagsMenuScene.add.graphics().setScrollFactor(0);
  line.lineStyle(2, 0x3a3a4e);
  line.lineBetween(20, 52, 280, 52);

  d.flagsListText = d.flagsMenuScene.add.text(20, 64, '', {
    fontSize: '13px',
    color: '#cfefff',
    fontFamily: 'monospace',
    lineSpacing: 3
  }).setScrollFactor(0);

  d.flagsPrevPageBg = d.flagsMenuScene.add.rectangle(210, 70, 24, 20, 0x2a2a3e)
    .setStrokeStyle(1, 0x5b6e89)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  d.flagsPrevPageText = d.flagsMenuScene.add.text(210, 70, '<', {
    fontSize: '14px',
    color: '#cfefff',
    fontStyle: 'bold'
  }).setOrigin(0.5).setScrollFactor(0);

  d.flagsNextPageBg = d.flagsMenuScene.add.rectangle(280, 70, 24, 20, 0x2a2a3e)
    .setStrokeStyle(1, 0x5b6e89)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  d.flagsNextPageText = d.flagsMenuScene.add.text(280, 70, '>', {
    fontSize: '14px',
    color: '#cfefff',
    fontStyle: 'bold'
  }).setOrigin(0.5).setScrollFactor(0);

  d.flagsPageInfoText = d.flagsMenuScene.add.text(245, 70, '1/1', {
    fontSize: '11px',
    color: '#9cc4ff',
    fontFamily: 'monospace'
  }).setOrigin(0.5).setScrollFactor(0);

  const prevPage = () => {
    if (!d.enabled || d.flagsPageIndex <= 0) return;
    d.flagsPageIndex -= 1;
    d._lastFlagsSignature = null;
    d.updateFlagsDebugUI();
  };

  const nextPage = () => {
    if (!d.enabled) return;
    d.flagsPageIndex += 1;
    d._lastFlagsSignature = null;
    d.updateFlagsDebugUI();
  };

  d.flagsPrevPageBg.on('pointerdown', prevPage);
  d.flagsNextPageBg.on('pointerdown', nextPage);

  d.flagsPrevPageBg.on('pointerover', () => d.flagsPrevPageBg?.setFillStyle(0x3a3a4e));
  d.flagsPrevPageBg.on('pointerout', () => d.flagsPrevPageBg?.setFillStyle(0x2a2a3e));
  d.flagsNextPageBg.on('pointerover', () => d.flagsNextPageBg?.setFillStyle(0x3a3a4e));
  d.flagsNextPageBg.on('pointerout', () => d.flagsNextPageBg?.setFillStyle(0x2a2a3e));

  d.flagsEmptyText = d.flagsMenuScene.add.text(150, 180, 'Nenhuma flag ativa', {
    fontSize: '16px',
    color: '#888888',
    align: 'center'
  }).setOrigin(0.5).setScrollFactor(0);

  d.flagsClearButtonBg = d.flagsMenuScene.add.rectangle(150, 322, 210, 34, 0x2a2a3e)
    .setScrollFactor(0)
    .setStrokeStyle(2, 0xff6666)
    .setInteractive({ useHandCursor: true });

  d.flagsClearButton = d.flagsMenuScene.add.text(150, 322, 'CLEAR ALL TAGS', {
    fontSize: '15px',
    color: '#ff6666',
    fontStyle: 'bold',
    padding: { x: 12, y: 4 }
  }).setOrigin(0.5).setScrollFactor(0);

  d.flagsClearButtonBg.on('pointerover', () => {
    d.flagsClearButtonBg?.setFillStyle(0x3a3a4e);
    d.flagsClearButton?.setColor('#ff9999');
  });

  d.flagsClearButtonBg.on('pointerout', () => {
    d.flagsClearButtonBg?.setFillStyle(0x2a2a3e);
    d.flagsClearButton?.setColor('#ff6666');
  });

  d.flagsClearButtonBg.on('pointerdown', () => {
    if (!d.enabled) {
      return;
    }

    if (window.gameState?.clearFlags) {
      window.gameState.clearFlags();
      d._lastFlagsSignature = null;
      d.updateFlagsDebugUI();
      d.showDebugToast('Flags limpas com sucesso', 0x00aa55);
    } else {
      d.showDebugToast('GameState indisponivel', 0xaa3333);
    }
  });

  d.flagsMenu.add([
    menuBg,
    title,
    line,
    d.flagsListText,
    d.flagsPrevPageBg,
    d.flagsPrevPageText,
    d.flagsPageInfoText,
    d.flagsNextPageBg,
    d.flagsNextPageText,
    d.flagsEmptyText,
    d.flagsClearButtonBg,
    d.flagsClearButton
  ]);

  d.layoutFlagsDebugUI();
  d.flagsMenuScene.__flagsMenuOwner = d;
}

export function destroyFlagsDebugUI(d) {
  d.clearFlagRows();
  d.flagsClearButtonBg?.destroy();
  d.flagsPrevPageBg?.destroy();
  d.flagsNextPageBg?.destroy();
  d.flagsPrevPageText?.destroy();
  d.flagsNextPageText?.destroy();
  d.flagsPageInfoText?.destroy();
  d.flagsMenu?.destroy();
  d.flagsMenu = null;
  d.flagsListText = null;
  d.flagsClearButton = null;
  d.flagsClearButtonBg = null;
  d.flagsEmptyText = null;
  d.flagsPrevPageBg = null;
  d.flagsNextPageBg = null;
  d.flagsPrevPageText = null;
  d.flagsNextPageText = null;
  d.flagsPageInfoText = null;

  if (d.flagsMenuScene && d.flagsMenuScene.__flagsMenuOwner === d) {
    d.flagsMenuScene.__flagsMenuOwner = null;
  }
}

export function updateFlagsDebugUI(d) {
  if (!d.flagsListText || !d.flagsEmptyText || !d.enabled) {
    d.flagsListText?.setVisible(false);
    d.flagsEmptyText?.setVisible(false);
    return;
  }

  d.layoutFlagsDebugUI();

  const flags = window.gameState?.getState?.()?.player?.flags || {};
  const allEntries = Object.entries(flags).sort(([a], [b]) => a.localeCompare(b));

  const totalPages = Math.max(1, Math.ceil(allEntries.length / d.flagsPageSize));
  if (d.flagsPageIndex >= totalPages) d.flagsPageIndex = totalPages - 1;
  if (d.flagsPageIndex < 0) d.flagsPageIndex = 0;

  const signature = `${d.flagsPageIndex}|${allEntries.map(([key, value]) => `${key}:${String(value)}`).join('|')}`;
  if (signature === d._lastFlagsSignature) {
    return;
  }
  d._lastFlagsSignature = signature;

  d.clearFlagRows();

  if (allEntries.length === 0) {
    d.flagsListText.setVisible(false);
    d.flagsEmptyText.setVisible(true);
    return;
  }

  const activeCount = allEntries.filter(([, value]) => value === true).length;
  d.flagsListText.setText(`Flags: ${allEntries.length} (ativas: ${activeCount})`);
  d.flagsListText.setVisible(true);
  d.flagsEmptyText.setVisible(false);

  d.flagsPageInfoText?.setText(`${d.flagsPageIndex + 1}/${totalPages}`);
  d.flagsPrevPageBg?.setAlpha(d.flagsPageIndex > 0 ? 1 : 0.45);
  d.flagsPrevPageText?.setAlpha(d.flagsPageIndex > 0 ? 1 : 0.45);
  d.flagsNextPageBg?.setAlpha(d.flagsPageIndex < totalPages - 1 ? 1 : 0.45);
  d.flagsNextPageText?.setAlpha(d.flagsPageIndex < totalPages - 1 ? 1 : 0.45);

  const start = d.flagsPageIndex * d.flagsPageSize;
  const end = start + d.flagsPageSize;
  const pageEntries = allEntries.slice(start, end);

  pageEntries.forEach(([key, value], index) => {
    d.createFlagRow(key, value, index);
  });
}

export function createFlagRow(d, flagKey, flagValue, index) {
  const y = 92 + (index * 22);
  const row = d.flagsMenuScene.add.container(20, y).setScrollFactor(0);

  const isActive = flagValue === true;
  const valueText = isActive ? 'true' : 'false';

  const labelText = `- ${d.truncateFlagText(flagKey, 18)}: ${valueText}`;
  const label = d.flagsMenuScene.add.text(0, 0, labelText, {
    fontSize: '12px',
    color: isActive ? '#cfefff' : '#8ea1b5',
    fontFamily: 'monospace'
  }).setOrigin(0, 0.5);

  const toggleBg = d.flagsMenuScene.add.rectangle(245, 0, 52, 18, isActive ? 0x1f5a3d : 0x5a1f2a)
    .setStrokeStyle(1, isActive ? 0x8dffc2 : 0xff7f9a)
    .setInteractive({ useHandCursor: true });

  const toggleTxt = d.flagsMenuScene.add.text(245, 0, isActive ? 'ON' : 'OFF', {
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
    if (!d.enabled) return;

    if (window.gameState?.setFlag) {
      window.gameState.setFlag(flagKey, !isActive);
    } else if (window.gameState?.removeFlag) {
      window.gameState.removeFlag(flagKey);
    }

    d._lastFlagsSignature = null;
    d.updateFlagsDebugUI();
    d.showDebugToast(`Flag ${!isActive ? 'ativada' : 'desativada'}: ${flagKey}`, !isActive ? 0x2a6f4f : 0x6f2a2a);
  });

  row.add([label, toggleBg, toggleTxt]);
  d.flagsMenu.add(row);
  d.flagItemRows.push(row);
}

export function truncateFlagText(text, maxLength = 18) {
  const value = String(text || '');
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxLength - 3))}...`;
}

export function clearFlagRows(d) {
  if (!d.flagItemRows || d.flagItemRows.length === 0) {
    return;
  }

  d.flagItemRows.forEach((row) => row?.destroy());
  d.flagItemRows = [];
}

export function showDebugToast(d, message, color = 0x222222) {
  const menuBounds = d.flagsMenu?.getBounds();
  const toastX = menuBounds ? menuBounds.centerX : 170;
  const toastY = menuBounds ? menuBounds.bottom + 12 : 285;

  const toastScene = d.flagsMenuScene || d.scene;
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

export function layoutFlagsDebugUI(d) {
  if (!d.flagsMenu) return;

  const hostCamera = d.flagsMenuScene?.cameras?.main || d.scene.cameras.main;
  const { width } = hostCamera;
  const x = Math.max(12, Math.min(width - 312, 20));
  d.flagsMenu.setPosition(x, 70);
}
