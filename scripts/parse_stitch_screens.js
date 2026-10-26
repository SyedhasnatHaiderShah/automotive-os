const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

const csv = fs.readFileSync('docs/implementation/STITCH_SCREEN_MAP.csv', 'utf8');
const lines = csv.trim().split('\n').filter(Boolean).slice(1);
const map = lines.map(l => {
  const p = parseCSVLine(l);
  return { id: p[0], name: p[1], stitch_id: p[3] };
});

const data = JSON.parse(fs.readFileSync('C:/Users/ShahM/.gemini/antigravity/brain/a1d66d10-c2ad-4fcd-b19b-4359e1c4b44c/.system_generated/steps/68/output.txt', 'utf8'));
const stitchScreens = data.screens;

map.forEach(m => {
  const found = stitchScreens.find(s => s.name.endsWith('/' + m.stitch_id));
  if (found) {
    console.log(m.id.padEnd(4), found.title.padEnd(48), (found.width + 'x' + found.height).padEnd(12), found.deviceType, m.stitch_id);
  } else {
    console.log(m.id.padEnd(4), 'NOT FOUND:', m.stitch_id);
  }
});

console.log('\n--- Extra screens in Stitch not in S01-S31 map: ---');
stitchScreens.forEach(s => {
  const sid = s.name.split('/').pop();
  const found = map.find(m => m.stitch_id === sid);
  if (!found) {
    console.log('Extra screen in project:', sid, s.title);
  }
});
