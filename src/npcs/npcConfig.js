function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
}

export function toNpcList(rawConfigs) {
  if (!rawConfigs) {
    return [];
  }

  if (Array.isArray(rawConfigs)) {
    return rawConfigs;
  }

  if (typeof rawConfigs !== 'object') {
    return [];
  }

  if (Array.isArray(rawConfigs.list)) {
    return rawConfigs.list;
  }

  if (Array.isArray(rawConfigs.npcs)) {
    return rawConfigs.npcs;
  }

  const list = [];

  if (Array.isArray(rawConfigs.team)) {
    list.push(...rawConfigs.team);
  }

  if (rawConfigs.manager) {
    list.push(rawConfigs.manager);
  }

  if (list.length > 0) {
    return list;
  }

  if (rawConfigs.id || rawConfigs.name || rawConfigs.texture || rawConfigs.textureKey) {
    return [rawConfigs];
  }

  return [];
}

export function normalizeNpcConfig(rawConfig = {}, defaults = {}) {
  const idFallback = defaults.id || `npc_${Date.now()}`;
  const nameFallback = defaults.name || 'NPC';

  const textureKey = String(
    rawConfig.textureKey || rawConfig.texture || defaults.textureKey || defaults.texture || 'npc_default'
  );

  const scaleValue = Number(rawConfig.scale);
  const normalizedScale = Number.isFinite(scaleValue) ? scaleValue : null;

  return {
    id: String(rawConfig.id || defaults.id || idFallback),
    name: String(rawConfig.name || defaults.name || nameFallback),
    role: rawConfig.role || defaults.role || null,
    group: rawConfig.group || defaults.group || null,
    x: toNumber(rawConfig.x, toNumber(defaults.x, 0)),
    y: toNumber(rawConfig.y, toNumber(defaults.y, 0)),
    texture: textureKey,
    textureKey,
    assetFile: rawConfig.assetFile || defaults.assetFile || null,
    frame: toNumber(rawConfig.frame, toNumber(defaults.frame, 0)),
    scale: normalizedScale,
    scaleMultiplier: toNumber(
      rawConfig.scaleMultiplier ?? rawConfig.sitScaleMultiplier,
      toNumber(defaults.scaleMultiplier ?? defaults.sitScaleMultiplier, 1)
    ),
    depth: toNumber(rawConfig.depth, toNumber(defaults.depth, 4)),
    interactionRadius: toNumber(rawConfig.interactionRadius, toNumber(defaults.interactionRadius, 32)),
    interactionAreaWidth: toNumber(
      rawConfig.interactionAreaWidth ?? rawConfig.areaWidth ?? rawConfig.width,
      toNumber(defaults.interactionAreaWidth ?? defaults.areaWidth ?? defaults.width, 0)
    ),
    interactionAreaHeight: toNumber(
      rawConfig.interactionAreaHeight ?? rawConfig.areaHeight ?? rawConfig.height,
      toNumber(defaults.interactionAreaHeight ?? defaults.areaHeight ?? defaults.height, 0)
    ),
    dialogues: Array.isArray(rawConfig.dialogues)
      ? rawConfig.dialogues
      : (Array.isArray(defaults.dialogues) ? defaults.dialogues : []),
    canMove: toBoolean(rawConfig.canMove, toBoolean(defaults.canMove, false)),
    patrol: rawConfig.patrol ?? defaults.patrol ?? null,
    locked: toBoolean(rawConfig.locked, toBoolean(defaults.locked, false)),
    lockedMessage: rawConfig.lockedMessage || defaults.lockedMessage || null,
    contactFlagKey: rawConfig.contactFlagKey || defaults.contactFlagKey || null,
    flipX: typeof rawConfig.flipX === 'boolean'
      ? rawConfig.flipX
      : (typeof rawConfig.sitDirectionFlipX === 'boolean'
        ? rawConfig.sitDirectionFlipX
        : toBoolean(defaults.flipX, false))
  };
}
