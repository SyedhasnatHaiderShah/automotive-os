# S16 — Vehicle Listing Moderation & VIN Risk Review Evidence Report

**Screen ID:** S16  
**Stitch ID:** `8ac37f225c8e44ff8d99e824c784ccd7`  
**Route:** `/moderation/listings/mod-9921` in `apps/admin`  
**Execution Timestamp:** 2026-10-23T09:11:14.238Z  
**Verification Result:** PASS (14/14 checks passed)

---

## 1. Executive Summary
S16 implements the Vehicle Listing Moderation & VIN Risk Review in `apps/admin/app/moderation/listings/[id]/page.tsx`, strictly aligned with approved Stitch screen `8ac37f225c8e44ff8d99e824c784ccd7`. The screen delivers a high-security vehicle asset verification and moderation terminal for platform administrators, complete with a physical showroom media audit (6-plate studio mosaic with GPS/EXIF matching), specification & telemetry attestation table (VIN, cooling spec, asking price, odometer, ECU stage), critical discrepancy alert engine (PR-8Z4 tropical cooling kit mismatch), integrity & anti-fraud scans (duplicate detection, Al Quoz BLE beacon, Central Bank liens), 4-tier sovereign adjudication terminal, and a fast-triage moderation queue pipeline ribbon.

---

## 2. Verified Capabilities & Verification Evidence

| # | Check / Feature | Status | Details |
|---|---|---|---|
| 1 | HTTP 200 Response on /moderation/listings/[id] | **PASS** | Status code: 200 |
| 2 | Top Super-Governance Audit Strip & Priority P1 Flags | **PASS** | Audit Code: true, Priority: true, Flag: true |
| 3 | Vehicle Dossier Title & Dealership Accreditation Metadata | **PASS** | Title: true, Dealer: true, DED: true |
| 4 | Top Quick Action Controls (Approve & Publish / Reject & De-list) | **PASS** | Approve and Reject buttons visible: true |
| 5 | Showroom Media Audit (6-Photo Mosaic & Camera EXIF Signature) | **PASS** | Header: true, GPS: true, Photos: 6, Coords: true, Camera: true |
| 6 | Specification & Telemetry Attestation Table (5 Verified Parameters) | **PASS** | VIN: true, Spec Mismatch: true, Price: true, Odo: true, Engine: true |
| 7 | Cryptographically Attached Dossier Documents (Tasjeel, Mulkiya, Warranty) | **PASS** | Tasjeel: true, Mulkiya: true, Warranty: true |
| 8 | Critical Discrepancy Engine Alert Card (PR-8Z4 Tropical Retrofit Check) | **PASS** | Title: true, Retrofit: true, Radiator: true, Act: true |
| 9 | Integrity & Anti-Fraud Scans (Duplicates, BLE Beacon, Central Bank Liens) | **PASS** | Duplicates: true, Beacon: true, Liens: true |
| 10 | Sovereign Adjudication Terminal (4 Options, Citation Box, Compliance Attestation) | **PASS** | All radio choices, citation textarea, and commit button visible: true |
| 11 | Interactive Adjudication Execution & Immutable Outbox Ledger Broadcast | **PASS** | Ledger confirmation notification: true |
| 12 | Moderation Queue Pipeline Ribbon (4 Fast-Triage Queued Vehicles) | **PASS** | Pipeline: true, Ferrari: true, G63: true, Cullinan: true, Revuelto: true |
| 13 | Multi-device Responsive & Arabic RTL Screenshots Generated | **PASS** | Captured: 1440px, 1024px, 390px, and Arabic RTL |
| 14 | Stitch Approved Design Reference Comparison | **PASS** | Matched against stitch-admin-moderation.png (Obsidian Dark, Studio Glass dossiers, Outfit/Inter typography, Gold accents) |

---

## 3. Visual Artifacts
- Desktop 1440px: `docs/qa/evidence/S16/s16-desktop-1440.png`
- Tablet 1024px: `docs/qa/evidence/S16/s16-tablet-1024.png`
- Mobile 390px: `docs/qa/evidence/S16/s16-mobile-390.png`
- Arabic RTL: `docs/qa/evidence/S16/s16-arabic-rtl.png`
