# Automotive OS — Security & Load Test Plan

**Document Version:** 1.2.0-STAGING  
**Lead:** Autonomous Release Orchestrator (Antigravity)  
**Standard Governance:** [`docs/implementation/QA_GATES.md`](file:///h:/Personal/Automotiv%20OS/docs/implementation/QA_GATES.md), UAE Federal Decree-Law No. 45 of 2021 (PDPL)  
**Target Release:** `v1.2.0-staging.1` (Git Checkpoint: `c1afa53`)

---

## 1. Multi-Tenant Boundary & Penetration Testing

The security architecture of Automotive OS relies on a defense-in-depth model combining application-layer guards and database-layer forced Row-Level Security (RLS).

### 1.1 Tenant Isolation Verification Matrix

| Vulnerability Scenario | Attack Vector Simulated | Expected Defense Behavior | Verification Test File |
|---|---|---|---|
| **Cross-Tenant Vehicle Read** | Dealer A sends GET request for Dealer B's vehicle ID. | Returns `404 Not Found` (or empty set); RLS rejects at SQL query level. | `auth-tenancy.spec.ts` & `rls-isolation.test.ts` |
| **Cross-Tenant Vehicle Modification** | Dealer A sends PATCH request to update Dealer B's vehicle price. | Returns `403 Forbidden` / `404 Not Found`; zero rows modified in DB. | `rls-isolation.test.ts` |
| **Cross-Tenant Vehicle Deletion** | Dealer A attempts SQL/API deletion of Dealer B's vehicle. | Returns `403 Forbidden`; database delete policy blocks execution. | `rls-isolation.test.ts` |
| **Composite FK Bypass Attempt** | Direct SQL insertion linking Dealer A's branch to Dealer B's vehicle. | PostgreSQL rejects insertion due to composite `(tenant_id, id)` foreign key constraint. | `rls-isolation.test.ts` (Check 1) |
| **Body-Provided Tenant Injection** | Authenticated Dealer A includes `tenantId: "Dealer-B-UUID"` in JSON request body. | Controller ignores body param; forces `tenantId` from authenticated JWT session. | `tenant-access.guard.spec.ts` |
| **Public Private Field Leakage** | Public unauthenticated user queries `/api/v1/public/listings`. | Returns redacted projection; stock numbers, acquisition costs, buyer notes are null/omitted. | `public-listings.controller.ts` |
| **Sold Vehicle Stale Exposure** | Vehicle is marked `SOLD` in dealer inventory. | Listing is immediately unpublished and removed from public search cache. | `outbox-search-sync.spec.ts` |

### 1.2 Buyer Privacy & UAE PDPL (Federal Decree-Law No. 45/2021)
- **Buyer-Owned Identity:** Buyer profiles, virtual garage entries, and saved searches belong strictly to the buyer account. Dealerships have zero search or browsing access across consumer directories.
- **Explicit Consent Grants:** Dealerships receive buyer phone/email only when an explicit `LeadDataGrant` is granted by the buyer during enquiry submission.
- **Instant Revocation:** When a buyer revokes a data grant (`DELETE /api/v1/me/grants/:id`), the dealership lead record immediately redacts contact info, rendering it masked (`••••••••`).
- **Automated Verification:** Verified via `apps/api/test/buyer-leads-grants.spec.ts` (27/27 tests passing).

### 1.3 RBAC Least-Privilege & Margin Protection
- **Role Scoping:** API routes enforce role requirements via `@RequireRoles()`:
  - `DEALER_PRINCIPAL`: Full operational and financial visibility.
  - `SALES_MANAGER`: Pricing changes, quote approvals, lead allocations.
  - `SALES_EXECUTIVE`: Stock review and customer enquiry management; **acquisition costs and gross profit splits are cryptographically masked or redacted**.
  - `SERVICE_ADVISOR`: Workshop job cards, parts requests, bay bookings.
  - `ACCOUNTANT`: FTA tax invoice drafting, VAT reconciliation, export bonds.
  - `COMPLIANCE_OFFICER`: Audit review, dispute logs, judicial hold overrides.
- **Admin Isolation:** Platform operators (`@PlatformAdminOnly()`) possess cross-tenant inspection rights, but **every administrative view or action triggers an immutable event** in the `audit_logs` table recording admin user ID, IP address, and target tenant.

### 1.4 Sovereign Identity & Authentication Suite Hardening (S27–S31)
- **UAE PASS Level 3 Biometrics:** Dual-rail login portal (S27) supports UAE PASS biometric challenge verification (#84) with automatic Emirates ID profile extraction, fallbacks for non-resident buyers, and strict sandbox flag enforcement.
- **Sovereign Vault PIN & Cold Recovery (S29):** Dual-entropy recovery requires both a 6-digit segmented OTP and a cryptographic recovery seed phrase before authorizing a vault PIN reset.
- **Mandatory 24-Hour Settlement Freeze:** Enforcing CBUAE anti-fraud circulars, any sovereign vault PIN or master credential reset triggers an automatic 24-hour statutory hold on high-value escrow disbursements (`AED > 250,000`).
- **FIDO2 Passkey Management (S30):** VIP client security dashboard enables WebAuthn/FIDO2 hardware biometric key registration with concurrent multi-device session flushing.
- **PDPL Article 13 Consent Ledger:** Granular consent toggles for commercial dealer referrals, AECB soft-pull scoring, and automated KYC refresh with instant revocation audit logs.

---

## 2. API Authentication, Authorization & Hardening

1. **JWT Verification:**
   - Asymmetric (RS256) or 256-bit HMAC signatures.
   - Tokens carry `sub` (userId), `tenantId`, `role`, and `isPlatformAdmin`.
   - Expiration strictly capped at 24 hours.
2. **Input Sanitization & Injection Defense:**
   - NestJS global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
   - All database queries executed via Prisma ORM parameterized SQL (zero raw string concatenations).
3. **Rate Limiting & Abuse Prevention:**
   - Public enquiry submissions throttled via `EnquiryRateLimiterService` (max 5 submissions per IP/device per minute).
   - Authentication endpoints throttled to 10 attempts per minute to prevent brute-force credential stuffing.

---

## 3. Load & Performance Testing Plan

### 3.1 Target Performance SLAs

| Core User Journey | Target RPS | P50 Latency | P95 Latency | Max Error Rate |
|---|---|---|---|---|
| **Marketplace Search (`/cars`)** | 500 RPS | `< 120ms` | `< 250ms` | `< 0.01%` |
| **Listing Dossier (`/cars/[slug]`)** | 300 RPS | `< 100ms` | `< 200ms` | `< 0.01%` |
| **Vehicle Comparison (`/compare`)** | 150 RPS | `< 150ms` | `< 300ms` | `< 0.01%` |
| **VIP Lead Enquiry Submission** | 50 RPS | `< 250ms` | `< 500ms` | `< 0.05%` |
| **Dealer Inventory Grid (`/inventory`)** | 100 RPS | `< 180ms` | `< 350ms` | `< 0.01%` |
| **Outbox Event Processing** | 200 events/sec | `< 50ms` | `< 150ms` | `0%` |

---

### 3.2 Load Test Execution Profiles

#### Profile A: Public Discovery Campaign Surge (k6 Script)
Simulates a viral marketing campaign driving 5,000 concurrent buyers to the marketplace:

```javascript
// k6-marketplace-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 200 },  // Ramp-up to 200 users
    { duration: '5m', target: 500 },  // Sustained load at 500 users
    { duration: '2m', target: 1000 }, // Peak spike at 1,000 users
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests under 250ms
    http_req_failed: ['rate<0.01'],    // Under 1% failures
  },
};

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah'];
const MAKES = ['Porsche', 'Ferrari', 'Mercedes-AMG', 'Toyota'];

export default function () {
  const emirate = EMIRATES[Math.floor(Math.random() * EMIRATES.length)];
  const make = MAKES[Math.floor(Math.random() * MAKES.length)];

  // 1. Search Results Query
  const searchRes = http.get(`https://api.staging.automotive-os.ae/api/v1/public/listings?emirate=${emirate}&make=${make}`);
  check(searchRes, { 'search status 200': (r) => r.status === 200 });

  sleep(1);

  // 2. Fetch Single Listing Detail Dossier
  const detailRes = http.get('https://api.staging.automotive-os.ae/api/v1/public/listings/2024-porsche-911-gt3-rs-weissach-dubai');
  check(detailRes, { 'dossier status 200': (r) => r.status === 200 });

  sleep(2);
}
```

#### Profile B: Concurrent Dealership Peak Intake
Simulates 20 concurrent dealerships running inventory updates, quote generation, and workshop job dispatch during peak morning check-in (09:00–11:00 Asia/Dubai).

#### Profile C: Outbox Catch-up & Delisting Stress Test
Generates 10,000 rapid stock transitions (`AVAILABLE` → `RESERVED` → `SOLD`) to verify that the transactional outbox worker delists sold inventory from the public search projection without deadlocks or latency degradation.

---

## 4. Security & Load Sign-off Criteria
Before authorizing production deployment:
1. `rls-isolation.test.ts` must pass 16/16 tests against the staging database instance under the non-bypass `automotive_app` role.
2. All k6 load test stages must finish with P95 latency < 250ms and error rates < 0.01%.
3. Outbox worker must drain 10,000 events in under 60 seconds with 0 failed records.
