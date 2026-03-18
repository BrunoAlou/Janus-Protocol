const DEFAULT_DIRECTION = 'down';
const WALK_ACTION = 'walk';

function normalizeAction(action) {
  return (action || 'idle').toLowerCase();
}

function normalizeDirection(direction, fallback = DEFAULT_DIRECTION) {
  const value = (direction || fallback || DEFAULT_DIRECTION).toLowerCase();
  if (value === 'up' || value === 'down' || value === 'left' || value === 'right') {
    return value;
  }
  return fallback;
}

function inferDirectionFromVector(dx, dy, fallback = DEFAULT_DIRECTION) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  if (Math.abs(dy) > 0) {
    return dy >= 0 ? 'down' : 'up';
  }
  return fallback;
}

export function createCharacterCommandController(scene, sprite, adapter, options = {}) {
  const opts = {
    defaultDirection: DEFAULT_DIRECTION,
    stopOnNonWalk: true,
    ...options
  };

  let lastDirection = normalizeDirection(opts.defaultDirection);

  function resolveAnimation(action, direction) {
    if (!adapter || typeof adapter.resolveAnimation !== 'function') {
      return null;
    }

    const animKey = adapter.resolveAnimation(action, direction);
    if (!animKey || !scene.anims.exists(animKey)) {
      return null;
    }

    return animKey;
  }

  function playAnimation(action, direction) {
    const animKey = resolveAnimation(action, direction);
    if (!animKey) {
      return;
    }

    if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
      sprite.play(animKey, true);
    }
  }

  function execute(command = {}) {
    const action = normalizeAction(command.action);
    let direction = normalizeDirection(command.direction, lastDirection);
    let estimatedDurationMs = 0;

    if (command.velocity && sprite.body) {
      const vx = Number(command.velocity.x) || 0;
      const vy = Number(command.velocity.y) || 0;
      sprite.body.setVelocity(vx, vy);
      if (vx !== 0 || vy !== 0) {
        direction = inferDirectionFromVector(vx, vy, direction);
      }
    } else if (command.target && action === WALK_ACTION && sprite.body) {
      const speed = Number(command.speed) || 40;
      const targetX = Number(command.target.x) || sprite.x;
      const targetY = Number(command.target.y) || sprite.y;
      scene.physics.moveTo(sprite, targetX, targetY, speed);

      const dx = targetX - sprite.x;
      const dy = targetY - sprite.y;
      direction = inferDirectionFromVector(dx, dy, direction);
      const distance = Math.hypot(dx, dy);
      estimatedDurationMs = speed > 0 ? Math.round((distance / speed) * 1000) : 0;
    } else if (opts.stopOnNonWalk && sprite.body && action !== WALK_ACTION) {
      sprite.body.setVelocity(0, 0);
    }

    playAnimation(action, direction);
    lastDirection = direction;

    return {
      action,
      direction,
      estimatedDurationMs
    };
  }

  return {
    execute,
    getLastDirection: () => lastDirection,
    stop: () => execute({ action: 'idle', direction: lastDirection })
  };
}
