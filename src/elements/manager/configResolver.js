// Carrega os JSON de elementos no bundle para funcionar em dev e produção (GitHub Pages).
const ELEMENT_CONFIGS = import.meta.glob('../../data/elements/*.json', {
  eager: true,
  import: 'default'
});

const ELEMENT_CONFIG_URLS = import.meta.glob('../../data/elements/*.json', {
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

export function resolveBundledElementConfig(mapId) {
  const raw = String(mapId || '');
  const fileName = raw.endsWith('.json') ? raw : `${raw}.json`;
  const exactKey = `../../data/elements/${fileName}`;

  if (ELEMENT_CONFIGS[exactKey]) {
    return { data: ELEMENT_CONFIGS[exactKey], url: ELEMENT_CONFIG_URLS[exactKey] || null };
  }

  const wanted = normalizeMapId(fileName);
  const matchedKey = Object.keys(ELEMENT_CONFIGS).find((key) => {
    const assetFile = key.split('/').pop() || '';
    return normalizeMapId(assetFile) === wanted;
  });

  if (!matchedKey) {
    return { data: null, url: null };
  }

  return {
    data: ELEMENT_CONFIGS[matchedKey],
    url: ELEMENT_CONFIG_URLS[matchedKey] || null
  };
}
