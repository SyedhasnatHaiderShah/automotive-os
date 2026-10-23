const { spawnSync } = require('child_process');
const path = require('path');

const scripts = [
  'verify-s01.js',
  'verify-s02-s03.js',
  'verify-s04.js',
  'verify-s05.js',
  'verify-s06.js',
  'verify-s07.js',
  'verify-s08.js',
  'verify-s09.js',
  'verify-s10.js',
  'verify-s11.js',
  'verify-s12.js',
  'verify-s13.js',
  'verify-s14.js',
  'verify-s15.js',
  'verify-s16.js',
  'verify-s17.js',
  'verify-s18.js',
  'verify-s19.js',
  'verify-s20.js',
  'verify-s21.js',
  'verify-s22.js',
  'verify-s23.js',
  'verify-s24.js',
  'verify-s25.js',
  'verify-s26.js',
  'verify-s27.js',
  'verify-s28.js',
  'verify-s29.js',
  'verify-s30.js',
];

console.log('========================================================================');
console.log('Automotive OS — Running Playwright Verification Suite for All Screens');
console.log('========================================================================\n');

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n>>> Executing node ${script}...`);
  const startTime = Date.now();
  const run = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = run.status === 0;

  if (passed) {
    totalPassed++;
    console.log(`<<< [PASS] ${script} completed successfully in ${duration}s.`);
  } else {
    totalFailed++;
    console.error(`<<< [FAIL] ${script} exited with code ${run.status} in ${duration}s.`);
  }

  results.push({ script, passed, code: run.status, duration: `${duration}s` });
}

console.log('\n========================================================================');
console.log('VERIFICATION SUMMARY');
console.log('========================================================================');
results.forEach(r => {
  console.log(`${r.passed ? '[PASS]' : '[FAIL]'} ${r.script.padEnd(25)} (code: ${r.code}, duration: ${r.duration})`);
});
console.log('========================================================================');
console.log(`Total Scripts: ${scripts.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
console.log('========================================================================\n');

process.exit(totalFailed === 0 ? 0 : 1);
