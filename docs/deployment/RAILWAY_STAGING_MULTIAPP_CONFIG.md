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

**Railway API limitation (verified 2026-10-26):** Railway rejects setting
`railwayConfigFile` for legacy JSON config with
`Config as Code is deprecated. Use Infrastructure as Code`. The three JSON
files therefore serve as independently checked-in **per-app build/start/health
configuration templates and CI contracts**, not as actively selected Railway
Config File Paths. Do not claim that the live services are reading these files.

The working staging implementation is:
1. Root `railway.json` has only `$schema`, with no `build` or `deploy`
   override. This removes the erroneous global NestJS Docker build.
2. Existing **per-service Railway settings** explicitly select `RAILPACK`,
   pnpm workspace build/start commands and `/api/health` for all three
   frontends. These settings were independently verified via Railway API.
3. **Root Directory remains `/`** for each service so all workspace packages
   and `pnpm-lock.yaml` are available. Do not set Root Directory to an
   individual `/apps/<app>` folder just to locate its config: that can
   remove the monorepo workspace from the build context.
4. Keep the existing explicit `DOCKERFILE` builder and `/health`
   endpoint for `automotive-api`.

For durable code-managed Railway settings, migrate with Railway's replacement
`.railway/railway.ts` Infrastructure-as-Code system. Railway requires one
project-level authoring file for a monorepo. Review a **non-destructive plan**
against the existing project, including Postgres and buckets, before enabling
IaC or applying any changes. Do not attempt an unsupported Config File Path
update or claim these JSON files are applied automatically.

### Staging release procedure

1. Ensure GitHub CI has passed `node scripts/verify-railway-staging-config.mjs`
   (plus the existing typecheck, API/RLS tests, monorepo build).
2. Verify each of the **three existing Railway frontend service
   settings** matches its per-app JSON contract (RAILPACK, build command,
   start command, `/api/health`) and stage only their source commit
   updates to the common verified Git SHA. No config-path updates.
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
