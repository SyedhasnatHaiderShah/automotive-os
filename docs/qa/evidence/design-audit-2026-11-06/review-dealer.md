# Web Interface Guidelines review — apps/dealer (static, 2026-11-06)

Rules fetched from vercel-labs/web-interface-guidelines `command.md`. Read-only. Contrast ratios computed from `tailwind.config.js` hex values.

## apps/dealer/app/layout.tsx
- apps/dealer/app/layout.tsx:26 - [Medium] no skip link to main content; 12+ fixed-sidebar links + header controls precede content on every page
- apps/dealer/app/layout.tsx:35 - [Low] 5 Google font families via CSS, no `<link rel="preload" as="font">`
- apps/dealer/app/layout.tsx:46 - [Low] staging badge `right-3` physical → `end-3`; `text-[11px]`; fixed `z-[80]` can cover focused controls bottom-right

## apps/dealer/app/page.tsx
✓ pass

## apps/dealer/app/inventory/page.tsx
✓ pass (filters + paging URL-synced, validated against allowlists)

## apps/dealer/app/leads/page.tsx
- apps/dealer/app/leads/page.tsx:62 - [Low] inline 'موظف معيّن'/'Assigned staff' ternary bypasses i18n.ts
- apps/dealer/app/leads/page.tsx:73 - [Low] `transition-all` → `transition-colors`
- apps/dealer/app/leads/page.tsx:93 - [Low] filter chips rely on UA focus outline
- apps/dealer/app/leads/page.tsx:114 - [Medium] thead `text-[10px] uppercase tracking-wider` — 10px column headers
- apps/dealer/app/leads/page.tsx:142 - [Medium] date always en-GB format in `ar` locale
- apps/dealer/app/leads/page.tsx:147 - [Medium] `humanizeEnum(intent)`/`preferredContact` English-only; `t.prefers()` yields Arabic verb + English noun
- apps/dealer/app/leads/page.tsx:144 - [Low] buyer/listing cells no `truncate`/`break-words`/`max-w`
- apps/dealer/app/leads/page.tsx:104 - [Low] `assignmentNote` paragraph at `text-xs`

## apps/dealer/app/error.tsx
- apps/dealer/app/error.tsx:18 - [Medium] no `dir`/`lang`, English-only copy
- apps/dealer/app/error.tsx:23 - [Low] decorative `<svg>` lacks `aria-hidden="true"`
- apps/dealer/app/error.tsx:28 - [Low] `h2` with no `h1`; "Dealership Management System Offline" overstates any runtime error
- apps/dealer/app/error.tsx:32 - [Low] raw `error.message` shown; fallback has no next step
- apps/dealer/app/error.tsx:35 - [Medium] `text-xs text-outline/60` on surface-container-high ≈ 2.6:1 — trace id illegible
- apps/dealer/app/error.tsx:41 - [Low] buttons no `focus-visible`; "DMS Cockpit" ≠ sidebar "Dashboard"

## apps/dealer/app/not-found.tsx
- apps/dealer/app/not-found.tsx:6 - [Medium] English-only, no `dir`/`lang`
- apps/dealer/app/not-found.tsx:9 - [Low] `h2` without `h1`
- apps/dealer/app/not-found.tsx:13 - [Low] jargon "tenant partition"; :19 "Return to Operations Cockpit" ≠ "Dashboard"

## apps/dealer/app/loading.tsx
- apps/dealer/app/loading.tsx:5 - [Medium] skeleton has no `role="status"`/`aria-busy` — silent for screen readers
- apps/dealer/app/loading.tsx:7 - [Medium] `animate-pulse` full page, no `motion-reduce:animate-none`
- apps/dealer/app/loading.tsx:7 - [Low] skeleton geometry ≠ real shell → layout jump on resolve

