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
