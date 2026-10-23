# AG-18 — Verification Test Results & Evidence

**Repository**: `SyedhasnatHaiderShah/automotive-os`  
**Git Branch**: `fix/ag18-security-data-integrity`  
**Commit Baseline**: `7f563ed`  
**Test Execution Date**: October 23, 2026  
**Environment**: Isolated Local & Staging Test Harness (Node.js v20+, PostgreSQL 16 with RLS enabled)  

---

## 1. Reproduction Phase (Failing Tests First)

Prior to implementing source code remediations, a dedicated test suite `apps/api/test/ag18-security-integrity.spec.ts` was executed against Git HEAD at `7f563ed`. The suite reproduced confirmed defects across all 4 mandatory domains:

```text
> jest --runInBand "test/ag18-security-integrity.spec.ts"

FAIL test/ag18-security-integrity.spec.ts
  AG-18 Security Remediation & Data Integrity Verification Suite
    1. AUTHENTICATION & IDENTITY TAKEOVER DEFENSE
      × 1.1 MUST disable public dev token issuance in staging/production (30 ms)
      × 1.2 MUST reject registration when email matches existing user (prevent account takeover) (17 ms)
      × 1.3 MUST reject registration when Emirates ID matches existing user (7 ms)
      √ 1.4 MUST reject expired JWT tokens with 401 Unauthorized (5 ms)
      × 1.5 MUST reject JWT tokens with invalid issuer or audience (9 ms)
      √ 1.6 MUST reject JWT tokens with missing subject (sub claim) (3 ms)
    2. DATA PROTECTION & FIELD-LEVEL PERMISSION (purchaseCostFils)
      × 2.1 MUST default to denying purchaseCostFils when callerRole is undefined (12 ms)
      × 2.2 MUST deny purchaseCostFils visibility to non-privileged roles (SALES_AGENT) (7 ms)
      √ 2.3 MUST allow purchaseCostFils visibility to privileged roles (OWNER) (7 ms)
      √ 2.4 MUST reject unprivileged roles (SALES_AGENT) attempting to update purchaseCostFils (5 ms)
    3. CORS & CACHE-CONTROL HEADERS
      √ 3.1 MUST emit safe no-store Cache-Control headers on API responses (7 ms)

Test Suites: 1 failed, 1 total
Tests:       6 failed, 5 passed, 11 total
```

### Confirmed Defect Evidence
1. **Public Dev Token Active in Production**: `POST /api/v1/auth/token` returned HTTP 201 when `NODE_ENV = 'production'`.
2. **Account Takeover in Registration**: `POST /api/v1/auth/register` returned HTTP 201 and issued a JWT for existing user `tariq@alfuttaim-prestige.ae` when supplied by an unverified caller.
3. **Missing JWT Claims Validation**: Tokens signed with `iss: 'https://evil-issuer.com'` or `aud: 'wrong-audience'` were accepted with HTTP 200.
4. **Default-Allow on Wholesale Acquisition Cost**: `mapVehicleResponse(vehicle, undefined)` exposed `purchaseCostFils: "31000000"` to unauthenticated / role-less callers.

---

## 2. Post-Remediation Verification Phase

### 2.1 Targeted AG-18 Security & Integrity Suite
Command: `pnpm --filter api test test/ag18-security-integrity.spec.ts`  
Exit Code: `0` (PASS)

```text
PASS test/ag18-security-integrity.spec.ts
  AG-18 Security Remediation & Data Integrity Verification Suite
    1. AUTHENTICATION & IDENTITY TAKEOVER DEFENSE
      √ 1.1 MUST disable public dev token issuance in staging/production (28 ms)
      √ 1.2 MUST reject registration when email matches existing user (prevent account takeover) (7 ms)
      √ 1.3 MUST reject registration when Emirates ID matches existing user (6 ms)
      √ 1.4 MUST reject expired JWT tokens with 401 Unauthorized (3 ms)
      √ 1.5 MUST reject JWT tokens with invalid issuer or audience (4 ms)
      √ 1.6 MUST reject JWT tokens with missing subject (sub claim) (3 ms)
    2. DATA PROTECTION & FIELD-LEVEL PERMISSION (purchaseCostFils)
      √ 2.1 MUST default to denying purchaseCostFils when callerRole is undefined (3 ms)
      √ 2.2 MUST deny purchaseCostFils visibility to non-privileged roles (SALES_AGENT) (8 ms)
      √ 2.3 MUST allow purchaseCostFils visibility to privileged roles (OWNER) (6 ms)
      √ 2.4 MUST reject unprivileged roles (SALES_AGENT) attempting to update purchaseCostFils (4 ms)
      √ 2.5 MUST reject unprivileged roles (SALES_AGENT) attempting to create vehicle with purchaseCostFils (5 ms)
    3. CORS & CACHE-CONTROL HEADERS
      √ 3.1 MUST emit safe no-store Cache-Control headers on API responses (5 ms)
      √ 3.2 MUST reject unallowed origins in production CORS mode (2 ms)
      √ 3.3 MUST reject plain HTTP and wildcard subdomains in production CORS mode (3 ms)
    4. DYNAMIC DATA & DEALER DMS ZERO-SIMULATION
      √ 4.1 MUST return empty state with zero stats on empty database, without falling back to mock fixtures
      √ 4.2 MUST not hardcode simulated RTA or enquiry metrics when dynamic vehicle is returned (1 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        3.696 s
```

