# Stitch UI/UX re-audit — 2026-10-26 (GitHub fix branch)

**Stitch authority:** `docs/implementation/STITCH_SCREEN_MAP.csv` lists 31 screens in project `4467699827252507387`. Compare to actual full-resolution Stitch exports; do not infer parity from route existence, typecheck, old screenshots or sample data.

**Branch:** `fix/stitch-frontend-parity` from main `3baefab5`, PR #12 (draft). Changes not merged or deployed at writing. The re-audit is source-based; **no fresh 31-screen browser screenshot or authenticated flow was executed in this chat**.

| Gate | Evidence/status |
| --- | --- |
| 31 Stitch identifiers mapped to source routes | 31/31 mapped; S03 shares /cars sheet |
| Root route UX boundaries | Added 3 each (loading, error, not-found) to all 3 apps |
| Public catalog API handling | Now fails visibly instead of silently returning design fixtures for broken/empty endpoints |
| Vehicle detail API | Proper 404 and error propagation instead of a fabricated Porsche dossier |
| Enquiry submission | Simulated success blocked outside explicitly opted-in local preview; real buyer auth pending |
| Marketplace result pagination and sorting | Added API-backed page/limit/total, URL state, q and price sorting; awaiting deployed browser test |
| Vehicle images | Card now has non-network fallback if asset URL fails |
| Dealer listing actions | Auth-gated persistent submit and unpublish API/outbox/audit; unavailable until a real authenticated dealer session is wired |
| Dealer CSV | Actual visible rows export as CSV; not represented as an official RTA export |
| Bulk dealer actions | Fake alerts/state-only updates removed or disabled; real multi-row APIs still needed |
| Admin KYB and moderation decisions | Simulated successful writes removed; API rejection remains an error |
| Admin dashboard external operations | Buttons disabled; prominent synthetic staging context banner |
| Dealer/admin mobile navigation | Added responsive offsets, toggle buttons and Escape behavior; live mobile regression pending |
| Old inert navigation | Disabled unsupported Dealer and Platform links rather than allowing no-op clicks |
| Latest typecheck/test/build | Refer to PR #12 CI (not guaranteed until latest SHA passes) |
| **Current Stitch visual parity** | **NOT VERIFIED** — no current live-vs-full-resolution Stitch screenshot comparisons |
| **Current full E2E parity** | **NOT VERIFIED** — buyer and dealer authenticated flows are incomplete |

## Remaining High/Critical gaps — no false closure

1. **Buyer authentication and enquiry flow**: real identity/session token integration and persisted enquiry from S07, plus signed-in S08–S11 account experience. Current staged enquiry deliberately fails closed.
2. **Dealer authenticated operations**: `sessionStorage.automotive_dealer_access_token` is only a provisional integration point. There is not yet a verified dealer sign-in that supplies this value; no end-to-end listing status change is certified. Prefer a server-managed httpOnly session rather than extending this provisional mechanism to production.
3. **Admin live authentication**: verify basic/staging auth (Railway domain currently restricted), fake header bypass rejection, backend authorization and actual moderation event persistence.
4. **Remaining design parity**: measured Stitch-vs-current screenshots at 390, 768, 1024, 1440 widths, Arabic RTL, alignment, typography, modal focus, image crops, accessibility, visual-diff thresholds, all S01–S31.
5. **P1 demo-only screens** (S17–S26): numerous demo fixtures and simulated financial/regulatory interactions. Label and gate or integrate real backend per design; never claim escrow, legal, or banking automation.
6. **Missing broader Dealer destinations**: appointments, RTA compliance and settings are currently non-clickable with explicit feature gating, not complete live pages.
7. **Admin global lists and ancillary calls**: some API reads still merge fixture values; must be reviewed separately and replaced with truthful error/empty states.
8. **Search UX**: check keyboard focus trap and mobile sheet, history back/forward, request races, paging with filters, and count correctness against actual API.
9. **Performance and UI states**: validate on-load LCP, image network failures, API 401/403, no global horizontal scroll or overlapping fixed sidebars on deployed Railway.
10. **Production scope**: no Cloudflare production modifications as part of this PR.

## Next verification

Run `pnpm exec playwright test -c tests/stitch-parity/playwright.config.ts` against Railway staging with authorized credentials. Failures indicate actionable defects, **not** reason to relabel results as PASS. Capture current and Stitch reference images at identical viewport and content; update `SCREEN_COVERAGE.csv` only after live validated evidence. 
