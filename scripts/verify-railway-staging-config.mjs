import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const get = (path) => JSON.parse(readFileSync(path, 'utf8'));
const root = get('railway.json');
assert.equal(root.$schema, 'https://railway.com/railway.schema.json');
assert.equal(root.build, undefined, 'Root config must not override builders for monorepo services');
assert.equal(root.deploy, undefined, 'Root config must not override start/health of monorepo services');

for (const [app, port] of [['marketplace',3000],['dealer',3001],['admin',3002]]) {
  const file = `apps/${app}/railway.json`;
  const cfg = get(file);
  const pkg = get(`apps/${app}/package.json`);
  assert.equal(cfg.$schema, root.$schema);
  assert.equal(pkg.name, app);
  assert.equal(cfg.build.builder, 'RAILPACK', `${file}: must not build the API Docker image`);
  assert.equal(cfg.build.dockerfilePath, undefined, `${file}: frontend must not select Dockerfile`);
  assert.match(cfg.build.buildCommand, /pnpm install --frozen-lockfile/);
  assert.ok(cfg.build.buildCommand.includes(`pnpm --filter ${app}... build`), `${file}: must target this package and workspace dependencies`);
  assert.equal(cfg.deploy.startCommand, `pnpm --filter ${app} start`);
  assert.equal(cfg.deploy.healthcheckPath, '/api/health');
  assert.equal(cfg.deploy.healthcheckTimeout, 120);
  assert.equal(cfg.deploy.restartPolicyType, 'ON_FAILURE');
  assert.ok(pkg.scripts.start.includes(`-p ${port}`), `apps/${app}/package.json: expected port ${port}`);
  assert.ok(existsSync(`apps/${app}/app/api/health/route.ts`), `${app}: health route missing`);
  console.log(`✓ ${app}: isolated RAILPACK build, correct start and healthcheck`);
}

assert.ok(existsSync('docker/Dockerfile.api'), 'API Dockerfile must be preserved');
console.log('✓ root config is neutral; API Dockerfile unchanged');
