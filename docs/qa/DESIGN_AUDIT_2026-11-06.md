# Design, legibility and UI/UX audit — 2026-11-06

Scope: marketplace (buyer), dealer DMS and platform admin consoles on the local QA stack
(`automotive_os_qa`, API as the RLS role). Three methods, run in parallel:

1. **Measured in the browser** (`tests/e2e/design-audit.spec.ts`, `DESIGN_AUDIT=1`): 25 pages
   signed in as buyer / dealer OWNER / platform admin, at 1440 px and 390 px plus an Arabic (RTL)
   pass — real computed styles: text contrast against the effective background, text size, touch
   target size, accessible names, labels, image attributes, heading order, keyboard focus
   visibility, horizontal overflow. Raw data: `docs/qa/evidence/design-audit-2026-11-06/findings.json`
   (2,929 measurements), one full-page screenshot per page/viewport in the same folder.
2. **Static review against the Vercel Web Interface Guidelines** (all rule groups) of every page
   and component in the three apps and `packages/ui`. Full `file:line` findings:
   `docs/qa/evidence/design-audit-2026-11-06/review-marketplace.md`, `review-dealer.md`, `review-admin.md`.
3. **Visual review** of screenshots against the approved Stitch handoff (`docs/design/DESIGN_HANDOFF.md`).

Verdict: the three apps are structurally sound on the live flows (real links, URL-synced search and
pagination in the marketplace and dealer inventory, landmarks, `color-scheme: dark`, Dubai-time
helpers), but **the approved type scale is not actually applied anywhere**, text is routinely set
below legible size, modals and drawers are not keyboard-safe, Arabic parity is broken in the islands
that matter most, and most pages fail the touch-target floor on phones. Nothing was changed on 2026-11-06;
S1, S3, S4 and S5 were fixed on 2026-11-09 (section 5, which also corrects two measurements).

## 1. Systemic findings (fix once, fixes everywhere)

| # | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| S1 | **High** | **The Stitch type scale never compiles.** `packages/ui/src/tailwind-preset.ts` defines `headline-xl/lg/md/sm`, `body-lg/md/sm`, `label-caps`, `data-*` as `fontSize` entries (size, line-height, tracking, weight), but none of the three `tailwind.config.js` files uses `presets`; they only copy the `fontFamily` names. So `text-headline-sm`, `text-body-sm`, `text-label-caps` … (used ≈1,000× in dealer, ≈100× in admin, ≈100× in marketplace) emit **no CSS**; headings, KPI numbers and caps labels inherit 16px or whatever other utility is present. | `grep -c "\.text-body-sm{" apps/*/.next/static/css/app/layout.css` → 0 in all apps; `docs/qa/CODEBASE_KNOWLEDGE.md` G2 | Add `presets: [require('../../packages/ui/src/tailwind-preset')]` (or move tokens to the preset) in all three configs; delete the duplicated colour/font blocks. Then re-run the audit: many "tiny text" and "hierarchy" findings below are a symptom of this. |
| S2 | **High** | **Text below legible size everywhere.** 1,548 visible text nodes under 12px (9–11px) across the 25 pages: table headers (`text-[10px]`), KPI labels, status pills, "EN / عربي" toggles, breadcrumb, finance and cascade-delete disclaimers, action buttons (`listing-actions.tsx:70`), section `<h2>`s (`dashboard-cockpit-view.tsx:95`). Dealer inventory alone: 124 on desktop, 177 on mobile. | findings.json `tiny-text`; screenshots `dealer-inventory-*.png` | Floor at 12px for labels and 14px for body (Stitch `body-sm` is 12px — reserve it for captions). Replace `text-[9px|10px|11px]` with `text-xs`/`text-sm` and let hierarchy come from weight/tracking. |
| S3 | **High** | **Modals and drawers are not keyboard/screen-reader safe.** No initial focus, focus trap, focus return or `inert` background in: marketplace enquiry modal (`vip-enquiry-modal.tsx:159`), compare picker (`compare/page.tsx:503`, also no Escape or scroll lock), cars mobile filter sheet (`cars/page.tsx:620`), admin user drawer (`users/page.tsx:463`, declares `aria-modal` but traps nothing), dealer intake modal (`vehicle-intake-modal.tsx:23`), all 43 preview modals (`sales/page.tsx:1147…`). Only `apps/admin/components/AdminDialog.tsx` is correct. | measured: focus stays on trigger when the sheet opens (`findings.json`, mobile cars); static reviews | Extract `AdminDialog` into `packages/ui` and use it for every overlay. |
| S4 | **High** | **Off-canvas sidebars stay in the tab order when hidden.** Dealer and admin hide the sidebar on <1024px with `translateX(-100%)` only; every keyboard user tabs through 12+ invisible links on every page, and when open the drawer has no focus move/return, backdrop not tappable, body not scroll-locked. | `apps/dealer/app/globals.css:31`, `apps/admin/app/globals.css:30`, `dealer-sidebar.tsx:101`, `AdminSidebar.tsx:31` | `inert`/`visibility:hidden` when closed, `aria-controls` + focus management when open, `overflow:hidden` on body. |
| S5 | **High** | **Focus is invisible on the first tab stops.** `focus:outline-none` with no replacement on the marketplace header logo and emirate `<select>` (`packages/ui/src/components/header.tsx:36,73`), every vehicle-card image link (`vehicle-card.tsx:74`), admin filter selects (`users/page.tsx:261,280`). Measured: admin header icon buttons (notifications, universal search, emergency freeze, export) and dealer "Intake vehicle"/"Add vehicle" show no visible change on keyboard focus (55 instances). | findings.json `focus-not-visible` | Global `:focus-visible` ring in each `globals.css`; never `outline-none` without `focus-visible:ring-2`. |
| S6 | Medium | **Touch targets below 44px on phones** — 724 instances at 390px: header icon buttons 32×32, admin row actions 63×24 / 24×24 (audit expand), "Show password" 16×16, language toggles ≈28×20, filter links 95×17, dealer action buttons 32×36. Desktop also has 24px-floor misses (breadcrumb links, "Reset All", checkbox 16×16). | findings.json `small-target`; `admin-users-mobile.png` | `min-h-11 min-w-11` on icon buttons and row actions on `<md`; larger checkboxes (20px) with label hit area. |
| S7 | Medium | **Contrast failures on dim text.** Measured fails: `text-on-surface-variant/60` 4.45:1 at 12px (dealer sidebar disabled items, 108 nodes), header "Sell & Consign Soon" `/50` 3.56:1, `text-gray-500` 3.9–4.0:1 (auth checklist, footer, access pages), disabled "Intake Vehicle" `text-on-primary` on `bg-primary/40` **1.9:1**, admin `text-gray-600` ≈1.9:1 (`users/page.tsx:375,389`), error-page trace ids `text-outline/60` ≈2.6:1 (`dealer/app/error.tsx:35`, `admin/app/error.tsx:35`). Every alpha variant of `text-outline` and `text-on-surface-variant` fails AA on the card surfaces. | findings.json `contrast`; static reviews | Ban alpha-faded text tokens; add a `muted` token that passes 4.5:1 on `surface-container-high`; disabled = `opacity` on the whole control, not dark-on-dark. |
| S8 | Medium | **Arabic parity broken in the interactive islands.** Client islands and helpers are English-only or hard-code `en-US`/`en-GB`: dealer `lead-row-actions.tsx`, `listing-actions.tsx`, `preview-banner.tsx`, `formatAed`/`formatDubaiDateTime`/`humanizeEnum` (`dealer-api.ts:185,192,205`); marketplace `dealer-storefront-view.tsx:22` ignores the persisted locale, `enquiry-view.tsx:50` forces the EN modal, `dashboard`, `verify-email`, `access-*` pages, `vehicle-card` labels; admin `verifications/*`, `moderation/listings/[id]`, `error.tsx`, `not-found.tsx`. `useMarketplaceLocale` starts at `'en'` so Arabic content flashes English on every navigation (`layout.tsx:28`). Arabic plurals wrong (`i18n.ts:308`). Physical `left/right/pl/pr/text-right` utilities in auth, compare, vehicle-card, verifications. | static reviews; measured RTL pass shows `<html dir="rtl">` correct on all 6 sampled pages | Seed the locale hook from the server cookie (as `vehicle-detail-view` does); route all formatting through `Intl.*` with the active locale; add enum label maps to `i18n.ts`; swap physical utilities for logical ones. |
| S9 | Medium | **Destructive actions without confirmation or undo.** Buyer: revoke dealer access (`buyer-enquiries-view.tsx:256`, `buyer-profile-view.tsx:231`), delete saved search (`buyer-saved-view.tsx:230`). Dealer: lead status select PATCHes immediately incl. irreversible WON (`lead-row-actions.tsx:59`), Unpublish removes the public listing on click (`listing-actions.tsx:68`). Admin: provision dialog and data-console forms discard typed input on Escape/Cancel with no unsaved-changes guard. | static reviews | Reuse `ConfirmReasonModal`; add `beforeunload`/router guards on dirty forms. |
| S10 | Medium | **Layout breaks at 390px and 1024px.** Horizontal overflow measured on mobile cars (420px), dealer inventory (926px), admin users (459px), admin data (567px), data/Vehicle (1623px; also 1871px on desktop); admin header block "External gateways disconnected" overflows and overlaps the page title at 390px (`AdminHeader.tsx:62-79`) and bleeds under the heading on desktop data pages; dashboard AED KPI overflows its 2-col card (`dashboard-cockpit-view.tsx:98`); `AdminDialog` panel not scrollable on phones. | findings.json `horizontal-overflow`; `admin-users-mobile.png` | Truncate header labels, make wide tables `overflow-x-auto` with a sticky first column, `max-h-[100dvh] overflow-y-auto` on dialogs, responsive KPI sizes. |
| S11 | Medium | **No `prefers-reduced-motion` handling anywhere**; `animate-pulse`/`animate-spin`/`animate-ping`, hover `scale`, drawer transitions and `scrollTo({behavior:'smooth'})` always run; 279 interactive elements use `transition: all`. | findings.json `transition-all`; static reviews | One `@media (prefers-reduced-motion: reduce)` block per app; `transition-colors`/`transform` only. |
| S12 | Medium | **Icon-font text leaks into accessible names** in dealer and admin (Material Symbols spans without `aria-hidden`): sidebar items read "monitoring Operations Command", buttons "add_box Intake Vehicle". The marketplace fixed this earlier (QA-SI-03); dealer/admin did not. Also no `aria-current="page"` on active nav, no skip link on any page (56/56), heading levels skipped (h1→h3) on home, cars, dealers. | findings.json `no-skip-link`, `heading-skip`; static reviews | `aria-hidden="true"` on every icon span (lint rule), skip link + `<main id>` in each layout, fix heading ladder. |
| S13 | Medium | **Numbers and dates formatted by hand.** `AED ${n.toLocaleString('en-US')}` and manual grouping in `formatAedFromFils`, locale-less `toLocaleString()` in compare and sales (hydration risk), `+4h` arithmetic for Dubai, proportional Outfit used for prices with no `tabular-nums`, unrounded `fils/100` on the detail page. | static reviews | `Intl.NumberFormat(locale,{style:'currency',currency:'AED'})`, `Intl.DateTimeFormat(locale,{timeZone:'Asia/Dubai'})`, `font-variant-numeric: tabular-nums` on price/VIN/count classes. |
| S14 | Medium | **Images and fonts.** 85 `<img>` without intrinsic dimensions (cards, thumbnails, dealer inventory: up to 50 eager images per page), LCP images without `fetchPriority="high"`, five Google font families loaded by render-blocking CSS with no preload, Material Symbols `display=block` (icons invisible until loaded; ligature words on failure), detail page shows a broken image with alt text when the object is missing. | findings.json `img-no-dimensions`; `dealer-inventory-desktop.png` | `width/height` + `loading="lazy"` below the fold, `next/font`, a placeholder component everywhere (cards already have one). |
| S15 | Low | **Token drift and off-theme pages.** Auth, verify-email, dashboard, access-* use `#0b0f17/#121824`, `text-gray-*`, `stone-*`; admin uses `bg-[#121824]`, `text-white`, `text-gray-300/400/500/600`; badges use `emerald/amber/sky/rose`. `font-heading`, `font-arabic`, `animate-fade-in` are used but undefined. Note the handoff's "Light Studio Glass" for dealer/admin conflicts with AGENTS.md's final Obsidian decision; the apps follow Obsidian. | static reviews | Tokens only; remove raw hex and Tailwind palette greys; delete undefined classes. |

