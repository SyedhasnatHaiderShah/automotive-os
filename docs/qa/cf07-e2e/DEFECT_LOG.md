# CF-07 & CF-07.1 Comprehensive Defect & Remediation Log

**Document:** `DEFECT_LOG.md`  
**Scope:** Architecture Discovery, Implementation, Security Hardening & Browser E2E Regression  
**Total Defects Identified:** 6  
**Total Defects Remediated:** 6 (100% Resolved)  
**Open Defects:** 0

---

## Defect Inventory

### DEF-01: Customer Email Verification Immediate Bypass
- **Severity:** High (P1 Security)
- **Layer:** Backend API (`apps/api/src/auth/auth.service.ts`)
- **Description:** Customer registration directly marked `emailVerifiedAt: new Date()` and set user status to `'ACTIVE'`.
- **Root Cause:** Placeholder implementation during initial prototyping.
- **Remediation:** 
  - Added `emailVerificationTokenHash` and `emailVerificationExpiresAt` columns via Prisma migration.
  - Set status to `'PENDING_VERIFICATION'` and `emailVerifiedAt: null`.
  - Stored SHA-256 hash of single-use 256-bit token with 24h expiration.
  - Required token consumption via `POST /api/v1/auth/verify-email`.
  - Blocked login with `403 EMAIL_NOT_VERIFIED` for unverified accounts.
- **Status:** **RESOLVED & VERIFIED**

---

### DEF-02: Zero-Trust Admin Elevation & Plaintext Token Log Exposure
- **Severity:** Critical (P0 Security)
- **Layer:** Backend API & Bootstrap Script (`scripts/bootstrap-platform-admins.ts`, `apps/api/src/auth/auth.service.ts`)
- **Description:** Platform admin bootstrap script printed plaintext activation tokens to stdout, and public signup on matching admin emails granted immediate superadmin elevation without MFA.
- **Root Cause:** Incomplete security hardening around initial admin setup.
- **Remediation:**
  - Bootstrap script provisions identity with `isPlatformAdmin: false` and `PENDING_VERIFICATION`.
  - Suppressed plaintext token logging in production environments.
  - Implemented RFC 6238 TOTP engine (`apps/api/src/auth/totp.util.ts`).
  - Required mandatory TOTP 2FA secret generation and 6-digit challenge verification during `/auth/activate` completion before setting `isPlatformAdmin: true`.
- **Status:** **RESOLVED & VERIFIED**

---

### DEF-03: Stale JWT Claims Bypassing Session Revocation & Admin Demotion
- **Severity:** Critical (P0 Security)
- **Layer:** Edge Middleware & JWT Strategy (`apps/admin/middleware.ts`, `apps/api/src/auth/auth.service.ts`)
- **Description:** Next.js Edge Middleware and NestJS JwtStrategy trusted static JWT claims for 7 days without validating whether the session had been revoked or the user demoted/suspended.
- **Root Cause:** Stateless JWT verification without database check.
- **Remediation:**
  - Added authoritative validation against PostgreSQL `Session` table on every authenticated API request.
  - Added `GET /api/v1/auth/verify-admin-session` for Edge Middleware subrequest verification.
  - Middleware drops cookies and redirects to `/auth` if the session is revoked or user is no longer a platform admin.
- **Status:** **RESOLVED & VERIFIED**

---

### DEF-04: Next.js Edge Middleware BasePath Exclusion on Root `/admin`
- **Severity:** High (P1 Functional/Security)
- **Layer:** Next.js Routing (`apps/admin/middleware.ts`)
- **Description:** Unauthenticated requests to `/admin` returned `200 OK` with static cache HIT instead of redirecting to `/auth?tab=login`.
- **Root Cause:** Next.js strips `basePath: '/admin'`, leaving the evaluated path as `""` (empty string). The middleware matcher regex `'/((?!...).*)'` required a leading slash `/`, causing the root admin path to completely bypass middleware.
- **Remediation:**
  - Updated middleware config matcher to explicitly include `'/'` alongside the wildcard:
    ```typescript
    export const config = {
      matcher: [
        '/',
        '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
      ],
    };
    ```
  - Verified curl and Playwright test assert 307 redirect to `/auth?tab=login`.
- **Status:** **RESOLVED & VERIFIED**

---

### DEF-05: Playwright Strict Mode Selector Collisions on UI Labels
- **Severity:** Low (P3 Automation)
- **Layer:** Playwright E2E Tests (`tests/e2e/auth-customer.spec.ts`, `tests/e2e/auth-admin.spec.ts`, `tests/e2e/auth-dealer.spec.ts`)
- **Description:** Playwright threw strict mode violations when matching `getByRole('button', { name: /Sign In/i })` or `getByRole('link', { name: /Login/i })` because multiple elements (e.g. header nav link, form submit button, drawer return button) matched the loose regex.
- **Root Cause:** Overly permissive regex in E2E test assertions.
- **Remediation:** Scoped selectors to parent containers (`page.locator('form')`) or used exact string matching (`{ name: 'Sign In', exact: true }`).
- **Status:** **RESOLVED & VERIFIED**

---

### DEF-06: API Auth Unit Test Mocks Lacking Verification Timestamps
- **Severity:** Low (P3 Unit Tests)
- **Layer:** Jest Unit Tests (`apps/api/src/auth/auth.service.spec.ts`)
- **Description:** Existing unit tests failed after S1 remediation because mock user objects lacked `emailVerifiedAt` timestamps, triggering `EMAIL_NOT_VERIFIED` exceptions during login tests.
- **Root Cause:** Mocks needed update to reflect new required email verification schema.
- **Remediation:** Updated mock user fixtures in `auth.service.spec.ts` with `emailVerifiedAt: new Date()` for valid login cases and `status: 'PENDING_VERIFICATION'` for signup expectations.
- **Status:** **RESOLVED & VERIFIED**