## apps/dealer/app/globals.css
- apps/dealer/app/globals.css:31 - [High] drawer closed by `translateX(-100%)` only — sidebar links remain in tab order + a11y tree on <1024px. Add `visibility:hidden` or `inert` when closed
- apps/dealer/app/globals.css:31 - [Low] `transition: transform 200ms` no `prefers-reduced-motion` guard
- apps/dealer/app/globals.css:37 - [Medium] backdrop `pointer-events: none`; no body scroll lock; no `overscroll-behavior: contain`
- apps/dealer/app/globals.css:6 - [Medium] html lacks `scroll-padding-top: 4rem` — fixed header covers elements scrolled into view by focus/anchors
- apps/dealer/app/globals.css:22 - [Low] `.no-scrollbar` removes scroll affordance (unused)
- apps/dealer/app/globals.css:5 - [Low] no global `:focus-visible` style
- apps/dealer/app/globals.css:34 - [Low] `!important` sibling-selector overrides fragile vs utilities

## apps/dealer/components/dealer-shell.tsx
- apps/dealer/components/dealer-shell.tsx:36 - [Low] `<main>` has no `id`/`tabIndex={-1}` for skip-link target
- apps/dealer/components/dealer-shell.tsx:20 - [Low] `isPending` discarded — locale toggle has no busy state/live announcement
- apps/dealer/components/dealer-shell.tsx:32 - [Low] `${dir}` injected as class — dead class

## apps/dealer/components/dealer-header.tsx
- apps/dealer/components/dealer-header.tsx:37 - [Medium] fixed header without `scroll-padding-top`
- apps/dealer/components/dealer-header.tsx:40 - [Medium] hamburger: no `aria-controls`; open doesn't move focus into drawer; close doesn't return focus
- apps/dealer/components/dealer-header.tsx:48 - [Low] `text-[11px]` note; explanation `title`-only
- apps/dealer/components/dealer-header.tsx:57 - [Low] `aria-label` on non-interactive `<span>`
- apps/dealer/components/dealer-header.tsx:66 - [Medium] locale toggle ≈ 24px tall — below touch target; `aria-label="Toggle language"` hides state
- apps/dealer/components/dealer-header.tsx:90 - [Low] `text-[10px] uppercase` role caption
- apps/dealer/components/dealer-header.tsx:37 - [Low] `backdrop-blur-xl` on always-fixed header — paint cost on tablets

## apps/dealer/components/dealer-sidebar.tsx
- apps/dealer/components/dealer-sidebar.tsx:101 - [High] offscreen `<aside>` stays focusable/readable on mobile; needs `inert`/`aria-hidden` when closed + `id` for `aria-controls`
- apps/dealer/components/dealer-sidebar.tsx:101 - [Low] `h-screen` → `h-dvh`
- apps/dealer/components/dealer-sidebar.tsx:103 - [Low] close button "✕" glyph; no `hover:`/`focus-visible`; ≈36px
- apps/dealer/components/dealer-sidebar.tsx:26 - [Medium] Escape closes ✓ but focus not restored to hamburger; no scroll lock
- apps/dealer/components/dealer-sidebar.tsx:74 - [Medium] disabled items `text-on-surface-variant/60` at `text-xs` ≈ 4.4:1 — under 4.5:1
- apps/dealer/components/dealer-sidebar.tsx:78 - [Low] `text-[10px] uppercase tracking-wider` badges/section labels (also :96, :111, :117, :138)
- apps/dealer/components/dealer-sidebar.tsx:88 - [Low] `transition-all`
- apps/dealer/components/dealer-sidebar.tsx:39 - [Low] nav labels inline bilingual ternaries, not in i18n.ts
- apps/dealer/components/dealer-sidebar.tsx:161 - [Low] `truncate` on flex container; inner span needs `min-w-0 truncate`

## apps/dealer/components/dealer-ui.tsx
- apps/dealer/components/dealer-ui.tsx:22 - [Medium] StatCard label `text-[10px] uppercase` (every KPI label)
- apps/dealer/components/dealer-ui.tsx:26 - [Low] note `text-[11px]`
- apps/dealer/components/dealer-ui.tsx:20 - [Low] StatCard not `<dl>`/no heading
- apps/dealer/components/dealer-ui.tsx:64 - [Low] pager/filter links rely on UA focus ring
- apps/dealer/components/dealer-ui.tsx:156 - [Low] `role="status"` on static AccessNotice unnecessary
- (numbers in `font-data-mono-num` → tabular ✓; pager `min-h-11` ✓; URL-synced ✓)

