# Playwright End-to-End Regression Test Suite Results

**Document:** `PLAYWRIGHT_RESULTS.md`  
**Execution Timestamp:** 2026-10-27 11:09:22 UTC+4  
**Playwright Config:** `tests/e2e/playwright.config.ts`  
**Browser Engine:** Chromium (Desktop Chrome, Tablet Chrome, Mobile Pixel 7)  
**Total Tests Executed:** 60  
**Passed:** 60 (100%)  
**Failed:** 0  
**Execution Duration:** 1.7 minutes

---

## 1. Test Execution Summary by Project

| Project Profile | Device / Viewport | Specs Run | Total Tests | Passed | Failed | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Chrome** | 1440 × 900 (Desktop) | 4 specs | 20 | 20 | 0 | 36.2s |
| **Tablet Chrome** | 1024 × 768 (Tablet) | 4 specs | 20 | 20 | 0 | 32.1s |
| **Mobile Chrome** | 390 × 844 (Pixel 7 / Mobile) | 4 specs | 20 | 20 | 0 | 33.7s |
| **Consolidated** | Multi-Viewport | **All 4 specs** | **60** | **60** | **0** | **1.7m** |

---

## 2. Detailed Test Case Manifest

### Suite 1: `tests/e2e/auth-admin.spec.ts` (Platform Administration & Governance)
- **Test 1:** Public registration strictly prohibits administrative or dealership role self-selection (`PASS` on Desktop 1.9s, Tablet 1.9s, Mobile 1.7s)
- **Test 2:** `/auth/activate` handles invalid, expired, and pending invitation tokens safely (`PASS` on Desktop 1.2s, Tablet 1.4s, Mobile 1.2s)
- **Test 3:** `/admin` command console rejects unauthenticated access and redirects to `/auth` (`PASS` on Desktop 1.2s, Tablet 1.7s, Mobile 1.3s)
- **Test 4:** `/admin/users` user governance desk rejects unauthenticated access (`PASS` on Desktop 1.2s, Tablet 1.1s, Mobile 1.7s)
- **Test 5:** `/admin/dealers` dealership desk rejects unauthenticated access (`PASS` on Desktop 1.8s, Tablet 1.0s, Mobile 1.2s)
- **Test 6:** `/admin/audit-logs` activity ledger rejects unauthenticated access (`PASS` on Desktop 1.9s, Tablet 1.8s, Mobile 1.4s)

### Suite 2: `tests/e2e/auth-customer.spec.ts` (Customer Authentication & Lifecycle)
- **Test 7:** Customer Portal (`/auth`) renders Obsidian Studio Glass layout and tab switching (`PASS` on Desktop 1.7s, Tablet 1.6s, Mobile 1.8s)
- **Test 8:** Registration requires mandatory PDPL checkbox agreement (`PASS` on Desktop 1.2s, Tablet 1.9s, Mobile 1.1s)
- **Test 9:** Password checklist indicates complexity requirements (`PASS` on Desktop 2.3s, Tablet 1.2s, Mobile 1.2s)
- **Test 10:** `/auth/verify-email` displays token verification and resend states (`PASS` on Desktop 1.7s, Tablet 8.1s, Mobile 2.1s)
- **Test 11:** Post-auth `/dashboard` resolver redirects unauthenticated users to `/auth` (`PASS` on Desktop 2.2s, Tablet 887ms, Mobile 1.6s)
- **Test 12:** Arabic RTL localization renders correctly (`PASS` on Desktop 1.8s, Tablet 1.4s, Mobile 1.4s)

### Suite 3: `tests/e2e/auth-dealer.spec.ts` (Dealership Multi-Role & Tenancy)
- **Test 13:** Dealer console (`/dealer`) rejects unauthenticated access and redirects to `/auth` (`PASS` on Desktop 3.2s, Tablet 2.6s, Mobile 2.7s)
- **Test 14:** `/access-suspended` renders formal tenant suspension and compliance hold notice (`PASS` on Desktop 1.5s, Tablet 1.4s, Mobile 1.0s)
- **Test 15:** `/access-denied` renders formal authorization lockout notice (`PASS` on Desktop 1.0s, Tablet 886ms, Mobile 1.1s)

### Suite 4: `tests/e2e/single-domain-routing.spec.ts` (Single-Domain Multi-Zone Routing & Edge Gateway)
- **Test 16:** Root path (`/`) serves public marketplace and responsive navigation (`PASS` on Desktop 764ms, Tablet 1.2s, Mobile 1.6s)
- **Test 17:** Public vehicle listings (`/cars`) render with search and filters (`PASS` on Desktop 1.1s, Tablet 1.0s, Mobile 1.1s)
- **Test 18:** Public dealer directory (`/dealers`) loads verified UAE showrooms (`PASS` on Desktop 1.1s, Tablet 1.1s, Mobile 1.2s)
- **Test 19:** Static Next.js bundles, styles and fonts load without 404 or 500 errors (`PASS` on Desktop 2.1s, Tablet 1.7s, Mobile 1.7s)
- **Test 20:** No horizontal overflow on desktop (1440px), tablet (1024px), or mobile (390px) (`PASS` on Desktop 7.1s, Tablet 986ms, Mobile 1.5s)

---

## 3. Artifacts & Evidence Collected

- **JSON Test Report:** `test-results/e2e/results.json`
- **HTML Interactive Report:** `test-results/e2e/html-report/`
- **Screenshots:** Captured for every test step and stored in `test-results/e2e/artifacts/`
- **Trace Archives:** Trace records generated for regression tracking
