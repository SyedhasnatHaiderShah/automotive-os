# AG-18 — Release-Blocking Security & Data Integrity Remediation Report

**Repository**: `SyedhasnatHaiderShah/automotive-os`  
**Baseline Git Commit**: `7f563ed`  
**Remediation Branch**: `fix/ag18-security-data-integrity`  
**Audit & Remediation Program**: AG-18 Mandatory Security & Data Integrity Fix  
**Author**: Principal Application Security Engineer & QA Architect  
**Date**: October 23, 2026  
**Status**: REMEDIATED & VERIFIED  

---

## 1. Executive Summary

Following independent source inspection of repository commit `7f563ed`, several release-blocking security, privacy, and data-integrity defects were identified across authentication, CORS origin governance, vehicle inventory data protection, and dealership operational telemetry.

All defects were first reproduced with dedicated failing end-to-end integration tests in `apps/api/test/ag18-security-integrity.spec.ts`. Bounded, defense-in-depth remediations were subsequently implemented across `apps/api` and `apps/dealer`. The entire test suite was re-executed, achieving 100% test pass rates across all 11 test suites (125/125 API tests, 16/16 database multi-tenancy & RLS tests), followed by full monorepo typecheck and production builds.

---

## 2. Confirmed Vulnerability Root Cause Analysis & Remediation

### 2.1 Authentication: Public Development Token Issuance Gating
* **Vulnerability ID**: SEC-AG18-AUTH-01
* **Severity**: Critical (CVSS 9.1)
* **Root Cause**: `apps/api/src/auth/auth.controller.ts` exposed `@Public() @Post('token')` (`getDevToken`) without environment checks, allowing arbitrary JWT minting for any `identitySubject` in production and staging environments.
* **Remediation**:
  - Gated `getDevToken` against `process.env.NODE_ENV`.
  - In `production` and `staging` environments, calling `POST /api/v1/auth/token` throws a `ForbiddenException` (HTTP 403) unless `ENABLE_DEV_TOKEN === 'true'`.
* **File Modified**: `apps/api/src/auth/auth.controller.ts`

### 2.2 Authentication: Account Takeover via Registration Overwrite
* **Vulnerability ID**: SEC-AG18-AUTH-02
* **Severity**: Critical (CVSS 9.8)
* **Root Cause**: `apps/api/src/auth/auth.service.ts` queried `prisma.user.findFirst` for matching email, phone, or Emirates ID during `POST /api/v1/auth/register`. If a match was found, it updated that user's record and minted a JWT for their account without verifying identity ownership. An attacker could take over any existing dealer or buyer account by registering with their email or Emirates ID.
* **Remediation**:
  - Prohibited unverified account linking and overwrites.
  - When an existing user matches by email, phone, or Emirates ID, `registerVipLead` throws a `ConflictException` (HTTP 409):
    > *"An account with this email, phone number, or Emirates ID already exists. Proven identity ownership is required; please authenticate directly via UAE PASS."*
  - No access tokens or profile mutations occur for existing accounts.
* **File Modified**: `apps/api/src/auth/auth.service.ts`

### 2.3 Authentication: JWT Secret Fail-Closed & Claim Validation
* **Vulnerability ID**: SEC-AG18-AUTH-03
* **Severity**: High (CVSS 8.2)
* **Root Cause**: `apps/api/src/auth/jwt.strategy.ts` and `auth.module.ts` fell back to a default static dev secret (`dev-jwt-secret-replace-in-production-min-32-chars-long`). Neither `issuer` nor `audience` claims were validated in `JwtStrategy`.
* **Remediation**:
  - Added fail-closed startup validation in `auth.module.ts` and `jwt.strategy.ts`: in `production` and `staging`, bootstrap throws a fatal error if `JWT_SECRET` is unset or matches the default development secret.
  - Configured `passport-jwt` with strict `issuer: process.env.JWT_ISSUER || 'https://auth.autonexa.ae'` and `audience: process.env.JWT_AUDIENCE || 'autonexa-api'`.
  - Added claim-level validation in `JwtStrategy.validate()`: validates `payload.sub`, `payload.iss`, and `payload.aud`. Mismatched or missing claims throw `UnauthorizedException` (HTTP 401).
* **Files Modified**: `apps/api/src/auth/jwt.strategy.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.service.ts`

### 2.4 CORS: Strict HTTPS Origin Governance & Safe Caching
* **Vulnerability ID**: SEC-AG18-CORS-01
* **Severity**: High (CVSS 7.5)
* **Root Cause**: `apps/api/src/main.ts` allowed all origins when `CORS_ORIGINS` was empty, automatically trusted any `http://localhost:*`, and used insecure suffix matching `requestOrigin.endsWith(".automotive-os.ae")` without protocol or hostname boundaries. Authenticated responses also lacked strict `Cache-Control` headers.
* **Remediation**:
  - Enforced strict fail-closed behavior in production and staging: when `CORS_ORIGINS` is unset, all cross-origin requests are denied.
  - Origins must explicitly match the configured allowlist and must use `https://`. Suffix matching and automatic localhost trust were eliminated for production/staging.
  - Added defense-in-depth response headers to prevent cross-user/tenant caching:
    ```http
    Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
    Pragma: no-cache
    Expires: 0
    Surrogate-Control: no-store
    ```
* **File Modified**: `apps/api/src/main.ts`

