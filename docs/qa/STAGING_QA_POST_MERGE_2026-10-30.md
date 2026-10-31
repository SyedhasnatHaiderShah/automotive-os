# Staging QA after PR #35 merge — 2026-10-30

Main at `468abb8` (PR #35). Checked in the built-in browser and with HTTP probes against Railway staging, signed out. Signed-in buyer, dealer and admin flows were **NOT RUN**: no test credentials are available to the agent, and it does not enter passwords.

## Deployment state

| Service | Running current code? | Evidence |
|---|---|---|
| API | Yes | Restarted about 9 minutes after the merge (uptime check). `GET /api/v1/public/listings` now returns `gccSpec`. |
| Marketplace | Yes | `/cars` shows "Save this search", home shows All/New/Used tabs and a real hero listing. |
| Dealer | **No — stale** | Every `/dealer/*` path returns a prerendered, CDN-cached not-found page (HTTP 200, `x-nextjs-prerender: 1`, `x-nextjs-cache: HIT`) when signed out, instead of a 307 to login. With a dummy cookie, `/dealer/inventory` renders the original pre-audit "Inventory Service Unavailable — TENANT_CONTEXT_REQUIRED" page. `/dealer/api/health` reports `environment: production`, while `docker/Dockerfile.dealer` sets `NODE_ENV=staging`, so Railway is not deploying this service from the repo's current Dockerfile/branch. |
| Admin | Unknown | Behind Basic Auth (401). |

## Results (signed out)

| Check | Result |
|---|---|
| `/cars` lists all published stock with no default GCC or price cap (MK-03) | PASS: 2 of 2 listings shown, no filter chips active |
| GCC badges come from data (MK-01) | PASS: both listings are GCC in the API and show the badge |
| Storefront GCC filter count (MK-02) | PASS: "GCC spec (1)" on `/dealers/gargash-autos` |
| Home hero uses a real listing, tabs All/New/Used (MK-15, MK-16) | PASS |
| "Save this search" signed out redirects to login with return path (MK-17) | PASS: `/auth?tab=login&redirect=%2Fcars` |
| `/account/*`, `/dashboard` signed out redirect to login | PASS: 307 with redirect param |
| Response times | PASS: 0.55–0.92 s for all probed routes |
| Unknown `/cars/<slug>` and `/dealers/<slug>` | PARTIAL: not-found page renders, but HTTP status is 200 (soft 404) |
| Vehicle images | FAIL (known config): `/api/v1/public/media/...` returns 404. Set `S3_PUBLIC_CDN_URL` or `PUBLIC_API_URL` on the API, and make sure the objects exist in the bucket. |
| Dealer console (DL-*, MK-05 landing) | BLOCKED: dealer service is stale (see above) |
| Consent migration | NOT RUN: waiting on `prisma migrate deploy` against staging |

## Retest — 2026-10-31 12:13 UTC
- Dealer service: **still stale**. `/dealer/*` returns the same prerendered, cached not-found page (`x-nextjs-prerender: 1`, `s-maxage=31536000`). With a dummy cookie, `/dealer/inventory` still renders the pre-audit "TENANT_CONTEXT_REQUIRED" page, and `/dealer/api/health` still reports `environment: production`.
- API: uptime 62,248 s (about 17 h), so no redeploy since the PR #35 deploy.
- Consent migration: cannot be confirmed from outside. It needs either a signed-in buyer settings check or `prisma migrate status` against the staging database.

## New findings
- **QA-POST-01 (Critical, deploy):** the staging dealer service is not running current `main`. Check the Railway dealer service's source branch, root directory or Dockerfile path, and the latest build logs. Then redeploy and purge the cached not-found page.
- **QA-POST-02 (Low):** soft 404s on unknown listing or dealer slugs (the `loading.tsx` streaming boundary commits a 200 before `notFound()` runs).
- **QA-POST-03 (Low):** the storefront metadata says "Dubai" for a Sharjah dealer (known MK Low; falls back to Dubai when there is no branch).

## Root cause — QA-POST-01 (dealer stale)
- Railway dealer service: builder Railpack, branch `main`, start `pnpm --filter dealer start`, **healthcheck path `/dealer`**, timeout 120 s.
- The PR #34 and PR #35 deploys both **failed at the Network › Healthcheck step**. The active deployment is still PR #31, which has the pre-audit dealer code.
- Why: since PR #34 the dealer middleware gates `/dealer` behind `ao_session`. Railway's healthcheck sends no cookie and no `Accept: text/html`, so it gets 401 JSON and the deploy fails. Admin (PR #35) and marketplace deployed fine.
- Fix: set the dealer healthcheck path to `/dealer/api/health` (route `apps/dealer/app/api/health`, excluded from the middleware matcher), then redeploy the latest `main` commit.

## Closure — 2026-10-31

| ID | Status | Resolution |
|---|---|---|
| QA-POST-01 | **Closed** | Railway dealer healthcheck path changed from `/dealer` to `/dealer/api/health`, so the PR #35 build deployed. That exposed a middleware 500 (relative `Location` rejected by Next.js), fixed in PR #37. Staging now: signed-out `/dealer`, `/dealer/inventory`, `/dealer/leads` and `/dealer/finance` return 307 to `/auth?tab=login&redirect=…` on the marketplace origin; non-HTML requests get 401; a stale cookie shows the "session expired" card. |
| QA-POST-02 | **Closed** (this PR) | The root, `/cars` and `/cars/[slug]` `loading.tsx` boundaries flushed a 200 before `notFound()`. They were removed. `generateMetadata` now throws `notFound()` for unknown slugs, and the pages that read `useSearchParams` (`/auth`, `/access-denied`, `/access-suspended`) have their own `<Suspense>`. Local production build against the staging API: unknown car and dealer slugs return **404** for browsers and Googlebot; valid pages return 200. |
| QA-POST-03 | **Closed** (this PR) | Root cause was not the fallback. `runWithDbContext` returned a lazy Prisma promise that was awaited outside the AsyncLocalStorage scope, so the public dealer detail ran without RLS context: `branches: []`, `liveGroundedStock: 0`, no verification block. `runWithDbContext` now awaits inside the scope (regression test `src/database/run-with-db-context.spec.ts` fails without the fix). The metadata no longer invents "Dubai" when a dealer has no branch. |
| Vehicle images 404 | **Closed as data, not code** | `/api/v1/public/media/...` resolves the DB row and then returns "Object key does not exist in storage bucket". The seeded media rows point at objects that were never uploaded to the staging R2 bucket. The UI shows its "Vehicle image not available" fallback. Uploading staging images is an external-asset action that needs explicit approval. |
| Consent migration | **Open (owner action)** | Cannot be verified from outside. Run `npx prisma migrate status` against the staging database, or check a signed-in buyer's settings. |
| Signed-in flows | **Open (needs credentials)** | Buyer, dealer and admin signed-in QA need a person to sign in in the browser pane. |

Checks for this PR: API typecheck PASS; API jest 28 suites, 254/254 PASS (one earlier run had 2 timing-related outbox failures that pass alone and on rerun); marketplace typecheck and `next build` PASS; local `next start` status checks as above.
