/*
 * Optimize project assets in-place.
 * - JSON: minifies by removing whitespace.
 * - Images: recompresses PNG/JPG/JPEG/WEBP using sharp.
 *
 * Usage examples:
 *   node scripts/optimize-assets.js --json --write
 *   node scripts/optimize-assets.js --images --write
 *   node scripts/optimize-assets.js --json --images --write --src src/assets --src src/data
 */

const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const JSON_EXTENSIONS = new Set(['.json']);
const DEFAULT_SOURCES = ['src/assets', 'src/data'];

function parseArgs(argv) {
  const args = {
    includeJson: false,
    includeImages: false,
    write: false,
    sources: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--json') args.includeJson = true;
    else if (token === '--images') args.includeImages = true;
    else if (token === '--write') args.write = true;
    else if (token === '--src') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --src');
      }
      args.sources.push(value);
      i += 1;
    }
  }

  if (!args.includeJson && !args.includeImages) {
    args.includeJson = true;
    args.includeImages = true;
  }

  if (args.sources.length === 0) {
    args.sources = [...DEFAULT_SOURCES];
  }

  return args;
}

function walkFiles(rootDir) {
  const result = [];

  if (!fs.existsSync(rootDir)) {
    return result;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }
      result.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      result.push(fullPath);
    }
  }

  return result;
}

function formatBytes(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function toRelative(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

async function optimizeJsonFile(filePath, write) {
  const original = fs.readFileSync(filePath, 'utf8');
  let minified;

  try {
    const parsed = JSON.parse(original);
    minified = JSON.stringify(parsed);
  } catch (error) {
    return {
      type: 'json',
      filePath,
      changed: false,
      error: `Invalid JSON: ${error.message}`
    };
  }

  const before = Buffer.byteLength(original, 'utf8');
  const after = Buffer.byteLength(minified, 'utf8');
  const changed = after < before;

  if (changed && write) {
    fs.writeFileSync(filePath, `${minified}\n`, 'utf8');
  }

  return {
    type: 'json',
    filePath,
    changed,
    before,
    after
  };
}

async function optimizeImageFile(filePath, write, sharpLib) {
  const originalBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let pipeline = sharpLib(originalBuffer, { animated: false, failOn: 'none' });

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, effort: 10 });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ mozjpeg: true, quality: 85, progressive: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: 80, effort: 6 });
  } else {
    return {
      type: 'image',
      filePath,
      changed: false
    };
  }

  const optimizedBuffer = await pipeline.toBuffer();
  const before = originalBuffer.byteLength;
  const after = optimizedBuffer.byteLength;
  const changed = after < before;

  if (changed && write) {
    fs.writeFileSync(filePath, optimizedBuffer);
  }

  return {
    type: 'image',
    filePath,
    changed,
    before,
    after
  };
}

function printReport(projectRoot, title, entries) {
  const changedEntries = entries.filter((entry) => entry.changed);
  const withError = entries.filter((entry) => entry.error);
  const totalBefore = changedEntries.reduce((sum, item) => sum + (item.before || 0), 0);
  const totalAfter = changedEntries.reduce((sum, item) => sum + (item.after || 0), 0);
  const saved = Math.max(0, totalBefore - totalAfter);

  console.log(`\n${title}`);
  console.log(`- Files scanned: ${entries.length}`);
  console.log(`- Files changed: ${changedEntries.length}`);
  console.log(`- Total saved: ${formatBytes(saved)}`);

  if (changedEntries.length > 0) {
    console.log('- Top changes:');
    changedEntries
      .sort((a, b) => (b.before - b.after) - (a.before - a.after))
      .slice(0, 15)
      .forEach((entry) => {
        const diff = entry.before - entry.after;
        console.log(
          `  * ${toRelative(projectRoot, entry.filePath)} | ${formatBytes(entry.before)} -> ${formatBytes(entry.after)} | saved ${formatBytes(diff)}`
        );
      });
  }

  if (withError.length > 0) {
    console.log('- Errors:');
    withError.forEach((entry) => {
      console.log(`  * ${toRelative(projectRoot, entry.filePath)} | ${entry.error}`);
    });
  }
}

async function main() {
  const projectRoot = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  console.log('[optimize-assets] Starting...');
  console.log(`[optimize-assets] Mode: ${args.write ? 'write' : 'dry-run'}`);
  console.log(`[optimize-assets] Sources: ${args.sources.join(', ')}`);

  const allFiles = args.sources
    .map((source) => path.resolve(projectRoot, source))
    .flatMap((sourceDir) => walkFiles(sourceDir));

  const jsonFiles = args.includeJson
    ? allFiles.filter((filePath) => JSON_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    : [];

  const imageFiles = args.includeImages
    ? allFiles.filter((filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    : [];

  let sharpLib = null;
  if (args.includeImages) {
    try {
      // Lazy import so JSON optimization still works without sharp.
      // eslint-disable-next-line global-require
      sharpLib = require('sharp');
    } catch (error) {
      console.error('[optimize-assets] sharp is required for --images. Install with: npm i -D sharp');
      process.exitCode = 1;
      return;
    }
  }

  const jsonResults = [];
  for (const filePath of jsonFiles) {
    // eslint-disable-next-line no-await-in-loop
    const result = await optimizeJsonFile(filePath, args.write);
    jsonResults.push(result);
  }

  const imageResults = [];
  for (const filePath of imageFiles) {
    // eslint-disable-next-line no-await-in-loop
    const result = await optimizeImageFile(filePath, args.write, sharpLib);
    imageResults.push(result);
  }

  if (args.includeJson) {
    printReport(projectRoot, 'JSON optimization', jsonResults);
  }

  if (args.includeImages) {
    printReport(projectRoot, 'Image optimization', imageResults);
  }

  if (!args.write) {
    console.log('\n[optimize-assets] Dry-run complete. Re-run with --write to apply changes.');
  } else {
    console.log('\n[optimize-assets] Optimization complete.');
  }
}

main().catch((error) => {
  console.error('[optimize-assets] Failed:', error);
  process.exitCode = 1;
});
