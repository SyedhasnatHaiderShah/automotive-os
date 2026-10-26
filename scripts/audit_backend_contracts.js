const fs = require('fs');
const path = require('path');
const https = require('https');

const STAGING_API = 'https://api-staging.syedhasnat.com';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, STAGING_API);
    const reqHeaders = {
      'User-Agent': 'AutomotiveOS-Contract-Auditor/1.0',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    const req = https.request(url, { method, headers: reqHeaders, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          path,
          method,
          status: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', (err) => {
      resolve({ path, method, status: 0, error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('Auditing API Contracts against Staging:', STAGING_API);

  const endpoints = [
    { method: 'GET', path: '/health', expectedStatus: 200, category: 'SYSTEM' },
    { method: 'GET', path: '/api/v1/public/listings', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/public/listings?emirate=Sharjah', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/public/listings?page=1&limit=5', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/public/dealers', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/public/dealers/gargash-autos', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/public/dealers/al-futtaim-prestige', expectedStatus: 200, category: 'BUYER' },
    { method: 'GET', path: '/api/v1/tenants/22222222-2222-2222-2222-222222222222/vehicles', expectedStatus: 401, category: 'DEALER_AUTH_GATE' },
    { method: 'GET', path: '/api/v1/tenants/22222222-2222-2222-2222-222222222222/leads', expectedStatus: 401, category: 'DEALER_AUTH_GATE' },
    { method: 'GET', path: '/api/v1/admin/listings', expectedStatus: 401, category: 'ADMIN_AUTH_GATE' },
    { method: 'GET', path: '/api/v1/admin/verifications', expectedStatus: 401, category: 'ADMIN_AUTH_GATE' },
    { method: 'POST', path: '/api/v1/auth/login', body: { email: 'invalid@example.com', password: 'bad' }, expectedStatus: 401, category: 'AUTH' }
  ];

  const results = [];

  for (const ep of endpoints) {
    console.log(`Testing ${ep.method} ${ep.path}...`);
    const res = await request(ep.method, ep.path, ep.body);
    const pass = res.status === ep.expectedStatus;
    console.log(`  -> Status: ${res.status} (Expected: ${ep.expectedStatus}) => ${pass ? 'PASS' : 'FAIL'}`);

    results.push({
      ...ep,
      actualStatus: res.status,
      pass,
      sampleResponse: typeof res.body === 'object' ? JSON.stringify(res.body).slice(0, 200) : String(res.body).slice(0, 200)
    });
  }

  const outPath = path.join(__dirname, '../docs/qa/cf06/api-contract-audit-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\nAudit complete! Results saved to:', outPath);
}

main().catch(console.error);
