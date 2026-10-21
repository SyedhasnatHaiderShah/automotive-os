# Automotive OS — Project Status

**Date:** 2026-10-20  
**Phase:** Inception & Architectural Audit (Sprint 0 / Pre-Scaffold)  
**Target Market:** UAE (Dubai & Sharjah pilot, all seven emirates), internationalization-ready (English & Arabic RTL, AED currency, Asia/Dubai timestamps).

---

## 1. Current Repository State

- **Scaffolding:** No application runtime code, monorepo tooling, or package configurations (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) exist yet.
- **Specification & Documentation Assets:**
  - `AGENTS.md`: Workspace rules, domain isolation policies, multi-tenancy requirements, currency handling, and deliverable reporting constraints.
  - `docs/PRODUCT_BRIEF.md`: Core product baseline, 3-app architecture, UAE scope, P0 MVP scope, and UI direction.
  - `docs/decisions/ADR-0001-proposed-stack.md`: Architectural proposal (pnpm + Turborepo, Next.js, NestJS, Prisma + Postgres RLS, BullMQ + Redis, S3-compatible storage). Status: `PROPOSED`.
  - `docs/design/DESIGN_HANDOFF.md`: Stitch design registry template (all screen IDs, token sets, and exports currently marked `TBD`).
  - `docs/references/`: Non-production reference materials including `FRD_v2.1_UAE.docx`, `UAE_Implementation_Backlog.xlsx`, `db_starter/schema.prisma` (draft 20 models), `tenant_policies.sql`, and `engineering/` docs.
  - `prompts/`: Structured step-by-step audit, stitch design, and implementation prompt packs.

---

## 2. Agreed Architecture & Conventions

### Stack & Monorepo Structure
- **Package Manager & Workspaces:** `pnpm` workspaces + `Turborepo`.
- **Applications:**
  - `apps/marketplace`: Next.js (App Router, Tailwind CSS, buyer vehicle search, comparison, and lead engagement).
  - `apps/dealer`: Next.js (App Router, Tailwind CSS, dealer DMS inventory, leads, pipeline, branch management).
  - `apps/admin`: Next.js (App Router, platform administration, dealer KYB approval, listing moderation, audit).
  - `apps/api`: NestJS modular-monolith (OpenAPI/Swagger, REST API, modular domain structure).
- **Shared Packages:**
  - `packages/database`: Prisma schema, migration scripts, tenant-safe client extensions, seeder scripts.
  - `packages/contracts`: Shared TypeScript DTOs, API request/response types, validation schemas.
  - `packages/ui`: Shared React components, design tokens, RTL support.
  - `packages/config`: Shared TypeScript, ESLint, Tailwind configs.

### Core Domain & Data Isolation Rules
1. **Multi-Tenancy & Security:**
   - Every private dealer operational record MUST contain `tenant_id`.
   - Never trust body-supplied `tenant_id`; tenant identity is resolved strictly from validated auth context/session claims.
   - Dual-layer tenant isolation: NestJS tenant guards + composite unique/foreign keys (`tenant_id`, `id`) + PostgreSQL Row-Level Security (RLS) defense-in-depth with non-bypass application roles.
   - Cross-tenant denial must be explicitly validated in integration tests.
2. **Buyer Identity vs Dealer CRM:**
   - Global buyer identity is platform-owned, not dealer-owned.
   - Dealer receives only consent-gated, purpose-scoped lead contact fields for authorized inquiries.
   - Public listing view models are strictly redacted (no dealer acquisition cost, private dealer notes, or internal margin).
3. **Canonical Stock vs Moderated Listing Projection:**
   - Dealer inventory stock is the canonical system of record.
   - Public marketplace listings are moderated, approved read-model projections.
   - Status changes (`SOLD`, `SUSPENDED`, `ARCHIVED`) trigger reliable atomic outbox events to unpublish listings immediately.
4. **Data Formats & Standards:**
   - Financials: Smallest currency unit in integers (e.g. fils for AED: 100 AED = 10,000) with explicit currency code (`AED`).
   - Timestamps: Stored strictly in UTC; presented in `Asia/Dubai` timezone for user-facing surfaces.

---

