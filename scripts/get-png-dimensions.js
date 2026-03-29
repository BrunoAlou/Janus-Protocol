const fs = require('fs');
const path = require('path');

function getPNGDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // PNG signature is 8 bytes, IHDR chunk follows
  // Width is at bytes 16-19 (big-endian), Height at 20-23 (big-endian)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  
  return { width, height };
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');
const files = ['idle', 'lift', 'phone', 'pickup', 'read', 'sit', 'throw', 'walk'];

files.forEach(f => {
  const filePath = path.join(assetsDir, `leo_2_${f}.png`);
  const dims = getPNGDimensions(filePath);
  console.log(`leo_2_${f}.png: ${dims.width}x${dims.height}`);
});
