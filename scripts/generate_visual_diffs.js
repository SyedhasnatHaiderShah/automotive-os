const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default || pixelmatchModule;

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

function loadPNG(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }
    const stream = fs.createReadStream(filePath).pipe(new PNG());
    stream.on('parsed', () => resolve(stream));
    stream.on('error', err => reject(err));
  });
}

async function compareImages(img1Path, img2Path, diffPath) {
  try {
    const img1 = await loadPNG(img1Path);
    const img2 = await loadPNG(img2Path);

    // Normalize width and height for comparison
    const width = Math.min(img1.width, img2.width, 1440);
    const height = Math.min(img1.height, img2.height, 2000); // Compare first 2000px viewport/scroll

    const canvas1 = new PNG({ width, height });
    const canvas2 = new PNG({ width, height });
    const diff = new PNG({ width, height });

    PNG.bitblt(img1, canvas1, 0, 0, width, height, 0, 0);
    PNG.bitblt(img2, canvas2, 0, 0, width, height, 0, 0);

    const numDiffPixels = pixelmatch(
      canvas1.data,
      canvas2.data,
      diff.data,
      width,
      height,
      { threshold: 0.15, includeAA: false }
    );

    const totalPixels = width * height;
    const diffRatio = numDiffPixels / totalPixels;
    const parityScore = Math.max(0, Math.round((1 - diffRatio) * 100));

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    return {
      success: true,
      comparedArea: `${width}x${height}`,
      numDiffPixels,
      diffRatio: diffRatio.toFixed(4),
      parityScore
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

async function main() {
  const refDir = path.join(__dirname, '../docs/qa/cf06/references');
  const impDir = path.join(__dirname, '../docs/qa/cf06/implemented');
  const diffDir = path.join(__dirname, '../docs/qa/cf06/diffs');

  const csv = fs.readFileSync('docs/implementation/STITCH_SCREEN_MAP.csv', 'utf8');
  const lines = csv.trim().split('\n').filter(Boolean).slice(1);
  const map = lines.map(l => {
    const p = parseCSVLine(l);
    return { id: p[0], name: p[1], stitchId: p[3] };
  });

  console.log(`Starting Visual Parity comparison for ${map.length} screens...`);

  const results = [];

  for (const item of map) {
    const refPng = path.join(refDir, `${item.id}-stitch-original.png`);
    const impPng = path.join(impDir, `${item.id}-${item.id === 'S03' ? 'mobile_390' : 'desktop_1440'}.png`);
    const diffPng = path.join(diffDir, `${item.id}-diff.png`);

    console.log(`Comparing ${item.id} (${item.name})...`);

    if (!fs.existsSync(impPng)) {
      console.log(`  -> Implemented screenshot missing for ${item.id} (status: BLOCKED or protected)`);
      results.push({
        id: item.id,
        name: item.name,
        status: 'BLOCKED_CAPTURE',
        parityScore: 0,
        notes: 'Target was blocked by auth gate or deployment routing'
      });
      continue;
    }

    const diffResult = await compareImages(refPng, impPng, diffPng);
    if (diffResult.success) {
      console.log(`  -> Score: ${diffResult.parityScore}% (diff pixels: ${diffResult.numDiffPixels})`);
      results.push({
        id: item.id,
        name: item.name,
        status: diffResult.parityScore >= 85 ? 'HIGH_PARITY' : (diffResult.parityScore >= 60 ? 'PARTIAL_PARITY' : 'DEVIATION_DETECTED'),
        parityScore: diffResult.parityScore,
        diffPixels: diffResult.numDiffPixels,
        diffRatio: diffResult.diffRatio,
        diffImage: `${item.id}-diff.png`
      });
    } else {
      console.log(`  -> Comparison error: ${diffResult.error}`);
      results.push({
        id: item.id,
        name: item.name,
        status: 'COMPARISON_ERROR',
        parityScore: 0,
        error: diffResult.error
      });
    }
  }

  const outJson = path.join(__dirname, '../docs/qa/cf06/visual-diff-summary.json');
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nVisual comparison finished! Written to ${outJson}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