## 2. Measured data (summary)

| Metric | Desktop 1440 | Mobile 390 |
|---|---|---|
| Pages measured | 25 (+6 in Arabic) | 25 |
| Text nodes < 12px | 755 | 793 |
| Contrast fails (< 4.5:1 normal / 3:1 large) | 69 | 69 |
| Interactive targets below floor (24px desktop / 44px mobile) | 55 | 669 |
| Focus not visible (first 25 focusables per page) | 31 | 24 |
| Horizontal overflow | 1 (`/admin/data/Vehicle`) | 6 |
| Pages without a skip link | 25 | 25 |
| Controls with `transition: all` | 279 total |

Worst pages by count: dealer inventory (157 / 177), dealer leads (92 / 146), storefront (69 / 118),
admin data/Vehicle (54 / 119), admin dealers (62 / 116), home (65 / 124).

Cleanest pages: forgot-password (1 / 3), buyer settings (8 / 15), admin moderation (11 / 23), compare (14 / 17).

## 3. What is good (keep)

- URL is the source of truth for search, filters and paging on `/cars`, `/dealer/inventory`, `/dealer/leads`; deep links past the last page are clamped.
- `color-scheme: dark`, `theme-color`, `<html lang dir>` from the persisted cookie on first paint in all three apps; Dubai-time helpers exist.
- Tables in dealer inventory/leads have `<caption>` and `scope`; pagers are 44px; disabled intake button carries a visible reason (`inventory-matrix-view.tsx:64-73`) — copy this pattern.
- `AdminDialog`, `ConfirmReasonModal`, `account-shell`, `buyer-profile-view`, `account-settings-view`, `forgot-password` pass the guideline review with Low notes only.
- Live regions and honest "not available yet" copy on loading/error states in most live pages.

