function pickRandom(list, fallback = null) {
  if (!Array.isArray(list) || list.length === 0) {
    return fallback;
  }

  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class AmbientMobileNpcService {
  constructor(scene) {
    this.scene = scene;
    this._handles = [];

    this.scene.events.once('shutdown', () => {
      this.destroy();
    });
  }

  registerRandomWalker(config = {}) {
    const {
      sprite,
      controller,
      home,
      roamRadius = 96,
      walkSpeed = 36,
      intervalMs = 2800,
      walkChance = 0.65,
      minWalkDistance = 8,
      idleActions = ['idle'],
      directions = ['right', 'up', 'left', 'down'],
      boundsResolver = null
    } = config;

    if (!sprite || !controller || !home) {
      return null;
    }

    const state = { isWalking: false };

    const getCollisionLayers = () => {
      const layers = this.scene.layers || {};
      return [layers.walls, layers.walls2, layers.objects, layers.doors].filter(Boolean);
    };

    const isPointBlocked = (x, y) => {
      const body = sprite?.body;
      const halfW = Number.isFinite(body?.halfWidth) ? body.halfWidth : 0;
      const halfH = Number.isFinite(body?.halfHeight) ? body.halfHeight : 0;

      const samples = [
        [x, y],
        [x - halfW, y],
        [x + halfW, y],
        [x, y - halfH],
        [x, y + halfH]
      ];

      const collisionLayers = getCollisionLayers();
      for (const layer of collisionLayers) {
        for (const [sx, sy] of samples) {
          const tile = layer.getTileAtWorldXY(sx, sy, true);
          if (tile && tile.index !== -1 && (tile.collides || tile.canCollide)) {
            return true;
          }
        }
      }

      return false;
    };

    const isPathBlocked = (fromX, fromY, toX, toY) => {
      const distance = Math.hypot(toX - fromX, toY - fromY);
      if (distance <= 0) {
        return false;
      }

      const sampleStep = 10;
      const steps = Math.max(2, Math.ceil(distance / sampleStep));

      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t;
        if (isPointBlocked(x, y)) {
          return true;
        }
      }

      return false;
    };

    const syncInteractionArtifacts = () => {
      if (!sprite?.active) {
        return;
      }

      // Prefer the NPC factory updater when available.
      if (typeof sprite.updateElements === 'function') {
        sprite.updateElements();
      }

      const nameTagOffset = Math.max(32, Math.round((sprite.displayHeight || 64) * 0.55));
      const indicatorOffset = nameTagOffset + 16;

      if (sprite.interactionZone?.setPosition) {
        sprite.interactionZone.setPosition(sprite.x, sprite.y);

        if (typeof sprite.interactionZone.body?.updateFromGameObject === 'function') {
          sprite.interactionZone.body.updateFromGameObject();
        } else if (typeof sprite.interactionZone.body?.reset === 'function') {
          sprite.interactionZone.body.reset(sprite.interactionZone.x, sprite.interactionZone.y);
        }
      }

      if (sprite.interactionIndicator?.setPosition) {
        sprite.interactionIndicator.setPosition(sprite.x, sprite.y - indicatorOffset);
      }

      if (sprite.nameTag?.setPosition) {
        sprite.nameTag.setPosition(sprite.x, sprite.y - nameTagOffset);
      }
    };

    this.scene.events.on('update', syncInteractionArtifacts);

    const getBounds = () => {
      if (typeof boundsResolver === 'function') {
        return boundsResolver();
      }

      return {
        minX: 0,
        minY: 0,
        maxX: this.scene.map?.widthInPixels ?? 1024,
        maxY: this.scene.map?.heightInPixels ?? 1024
      };
    };

    const playIdleAction = () => {
      const action = pickRandom(idleActions, 'idle');
      const direction = pickRandom(directions, 'down');
      controller.execute({ action, direction });
      syncInteractionArtifacts();
    };

    const walkRandomly = () => {
      const bounds = getBounds();

      let targetX = sprite.x;
      let targetY = sprite.y;
      let foundValidTarget = false;

      // Evita destinos dentro de colisao para NPCs ambulantes.
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidateX = clamp(
          home.x + (Math.random() * roamRadius * 2 - roamRadius),
          bounds.minX,
          bounds.maxX
        );

        const candidateY = clamp(
          home.y + (Math.random() * roamRadius * 2 - roamRadius),
          bounds.minY,
          bounds.maxY
        );

        const candidateDistance = Math.hypot(candidateX - sprite.x, candidateY - sprite.y);
        if (candidateDistance < minWalkDistance) {
          continue;
        }

        if (isPointBlocked(candidateX, candidateY)) {
          continue;
        }

        if (isPathBlocked(sprite.x, sprite.y, candidateX, candidateY)) {
          continue;
        }

        targetX = candidateX;
        targetY = candidateY;
        foundValidTarget = true;
        break;
      }

      if (!foundValidTarget) {
        playIdleAction();
        return;
      }

      const distance = Math.hypot(targetX - sprite.x, targetY - sprite.y);
      if (distance < minWalkDistance) {
        playIdleAction();
        return;
      }

      const result = controller.execute({
        action: 'walk',
        target: { x: targetX, y: targetY },
        speed: walkSpeed
      });
      syncInteractionArtifacts();

      state.isWalking = true;
      const estimatedDurationMs = Number(result?.estimatedDurationMs || 0);

      this.scene.time.delayedCall(Math.max(600, estimatedDurationMs), () => {
        if (!sprite?.active) {
          state.isWalking = false;
          return;
        }

        sprite.setVelocity(0, 0);
        state.isWalking = false;
        playIdleAction();
        syncInteractionArtifacts();
      });
    };

    playIdleAction();

    const timer = this.scene.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => {
        if (!sprite?.active || state.isWalking) {
          return;
        }

        const body = sprite.body;
        const blocked = body?.blocked;
        if (blocked && (blocked.left || blocked.right || blocked.up || blocked.down)) {
          sprite.setVelocity(0, 0);
          state.isWalking = false;
          playIdleAction();
          return;
        }

        if (Math.random() < walkChance) {
          walkRandomly();
          return;
        }

        playIdleAction();
      }
    });

    const handle = {
      destroy: () => {
        this.scene.events.off('update', syncInteractionArtifacts);
        timer?.remove?.();
      },
      isWalking: () => state.isWalking
    };

    this._handles.push(handle);
    return handle;
  }

  destroy() {
    this._handles.forEach((handle) => {
      handle?.destroy?.();
    });

    this._handles = [];
  }
}
