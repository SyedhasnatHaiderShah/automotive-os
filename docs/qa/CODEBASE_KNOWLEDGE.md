# Codebase Knowledge Baseline (pre-QA audit, 2026-10-30)

Branch: `feature/cf07-unified-auth-rbac` @ `b1295f6`. Built from code inspection + docs. Items marked
"verified" were confirmed by reading the code; everything else is from a survey and must be confirmed during QA.

## 1. Topology

| Unit | Path | Port | Notes |
|---|---|---|---|
| Marketplace (gateway) | `apps/marketplace` | 3000 | Next 15 App Router. Rewrites `/dealer/*`→3001, `/admin/*`→3002, `/api/*`→4000 (`next.config.mjs`). |
| Dealer DMS | `apps/dealer` | 3001 | `basePath: '/dealer'`. No middleware / auth guard. |
| Platform admin | `apps/admin` | 3002 | `basePath: '/admin'`. `middleware.ts` session + verify-admin-session; auth skipped on localhost dev unless `ADMIN_AUTH_ENFORCED=true`. |
| API | `apps/api` | 4000 | NestJS 10, no global prefix; controllers hard-code `api/v1/...`. Swagger `/api/docs`. |
| DB | `packages/database` | 5432 | Prisma 6.4, Postgres 16, RLS (`tenant_policies.sql`), 6 migrations, seed. |
| UI kit | `packages/ui` | – | Tokens + components; used by marketplace only. Tailwind preset unused. |
| Contracts | `packages/contracts` | – | `UserRole` enum does not match Prisma `MembershipRole`. Barely used. |

Local run: `docker compose up -d` → `pnpm install` → database `prisma:deploy`, `init:role`, `apply:policies`, `seed` → `pnpm run dev`.
Admin bootstrap: `scripts/bootstrap-platform-admins.ts` (activation link + TOTP; no default passwords).
E2E: `pnpm exec playwright test -c tests/e2e/playwright.config.ts` (1440/1024/390). Stitch parity: `tests/stitch-parity`.

Seed accounts: tariq@alfuttaim-prestige.ae (OWNER, Dubai tenant), zayd@gargash-autos.ae (OWNER, Sharjah tenant),
rashid.buyer@example.ae, fatima.buyer@example.ae (buyers), admin@autonexa.ae (platform admin).

## 2. Auth / tenancy model

- HS256 JWT (`JWT_SECRET`) from Bearer header or `ao_session` httpOnly cookie (Lax, 7d). Login creates `Session` row.
- `JwtAuthGuard` is per-controller (not global). Tenant only from route param `:tenantId` via `TenantAccessGuard`
  (active membership + ACTIVE tenant); `@RequireRoles` on `MembershipRole`. Platform admin bypasses as OWNER.
- Prisma `$extends` `$allOperations` sets `app.tenant_id` / `app.user_id` / `app.is_admin` per op in its own transaction.
- `/dashboard` resolver: admin → `/admin`, dealer role → `/dealer/...`, buyer → `/account/garage`.

## 3. Defect candidates for the QA audit

### API / security
- A1 (verified) `auth.service.ts:186` session revocation check runs only if JWT has `sessionId`; no `session.userId == user.id` check.
- A2 `validateOidcPayload` auto-provisions ACTIVE buyer for unknown `sub`.
- A3 JWT strategy accepts `HS256` and `RS256` with symmetric secret; `iss`/`aud` only checked when present.
- A4 Public listing/dealer/media reads run with `isAdmin:true` DB context (RLS bypass for public reads).
- A5 Missing `GET /api/v1/public/dealers` list endpoint while marketplace has `/dealers`.
- A6 Audit write failures swallowed; enquiry rate limiter and search projection in-memory; outbox `startWorker()` never called.

### Database
- D1 (verified shape, runtime unverified) `prisma.service.ts:51-72` wraps every op in a new `base.$transaction`;
  services that call `prisma.$transaction(tx => ...)` likely lose atomicity (audit + outbox "same transaction" rule).
- D2 `packages/contracts` roles diverge from Prisma `MembershipRole`.
- D3 Request DTO money fields are JS `number` (safe-int limit) while DB is BigInt fils.

### Data flow (frontend → API)
- F1 (verified) `apps/marketplace/lib/api.ts` buyer functions call dev `POST /api/v1/auth/token` with a hardcoded
  persona (lines 642, 1280, 1351, 1542, 1635, 1865, 1932, 2011, 2043, 2168) instead of the user session.
- F2 Ungated fixture fallbacks in marketplace (dealer storefront, enquiries, appointments, saved, favorites, profile);
  mutations return `true` on failure.
- F3 (verified) Dealer P1 pages (sales, workshop, parts, finance, accounting, fleet, export) initialise from
  `VERIFIED_*_FIXTURE` constants — 100% fixture data.
- F4 Dealer inventory/leads called without auth token; default tenant UUID `1111...`; `createDealerVehicle` uses
  `/api/v1/inventory/vehicles` (non-tenant path) and hardcoded media URL. Dead sessionStorage token.
- F5 Admin disputes/moderation/verifications initialise from mocks; moderation and KYB queues hardcoded lists;
  `executeDisputeAdjudication` fakes success.
- F6 Two auth models on the client: localStorage `ao_token` plus `ao_session` cookie. Dealer app has no login guard.
- F7 (verified) No `middleware.ts` in marketplace or dealer: `/account/*`, `/dashboard`, all `/dealer/*` unguarded server-side.

### Design
- G1 No i18n library: per-page `isRtl` toggle, `<html lang="en">` fixed, choice not persisted; RTL coverage partial.
- G2 Tokens duplicated across three `tailwind.config.js`; `packages/ui` preset unused; dealer/admin skip `@automotive-os/ui`.
- G3 Stitch parity NOT VERIFIED (CF06 diffs 70–90%). S27–S31 acceptance text describes fabricated values
  (AECB 842/900, AED 8.95M valuation, "live security metrics") that conflict with `INTEGRATION_TRUTH_TABLE.md`.

### Process
- `SCREEN_COVERAGE.csv` marks S01–S31 VERIFIED/PASS despite fixture-backed screens above; must be re-graded with proof.
- `lint` and app `test` scripts are `echo` stubs → CI false green.
- Doc contradictions: last-admin 400 vs 409, activation expiry 24h vs 72h, password min 8/10/12, role lists.
