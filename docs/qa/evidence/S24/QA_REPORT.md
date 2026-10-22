# S24 — Zero-Rated GCC Export & Customs Bond Discrepancy: QA Verification Report

**Screen:** S24 (`apps/dealer/app/accounting/exception/export/page.tsx`)  
**Stitch Screen ID:** `f2549d0dc269410ebc65bcfa2240280c`  
**Timestamp:** 2026-10-22T06:41:45.992Z  
**Result:** VERIFIED_PASS (19/19 checks passed)

## Visual Parity & Evidence
- **Desktop 1440px Viewport**: `docs/qa/evidence/S24/desktop_1440.png`
- **Arabic RTL Viewport**: `docs/qa/evidence/S24/arabic_rtl.png`
- **Mobile 390px Viewport**: `docs/qa/evidence/S24/mobile_390.png`
- **Interactive ZATCA Audit Dossier Modal**: `docs/qa/evidence/S24/modal_zatca_dossier.png`

## Automated Verification Suite
| # | Verification Gate | Result | Notes |
|---|-------------------|--------|-------|
| 1 | HTTP 200 Response on /accounting/exception/export | PASS | Status code: 200 |
| 2 | P1 Concept Roadmap Hero Banner & Statutory Badges (Decree-Law 8 Art. 45, ZATCA Protocol) | PASS | Badge: true, Law: true, ZATCA: true, Title: true |
| 3 | Urgent Customs Bond Discrepancy Alert Strip & 90-Day Clock Telemetry (Day 78/90, 12 Days Left, AED 210k Lien) | PASS | Alert: true, Clock: true, Lien: true |
| 4 | Operational KPI Telemetry Bar (AED 30.69M Cleared, AED 210k Lien, AED 4.20M GCC Volume, 90d Window) | PASS | Revenue: true, Lien: true, GCC: true, Clock: true |
| 5 | Interactive Zero-Rated Export Tax Invoice (INV-2025-0140, Bayan BAY-99812-25, SF90 XX, Arabic Mirror) | PASS | Inv: true, Bayan: true, Buyer: true, SF90: true, Bilingual: true |
| 6 | High-Fidelity SVG TLV QR Code & Cryptographic SHA Hash (ZATCA Bilateral Cross-Border Stamp) | PASS | SVG: true, TLV: true, Hash: true, Callout: true |
| 7 | Dual-Ledger Escrow Settlement Matcher (FAB Escrow vs Dealership GL, AED 210k Variance) | PASS | DualLedger: true, FAB: true, ERP: true, Variance: true |
| 8 | Corporate Tax & Bond Status (0% QFZP Rate, AED 210k Exposure, 62% Mainland / 38% Bonded Split) | PASS | BondStatus: true, QFZP: true, Contingent: true, Split: true |
| 9 | Customs Resolution Dossier & Bayan Reconciliation Ratio (13/14 Reconciled, 1 Pending Bayan) | PASS | Dossier: true, Ratio: true |
| 10 | Uncontested Escrow Principal Release Flow (AED 3.99M Disbursed) | PASS | Btn: true, Toast: true |
| 11 | ZATCA Cross-Border Customs Audit Dossier Modal (#GCC-KSA-ZATCA-2025-99812, Batha Border) | PASS | ZATCA modal rendered with protocol ref: true |
| 12 | FTA Article 45 Export Extension Appeal Modal Flow (+30 Calendar Days Granted) | PASS | Modal: true, Feedback: true |
| 13 | Upload Certified Port of Exit Bayan Flow & Immediate Discrepancy Cure (Lien Cleared, 14/14 Reconciled) | PASS | Modal: true, Cured Toast: true, Reconciled: true |
| 14 | FAB Escrow Sovereign Trust Deed Modal (First Abu Dhabi Bank IBAN, LC Guarantee) | PASS | Escrow Deed modal rendered: true |
| 15 | Peppol BIS 3.0 / UBL 2.1 Zero-Rated Export XML Inspection Modal | PASS | XML modal rendered with zero-rated export schema: true |
| 16 | Demonstrator Interactive State Switcher (Standard, Trade-in Offset, Audit Discrepancy Flag) | PASS | Standard: true, TradeIn: true, Audit: true |
| 17 | RBAC Least-Privilege Role Masking (Sales Rep hides Contingent Tax Exposure & Escrow Hold) | PASS | Confidential tax lien masked with bullets: true |
| 18 | Arabic RTL Layout & Bilateral Localization (dir="rtl", Arabic export discrepancy headers) | PASS | RTL: true, Title: true, Arabic Invoice: true |
| 19 | Mobile Responsive Viewport (390px) without horizontal clipping or structural blowout | PASS | Mobile content rendered without blowout: true |

## Statutory Compliance & Integration Truth
- **FTA Article 45 Direct Export Mandate**: Compliant with Federal Decree-Law No. (8) on Value Added Tax and Article 45 of Executive Regulations, enforcing a 90-day statutory clock for Port of Exit Bill of Lading (Bayan) confirmation to sustain 0% zero-rated VAT.
- **ZATCA Cross-Border Protocol**: Direct reconciliation between Dubai Customs declaration #BAY-99812-25 and Saudi ZATCA electronic customs clearance at Batha/Salwa border terminal.
- **Escrow Statutory Tax Lien**: Quarantines a 5% contingent VAT exposure (AED 210,000.00) in First Abu Dhabi Bank (FAB) sovereign escrow trust while releasing uncontested principal (AED 3,990,000.00) to the dealership.
- **Least-Privilege RBAC**: Contingent tax exposure amounts and dual-ledger escrow variance holds are strictly masked when accessed via Sales Representative credentials.
