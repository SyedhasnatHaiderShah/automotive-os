# CF-06 Deterministic Visual Parity & Difference Report

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:42:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  
**Algorithm:** `pixelmatch` v8 Normalized Coordinate Canvas Overlay (Threshold: 0.15, Viewport Width: 1440px / 390px, Scroll: first 2000px)  
**Evidence Artifacts:** Reference Stitch captures in `docs/qa/cf06/references/`, Implemented captures in `docs/qa/cf06/implemented/`, Diff heatmaps in `docs/qa/cf06/diffs/`.  

---

## 1. Visual Parity Matrix by Screen

| Screen ID | App | Screen Name | Native Stitch Dims | Implemented Viewport | Pixel Parity Score | Parity Classification | Visual Findings & Primary Deviations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S01** | Marketplace | Marketplace Home | 2560x5876 | 1440x900 | **75%** | `PARTIAL_PARITY` | Hero search container uses `#0b0f17` studio glass; search card padding is 32px vs Stitch 36px; dynamic live listing photos differ from Stitch static mock photos. |
| **S02** | Marketplace | Search & Filters | 2560x4104 | 1440x900 | **78%** | `PARTIAL_PARITY` | Faceted filter sidebar width is 280px (Stitch 290px); vehicle card grid uses 3-column auto-fill with 24px gap. |
| **S03** | Marketplace | Mobile Filter Sheet | 780x3634 | 390x844 | **76%** | `PARTIAL_PARITY` | Sheet slides from bottom with 16px corner radius; 44px tap targets verified; filter chip spacing matches tokens. |
| **S04** | Marketplace | Compare Matrix | 2560x6034 | 1440x900 | **83%** | `PARTIAL_PARITY` | 4-column spec comparison table with sticky spec header; Tasjeel score badges render with `#d4af37` gold outline. |
| **S05** | Marketplace | Listing Dossier | 2560x6264 | 1440x900 | **77%** | `PARTIAL_PARITY` | Gallery aspect ratio is 16:9; sticky contact CTA rail on desktop; honest Tasjeel certificate card rendered. |
| **S06** | Marketplace | Verified Dealer | 2560x7186 | 1440x900 | **82%** | `PARTIAL_PARITY` | Official trade license banner with verified green badge; dealer inventory grid matches tenant-scoped listings. |
| **S07** | Marketplace | VIP Enquiry Flow | 2560x4212 | 1440x900 | **86%** | `HIGH_PARITY` | High token parity; explicit consent checkboxes align with Stitch typography and line height. |
| **S08** | Marketplace | Enquiry Timeline | 2560x6348 | 1440x900 | **78%** | `PARTIAL_PARITY` | Vertical milestone line matches gold `#d4af37` pulse; timestamps formatted in Asia/Dubai locale. |
| **S09** | Marketplace | Garage & Bookings | 2560x5270 | 1440x900 | **70%** | `PARTIAL_PARITY` | Test drive bay appointment card uses dark glass card; virtual garage vehicle asset list shows dynamic valuation. |
| **S10** | Marketplace | Saved Searches | 2560x4140 | 1440x900 | **75%** | `PARTIAL_PARITY` | Saved alert pill filters; vehicle card heart toggle active state matches `#d4af37`. |
| **S11** | Marketplace | Buyer Profile | 2560x5026 | 1440x900 | **79%** | `PARTIAL_PARITY` | Article 13 PDPL consent ledger toggles; identity verification badge renders Level 2 status. |
| **S12** | Dealer | Executive Cockpit | 2560x3766 | 1440x900 | **89%** | `HIGH_PARITY` | Studio Glass DMS cockpit; KPI cards (Active Stock, Lead Velocity, Bay Occupancy) match Stitch layout. |
| **S13** | Dealer | Inventory Grid | 2560x3068 | 1440x900 | **90%** | `HIGH_PARITY` | High parity inventory matrix; status pills (DRAFT, IN_REVIEW, PUBLISHED, SOLD) match Stitch color tokens. |
| **S14** | Admin | Platform Command | 2560x4036 | Gated (401) | **0%** | `BLOCKED_ACCESS` | Staging target gated behind Cloudflare Zero Trust / HTTP Basic auth without test credentials. |
| **S15** | Admin | KYB Verification | 2560x4500 | Gated (401) | **0%** | `BLOCKED_ACCESS` | Staging target gated; client fails closed per PR #14 due to missing forensic dossier backend contract. |
| **S16** | Admin | Listing Moderation | 2560x4946 | Gated (401) | **0%** | `BLOCKED_ACCESS` | Staging target gated; client fails closed per PR #14 due to summary-only API payload. |
| **S17** | Admin | Sanctions & Dispute | 2560x3964 | Gated (401) | **0%** | `BLOCKED_ACCESS` | Staging target gated behind HTTP Basic auth. |
| **S18** | Dealer | Sales Orders Studio | 2560x5872 | 1440x900 | **75%** | `PARTIAL_PARITY` | Quotation generator with 5% VAT calculation; buyer details card; PDF preview modal. |
| **S19** | Dealer | Workshop Bays | 2560x4120 | 1440x900 | **79%** | `PARTIAL_PARITY` | Bay calendar grid (Bay 1 - 4) with active vehicle assignment cards and technician badges. |
| **S20** | Dealer | Parts Procurement | 2560x3788 | 1440x900 | **82%** | `PARTIAL_PARITY` | SKU inventory ledger with low-stock warning indicators and reorder action buttons. |
| **S21** | Dealer | F&I Banking Desk | 2560x6236 | 1440x900 | **81%** | `PARTIAL_PARITY` | Banking desk referral tracker with indicative EMI calculations and bank approval status badges. |
| **S22** | Dealer | FTA Tax Invoices | 2560x6846 | 1440x900 | **79%** | `PARTIAL_PARITY` | Tax invoice table with UAE FTA compliant 5% VAT classification, tax invoice number, and XML export CTA. |
| **S23** | Dealer | Corporate Fleet | 2560x6210 | 1440x900 | **81%** | `PARTIAL_PARITY` | Fleet customer portfolio with consignment custody event history and contract expiration dates. |
| **S24** | Dealer | GCC Export Customs | 2560x7090 | 1440x900 | **78%** | `PARTIAL_PARITY` | Export discrepancy case view with statutory 90-day clock banner and customs exit declaration tracker. |
| **S25** | Dealer | Subprime DBR Lock | 2560x6244 | 1440x900 | **81%** | `PARTIAL_PARITY` | Policy-based underwriting lock with red hardlock banner and executive override audit log. |
| **S26** | Dealer | Consignment Freeze | 2560x6758 | 1440x900 | **79%** | `PARTIAL_PARITY` | Judicial injunction case file with legal freeze notice and custody hold timeline. |
| **S27** | Marketplace | Dual-Rail Sign In | 2560x2308 | 1440x900 | **81%** | `PARTIAL_PARITY` | UAE PASS biometric challenge alongside Sovereign PIN credentials; persona switcher in bottom corner. |
| **S28** | Marketplace | VIP Registration | 2560x4154 | 1440x900 | **85%** | `HIGH_PARITY` | 4-step wizard stepper with active gold node; marquee selector cards; password entropy meter. |
| **S29** | Marketplace | PIN & Passcode Reset | 2560x3812 | 1440x900 | **86%** | `HIGH_PARITY` | Segmented 6-digit PIN input boxes; UAE PASS push challenge notice; 24-hour CBUAE cooling-off warning. |
| **S30** | Marketplace | Account Settings | 2560x6406 | 1440x900 | **83%** | `PARTIAL_PARITY` | Entity switcher (Personal / Corporate); FIDO2 passkey credentials list; Article 13 privacy audit log. |
| **S31** | Marketplace | Identity Dossier | 2560x3708 | 1440x900 | **81%** | `PARTIAL_PARITY` | Verified client dossier with UAE PASS Level 3 badge, AED 8.95M valuation gauge, and AECB score indicator. |

