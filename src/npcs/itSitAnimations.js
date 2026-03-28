import { resolveAssetPath } from '../utils/AssetResolver.js';

export const IT_SIT_FRAME_WIDTH = 16;
export const IT_SIT_FRAME_HEIGHT = 32;

export function getItSitAnimationKey(textureKey) {
  return `${textureKey}_sit`;
}

export function loadItSitNpcAssets(scene, npcConfigs = []) {
  npcConfigs.forEach((npcConfig) => {
    if (!npcConfig?.textureKey || !npcConfig?.assetFile) {
      return;
    }

    const textureKey = npcConfig.textureKey;
    const assetUrl = resolveAssetPath(npcConfig.assetFile);

    if (!assetUrl) {
      console.warn(`[itSitAnimations] Invalid asset URL for texture "${textureKey}"`);
      return;
    }

    // Evita ficar preso em textura antiga no cache quando houve rename de arquivo.
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }

    scene.load.spritesheet(
      textureKey,
      assetUrl,
      {
        frameWidth: IT_SIT_FRAME_WIDTH,
        frameHeight: IT_SIT_FRAME_HEIGHT
      }
    );
  });
}

export function createItSitNpcAnimations(scene, npcConfigs = []) {
  npcConfigs.forEach((npcConfig) => {
    const textureKey = npcConfig?.textureKey;
    if (!textureKey) {
      return;
    }

    const animationKey = getItSitAnimationKey(textureKey);
    if (scene.anims.exists(animationKey)) {
      return;
    }

    const texture = scene.textures.get(textureKey);
    const frameNames = texture
      ? texture.getFrameNames().filter((name) => name !== '__BASE')
      : [];

    if (frameNames.length === 0) {
      return;
    }

    const maxFrameIndex = Math.max(0, frameNames.length - 1);
    const endFrame = Math.min(2, maxFrameIndex);

    scene.anims.create({
      key: animationKey,
      // Mesmo padrão do Caio: loop sentado usando os 3 primeiros frames.
      frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: endFrame }),
      frameRate: 8,
      repeat: -1
    });
  });
}
