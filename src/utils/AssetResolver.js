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

function normalizeMapId(value) {
  return String(value || '')
    .replace(/\.json$/i, '')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

export function resolveAssetPath(relativePath) {
  // Para GitHub Pages com base '/Janus-Protocol/', 
  // os assets estão em /assets/ depois do build
  // Durante desenvolvimento (Vite), estão em ./assets/
  
  // Use import.meta.url para obter o caminho correto em ambos os modos
  return new URL(`../assets/${relativePath}`, import.meta.url).href;
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
