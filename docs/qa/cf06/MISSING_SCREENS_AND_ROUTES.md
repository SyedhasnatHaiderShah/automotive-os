# CF-06 Route Coverage, Missing Screens & Domain Audit

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:33:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  

---

## 1. Route Inventory & Coverage Status (S01–S31)

| Screen ID | App | Screen Name | Expected Route Path | Source Code Path | Route Existence | Staging Access Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S01** | Marketplace | Marketplace Home & Car Search | `/` | `apps/marketplace/app/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S02** | Marketplace | Search Results & Dealer Filters | `/cars` | `apps/marketplace/app/cars/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S03** | Marketplace | Mobile Filters Overlay Sheet | `/cars` (drawer) | `apps/marketplace/app/cars/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S04** | Marketplace | Vehicle Comparison Matrix | `/compare` | `apps/marketplace/app/compare/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S05** | Marketplace | Vehicle Listing Detail Dossier | `/cars/[slug]` | `apps/marketplace/app/cars/[slug]/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S06** | Marketplace | Verified Dealership Storefront | `/dealers/[slug]` | `apps/marketplace/app/dealers/[slug]/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S07** | Marketplace | VIP Enquiry & Consent Flow | `/cars/[slug]/enquiry` | `apps/marketplace/app/cars/[slug]/enquiry/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S08** | Marketplace | Buyer Enquiry Status Timeline | `/account/enquiries` | `apps/marketplace/app/account/enquiries/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S09** | Marketplace | Appointments & Virtual Garage | `/account/garage` | `apps/marketplace/app/account/garage/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S10** | Marketplace | Saved Searches & Favorites | `/account/saved` | `apps/marketplace/app/account/saved/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S11** | Marketplace | Buyer Profile & Privacy | `/account/profile` | `apps/marketplace/app/account/profile/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S12** | Dealer | Executive Overview Dashboard | `/dashboard` | `apps/dealer/app/dashboard/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S13** | Dealer | Vehicle Inventory Grid | `/inventory` | `apps/dealer/app/inventory/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S14** | Admin | Platform Operations Command | `/` | `apps/admin/app/page.tsx` | **EXISTS** | **BLOCKED_ACCESS (401 Auth)** |
| **S15** | Admin | KYB Verification Dossier | `/verifications/[id]` | `apps/admin/app/verifications/[id]/page.tsx` | **EXISTS** | **BLOCKED_ACCESS (401 Auth)** |
| **S16** | Admin | Listing Moderation & VIN Risk | `/moderation/listings/[id]` | `apps/admin/app/moderation/listings/[id]/page.tsx` | **EXISTS** | **BLOCKED_ACCESS (401 Auth)** |
| **S17** | Admin | Seller Sanctions & Disputes | `/disputes` | `apps/admin/app/disputes/page.tsx` | **EXISTS** | **BLOCKED_ACCESS (401 Auth)** |
| **S18** | Dealer | Sales Orders & Quotes Studio | `/sales` | `apps/dealer/app/sales/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S19** | Dealer | Workshop Job Card & Bays | `/workshop` | `apps/dealer/app/workshop/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S20** | Dealer | Parts & Automated Procurement | `/parts` | `apps/dealer/app/parts/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S21** | Dealer | F&I Referral & Banking Desk | `/finance` | `apps/dealer/app/finance/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S22** | Dealer | FTA Tax Invoices & Accounting | `/accounting` | `apps/dealer/app/accounting/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S23** | Dealer | Fleet & Consignment Portfolio | `/fleet` | `apps/dealer/app/fleet/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S24** | Dealer | GCC Export Customs Discrepancy | `/accounting/exception/export` | `apps/dealer/app/accounting/exception/export/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S25** | Dealer | Subprime DBR Exception Lock | `/finance/exception` | `apps/dealer/app/finance/exception/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S26** | Dealer | Consignment Custody Freeze | `/fleet/exception` | `apps/dealer/app/fleet/exception/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S27** | Marketplace | Sign In & UAE PASS | `/auth/login` | `apps/marketplace/app/auth/login/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S28** | Marketplace | VIP Registration & Account | `/auth/register` | `apps/marketplace/app/auth/register/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S29** | Marketplace | Forgot Password & Reset PIN | `/auth/forgot-password` | `apps/marketplace/app/auth/forgot-password/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S30** | Marketplace | Account Details & Settings | `/account/settings` | `apps/marketplace/app/account/settings/page.tsx` | **EXISTS** | **LIVE (200 OK)** |
| **S31** | Marketplace | User Profile & Identity Dossier | `/account/profile/dossier` | `apps/marketplace/app/account/profile/dossier/page.tsx` | **EXISTS** | **LIVE (200 OK)** |

---

## 2. Infrastructure & Routing Anomalies

### 2.1 Admin Staging Target Misconfiguration
- **Staging URL in Prompt:** `https://automotive-admin-staging.up.railway.app`
- **Result:** **HTTP 404 Not Found** (Railway Hikari edge).
- **Actual Active Staging Domain:** `https://admin-staging.syedhasnat.com`
- **Root Cause:** Platform admin was provisioned as an OpenNext Cloudflare Worker custom domain / Railway origin behind HTTP Basic Auth and Cloudflare Access, rather than bound to the default Railway `.up.railway.app` subdomain.

### 2.2 Public Dealers Collection Route Absence
- **Expected Endpoint:** `GET /api/v1/public/dealers`
- **Result:** **HTTP 404 Not Found** on staging API.
- **Root Cause:** In `apps/api/src/tenants/public-dealers.controller.ts`, only `GET :slug` is defined. No index handler `@Get()` exists to list all verified dealerships.

### 2.3 Unmapped 32nd Stitch Screen
- **Screen ID in Stitch API:** `e6d308659f274d20b9f2d3434d459c4f`
- **Title:** `VIP Checkout & Escrow Deposit Settlement`
- **Status:** Present in Google Stitch project `4467699827252507387`, but omitted from the approved 31-screen scope in `STITCH_SCREEN_MAP.csv`. Flagged for Phase 2 roadmap consideration.