## apps/dealer/components/dashboard-cockpit-view.tsx
- apps/dealer/components/dashboard-cockpit-view.tsx:80 - [Medium] `disabled` button carries reason in `title`/`aria-label` only — use `aria-disabled` + visible helper (inventory-matrix-view:67 pattern)
- apps/dealer/components/dashboard-cockpit-view.tsx:95 - [Medium] section `h2` at `text-[11px] uppercase` (also :114)
- apps/dealer/components/dashboard-cockpit-view.tsx:98 - [Medium] 2-col grid at 390px: "AED 12,345,678" `text-2xl` mono overflows ~150px card (:105)
- apps/dealer/components/dashboard-cockpit-view.tsx:65 - [Low] `transition-all` (also :73)
- apps/dealer/components/dashboard-cockpit-view.tsx:105 - [Low] `'AED 0'` literal; `formatAed` en-US only
- apps/dealer/components/dashboard-cockpit-view.tsx:158 - [Low] "View all" `text-xs`, hover-only underline, <24px target
- apps/dealer/components/dashboard-cockpit-view.tsx:174 - [Medium] `humanizeEnum(intent)` + en-GB date English-only in AR; `text-[11px]` meta line unclamped
- apps/dealer/components/dashboard-cockpit-view.tsx:118 - [Low] `lg:grid-cols-6` at 1024px ≈ 125px cards; AR labels wrap

## apps/dealer/components/inventory-matrix-view.tsx
- apps/dealer/components/inventory-matrix-view.tsx:109 - [Medium] thead `text-[10px] uppercase`
- apps/dealer/components/inventory-matrix-view.tsx:156 - [Medium] `<img>` without `width`/`height`/`loading="lazy"` — up to 50 eager images per page
- apps/dealer/components/inventory-matrix-view.tsx:160 - [Medium] model-year badge `text-[9px]`
- apps/dealer/components/inventory-matrix-view.tsx:170 - [Medium] stock number `text-[10px]`; no `translate="no"`
- apps/dealer/components/inventory-matrix-view.tsx:176 - [Medium] VIN: no `translate="no"`, no `whitespace-nowrap`
- apps/dealer/components/inventory-matrix-view.tsx:181 - [Low] `toLocaleString('en-US')` + " km" hardcoded
- apps/dealer/components/inventory-matrix-view.tsx:197 - [Low] cost line `text-[11px]`; `formatAed` not locale-aware
- apps/dealer/components/inventory-matrix-view.tsx:221 - [Medium] "View leads" icon link ≈ 25px target; href `/leads` unfiltered
- apps/dealer/components/inventory-matrix-view.tsx:45 - [Low] `transition-all`
- apps/dealer/components/inventory-matrix-view.tsx:85 - [Low] "3 / 1" value ambiguous without reading note
- apps/dealer/components/inventory-matrix-view.tsx:105 - [Low] scroll region not keyboard-focusable; 7 columns at 390px, no sticky first column
- (:64-73 disabled intake with `aria-describedby` + visible reason ✓; caption/scope ✓)

## apps/dealer/components/lead-row-actions.tsx
- apps/dealer/components/lead-row-actions.tsx:52 - [Low] `focus:outline-none focus:ring-1` — `:focus` not `:focus-visible`
- apps/dealer/components/lead-row-actions.tsx:57 - [Medium] "Status"/"Assigned"/"Unassigned" + `humanizeEnum` options English-only
- apps/dealer/components/lead-row-actions.tsx:59 - [Medium] select change PATCHes immediately — WON irreversible with no confirm/undo
- apps/dealer/components/lead-row-actions.tsx:98 - [Medium] `aria-live="polite"` span mounted only while pending — live region must pre-exist
- apps/dealer/components/lead-row-actions.tsx:103 - [Low] `text-right` → `text-end`; `text-[11px]` error
- apps/dealer/components/lead-row-actions.tsx:59 - [Low] selects lack `name`; `disabled`+`title` reason unreachable
- apps/dealer/components/lead-row-actions.tsx:57 - [Low] label `text-[11px]`

