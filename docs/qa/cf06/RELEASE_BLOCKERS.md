# CF-06 Release Blockers & Operational Gates

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:34:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  

---

## 1. Critical Launch Blockers (P0)

### Blocker 1: Deployment Staleness of Railway Staging Environment
- **Severity:** P0 — Operational Deployment
- **Description:** Staging targets (`automotive-marketplace-staging.up.railway.app`, `automotive-dealer-staging.up.railway.app`, `api-staging.syedhasnat.com`) are running commit `3baefab` (PR #11 cutover). Recent PRs (#12 Stitch fixes, #13 route states, #14 review guards, #15 Sentinel hardening) are merged into `main` (`2afedce`) but not yet deployed.
- **Impact:** Live staging contains 5 inert links (`href="#"`) and lacks the route-level error/loading suspense boundaries that exist in source HEAD.
- **Resolution Path:** Trigger authorized deployment of `main` (`2afedce`) to Railway staging services once approved.

---

### Blocker 2: Platform Admin Staging Domain Misalignment
- **Severity:** P0 — Infrastructure & Access
- **Description:** The prompt-specified domain `https://automotive-admin-staging.up.railway.app` returns HTTP 404. The actual active staging deployment is hosted at `https://admin-staging.syedhasnat.com` gated behind HTTP Basic Auth (`Basic realm="Automotive OS Admin Protected Gate"`).
- **Impact:** Automated CI test runners and external auditors querying the `.up.railway.app` domain fail with 404.
- **Resolution Path:** Either configure Railway custom domain CNAME for `automotive-admin-staging.up.railway.app` or update test runners and CI workflows to use `https://admin-staging.syedhasnat.com` with configured `ADMIN_AUTH_USER` / `ADMIN_AUTH_PASSWORD`.

---

## 2. Architectural & Contract Blockers (P1)

### Blocker 3: Forensic Dossier Contracts for S15 (KYB) and S16 (Moderation)
- **Severity:** P1 — Contract Truth & Regulatory Safety
- **Description:** Approved Stitch designs require full beneficial ownership ledgers (UBO equity %, PEP sanctions check, biometric status), facility audit specifications, EXIF camera/GPS provenance, and ECU attestation. The current NestJS API returns high-level summaries (`ListingSummaryDto`, `KybVerificationSummaryDto`).
- **Safety Guard:** In PR #14, the frontend was specifically guarded to fail closed (`isModerationDossier` / `isKybDossier` type guards) and show a retryable warning rather than fabricating fake telemetry.
- **Resolution Path:** Design and implement backend NestJS DTO extensions, Prisma schema additions, and database migration in a dedicated backend PR. S15 and S16 must remain labelled **GATED_CONTRACT** until backed by schema.

---

### Blocker 4: Missing Public Dealers Collection Route
- **Severity:** P1 — API Contract Gap
- **Description:** `apps/api/src/tenants/public-dealers.controller.ts` exposes `GET /api/v1/public/dealers/:slug`, but lacks a collection endpoint `GET /api/v1/public/dealers` to list verified dealerships.
- **Impact:** Any client view seeking to browse verified dealerships without a slug receives a 404.
- **Resolution Path:** Add `@Get()` handler in `PublicDealersController` returning paginated verified tenant profiles.

---

## 3. External Regulatory Gates (GATED_EXTERNAL)

Per `docs/implementation/INTEGRATION_TRUTH_TABLE.md`, the following third-party integrations are legally gated:
1. **UAE PASS Production OIDC:** Requires TDRA / UAE PASS production onboarding and client certificate signing.
2. **Tasjeel / RTA Telemetry Uplink:** Requires accredited vehicle inspection provider API agreement.
3. **AECB Credit Bureau Underwriting:** Requires Central Bank of the UAE (CBUAE) and AECB data access accreditation.
4. **UAE FTA E-Invoicing Phase 2:** Requires tax agent clearance and Peppol / ZATCA e-invoicing transmission gateway.
5. **Ministry of Justice Judicial Hold:** Requires certified court order integration.

> [!IMPORTANT]
> None of the above external dependencies may be claimed as live in marketing, UI, or audit reports without external legal review. They are truthfully represented as *Coming Soon* or simulated via isolated staging sandbox fixtures.
