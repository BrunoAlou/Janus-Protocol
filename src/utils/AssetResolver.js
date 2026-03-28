/**
 * AssetResolver - Centraliza a resolução de caminhos de assets
 * Funciona com Vite e GitHub Pages (com base: '/Janus-Protocol/')
 */

// Mapa estático de JSON de mapas gerado no build do Vite.
// Usa URLs finais (hashadas) para funcionar em dev e produção.
const MAP_JSON_URLS = import.meta.glob('../assets/*.json', {
  eager: true,
  query: '?url',
  import: 'default'
});

// Mapa estático de todos os assets para garantir paths válidos (com hash) no build.
const ASSET_URLS = import.meta.glob('../assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default'
});

function normalizeMapId(value) {
  return String(value || '')
    .replace(/\.json$/i, '')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

export function resolveAssetPath(relativePath) {
  if (!relativePath) {
    console.error('[AssetResolver] resolveAssetPath recebeu valor inválido:', relativePath);
    return null;
  }

  const normalized = String(relativePath)
    .replace(/^\.?\//, '')
    .replace(/^assets\//i, '');

  const exactKey = `../assets/${normalized}`;
  if (ASSET_URLS[exactKey]) {
    return ASSET_URLS[exactKey];
  }

  const matchedKey = Object.keys(ASSET_URLS).find((key) => key.endsWith(`/${normalized}`));
  if (matchedKey) {
    return ASSET_URLS[matchedKey];
  }

  // Fallback para manter compatibilidade em dev para caminhos dinâmicos.
  return new URL(`../assets/${normalized}`, import.meta.url).href;
}

export function resolveMapPath(mapFileOrId) {
  if (!mapFileOrId) {
    console.error('[AssetResolver] resolveMapPath recebeu valor inválido:', mapFileOrId);
    return null;
  }

  const raw = String(mapFileOrId);
  const fileName = raw.endsWith('.json') ? raw : `${raw}.json`;

  // 1) Match exato por arquivo
  const exactKey = `../assets/${fileName}`;
  if (MAP_JSON_URLS[exactKey]) {
    return MAP_JSON_URLS[exactKey];
  }

  // 2) Match flexível por nome normalizado (case-insensitive, _ vs -)
  const wanted = normalizeMapId(fileName);
  const matchedKey = Object.keys(MAP_JSON_URLS).find((key) => {
    const assetFile = key.split('/').pop() || '';
    return normalizeMapId(assetFile) === wanted;
  });

  if (matchedKey) {
    return MAP_JSON_URLS[matchedKey];
  }

  console.error(`[AssetResolver] Mapa não encontrado para "${mapFileOrId}"`);
  return null;
}
