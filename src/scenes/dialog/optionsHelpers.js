export function updateVisibleOptions(scene) {
  const endIndex = Math.min(scene.visibleStartIndex + scene.maxVisibleOptions, scene.currentOptions.length);

  scene.optionButtons.forEach((button, index) => {
    if (index >= scene.visibleStartIndex && index < endIndex) {
      const visibleIndex = index - scene.visibleStartIndex;
      const y = scene.optionsStartY + (visibleIndex * (scene.buttonHeight + scene.buttonSpacing));
      button.setY(y);
      button.setVisible(true);
    } else {
      button.setVisible(false);
    }
  });

  const hasMoreAbove = scene.visibleStartIndex > 0;
  const hasMoreBelow = endIndex < scene.currentOptions.length;

  scene.scrollUpIndicator.setVisible(hasMoreAbove);
  scene.scrollDownIndicator.setVisible(hasMoreBelow);
}

export function createOptionButton(scene, option, index, x, y, width, height) {
  const container = scene.add.container(x, y);

  const isDisabled = option.disabled || false;
  const bgColor = isDisabled ? 0x333333 : 0x2a2a3e;
  const textColor = isDisabled ? '#666666' : '#ffffff';

  const bg = scene.add.rectangle(width / 2, height / 2, width, height, bgColor)
    .setStrokeStyle(1, 0x00d9ff)
    .setInteractive({ useHandCursor: !isDisabled });

  let iconOffset = 0;
  if (option.icon) {
    const icon = scene.add.text(10, height / 2, option.icon, {
      fontSize: '16px'
    }).setOrigin(0, 0.5);
    container.add(icon);
    iconOffset = 28;
  }

  const label = scene.add.text(10 + iconOffset, height / 2, option.label, {
    fontSize: '14px',
    fontFamily: 'Arial',
    color: textColor
  }).setOrigin(0, 0.5);

  if (option.description) {
    const desc = scene.add.text(width - 8, height / 2, option.description, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#888888'
    }).setOrigin(1, 0.5);
    container.add(desc);
  }

  if (isDisabled && option.disabledReason) {
    const reason = scene.add.text(width - 8, height / 2, `🔒 ${option.disabledReason}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ff6666'
    }).setOrigin(1, 0.5);
    container.add(reason);
  }

  container.add([bg, label]);

  if (!isDisabled) {
    bg.on('pointerover', () => {
      scene.selectedOptionIndex = index;
      scene.highlightOption(index);
    });

    bg.on('pointerdown', () => {
      scene.selectOption(option);
    });
  }

  container.bg = bg;
  container.option = option;
  container.isDisabled = isDisabled;

  return container;
}

export function highlightOption(scene, index) {
  if (index < scene.visibleStartIndex) {
    scene.visibleStartIndex = index;
    updateVisibleOptions(scene);
  } else if (index >= scene.visibleStartIndex + scene.maxVisibleOptions) {
    scene.visibleStartIndex = index - scene.maxVisibleOptions + 1;
    updateVisibleOptions(scene);
  }

  scene.optionButtons.forEach((button, i) => {
    if (button.isDisabled) return;

    if (i === index) {
      button.bg.setFillStyle(0x3a3a4e);
      button.bg.setStrokeStyle(2, 0x00ffff);
    } else {
      button.bg.setFillStyle(0x2a2a3e);
      button.bg.setStrokeStyle(1, 0x00d9ff);
    }
  });
}
