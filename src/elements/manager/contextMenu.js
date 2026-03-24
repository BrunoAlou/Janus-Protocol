export function showElementContextMenu(manager, x, y, element) {
  if (!manager.floatingMenu) {
    // FloatingMenu is lazily initialized by ElementManager
    return;
  }

  const options = [];

  if (element.options && element.options.length > 0) {
    element.options.forEach((opt) => {
      options.push({
        label: opt.label || 'Interact',
        icon: opt.icon || '◎',
        disabled: opt.disabled || false,
        action: () => {
          if (opt.action && typeof opt.action === 'function') {
            opt.action();
          } else {
            element.interact('mouse');
          }
        }
      });
    });
  } else {
    options.push({
      label: `Interact with ${element.name}`,
      icon: '◎',
      action: () => element.interact('mouse')
    });
  }

  if (options.length > 0) {
    options.push({ label: '', icon: '', disabled: true });
  }

  options.push({
    label: 'Examine',
    icon: '◉',
    action: () => {
      if (element.description) {
        console.log(`Description: ${element.description}`);
      }
    }
  });

  options.push({
    label: 'Cancel',
    icon: '✕',
    action: () => {
      manager.floatingMenu.hide();
    }
  });

  manager.floatingMenu.show(x, y, options);
}
