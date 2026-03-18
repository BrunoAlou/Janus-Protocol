/**
 * Registro central de tilesets usados pelos mapas.
 * Mantem um unico padrao para preload e resolucao de textura por nome do tileset.
 */

export const TILESET_ASSETS = Object.freeze({
  '1_Generic_32x32': {
    textureKey: '1_generic_image',
    fileName: '1_Generic_32x32.png'
  },
  '5_Classroom_and_library_32x32': {
    textureKey: '5_classroom_image',
    fileName: '5_Classroom_and_library_32x32.png'
  },
  'Generic_Home_1_Layer_1_32x32': {
    textureKey: 'generic_home_image',
    fileName: 'Generic_Home_1_Layer_1_32x32.png'
  },
  'Condominium_Design_2_layer_1_32x32': {
    textureKey: 'condo_layer1_image',
    fileName: 'Condominium_Design_2_layer_1_32x32.png'
  },
  'Condominium_Design_2_layer_2_32x32': {
    textureKey: 'condo_layer2_image',
    fileName: 'Condominium_Design_2_layer_2_32x32.png'
  },
  'Condominium_Design_preview_32x32': {
    textureKey: 'condo_preview_image',
    fileName: 'Condominium_Design_preview_32x32.png'
  },
  'Modern_Office_Shadowless_32x32': {
    textureKey: 'modern_office_image',
    fileName: 'Modern_Office_Shadowless_32x32.png'
  },
  '2_LivingRoom_Black_Shadow_32x32': {
    textureKey: 'livingroom_black_shadow_image',
    fileName: '2_LivingRoom_Black_Shadow_32x32.png'
  },
  '16_Grocery_store_Black_Shadow_32x32': {
    textureKey: 'grocery_black_shadow_image',
    fileName: '16_Grocery_store_Black_Shadow_32x32.png'
  },
  '23_Television_and_Film_Studio_Black_Shadow_32x32': {
    textureKey: 'tv_studio_black_shadow_image',
    fileName: '23_Television_and_Film_Studio_Black_Shadow_32x32.png'
  }
});

export function preloadRegisteredTilesets(scene) {
  Object.values(TILESET_ASSETS).forEach(({ textureKey, fileName }) => {
    if (!scene.textures.exists(textureKey)) {
      scene.load.image(textureKey, `/src/assets/${fileName}`);
    }
  });
}

export function getTextureKeyForTileset(tilesetName) {
  if (!tilesetName) return null;

  if (TILESET_ASSETS[tilesetName]) {
    return TILESET_ASSETS[tilesetName].textureKey;
  }

  const matchedEntry = Object.entries(TILESET_ASSETS).find(([name]) =>
    tilesetName.includes(name)
  );

  return matchedEntry ? matchedEntry[1].textureKey : null;
}