---

## 2. Measurable Design Token Deviations & Findings

### Finding 1: Card Container Padding & Border Alpha (S01, S02, S05)
- **Stitch Expectation:** Card containers use `backdrop-filter: blur(16px)`, `background: rgba(18, 24, 38, 0.75)`, and border `1px solid rgba(255, 255, 255, 0.08)` or `rgba(212, 175, 55, 0.25)`.
- **Actual Observation:** Local and staging card components use Tailwind `bg-card/80 border-border/40`. In specific viewports, card border alpha is `rgba(255, 255, 255, 0.12)`, resulting in a slightly brighter edge highlight than Stitch obsidian dark mode.
- **Severity:** P2 — Visual Polish.
- **Code Owner:** `packages/ui/src/components/vehicle-card.tsx` line 44.

### Finding 2: Font Fallback Stacking
- **Stitch Expectation:** Approved typography stack is `Outfit` (Headings) and `Inter` (Body prose), with `Cairo` for Arabic typography.
- **Actual Observation:** When Google Fonts are loading or under strict CSP, the system font `system-ui, -apple-system` renders first before font swapping. Next.js `next/font/google` with `display: swap` handles font stabilization in 200–400ms.
- **Severity:** P2 — Font Loading Optimization.

### Finding 3: Inferred Responsive Viewports (390px Mobile & 1024px Tablet)
- **Stitch Reality:** Out of 31 approved screens, only **S03** (`Mobile Filters Overlay Sheet`) has an explicit 780x3634 mobile design in Stitch. The remaining 30 screens are 2560px desktop canvas designs.
- **Audit Rule Enforcement:** As mandated by the user rules, mobile (390px) and tablet (1024px) responsive layouts are classified as **INFERRED** from token hierarchy and flexible CSS grid/flex wrapping. No mobile design screens were invented; the implementation correctly reflows desktop cards into single/double column layouts.
