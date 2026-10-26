# CF-06 Defect & Remediation Fix Log

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:47:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  

---

## Defect Inventory & Reviewable Fix Record

### Defect CF06-DEF-001: Exception Filter Correlation ID Contract Mismatch
- **ID:** `CF06-DEF-001`
- **Severity:** P0 — CI Test Failure & Contract Regression
- **Screen / Service:** API (`apps/api/src/common/filters/http-exception.filter.ts`)
- **Actual Screenshot:** N/A (Backend Exception Handling)
- **Reference Contract:** Standardized error response contract `{ error: { code, message, correlationId } }` requiring `corr-` prefix per AG-17 suite.
- **Precise Difference:** In PR #15 (`ebea3aa`), Sentinel bot changed default correlation IDs from `corr-${Date.now()}-...` to raw `randomUUID()`. This caused `test/security-audit-remediation.spec.ts` line 241 to fail (`expect(response.body.error.correlationId).toMatch(/^corr-/)`).
- **Reproduction Steps:** Run `pnpm --filter api test`.
- **Expected Behavior:** Global exception filter produces a cryptographically secure UUID prefixed with `corr-` so that it satisfies both UUID uniqueness and client telemetry prefix contracts.
- **Observed Behavior:** Returned raw UUID without prefix (`"aad74e50-6830-478c-bfa1-eb1838faea96"`), failing test suite with 1 failed / 16 passed.
- **Root Cause:** Sentinel bot omitted the `corr-` namespace prefix when replacing insecure pseudo-random generation with `node:crypto.randomUUID()`.
- **File and Line:** `apps/api/src/common/filters/http-exception.filter.ts` line 24, and `http-exception.filter.spec.ts` line 74.
- **Applied Fix:** Updated default generation to ``corr-${randomUUID()}`` and harmonized unit test regex to ``/^(corr-)?[0-9a-f]{8}-.../i``.
- **Proof:** Ran `pnpm --filter api test` — 17 / 17 test suites and 165 / 165 tests pass (100% green).
- **Residual Risk:** Low. Completely backwards compatible with all client correlation ID handlers.

---

### Defect CF06-DEF-002: Staging Deployment Staleness (5 Inert Footer Links)
- **ID:** `CF06-DEF-002`
- **Severity:** P1 — Staging Parity & Click Integrity
- **Screen ID:** S01 (`Marketplace Home`), S02 (`Search Results`)
- **Actual Screenshot:** `docs/qa/cf06/implemented/S01-desktop_1440.png`
- **Reference Screenshot:** `docs/qa/cf06/references/S01-stitch-original.png`
- **Precise Difference:** Staging deployment contains `<a href="#">` for footer links: "Verified Dealers", "Sell & Consign", "Privacy Notice", "Terms of Service", "UAE Consumer Rights".
- **Reproduction Steps:** Load `https://automotive-marketplace-staging.up.railway.app/`; inspect footer anchors.
- **Expected Behavior:** Semantic Next.js `<Link>` elements pointing to real routes (`/dealers`, `/sell`, `/privacy`, `/terms`, `/consumer-rights`).
- **Observed Behavior:** 5 links have `href="#"`. Clicking scrolls to top without navigation.
- **Root Cause:** Railway staging environment was deployed on commit `3baefab` (PR #11 cutover). Commit `060e91b` (PR #12) fixed these links in source code, but staging has not yet been redeployed.
- **File and Line:** `apps/marketplace/components/footer.tsx` (resolved in HEAD).
- **Proposed Fix:** Trigger authorized Railway deployment of `main` (`2afedce`).
- **Residual Risk:** Nil once deployed. Verified clean in local HEAD.

---

### Defect CF06-DEF-003: Platform Admin Route Mismatch on Railway Default Subdomain
- **ID:** `CF06-DEF-003`
- **Severity:** P0 — Infrastructure Routing
- **Screen ID:** S14, S15, S16, S17
- **Actual Screenshot:** `docs/qa/cf06/implemented/S14-desktop_1440.png`
- **Reference Screenshot:** `docs/qa/cf06/references/S14-stitch-original.png`
- **Precise Difference:** `https://automotive-admin-staging.up.railway.app` returns HTTP 404.
- **Reproduction Steps:** Execute HTTP GET to `https://automotive-admin-staging.up.railway.app/`.
- **Expected Behavior:** Routing to Platform Admin staging console.
- **Observed Behavior:** 404 Not Found from `railway-hikari` router.
- **Root Cause:** Admin application was provisioned on Cloudflare custom domain `admin-staging.syedhasnat.com` behind HTTP Basic Auth and Cloudflare Access, rather than default Railway domain.
- **File and Line:** `apps/admin/wrangler.staging.toml` / Railway dashboard.
- **Proposed Fix:** Map custom domain or update CI configuration to target `https://admin-staging.syedhasnat.com`.
- **Residual Risk:** Low. Protected by design.

---

### Defect CF06-DEF-004: Missing Collection Endpoint for Public Dealerships
- **ID:** `CF06-DEF-004`
- **Severity:** P1 — Contract Gap
- **Screen ID:** S06, API
- **Actual Endpoint:** `GET /api/v1/public/dealers` -> 404 Not Found
- **Reference Contract:** Public directory of verified dealerships for marketplace browsing.
- **Precise Difference:** `apps/api/src/tenants/public-dealers.controller.ts` implements `@Get(':slug')`, but no root `@Get()`.
- **Reproduction Steps:** `curl -i https://api-staging.syedhasnat.com/api/v1/public/dealers`.
- **Expected Behavior:** 200 OK with paginated array of verified dealer profiles.
- **Observed Behavior:** 404 Not Found.
- **Root Cause:** Collection route handler omitted during initial tenant controller implementation.
- **Proposed Fix:** Add `@Get()` handler in `PublicDealersController` returning active tenants with KYB verification flag.
- **Residual Risk:** Low. Additive contract change.