## 4. Recommended order of work

1. S1 (apply the UI preset) → re-run the audit; it will remove most hierarchy/size noise.
2. S3 + S4 + S5 (overlay focus management, sidebar `inert`, global focus ring): keyboard and screen-reader blockers, all mechanical.
3. S2 + S6 + S7 (size, targets, contrast): a token pass — add `muted` and `caption` tokens, replace `text-[9–11px]`, `min-h-11` on controls.
4. S8 (Arabic parity): seed locale from cookie, `Intl` helpers, enum label maps, logical utilities.
5. S9, S10, S11, S12, S13, S14, S15 as a polish sprint; add the design-audit spec to CI with thresholds (e.g. 0 contrast fails, 0 focus-not-visible, 0 overflow).

Rerun: `DESIGN_AUDIT=1 pnpm exec playwright test -c tests/e2e/playwright.config.ts design-audit --project="Desktop Chrome"`
(needs the stack and `.qa-credentials.local.json`; measurements, not assertions).

## 5. Fix pass 1 — 2026-11-09 (S1, S3, S4, S5)

Status of the four High findings addressed in this pass. Everything else in section 1 is unchanged and still open.

| ID | Status | What changed |
|---|---|---|
| S1 | **Fixed** | All three `tailwind.config.js` files now load `automotiveTailwindPreset` from `packages/ui/src/tailwind-preset.ts` through `presets`; the duplicated colour, font, radius and spacing blocks were removed (admin keeps its three own tokens). Resolved-theme diff per app: 0 tokens removed, 0 changed, the 12 `fontSize` entries added. The compiled dealer and admin CSS now contains `text-headline-*`, `text-body-*`, `text-label-caps`, `text-data-*`. |
| S3 | **Fixed** | New shared focus containment in `packages/ui`: `activateFocusTrap` (stacked traps, Tab/Shift+Tab containment, Escape, scroll lock, focus return), `useModalFocus` and `ModalOverlay`. Wired into the marketplace enquiry modal, compare picker and mobile filter sheet, the admin identity drawer, the dealer intake modal and all 43 dealer preview modals (which also gained `role="dialog"`, `aria-modal` and a name from their heading). `AdminDialog` keeps its API and now uses the same trap, so a confirmation opened from the drawer stacks correctly. |
| S4 | **Fixed** | Closed off-canvas sidebars (dealer, admin, below 1024px) are `visibility: hidden`, so their links leave the tab order and the accessibility tree. Open, they behave as a modal drawer through `useOffCanvasNav`: focus moves in, Tab stays in, Escape and a backdrop tap close, page scroll is locked, focus returns to the toggle. Toggles carry `aria-controls`. |
| S5 | **Fixed** | One global rule per app (`globals.css`) draws a 2px primary outline on `:focus-visible` for every control that does not draw its own ring, including controls that reset the outline with `focus:outline-none`. The marketplace header logo and emirate select and the vehicle-card image link got explicit indicators. |