## apps/dealer/components/listing-actions.tsx
- apps/dealer/components/listing-actions.tsx:66 - [Medium] "Unpublish"/"Submit for review"/"Saving…" English-only
- apps/dealer/components/listing-actions.tsx:68 - [Medium] Unpublish fires immediately — no confirmation/undo
- apps/dealer/components/listing-actions.tsx:70 - [Medium] action buttons `text-[11px]`
- apps/dealer/components/listing-actions.tsx:79 - [Low] submit button has no `hover:` state
- apps/dealer/components/listing-actions.tsx:86 - [Low] `text-right` → `text-end`
- apps/dealer/components/listing-actions.tsx:60 - [Low] "—" placeholder with no sr-only meaning

## apps/dealer/components/dealer-service-error.tsx
- apps/dealer/components/dealer-service-error.tsx:81 - [Low] `h2` with no `h1`
- apps/dealer/components/dealer-service-error.tsx:85 - [Low] anchors rely on UA focus ring
- (dir/lang ✓, role=alert ✓, min-h-11 ✓)

## apps/dealer/components/dealer-sign-out-button.tsx
✓ pass

## apps/dealer/components/preview-banner.tsx
- apps/dealer/components/preview-banner.tsx:17 - [Medium] English-only banner on bilingual pages
- apps/dealer/components/preview-banner.tsx:14 - [Medium] fixed `z-[70]` bottom bar covers content/focus at page bottom
- apps/dealer/components/preview-banner.tsx:14 - [Low] `left-0 right-0` → `inset-x-0`; no `env(safe-area-inset-bottom)`

## apps/dealer/components/vehicle-intake-modal.tsx (not mounted today)
- apps/dealer/components/vehicle-intake-modal.tsx:23 - [High] dialog: no focus trap/initial focus, no Escape, no scroll lock
- apps/dealer/components/vehicle-intake-modal.tsx:33 - [Medium] `INTAKE_UNAVAILABLE_MESSAGE` + "Close" English while title is localised

## apps/dealer/lib/dealer-api.ts
- apps/dealer/lib/dealer-api.ts:185 - [Medium] `formatAed` hardcodes `en-US` + "AED " prefix; `maximumFractionDigits:0` silently rounds fils
- apps/dealer/lib/dealer-api.ts:192 - [Medium] `formatDubaiDateTime` hardcodes `en-GB`; no locale param
- apps/dealer/lib/dealer-api.ts:205 - [Medium] `humanizeEnum` English Title Case only — used for intent, contact channel, fuel, transmission, condition in AR UI

## apps/dealer/lib/i18n.ts
- apps/dealer/lib/i18n.ts:88 - [Low] casing inconsistent (Title vs sentence case)
- apps/dealer/lib/i18n.ts:96 - [Low] awkward copy "Latest 50 of 120 vehicles only"; :115, :119
- apps/dealer/lib/i18n.ts:175 - [Low] "Unable to load … from the API." exposes "API"; no next step
- apps/dealer/lib/i18n.ts:308 - [Medium] Arabic plurals ignore dual/plural (:263, :285)
- apps/dealer/lib/i18n.ts:33 - [Medium] parity gaps — lead-row-actions, listing-actions, vehicle-intake-modal, preview-banner, error.tsx, not-found.tsx, sidebar nav labels, enum values missing from the catalogue
- apps/dealer/lib/i18n.ts:144 - [Low] `statusLabel.toLowerCase()` → "5 test drive negotiation leads" reads oddly

