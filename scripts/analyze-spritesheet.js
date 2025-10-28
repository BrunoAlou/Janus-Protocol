// Script para analisar spritesheets PNG e detectar possíveis tamanhos de frames
// Uso:
//   node analyze-spritesheet.js [arquivo.png] [--rows=N] [--cols=M] [--row=K]
// - arquivo.png é relativo a src/assets (padrão: leo.png)
// - --rows / --cols ajudam a filtrar combinações
// - --row exibe o intervalo de frames pertencentes à linha K

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

let fileArg = null;
const options = {
  rows: null,
  cols: null,
  row: null
};

for (const arg of args) {
  if (arg.startsWith('--')) {
    const [flag, value] = arg.split('=');
    const normalized = flag.replace(/^--/, '');
    if (!value) {
      console.warn(`Ignorando flag sem valor: ${arg}`);
      continue;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      console.warn(`Valor inválido para ${flag}: ${value}`);
      continue;
    }
    if (normalized === 'rows') options.rows = numeric;
    else if (normalized === 'cols') options.cols = numeric;
    else if (normalized === 'row') options.row = numeric;
    else console.warn(`Flag desconhecida: ${flag}`);
  } else if (!fileArg) {
    fileArg = arg;
  }
}

let targetFile = fileArg || 'leo.png';
if (!targetFile.toLowerCase().endsWith('.png')) {
  targetFile = `${targetFile}.png`;
}

const imagePath = path.isAbsolute(targetFile)
  ? targetFile
  : path.join(__dirname, '..', 'src', 'assets', targetFile);

if (!fs.existsSync(imagePath)) {
  console.error(`Arquivo não encontrado: ${imagePath}`);
  process.exit(1);
}

// Ler o arquivo PNG e extrair dimensões do header
const buffer = fs.readFileSync(imagePath);

// PNG signature: 89 50 4E 47 0D 0A 1A 0A
// IHDR chunk comes next with width and height
const widthOffset = 16;
const heightOffset = 20;

const width = buffer.readUInt32BE(widthOffset);
const height = buffer.readUInt32BE(heightOffset);

console.log('=== SPRITESHEET ANALYSIS ===');
console.log('Arquivo:', path.basename(imagePath));
console.log('Dimensões:', `${width} x ${height}`);

const getDivisors = (value) => {
  const set = new Set();
  for (let i = 1; i <= Math.sqrt(value); i++) {
    if (value % i === 0) {
      set.add(i);
      set.add(value / i);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
};

const widthDivisors = getDivisors(width);
const heightDivisors = getDivisors(height);

const combinations = [];

for (const cols of widthDivisors) {
  if (options.cols && cols !== options.cols) continue;
  const frameWidth = width / cols;
  if (frameWidth > 512) continue;

  for (const rows of heightDivisors) {
    if (options.rows && rows !== options.rows) continue;
    const frameHeight = height / rows;
    if (frameHeight > 512) continue;

    const totalFrames = cols * rows;
    combinations.push({
      frameWidth,
      frameHeight,
      cols,
      rows,
      totalFrames,
      square: frameWidth === frameHeight
    });
  }
}

if (!combinations.length) {
  console.warn('Nenhuma combinação encontrada com os filtros atuais.');
  process.exit(0);
}

const squareCombos = combinations.filter(c => c.square);
const rectangularCombos = combinations.filter(c => !c.square);

const printCombos = (label, list) => {
  if (!list.length) {
    console.log(`(${label}: nenhuma combinação)`);
    return;
  }
  console.log(`\n${label}:`);
  const sorted = [...list].sort((a, b) => {
    if (a.frameWidth === b.frameWidth) return a.frameHeight - b.frameHeight;
    return a.frameWidth - b.frameWidth;
  });
  for (const combo of sorted) {
    const marker = options.row && options.row <= combo.rows ? '*' : ' ';
    console.log(`${marker} ${combo.frameWidth}x${combo.frameHeight} → ${combo.cols} cols × ${combo.rows} rows = ${combo.totalFrames} frames`);
  }
};

printCombos('Frames quadrados', squareCombos);
printCombos('Frames retangulares', rectangularCombos);

console.log('\n=== RECOMENDAÇÃO ===');
const prioritized = combinations
  .filter(c => c.totalFrames >= 4 && c.totalFrames <= 200)
  .sort((a, b) => {
    // Preferir frames próximos de quadrados e com tamanho menor
    const areaA = a.frameWidth * a.frameHeight;
    const areaB = b.frameWidth * b.frameHeight;
    const ratioA = Math.abs(a.frameWidth - a.frameHeight);
    const ratioB = Math.abs(b.frameWidth - b.frameHeight);
    if (ratioA === ratioB) return areaA - areaB;
    return ratioA - ratioB;
  });

const recommendation = prioritized[0] || combinations[0];
console.log(`frameWidth: ${recommendation.frameWidth}, frameHeight: ${recommendation.frameHeight}`);
console.log(`grid: ${recommendation.cols} cols × ${recommendation.rows} rows (${recommendation.totalFrames} frames)`);

if (options.row) {
  console.log(`\n=== DETALHES DA LINHA ${options.row} ===`);
  let anyMatch = false;
  for (const combo of combinations) {
    if (options.row > combo.rows) continue;
    anyMatch = true;
    const startIndex = combo.cols * (options.row - 1);
    const endIndex = startIndex + combo.cols - 1;
    console.log(`- ${combo.frameWidth}x${combo.frameHeight}: frames ${startIndex} até ${endIndex}`);
  }
  if (!anyMatch) {
    console.log(`Nenhuma combinação possui ${options.row} linhas.`);
  }
}
