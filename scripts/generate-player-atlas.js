/**
 * generates atlas JSON files for leo_2 spritesheets
 * Run with: node scripts/generate-player-atlas.js
 */

const fs = require('fs');
const path = require('path');

function generateFrames(frameCount, startX = 0) {
  const frames = [];
  const frameWidth = 32;
  const frameHeight = 64;
  
  for (let i = 0; i < frameCount; i++) {
    const frameNum = i + 1;
    const x = startX + (i * frameWidth);
    frames.push({
      filename: `frame_${String(frameNum).padStart(2, '0')}`,
      frame: { x, y: 0, w: frameWidth, h: frameHeight },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
      sourceSize: { w: frameWidth, h: frameHeight }
    });
  }
  
  return frames;
}

function generateLeoAtlas(action, pngWidth) {
  const frameWidth = 32;
  const frameHeight = 64;
  const totalFrames = pngWidth / frameWidth;
  const framesPerDirection = totalFrames / 4;
  
  const frames = [];
  const directions = ['right', 'up', 'left', 'down'];
  
  // Generate frames for each direction
  directions.forEach((dir, dirIndex) => {
    const startX = dirIndex * (framesPerDirection * frameWidth);
    for (let i = 0; i < framesPerDirection; i++) {
      const frameNum = i + 1;
      const x = startX + (i * frameWidth);
      frames.push({
        filename: `${action}_${dir}_${String(frameNum).padStart(2, '0')}`,
        frame: { x, y: 0, w: frameWidth, h: frameHeight },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
        sourceSize: { w: frameWidth, h: frameHeight }
      });
    }
  });
  
  return {
    frames,
    meta: {
      app: "Leo 2 Atlas Generator",
      version: "1.0",
      image: `leo_2_${action}.png`,
      format: "RGBA8888",
      size: { w: pngWidth, h: 64 },
      scale: "1"
    }
  };
}

// Define dimensions for each sprite
const sprites = {
  walk: 768,
  idle: 768,
  lift: 1792,
  phone: 384,
  pickup: 1536,
  read: 384,
  sit: 384,
  throw: 1792
};

const assetsDir = path.join(__dirname, '..', 'src', 'assets');

Object.entries(sprites).forEach(([action, width]) => {
  const atlas = generateLeoAtlas(action, width);
  const outputPath = path.join(assetsDir, `leo_2_${action}_atlas.json`);
  fs.writeFileSync(outputPath, JSON.stringify(atlas, null, 0));
  console.log(`✓ Generated leo_2_${action}_atlas.json (${width}x64, ${width / 32} frames total)`);
});

console.log('\nAll atlas files generated successfully!');