### Corrections to the 2026-11-06 findings

- **S1 usage count.** The marketplace does not use the `text-*` type-scale classes at all (it uses the `font-*` family names with explicit sizes), so S1 changed nothing there. Actual use: dealer ≈870, admin ≈96, marketplace 0.
- **S5 measured count.** The 55 "focus not visible" measurements were all disabled or hidden controls that cannot take focus, not missing indicators. The check also treated Tailwind's transparent `outline-none` outline as a visible change, so it could not see the real cases (header logo, emirate select, card links), which came from the static review. The audit script now skips unfocusable elements, ignores transparent outlines and waits for `transition-all` indicators to settle. The baseline number for S5 is therefore not comparable with the rerun.

### Rerun (evidence: `docs/qa/evidence/design-audit-2026-11-09/`)

Same 25 pages, same three passes. The 2026-11-06 folder is kept as the baseline.

| Measurement | 2026-11-06 | 2026-11-09 | Note |
|---|---|---|---|
| Focus not visible | 55 | 0 | Corrected check; see above. |
| Contrast fails | 138 | 64 | Mostly the dealer sidebar: hidden on mobile now, and fewer disabled items in the current working tree. Not a contrast fix. |
| Targets below floor | 724 | 630 | Hidden sidebar links are no longer counted. Not a target fix. |
| Text under 12px | 1,548 | 1,470 | Stitch `label-caps` is 11px by design; S2 needs a token decision. |
| Horizontal overflow | 7 | 7 | Unchanged (S10 open). |
| Total | 2,929 | 2,635 | |

Visual check of the new screenshots: the admin console now shows the Stitch hierarchy (40px page title, 32px KPI values, 12px body) where everything was 16px before; no new overflow was measured. The three `admin-users-*` screenshots were removed from the new folder because the list showed a personal email address.

### Checks run

| Check | Result |
|---|---|
| `tsc --noEmit` in `packages/ui`, `apps/marketplace`, `apps/dealer`, `apps/admin` | PASS |
| `packages/ui` build | PASS |
| `tests/e2e/a11y-focus.spec.ts` (new, 7 tests: three marketplace overlays, focus indicators, dealer and admin drawers, admin drawer with stacked dialog) | PASS 7/7 |
| Full Playwright suite, Desktop Chrome | PASS 45/45, 1 skipped (the audit spec, gated by `DESIGN_AUDIT=1`) |
| Design audit rerun | Ran; measurements above |
| Lint | NOT RUN: the three app `lint` scripts are `echo` stubs |
| API unit tests, RLS tests, API acceptance harness | NOT RUN: no API code changed in this pass |
| Tablet and Mobile Playwright projects | NOT RUN |

### Remaining risks

- The new focus spec was not run against the pre-fix code, so it is not shown failing first. A first flaky run did expose one real defect, now fixed: nav links with `transition: all` are still `visibility: hidden` for one frame after the drawer opens, and the trap treated them as tab stops.
- The type scale changes sizes on about 970 elements in dealer and admin. Only the 25 audited pages were looked at; the dealer preview pages (sales, workshop, parts, finance, accounting, fleet) were not visually reviewed after the change.
- `tailwind.config.js` requires a `.ts` preset. Tailwind loads it through its bundled `jiti` fallback; verified on Node 24 with Tailwind 3.4.19 only.
- Apps import `@automotive-os/ui` from its `dist` build, which is gitignored, so `packages/ui` must be built before the apps (Turborepo `^build`).
- The admin identity drawer opens from a mouse click on a table row; the row itself is still not keyboard-operable (not part of S3).

Next: S2 + S6 + S7 (size, target and contrast token pass), which needs a decision on the 11px `label-caps` token.