## apps/dealer/app/sales/page.tsx (fixture preview)
- :1147 - [High] 3 modals (:1147, :1225, :1278) are plain `div` overlays — no dialog semantics, focus trap, Escape, scroll lock
- :1168 - [High] `<label>` not associated for 3 inputs (:1171, :1183, :1195)
- :982 - [High] search input: no label/`aria-label`, no `name`, `focus:outline-none`; wired to nothing
- :419 - [High] `<div onClick>` copy-VIN — not focusable, no `role="button"`/key handler
- :1156 - [Medium] icon-only close buttons rely on ligature text "close" for name, 24px target
- :132 - [Medium] Material icons lack `aria-hidden` throughout
- :130 - [Medium] feedback banner no `role="status"`; heading contradicts body "Preview only — nothing was sent."
- :176 - [Medium] `animate-ping` infinite; :763 `animate-pulse`; no `motion-reduce`
- :231 - [Medium] pipeline filter buttons: no `aria-pressed`; never filters the table (dead control); counts hardcoded
- :364 - [Medium] native `alert()` for "CRM Card"; :457 "Inspect Spec Sheet"
- :494 - [Medium] tables (:494, :993) no `<caption>`, `<th>` without `scope="col"`
- :897 - [Medium] progress bar `div` inline width, no `role="progressbar"`
- :982 - [Medium] physical sides (`left-3`, `pl-9 pr-3`, `text-right`, `rounded-l-lg`/`rounded-r-lg`) flip wrong in RTL
- :15 - [Medium] page-local `useState('en')` ignores `ao_locale`
- :436 - [Medium] `toLocaleString()` without locale (hydration mismatch risk)
- :160 - [Medium] `text-label-caps`, `text-body-*`, `text-headline-*`, `text-data-currency-lg` have no `fontSize` → emit nothing; hierarchy flattened to 16px
- :1138 - [Medium] `text-[11px] text-outline` on surface-container-highest ≈ 3.9:1
- :1085 - [Medium] `sticky bottom-4 z-30` dock sits under fixed PreviewBanner (`z-[70]`)
- :369 - [Medium] English-only in AR mode + labels implying live integrations/persistence in a fixture ("CRM Card", "Digital Cryptographic Stamp Active", "Emirates NBD", "Telemetry Sync Live", "UAE PASS", "Tasjeel", "Save Draft", "Download File", "Confirm Slot")
- :815 - [Medium] "Manual Override" of e-signature gate with no confirmation
- :355 - [Low] full buyer email + phone rendered (fixture) — violates redaction rule if pattern copied to live module
- :41 - [Low] clipboard promise unawaited; `setTimeout` not cleared on unmount
- :577 - [Low] "AED 1,234.00" string concat, not Intl currency; "KM" → "km"
- :596 - [Low] divider `div` → `<hr>`; stepper not `<ol>`; breadcrumb not `<nav>`; heading order skips
- :1021 - [Low] fixture preformatted strings — not Intl
- :208 - [Low] buttons ≈ 30–34px targets; inputs use `:focus` not `:focus-visible`
- :1 - [Low] 1,330-line single client component

## Summary
1. Totals: 131 findings — High 7, Medium 57, Low 67. Clean: app/page.tsx, app/inventory/page.tsx, dealer-sign-out-button.tsx.
2. Live flows are structurally sound (real links, URL-synced filters/paging, caption+scope, logical properties, `min-h-11` pagers); defects are legibility, i18n parity and focus management.
3. Top 1 — closed mobile drawer stays in tab order (globals.css:31 / dealer-sidebar.tsx:101).
4. Top 2 — modals without dialog semantics (sales/page.tsx, vehicle-intake-modal.tsx).
5. Top 3 — form inputs with no accessible name and a `div onClick` copy control in the sales preview.
6. Top 4 — Arabic parity broken in live islands (dealer-api.ts helpers, lead-row-actions, listing-actions, preview-banner, error/not-found); Arabic plural grammar.
7. Top 5 — legibility: `text-[9px]`–`text-[11px]` on headers, KPI labels, section h2s, buttons; dashboard AED KPI overflows at 390px; sales page type tokens compile to nothing.
8. Destructive without confirm/undo: lead status select, Unpublish, Manual Override.
9. Motion/overlay: no reduced-motion; fixed header lacks `scroll-padding-top`; PreviewBanner hides the sales dock.
10. Contrast fails: error.tsx:35 (≈2.6:1), sales:1138 (≈3.9:1), sidebar disabled items (≈4.4:1).
