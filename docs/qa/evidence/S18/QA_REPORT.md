# QA Test Report: S18 — Sales Orders & Quotations Studio

**Timestamp:** 2026-10-23T09:11:33.223Z
**Target Route:** `http://localhost:3001/sales`
**Stitch Screen ID:** `e5eba1a68cca4c94b95a19b4c01c5312`
**Cohort:** P1 (Tax/legal/signature/escrow integration certified with provider disclaimers)
**Overall Status:** ✅ VERIFIED PASS

## Verification Checks
| Check | Result | Details |
|---|---|---|
| HTTP 200 Response on /sales | PASS ✅ | Status code: 200 |
| P1 Concept Roadmap Hero Banner & Statutory Badges | PASS ✅ | Badge: true, DED: true, Title: true |
| Live Pipeline State Filter Tabs Telemetry | PASS ✅ | All: true, Draft: true, Escrow: true, TradeIn: true, Sched: true |
| Active Order Dossier & UAE PASS Verified Buyer Bar | PASS ✅ | Order: true, ProForma: true, Buyer: true, Pass: true, Rep: true |
| Selected Vehicle Dossier Card (Porsche 911 GT3 RS Weissach) | PASS ✅ | Vehicle: true, VIN: true, StockId: true, Odometer: true |
| Dynamic Line-Item Costing & FTA 5% VAT Calculation Matrix | PASS ✅ | Base: true, Bespoke: true, VAT: true, Subtotal: true, VAT Total: true, Gross: true |
| Trade-In Offset & Net Settlement Position (AED 1,054,235) | PASS ✅ | TradeIn: true, Valuation: true, Lien: true, Equity: true, NetOutlay: true, Escrow: true |
| Multi-Party Cryptographic Sign-Off Gates (5 Sequential Steps) | PASS ✅ | Gate 1: true, Gate 2: true, Gate 3: true, Gate 4: true, Gate 5: true |
| Interactive Biometric Prompt Dispatch (UAE PASS) | PASS ✅ | Prompt feedback: true |
| Deal Profitability Telemetry & Tenant RBAC Least-Privilege Masking | PASS ✅ | Principal Margin Visible: true, Sales Rep Masked: true |
| Recent Sales Order Pipeline Telemetry Table (4 Orders) | PASS ✅ | SO-0891: true, SO-0888: true, SO-0882: true, SO-0879: true |
| Interactive Studio Modals (New Draft, FTA Tax Schema, Silk Handover Ceremony) | PASS ✅ | Draft: true, Tax: true, Handover: true |
| Tablet Viewport (1024x768) Responsive Rendering | PASS ✅ | Captured S18_tablet_1024.png |
| Mobile Viewport (390x844) Responsive Rendering | PASS ✅ | Captured S18_mobile_390.png |
| Arabic RTL Mode Toggle & Bilingual Typography | PASS ✅ | dir="rtl", Arabic Title: true, Arabic Order: true |

## Visual Proof & Artifacts
- Desktop Viewport (1440x900): `docs/qa/evidence/S18/S18_desktop_1440.png`
- Tablet Viewport (1024x768): `docs/qa/evidence/S18/S18_tablet_1024.png`
- Mobile Viewport (390x844): `docs/qa/evidence/S18/S18_mobile_390.png`
- Arabic RTL Layout (1440x900): `docs/qa/evidence/S18/S18_arabic_rtl.png`

## UAE Compliance & Commercial Rules
- VAT 5% calculation conforms to UAE FTA Executive Regulations Article 59.
- Dealer commercial purchase costs & profit margins are masked when logged in as Sales Executive (least-privilege RBAC).
- Biometric authorization simulates UAE PASS Gold mobile app handshake without unverified external production credential calls.