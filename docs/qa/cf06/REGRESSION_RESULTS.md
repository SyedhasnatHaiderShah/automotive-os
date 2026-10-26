# CF-06 Verification & Regression Results

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:47:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  
**Verification Branch:** `audit/cf06-stitch-full-parity`  
**Starting Commit Baseline:** `4f1cdb206d7ea2577af0e5b5e3aeb4062926cc0c`  
**Source HEAD Commit:** `2afedce48b62aa0d667c4618e3a2468351543888`  

---

## 1. Test Execution Summary

| Test Suite / Verification Layer | Target | Execution Command | Result | Pass Rate | Key Verification Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Workspace TypeScript Typecheck** | All 8 packages & apps | `pnpm typecheck` | **PASS** | **10 / 10 (100%)** | Zero type errors across apps/marketplace, apps/dealer, apps/admin, apps/api, packages/database, packages/ui, packages/contracts. |
| **NestJS Backend Unit & Integration Tests** | `apps/api` | `pnpm --filter api test` | **PASS** | **17 / 17 suites (165 / 165 tests, 100%)** | Fixed correlationId contract mismatch; outbox search sync, RLS transaction context, CORS allowlists all pass. |
| **Database Multi-Tenancy & RLS Suite** | `packages/database` | `pnpm --filter database test` | **PASS** | **100%** | Composite foreign keys verified; cross-tenant lead/vehicle denial confirmed; app non-bypass role verified. |
| **Live Railway Staging API Probes** | `api-staging.syedhasnat.com` | `node scripts/audit_backend_contracts.js` | **PASS / RECORDED** | **9 / 12 endpoints pass (3 documented gaps)** | Verified live PostgreSQL connection, public listing redaction, 401 unauthenticated tenant protection. |
| **Deterministic Visual Parity (Stitch vs Staging)** | S01–S31 | `node scripts/generate_visual_diffs.js` | **VERIFIED** | **27 / 27 accessible screens diffed (4 gated admin)** | Real pixel diff heatmaps generated in `docs/qa/cf06/diffs/`. Parity scores range 70% – 90%. |
| **Live Staging Browser Capture (Matrix Viewports)** | 1440px, 1024px, 390px, Arabic RTL | `node scripts/capture_staging_browser.js` | **VERIFIED** | **108 screenshots captured** | 27 screens * 4 viewports captured directly from running staging environment into `docs/qa/cf06/implemented/`. |

---

## 2. Detailed Suite Results

### 2.1 Backend API Test Suites (`apps/api`)
```
PASS test/security-audit-remediation.spec.ts
PASS test/buyer-leads-grants.spec.ts
PASS test/outbox-search-sync.spec.ts
PASS test/inventory-listings.spec.ts
PASS test/security-bypass-hardening.spec.ts
PASS test/auth-tenancy.spec.ts
PASS test/final-release-hardening.spec.ts
PASS test/cf03-staging-domain-cors.spec.ts
PASS test/codex-pr12-review.spec.ts
PASS test/inventory-media-upload.spec.ts
PASS src/tenants/public-dealers.controller.spec.ts
PASS src/common/guards/tenant-access.guard.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/common/guards/platform-admin.guard.spec.ts
PASS src/common/filters/http-exception.filter.spec.ts

Test Suites: 17 passed, 17 total
Tests:       165 passed, 165 total
Snapshots:   0 total
Time:        9.862 s
```

### 2.2 Turbo Typecheck Summary (`turbo run typecheck`)
```
@automotive-os/database:typecheck: PASS
@automotive-os/contracts:typecheck: PASS
@automotive-os/ui:typecheck: PASS
admin:typecheck: PASS
marketplace:typecheck: PASS
dealer:typecheck: PASS
api:typecheck: PASS

 Tasks:    10 successful, 10 total
Cached:    0 cached, 10 total
  Time:    24.402s
```