### 2.5 Data Protection: Default-Deny on `purchaseCostFils` & Field-Level Mutability
* **Vulnerability ID**: SEC-AG18-DATA-01
* **Severity**: High (CVSS 7.7)
* **Root Cause**: `apps/api/src/inventory/vehicles.service.ts` line 376 evaluated `!callerRole || privilegedCostRoles.includes(callerRole)`. When `callerRole` was `undefined`, it evaluated to `true`, leaking private wholesale acquisition costs to unprivileged callers. Furthermore, `createVehicle` and `updateVehicle` did not enforce field-level permissions when `purchaseCostFils` was provided in request payloads.
* **Remediation**:
  - Inverted the authorization check to strict default-deny:
    ```typescript
    const isCostAuthorized = Boolean(callerRole && PRIVILEGED_COST_ROLES.includes(callerRole));
    ```
  - Permitted roles for cost visibility and mutation are restricted to: `OWNER`, `ADMIN`, `FINANCE_MANAGER`, and `INVENTORY_MANAGER`.
  - In `createVehicle` and `updateVehicle`: if an unprivileged role (e.g. `SALES_AGENT`) submits `purchaseCostFils`, the API throws `ForbiddenException` (HTTP 403).
  - Passed `tenant.userRole` from `VehiclesController` to `createVehicle` and `updateVehicle` so returned DTOs correctly redact `purchaseCostFils` to `null`.
* **Files Modified**: `apps/api/src/inventory/vehicles.service.ts`, `apps/api/src/inventory/vehicles.controller.ts`

### 2.6 Dynamic Data: Zero-Simulation in Dealer DMS & Genuine Empty State
* **Vulnerability ID**: SEC-AG18-DYN-01
* **Severity**: Medium (CVSS 6.3)
* **Root Cause**: `apps/dealer/lib/api.ts` hardcoded `rtaVerified: true`, `inquiriesCount: 12`, and `vipBookingsCount: 2` on every vehicle returned from the database. Furthermore, if the database was empty (`items.length === 0`) or if the API was unreachable, lines 421-432 fell back to `VERIFIED_DEALER_INVENTORY_FIXTURES` with simulated stats (`28 units`, `AED 42,850,000` valuation).
* **Remediation**:
  - Dynamic DB mapping: `inquiriesCount` and `vipBookingsCount` now map from dynamic database fields (or default `0`); `rtaVerified` maps dynamically from vehicle verification or published status.
  - Empty state integrity: When the database returns `[]`, `fetchDealerInventory` returns `items: []` and zero stats (`totalUnits: 0, floorValuationAed: 0`).
  - Production resilience: When the backend API is unreachable or fails, production/staging throws an explicit error instead of falling back to mock fixtures. Fixture fallback is only allowed when `NODE_ENV === "development" && NEXT_PUBLIC_ENABLE_FIXTURES === "true"`.
  - Added genuine empty state table row in `apps/dealer/components/inventory-matrix-view.tsx` and explicit connection error banners in `apps/dealer/app/inventory/page.tsx`, `apps/dealer/app/page.tsx`, and `apps/dealer/app/leads/page.tsx`.
* **Files Modified**: `apps/dealer/lib/api.ts`, `apps/dealer/components/inventory-matrix-view.tsx`, `apps/dealer/app/inventory/page.tsx`, `apps/dealer/app/page.tsx`, `apps/dealer/app/leads/page.tsx`

---

## 3. Scope of Changed Files

| File | Change Description | Security Domain |
|---|---|---|
| `apps/api/src/auth/auth.controller.ts` | Gated dev token endpoint against staging/production | Authentication |
| `apps/api/src/auth/auth.service.ts` | Prevented account takeover by throwing 409 on existing user match | Authentication |
| `apps/api/src/auth/jwt.strategy.ts` | Fail-closed on missing secret, added issuer/audience validation | Authentication |
| `apps/api/src/auth/auth.module.ts` | Startup fail-closed validation for `JWT_SECRET` | Authentication |
| `apps/api/src/main.ts` | Strict HTTPS CORS allowlist, fail-closed when unset, no-store cache headers | CORS & Transport |
| `apps/api/src/inventory/vehicles.controller.ts` | Forwarded `tenant.userRole` into vehicle creation and update services | Data Protection |
| `apps/api/src/inventory/vehicles.service.ts` | Default-deny `purchaseCostFils`, field-level permission enforcement | Data Protection |
| `apps/dealer/lib/api.ts` | Removed hardcoded telemetry (12/2/true), eliminated production fixture fallback | Dynamic Data |
| `apps/dealer/components/inventory-matrix-view.tsx` | Added genuine empty-state row for zero-vehicle dealership stock | Dynamic Data |
| `apps/dealer/app/inventory/page.tsx` | Added explicit connection error boundary and retry banner | Operational Resilience |
| `apps/dealer/app/page.tsx` | Added explicit operations cockpit error fallback | Operational Resilience |
| `apps/dealer/app/leads/page.tsx` | Added explicit CRM lead inbox error fallback | Operational Resilience |
| `apps/api/test/ag18-security-integrity.spec.ts` | 16-test comprehensive reproduction and verification suite | Test Engineering |
| `apps/api/test/vip-auth-settings.spec.ts` | Added idempotency cleanup for repeated registration tests | Test Engineering |
| `apps/api/test/buyer-leads-grants.spec.ts` | Added idempotency reset for Tariq Al-Hashimi test user identity | Test Engineering |

---

## 4. Verification Evidence & Gate Summary

- **TDD Reproduction Suite**: 16/16 tests PASS (`test/ag18-security-integrity.spec.ts`)
- **API Full Suite**: 11/11 test suites PASS, 125/125 tests PASS (`pnpm --filter api test`)
- **Database RLS & Multi-Tenancy**: 16/16 tests PASS (`packages/database`)
- **Monorepo Lint & Typecheck**: 10/10 tasks PASS (`turbo run lint`, `turbo run typecheck`)
- **Production Build**: 7/7 tasks PASS (`turbo run build` across all apps and packages)

All release-blocking Critical and High security findings from the AG-18 audit have been resolved and verified with automated tests.
