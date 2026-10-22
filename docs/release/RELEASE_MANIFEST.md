# Automotive OS — Monorepo Release Manifest

**Release Version:** `0.1.0-staging.1`  
**Git Checkpoint Commit:** `7659b67` (Clean working tree)  
**Target Environment:** Staging / Controlled Pilot (UAE Region: `me-central-1`)  
**Release Engineering Lead:** Autonomous Release Orchestrator (Antigravity)  
**Standard Governance:** [`docs/implementation/QA_GATES.md`](file:///h:/Personal/Automotiv%20OS/docs/implementation/QA_GATES.md) & [`docs/implementation/INTEGRATION_TRUTH_TABLE.md`](file:///h:/Personal/Automotiv%20OS/docs/implementation/INTEGRATION_TRUTH_TABLE.md)  
**Reference Design System:** Stitch Obsidian & Studio Glass (Project `4467699827252507387`, 26 Screens Mapped)

---

## 1. Monorepo Artifact Inventory

| Service / Package | Package Path | Runtime Stack | Target Port | Deployment Type | Primary Responsibility |
|---|---|---|---|---|---|
| **`marketplace`** | `apps/marketplace` | Next.js 15.5.28, React 19, TypeScript strict | `3000` | Node.js Server / Edge SSR | Public discovery, faceted search, comparisons, buyer garage, VIP enquiries. |
| **`dealer`** | `apps/dealer` | Next.js 15.5.28, React 19, TypeScript strict | `3001` | Node.js Server | Multi-tenant dealership SaaS, inventory, sales studio, workshop, parts, F&I, fleet, exception desks. |
| **`admin`** | `apps/admin` | Next.js 15.5.28, React 19, TypeScript strict | `3002` | Node.js Server | Platform operations command, KYB dealership verification, listing moderation, seller sanctions/disputes. |
| **`api`** | `apps/api` | NestJS 10.4.15, TypeScript strict | `4000` | Containerized Node.js Service | Modular monolith backend, OpenAPI Swagger (`/api/docs`), JWT auth, RBAC guards, transactional outbox processor. |
| **`@automotive-os/database`** | `packages/database` | Prisma ORM 6.19.3, PostgreSQL 16 | `5432` | Internal Shared Package | Database client, RLS policies (`tenant_policies.sql`), migrations, test suites. |
| **`@automotive-os/contracts`** | `packages/contracts` | TypeScript strict | N/A | Internal Shared Package | Shared domain contracts, DTOs, API error interfaces, health schemas. |
| **`@automotive-os/ui`** | `packages/ui` | React 19, Tailwind CSS 3.4.17 | N/A | Internal Shared Package | Obsidian Dark design tokens, Studio Glass components, RTL wrappers. |
| **`@automotive-os/config`** | `packages/config` | Tooling Configs | N/A | Internal Shared Package | Shared ESLint, Prettier, and TypeScript base configurations. |

---

## 2. Verified Screen Scope (26 / 26 Screens 100% PASS)

All 26 screens have been implemented, visually matched against Stitch exports, and verified across 1440px desktop, 1024px tablet, 390px mobile, and Arabic RTL viewports:

### 2.1 P0 Core Marketplace & Backoffice (16 / 16 Verified)
- **S01** — `apps/marketplace/app/page.tsx` (`/`) — Marketplace Home & Car Search (`VERIFIED`)
- **S02** — `apps/marketplace/app/cars/page.tsx` (`/cars`) — Search Results & Dealer Filters (`VERIFIED`)
- **S03** — `apps/marketplace/app/cars/page.tsx` (Mobile Overlay) — Mobile Filters Overlay Sheet (`VERIFIED`)
- **S04** — `apps/marketplace/app/compare/page.tsx` (`/compare`) — Vehicle Comparison Matrix (`VERIFIED`)
- **S05** — `apps/marketplace/app/cars/[slug]/page.tsx` (`/cars/[slug]`) — Listing Detail Dossier (`VERIFIED`)
- **S06** — `apps/marketplace/app/dealers/[slug]/page.tsx` (`/dealers/[slug]`) — Verified Dealer Storefront (`VERIFIED`)
- **S07** — `apps/marketplace/app/cars/[slug]/enquiry/page.tsx` (`/cars/[slug]/enquiry`) — VIP Enquiry Flow (`VERIFIED`)
- **S08** — `apps/marketplace/app/account/enquiries/page.tsx` (`/account/enquiries`) — Buyer Enquiry Timeline (`VERIFIED`)
- **S09** — `apps/marketplace/app/account/garage/page.tsx` (`/account/garage`) — Appointments & Virtual Garage (`VERIFIED`)
- **S10** — `apps/marketplace/app/account/saved/page.tsx` (`/account/saved`) — Saved Searches & Favorites (`VERIFIED`)
- **S11** — `apps/marketplace/app/account/profile/page.tsx` (`/account/profile`) — Buyer Privacy & Profile (`VERIFIED`)
- **S12** — `apps/dealer/app/dashboard/page.tsx` (`/dashboard`) — Dealer Executive Dashboard (`VERIFIED`)
- **S13** — `apps/dealer/app/inventory/page.tsx` (`/inventory`) — Vehicle Inventory Grid (`VERIFIED`)
- **S14** — `apps/admin/app/page.tsx` (`/`) — Platform Operations Command (`VERIFIED`)
- **S15** — `apps/admin/app/verifications/[id]/page.tsx` (`/verifications/[id]`) — KYB Dealer Verification (`VERIFIED`)
- **S16** — `apps/admin/app/moderation/listings/[id]/page.tsx` (`/moderation/listings/[id]`) — Moderation Desk (`VERIFIED`)

### 2.2 P1 Advanced Operations & Statutory Desks (10 / 10 Verified)
- **S17** — `apps/admin/app/disputes/page.tsx` (`/disputes`) — Seller Sanctions & Dispute Review (`VERIFIED`)
- **S18** — `apps/dealer/app/sales/page.tsx` (`/sales`) — Sales Orders & Quotations Studio (`VERIFIED`)
- **S19** — `apps/dealer/app/workshop/page.tsx` (`/workshop`) — Workshop Job Cards & Bay Calendar (`VERIFIED`)
- **S20** — `apps/dealer/app/parts/page.tsx` (`/parts`) — Parts Inventory & Procurement (`VERIFIED`)
- **S21** — `apps/dealer/app/finance/page.tsx` (`/finance`) — F&I Referral & Banking Desk (`VERIFIED`)
- **S22** — `apps/dealer/app/accounting/page.tsx` (`/accounting`) — FTA Tax Invoices & Settlement (`VERIFIED`)
- **S23** — `apps/dealer/app/fleet/page.tsx` (`/fleet`) — Fleet Accounts & Consignment (`VERIFIED`)
- **S24** — `apps/dealer/app/accounting/exception/export/page.tsx` — GCC Export & Customs Bond Desk (`VERIFIED`)
- **S25** — `apps/dealer/app/finance/exception/page.tsx` — F&I Subprime DBR Hard-Lock (`VERIFIED`)
- **S26** — `apps/dealer/app/fleet/exception/page.tsx` — Consignment Freeze & Injunction Desk (`VERIFIED`)

---

## 3. Integration Truth Flags & Runtime Mode

| External System | Designated Provider | Staging Mode | Feature Flag Setting | User-Facing Disclosure |
|---|---|---|---|---|
| **Digital Identity** | UAE PASS / OIDC | Simulated OIDC Adapter | `FEATURE_FLAG_UAE_PASS_LIVE=false` | "UAE PASS Sandbox Connection" badge; local fallback active. |
| **Commercial Registry** | UAE DED / Ministry of Economy | Manual Document Dossier | `FEATURE_FLAG_DED_LIVE=false` | Manual reviewer attestation log recorded with officer identity. |
| **Technical Inspection** | RTA Tasjeel / Emirates Transport | Attested Certificate Upload | `FEATURE_FLAG_RTA_TASJEEL_LIVE=false` | Inspection score displayed only when supported by uploaded PDF. |
| **VIN Integrity** | Commercial Registry (Carfax/Police) | Manual Risk Review Desk | `FEATURE_FLAG_VIN_REGISTRY_LIVE=false` | Review checklist active; no automated certified guarantee. |
| **Credit Scoring** | Al Etihad Credit Bureau (AECB) | Consent Capture Only | `FEATURE_FLAG_AECB_LIVE=false` | Live bureau query button disabled; referral tracking active. |
| **Bank Lending / DBR** | CBUAE Open Finance | Indicative Policy Engine | `FEATURE_FLAG_BANK_OFFERS_LIVE=false` | 50% DBR / 85% LTV calculated with indicative disclaimer. |
| **E-Invoicing** | FTA / Peppol BIS 3.0 | TLV QR & UBL XML Generator | `FEATURE_FLAG_FTA_PEPPOL_LIVE=false` | Valid Base64 TLV and XML exported in "Draft / Staging" mode. |
| **Escrow & Settlement** | Licensed UAE Custody Bank | Dispute State Machine | `FEATURE_FLAG_ESCROW_CUSTODY_LIVE=false` | Case status and freeze tracking active; disbursement action disabled. |
| **Judicial Injunctions** | Dubai Courts Execution Dept | Structured Judicial Intake | `FEATURE_FLAG_COURTS_FEED_LIVE=false` | Court order intake and Article 99 interpleader escrow filing workflow. |
| **Customs Bonds** | Dubai Customs Mirsal 2 | Statutory Countdown Clock | `FEATURE_FLAG_CUSTOMS_MIRSAL_LIVE=false` | 90-day statutory export countdown tracked via configurable rules. |

---

## 4. Verification & QA Status Summary

- **TypeScript Compilation:** 10 / 10 Turbo tasks pass (0 errors).
- **ESLint Cleanliness:** 10 / 10 Turbo tasks pass (0 errors).
- **Production Asset Build:** 7 / 7 Turbo tasks pass (Next.js 15 App Router static/dynamic pages compiled).
- **Unit & Integration Tests:** 8 suites, 93 / 93 tests pass (NestJS API).
- **PostgreSQL RLS Multi-Tenancy:** 16 / 16 tests pass (`rls-isolation.test.ts`).
- **Playwright Browser Suites:** 25 / 25 test runners pass across all 26 screens (`run-all-verifications.js`).
- **Open Defects:** 0 Critical, 0 High, 0 Regressions.