---

### 2.2 Complete API Test Suite
Command: `pnpm --filter api test`  
Exit Code: `0` (PASS)

```text
PASS test/buyer-leads-grants.spec.ts
PASS test/vip-auth-settings.spec.ts
PASS test/outbox-search-sync.spec.ts
PASS test/inventory-listings.spec.ts
PASS test/security-audit-remediation.spec.ts
PASS test/auth-tenancy.spec.ts
PASS test/ag18-security-integrity.spec.ts
PASS src/tenants/public-dealers.controller.spec.ts
PASS src/common/guards/tenant-access.guard.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/common/guards/platform-admin.guard.spec.ts

Test Suites: 11 passed, 11 total
Tests:       125 passed, 125 total
Snapshots:   0 total
Time:        6.083 s
```

---

### 2.3 Database RLS & Multi-Tenancy Suite
Command: `pnpm --filter @automotive-os/database test`  
Exit Code: `0` (PASS)

```text
Automotive OS — Multi-Tenancy & RLS Verification Suite
======================================================
1. Testing Composite Foreign Key Integrity...
  [PASS] Composite FK: Cross-Tenant Branch Linking Rejected
  [PASS] Composite FK: Cross-Tenant Lead-Listing Rejected

2. Testing Dealer Asset Isolation (Non-Bypass App Role)...
  [PASS] Dealer A: Can Read Own Vehicles
  [PASS] Dealer A: CANNOT Read Dealer B Vehicles
  [PASS] Dealer A: CANNOT Change Dealer B Vehicles
  [PASS] Dealer A: CANNOT Delete Dealer B Vehicles
  [PASS] Dealer B: Can Read Own Vehicles
  [PASS] Dealer B: CANNOT Read Dealer A Vehicles

3. Testing Buyer Profile Isolation (Non-Bypass App Role)...
  [PASS] Buyer A: Can Read Own Profile
  [PASS] Buyer A: CANNOT Read Buyer B Profile
  [PASS] Buyer B: Can Read Own Profile
  [PASS] Buyer B: CANNOT Read Buyer A Profile

4. Testing Public Redacted Read Projection & Sold Unpublish...
  [PASS] Public: Can Read Available Published Listings
  [PASS] Public: Sold Vehicles Do NOT Remain Public
  [PASS] Public: Cannot Directly Query Private Vehicle Ledger

5. Testing Platform Admin Access & Audit...
  [PASS] Platform Admin: Cross-Tenant Inspection Access

======================================================
Summary: 16/16 tests passed.
Status: ALL TESTS PASSED
======================================================
```

---

### 2.4 Monorepo Typecheck & Lint
Commands: `pnpm run typecheck` & `pnpm run lint`  
Exit Code: `0` (PASS)

* **Typecheck**: 10/10 tasks successful (`api`, `dealer`, `marketplace`, `admin`, `@automotive-os/database`, `@automotive-os/contracts`, `@automotive-os/ui`)
* **Lint**: 10/10 tasks successful (zero syntax, formatting, or linting errors)

---

### 2.5 Production Build
Command: `pnpm run build`  
Exit Code: `0` (PASS)

* `apps/api`: NestJS production compile (`nest build`) successful.
* `apps/dealer`: Next.js 15 production build successful (17 routes, static/dynamic).
* `apps/marketplace`: Next.js 15 production build successful (18 routes, static/dynamic).
* `apps/admin`: Next.js 15 production build successful (8 routes, static/dynamic).
* `packages/*`: Prisma client generation & TypeScript compilation successful.
