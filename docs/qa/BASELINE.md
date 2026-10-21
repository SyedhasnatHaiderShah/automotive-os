# Baseline Verification Report — Automotive OS

**Date (UTC):** 2026-10-21 05:40:00  
**Git Checkpoint:** `b317aff8291b46cfc8fc196fa12d936b5064ea23` (`checkpoint-mvp-search-sync`)  
**Branch:** `main`  
**Node.js:** v24.11.1  
**Stitch Project ID:** `4467699827252507387` (Connected via MCP, 26 screens mapped)

---

## 1. Discovered Scripts & Commands

| Workspace / Package | Command | Tool | Purpose | Baseline Exit Code |
|---|---|---|---|---|
| Monorepo Root | `pnpm run lint` | Turbo / Shell | Code quality and linting | `0` (PASS) |
| Monorepo Root | `pnpm run typecheck` | Turbo / `tsc --noEmit` | Monorepo TypeScript verification | `0` (PASS) |
| Monorepo Root | `pnpm run test` | Turbo / Jest / tsx | Unit, integration, RLS suites | `0` (PASS) |
| Monorepo Root | `pnpm run build` | Turbo / Next.js / Nest | Production build compilation | `0` (PASS) |
| `apps/api` | `pnpm --filter api test` | Jest (`--runInBand`) | API contracts, tenancy, outbox | `0` (PASS) |
| `packages/database` | `npx -y tsx test/rls-isolation.test.ts` | Node / Prisma / pg | PostgreSQL RLS negative tests | `0` (PASS) |
| `packages/database` | `npx -y tsx prisma/seed.ts` | Prisma Seed | Dev PostgreSQL baseline seed | `0` (PASS) |

---

## 2. Baseline Check Results

### 2.1 Monorepo Typecheck (`pnpm run typecheck`)
- **Status:** **PASS** (10/10 tasks successful)
- **Packages:** `marketplace`, `dealer`, `admin`, `api`, `@automotive-os/contracts`, `@automotive-os/database`, `@automotive-os/ui`, `@automotive-os/config`.
- **Diagnostic output:** 0 errors.

### 2.2 Monorepo Tests (`pnpm run test`)
- **Status:** **PASS** (10/10 tasks successful)
- **API Tests (`apps/api`):** 7 test suites, 87/87 tests passed.
  - `auth-tenancy.spec.ts`: OIDC auth, buyer identity, dealer membership, cross-tenant denial (PASS)
  - `inventory-listings.spec.ts`: Vehicle inventory CRUD, media upload, listing moderation, publish gate (PASS)
  - `buyer-leads-grants.spec.ts`: Buyer profiles, saved searches, vehicle enquiries, field-level grants, revocation (PASS)
  - `outbox-search-sync.spec.ts`: Transactional outbox, search projection indexing, automatic unpublish on sold/suspended (PASS)
  - `tenant-access.guard.spec.ts`: Tenancy guard unit tests (PASS)
  - `platform-admin.guard.spec.ts`: Platform admin guard unit tests (PASS)
  - `health.controller.spec.ts`: Health check probe (PASS)
- **Database Multi-Tenancy & RLS Tests (`packages/database`):** 16/16 tests passed.
  - Composite FK branch & lead-listing rejection: PASS
  - Dealer A vs Dealer B cross-tenant isolation (CRUD denial): PASS
  - Buyer A vs Buyer B profile privacy: PASS
  - Public redacted projection & sold vehicle exclusion: PASS
  - Platform admin cross-tenant inspection with audit: PASS

### 2.3 Monorepo Production Build (`pnpm run build`)
- **Status:** **PASS** (7/7 build tasks successful)
  - `apps/marketplace`: Next.js 15 App Router static & dynamic route compilation (PASS)
  - `apps/dealer`: Next.js 15 App Router static & dynamic route compilation (PASS)
  - `apps/admin`: Next.js 15 App Router static & dynamic route compilation (PASS)
  - `apps/api`: NestJS CLI production distribution (PASS)
  - `@automotive-os/contracts`, `@automotive-os/database`, `@automotive-os/ui`: TypeScript declarations (PASS)

---

## 3. Database & Tenancy State

- **Engine:** PostgreSQL 16 (Local Development)
- **Applied Migration:** `20261020000000_init_tenancy_inventory`
- **RLS Configuration:**
  - Row Level Security enabled on: `tenants`, `branches`, `dealer_verifications`, `memberships`, `vehicles`, `vehicle_media`, `listings`, `leads`, `lead_data_grants`, `appointments`, `subscriptions`, `audit_events`, `outbox_events`, `buyer_profiles`, `buyer_favorites`, `saved_searches`.
  - Non-bypass role `app_user` with transaction-scoped `SET LOCAL app.current_tenant_id` and `SET LOCAL app.current_user_id`.
- **Baseline Seed Entities:**
  - Tenant A (Dubai): Al Futtaim Prestige Motors LLC (ACTIVE, APPROVED)
  - Tenant B (Sharjah): Gargash Emirates Autos FZCO (ACTIVE, APPROVED)
  - Buyer A: Rashid Al-Maktoum (Arabic, Dubai)
  - Buyer B: Fatima Al-Nuaimi (English, Sharjah)
  - Platform Admin: Maryam Al-Sabah (`admin@autonexa.ae`)

---

## 4. Stitch Design MCP Audit & Mapping Summary

- **Stitch Project:** `projects/4467699827252507387` ("Automotive OS Design System")
- **Total Screens Enumerated:** 26 (All 26 screens mapped 1:1 in `docs/implementation/STITCH_SCREEN_MAP.csv`)
- **Design Theme Alignment:**
  - **Public Marketplace:** Obsidian Dark Mode (`#101419` base, `#d4af37` gold, Outfit + Inter). Implemented in `apps/marketplace`.
  - **Dealer DMS & Admin:** Light Studio Glass (`#f8fafc` canvas, white glass cards, `#0f172a` slate). Implemented in `apps/dealer` and `apps/admin`.
  - **Mismatch Status:** 0 conflicting design themes detected between approved Stitch assets and active components.

---

## 5. Screen Coverage Metrics

| Cohort | Total Screens | IMPLEMENTED_UNVERIFIED | MISSING | VERIFIED |
|---|---|---|---|---|
| **P0 (S01–S16)** | 16 | 10 | 6 | 0 |
| **P1 (S17–S26)** | 10 | 0 | 10 | 0 |
| **Total** | **26** | **10** | **16** | **0** |

*Note: Per `docs/implementation/QA_GATES.md`, screens are classified as `IMPLEMENTED_UNVERIFIED` until automated browser visual comparison (screenshot-diff) and Playwright E2E journey proofs are generated in `docs/qa/evidence/`.*