## 3. Decisions: Accepted vs. TBD

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Monorepo & App Tech Stack** | **Accepted** (via ADR-0001 & Brief) | Turborepo + pnpm, Next.js App Router, NestJS modular monolith, PostgreSQL + Prisma, Redis + BullMQ. |
| **Market Scope & Currency** | **Accepted** | UAE-first (Dubai/Sharjah pilot), EN & AR (RTL), AED in integer minor units. |
| **Tenancy Isolation Model** | **Accepted** | Tenant ID on private entities, composite FKs, NestJS guard + Postgres RLS. |
| **Brand Identity** | **TBD** | `AutoNexa` is a placeholder name pending executive confirmation. |
| **Stitch Visual Handoff** | **Resolved** | `docs/design/DESIGN_HANDOFF.md` populated with 17 approved screens and exact tokens from Stitch project `4467699827252507387`. |
| **Legal & Regulatory Compliance** | **TBD** | External UAE legal review required for consumer privacy, lead consent language, and payment/escrow compliance before commercial deployment. |
| **Third-Party Integrations** | **TBD** | RTA vehicle history/registration, Emirates ID / UAE PASS verification, lender underwriting, and payment gateway partners deferred post-P0. |

---

## 4. Current Blockers

1. **Stitch Design Freeze:**
   - **Resolved**: All 17 production screen IDs, Obsidian & Studio Glass tokens, Arabic font pairings, and layout grids have been extracted and frozen in `docs/design/DESIGN_HANDOFF.md`.
2. **Database Migration Approval Gate:**
   - **Resolved**: Schema migrations 0001, 0002, and 0003 were successfully applied and verified on the local development PostgreSQL database with 16/16 RLS tests passing.
3. **Legal Compliance Review:**
   - External legal review required for UAE data privacy, consumer protection, and payment compliance before commercial deployment.

---

## 5. First P0 Implementation Slice

The initial vertical slice establishes the verified multi-tenant foundation without generating speculative application code:

- **Target Outcome:** A running Turborepo monorepo with `apps/api` and `packages/database`, establishing authenticated tenant context resolution and basic dealer inventory ingestion.
- **Slice Scope:**
  1. **Step 1 — Monorepo Scaffold:** Initialize `pnpm-workspace.yaml`, `turbo.json`, `package.json`, TypeScript base configs, and shared packages (`packages/database`, `packages/contracts`, `packages/config`).
  2. **Step 2 — Core Schema & Migration:** Create the initial tenant-aware schema in `packages/database` covering `Tenant`, `User`, `Membership`, `Role`, `Vehicle`, and `OutboxEvent`.
  3. **Step 3 — API Foundation & Tenant Guard:** Scaffold `apps/api` with NestJS, health check module, JWT/OIDC authentication middleware, and tenant context resolution interceptor.
  4. **Step 4 — Dealer Vehicle Inventory Service (CRUD):** Implement private inventory endpoints verifying strict `tenant_id` boundaries and composite FK integrity.
  5. **Step 5 — Automated Tenant Isolation & Outbox Tests:** Add unit and integration tests confirming cross-tenant access is rejected (`403/404`) and outbox events are emitted upon vehicle status changes.

---

## 6. Execution Plan & Current Progress

1. **Step 01:** Run prompt `prompts/stitch/01_DESIGN_FOUNDATION.md` through 08 in Stitch to generate, approve, and freeze UI tokens/screens; populate `docs/design/DESIGN_HANDOFF.md`. (**COMPLETED**)
2. **Step 02:** Execute `prompts/antigravity/02_SCAFFOLD.md` to bootstrap Turborepo, pnpm workspaces, and base package configurations. (**COMPLETED**)
3. **Step 03:** Execute `prompts/antigravity/03_DATABASE_DESIGN.md` to refine draft `schema.prisma` into production-ready schemas with composite keys and RLS policies. (**COMPLETED**)
4. **Step 04:** Execute `prompts/antigravity/05_AUTH_TENANCY.md` to implement tenant resolution, membership verification, and cross-tenant automated test suites. (**COMPLETED**)
5. **Step 05:** Execute `prompts/antigravity/06_INVENTORY_LISTINGS.md` to implement tenant-scoped vehicle inventory CRUD, private media upload pattern, dealer listing draft & submission, publish gates, admin approve/reject with audit & outbox, prompt unpublish sync on unavailable stock, and public redacted search/detail endpoints. (**COMPLETED - 51/51 API tests passing**)
6. **Step 06:** Implement CRM Leads, Purpose-Scoped Data Grants, Buyer Favorites, Saved Searches, Test-Drive Appointments & Revocation (`prompts/antigravity/07_BUYER_LEADS.md`). (**COMPLETED - 75/75 API tests passing**)
7. **Step 07:** Implement Design System UI package and component token primitives (`packages/ui`) and responsive Marketplace Home + Search Next.js pages (`apps/marketplace`) aligned with approved Stitch screens (`prompts/antigravity/08_DESIGN_SYSTEM_UI.md`). (**COMPLETED - Next.js production build verified**)
8. **Step 08 (Next):** Implement Remaining Frontend Slices for Dealer DMS and Platform Admin (`prompts/antigravity/09_FRONTEND_SLICES.md`).
