# Stitch design inventory — user-supplied final outcome

Authority: user-provided Stitch design inventory (26 screens), **not** an independently fetched Stitch export. Fetch each actual design by ID using Stitch MCP or verified export before declaring visual parity.

Approved design direction: **Obsidian & Studio Glass** dark mode; gold `#d4af37` accent, Outfit font, ~8px corner radius geometry, translucent glass cards, hairline borders. Use actual Stitch tokens if they differ; never extrapolate colors for missing states. English/Arabic RTL and AED formatting. This FINAL description supersedes earlier generic light-dashboard suggestions unless actual approved screen exports establish otherwise.

Screen source of truth: `docs/implementation/STITCH_SCREEN_MAP.csv` populated by real Stitch screen identifiers/assets. One row per design is in `SCREEN_COVERAGE.csv`. The UI is **design intent**, not evidence of live banking, government, escrow or compliance integrations. Real data and authorization determine which UI states can be presented.

## Group A — Public discovery (S01–S04)
S01 marketplace home/search; S02 results/filter grid; S03 mobile filter sheet; S04 four-way comparison.

## Group B — Detail/transaction (S05–S07)
S05 vehicle detail dossier; S06 verified dealer storefront; S07 enquiry and consent.

## Group C — Buyer workspace (S08–S11)
S08 enquiry progress; S09 appointments, test drives and virtual garage; S10 saved searches/favorites; S11 profile/privacy.

## Group D — Dealer operations (S12–S13)
S12 executive dashboard; S13 inventory grid and lifecycle.

## Group E — Platform administration (S14–S17)
S14 governance dashboard; S15 KYB review; S16 listing moderation/risk; S17 sanctions and escrow disputes (gated).

## Group F — Extended DMS (S18–S23)
S18 quotes/sales orders; S19 workshop/bays; S20 parts/procurement; S21 F&I referral/banking (gated); S22 tax invoices/accounting settlement (gated); S23 fleet/consignment.

## Group G — High-risk exceptions (S24–S26)
S24 customs/VAT export exception; S25 F&I DBR/LTV exception; S26 court-injunction custody freeze. These must not be presented as live regulatory automation without validated laws, evidence and integrations.

## Non-negotiables
- Never present design sample values as actual production metrics or compliance decisions.
- AECB, UAE PASS, RTA/Tasjeel, FTA, CBUAE, DED, DIFC, insurers, banks and court systems require approved credentials, legal rights, documented contractual APIs and field-by-field provenance before being marked `LIVE_VERIFIED`.
- Existing users, projects, code and migrations take precedence over any generated scaffold; audit first.
