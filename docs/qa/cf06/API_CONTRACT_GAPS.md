# CF-06 Backend Contract & Data Truth Audit Report

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:32:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  
**Staging Target Probed:** `https://api-staging.syedhasnat.com`  
**Database Connection:** Connected (`PostgreSQL 16`)  
**Audit Policy:** Zero Trust, Truth in Telemetry, Defense-in-Depth Tenant Boundary Enforcement.

---

## 1. Executive Contract Summary

| Endpoint / Action | Method | Expected Status | Staging Actual Status | Contract Conformance | Assessment / Blocker |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | GET | 200 | **200 OK** | **FULL_PASS** | Returns uptime (~134k s), nodeVersion, database `connected`. |
| `/api/v1/public/listings` | GET | 200 | **200 OK** | **FULL_PASS** | Returns published stock with prices, specs, dealer relationship, and image media. Redacts wholesale margins and sensitive data. |
| `/api/v1/public/listings?emirate=Sharjah` | GET | 200 | **200 OK** | **FULL_PASS** | Faceted filtering by emirate functions truthfully. |
| `/api/v1/public/listings?page=1&limit=5` | GET | 200 | **200 OK** | **FULL_PASS** | Pagination boundary parameters supported. |
| `/api/v1/public/dealers/:slug` | GET | 200 | **200 OK** | **FULL_PASS** | Verified storefront endpoint (`gargash-autos`, `al-futtaim-prestige`). |
| `/api/v1/public/dealers` | GET | 200 | **404 Not Found** | **CONTRACT_GAP** | `PublicDealersController` lacks a collection GET endpoint for all verified dealers. |
| `/api/v1/tenants/:tenantId/vehicles` | GET | 401 | **401 Unauthorized** | **FULL_PASS** | Unauthenticated requests to private dealer inventory are rejected fail-closed. |
| `/api/v1/tenants/:tenantId/leads` | GET | 401 | **401 Unauthorized** | **FULL_PASS** | Unauthenticated access to dealer leads is strictly blocked. |
| `/api/v1/admin/listings` | GET | 401 | **404 Not Found** | **DEPLOYMENT_STALE** | Admin listings endpoint is not routed on the older staging build. |
| `/api/v1/admin/verifications` | GET | 401 | **404 Not Found** | **DEPLOYMENT_STALE** | Admin KYB endpoint is not routed on the older staging build. |
| `/api/v1/auth/login` | POST | 401 | **404 Not Found** | **ARCHITECTURAL_DECISION** | No direct password login endpoint. Auth uses dual-rail UAE PASS / dev token. |
| `/api/v1/auth/token` (Dev token) | POST | 403 in staging | **403 Forbidden** | **SECURITY_PASS** | Staging API strictly denies dev JWT generation per PR #11 security mandate. |

---

## 2. In-Depth Contract Analysis & Special Findings

### 2.1 PR #14 Codex Review Findings (S15 KYB Dossier & S16 Moderation Dossier)
**Context:**
The approved Stitch designs for S15 (KYB Dossier) and S16 (Moderation Review) define deep forensic inspection interfaces:
- **S15 KYB Requirements:** Beneficial ownership ledger (`BeneficialOwner[]` with equity %, Emirates ID, biometric verification level, PEP/sanctions search), showroom facility audit (`capacityHypercars`, climate control spec, Tasjeel bay, RTA telemetry uplink, civil defense certification).
- **S16 Moderation Requirements:** EXIF camera make/model/timestamp, GPS venue coordinates, ECU attestation, forensic scan pipeline triage (`scans[]`).

**Current Backend Reality:**
The NestJS API `AdminController` currently returns summary entities (`ListingSummaryDto` and `KybVerificationSummaryDto`).
In PR #14 (`4f1cdb2`), the client application was hardened to prevent rendering fabricated mock data when communicating with real APIs:
```typescript
// apps/admin/lib/api.ts
const data: unknown = await res.json();
if (!isModerationDossier(data)) {
  throw new Error('Detailed listing moderation evidence is unavailable from this API. No attestation has been verified.');
}
```
**Audit Conclusion on S15 / S16:**
These screens **fail closed** as intended. They cannot be certified as 100% functionally complete against production/staging until backend DTOs and Prisma migrations add the forensic dossier schema. They are marked **GATED_CONTRACT** with clear release blockers.

---

### 2.2 Dual-Rail Authentication & Identity Truth
- **S27 (Sign In):** Dual-rail design (UAE PASS biometrics + Emirates ID / PIN fallback).
- **Staging Reality:** Live UAE PASS authentication requires government OIDC client certificates and callback URL registrations (`https://stg-id.uaepass.ae`). In staging, a high-fidelity synthetic challenge is simulated.
- **Security Guard:** `POST /api/v1/auth/token` throws `ForbiddenException` in staging/production, ensuring development backdoor tokens cannot be minted in non-local environments.

---

### 2.3 Regulatory Integrations Truth Table Status

In accordance with `docs/implementation/INTEGRATION_TRUTH_TABLE.md`:
1. **UAE PASS:** Synthetic staging mock. Real integration requires approved TDRA credentials.
2. **Tasjeel / RTA Vehicle History:** Truthful static inspection score card. No fake live telemetry.
3. **AECB Credit Bureau (S21, S25, S31):** Indicative credit gauge (842/900). Labelled *Indicative Underwriting*.
4. **UAE FTA / E-Invoicing (S22, S24):** Cryptographic XML invoice preview and QR code verification per UAE FTA requirements. Live FTA clearance API marked *Coming Soon*.
5. **Ministry of Justice / Judicial Hold (S26):** Internal legal hold state machine. No automated court API.
6. **FAB Escrow Vault (S08, S17, S30):** Escrow milestone status tracked honestly. Funds disbursement requires licensed escrow partner.
