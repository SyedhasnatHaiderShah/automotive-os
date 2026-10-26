# Railway Staging — Multi-app configuration

All four application services use the same repository root, but different runtimes.
The former root `railway.json` specified `docker/Dockerfile.api`, `node apps/api/dist/src/main.js` and `/health` globally.
Railway config-as-code **overrides** dashboard service settings, so that configuration caused
Marketplace/Dealer/Admin deployments to build the **API Docker image** and fail
their Next.js `/api/health` checks. This was observed in Railway deployment
`8e3b2343-f6c5-4ce6-af93-6858ec815686` on 2026-10-26.

The root `railway.json` now specifies no build or deploy override. Existing
staging Railway service settings are authoritative:

| Service | Builder | Build command | Start command | Health |
|---|---|---|---|---|
| automotive-marketplace | RAILPACK | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter marketplace... build` | `pnpm --filter marketplace start` | `/api/health` |
| automotive-dealer | RAILPACK | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter dealer... build` | `pnpm --filter dealer start` | `/api/health` |
| automotive-admin | RAILPACK | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter admin... build` | `pnpm --filter admin start` | `/api/health` |
| automotive-api | DOCKERFILE (`docker/Dockerfile.api`) | API Dockerfile pipeline | `pnpm --filter api start:prod` | `/health` |

Staging Railway project: `c1443852-2c86-493c-a3c3-b408f32ed023`.
Staging environment: `07169f66-aacd-40b7-bb6a-bf44047216d1`.

**Do not configure API Dockerfile or /health globally.**
Deploy a single immutable GitHub SHA to all four app services; verify each
service's resolved builder in its own build logs. PostgreSQL volume and
database must not be recreated, reconfigured or seeded during a frontend
build-only repair.

Note: Railway has announced legacy Config as Code deprecation, with a
2026-12-01 hard cutoff. Plan the eventual migration to supported
Infrastructure as Code, without changing these staging services here.

**Release checklist:** confirm CI is green; API /health, public listing
catalog and details; three frontend /api/health routes; authenticated
and denied admin checks; marketplace search and pagination; dealer /inventory;
Arabic RTL; 404, error, empty and retry states. Record service deployment
IDs and SHA, not just green status. Use synthetic staging data only.

## Per-service Railway config files (October 26 fix)

The source-of-truth app configs are committed **in each Next.js app**:

| Railway service | Config file path in Railway | App port | App health |
|---|---|---|---|
| automotive-marketplace | `/apps/marketplace/railway.json` | 3000 | `/api/health` |
| automotive-dealer | `/apps/dealer/railway.json` | 3001 | `/api/health` |
| automotive-admin | `/apps/admin/railway.json` | 3002 | `/api/health` |

In Railway > each service > Settings > **Config File Path**, use the exact
absolute repository paths above. Set **Root Directory** to `/` for all three
so the pnpm workspace packages and root lockfile remain available. Config File
Path is **not** the same as Root Directory.

Each file explicitly uses `RAILPACK` (no Dockerfile), the app-specific
pnpm build and start commands, and its own healthcheck. Railway's config-as-code
settings override dashboard settings; therefore **pointing the three services
at these paths is mandatory**. Merely committing the files does not change
which config Railway reads. Retain the existing explicit DOCKERFILE setting
on `automotive-api`; it continues to use `docker/Dockerfile.api` and `/health`.

### Staging release procedure

1. Ensure GitHub CI has passed `node scripts/verify-railway-staging-config.mjs`
   (plus the existing typecheck, API/RLS tests, monorepo build).
2. Stage only the frontend three services' `railwayConfigFile` settings
   to their per-app config paths and a common verified Git SHA.
3. Inspect `get_staged_changes`: no Postgres/volume, bucket, API, secrets,
   nameservers or production changes.
4. Deploy the staged frontend revision after user authorization; check each
   deployment's actual builder and build output. It **must** say RAILPACK,
   and the resulting container **must** run `next start -p` on its app port,
   not the NestJS API.
5. Assert HTTP 200 for each `/api/health`, Railway SUCCESS, main page and
   dealer `/inventory`; ensure admin is HTTP 401 when unauthenticated and
   works with authorized credentials. Verify database/API are unaffected.

### Regression prevention

`scripts/verify-railway-staging-config.mjs` refuses a reintroduced root
`build` or `deploy` override, a frontend Docker builder, a wrong pnpm
package filter, a wrong health endpoint or missing frontend health route.
