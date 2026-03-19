/**
 * AssetResolver - Centraliza a resolução de caminhos de assets
 * Funciona com Vite e GitHub Pages (com base: '/Janus-Protocol/')
 */

export function resolveAssetPath(relativePath) {
  // Para GitHub Pages com base '/Janus-Protocol/', 
  // os assets estão em /assets/ depois do build
  // Durante desenvolvimento (Vite), estão em ./assets/
  
  // Use import.meta.url para obter o caminho correto em ambos os modos
  return new URL(`../assets/${relativePath}`, import.meta.url).href;
}

export function resolveMapPath(mapFile) {
  return resolveAssetPath(mapFile);
}
