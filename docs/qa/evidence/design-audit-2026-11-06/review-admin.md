# Web Interface Guidelines review — apps/admin (static, 2026-11-06)

Source of rules: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md. Read-only. Paths relative to `apps/admin/`.

Cross-cutting fact verified against compiled CSS (`.next/static/css/app/layout.css`): the classes `text-headline-xl`, `text-headline-lg`, `text-headline-sm`, `text-body-sm` and `font-heading` are NOT defined in `tailwind.config.js` (only `label-caps` and `data-mono-num` fontSizes exist) and do not compile. Every `<h1>`/`<h2>` that relies on them renders at the Preflight default (16px). Reported once per file as "undefined typography token".

## app/layout.tsx
- app/layout.tsx:44 - [Medium] no skip link to main content; every page puts ~12 sidebar links + header controls before `<main>`
- app/layout.tsx:47 - [Low] staging badge uses physical `right-3` (should be `end-3` for RTL) and `text-[11px]`
- app/layout.tsx:35-42 - [Low] Google Fonts loaded via stylesheet only; no `<link rel="preload" as="font">` for Outfit/Inter

## app/page.tsx
- app/page.tsx:79,135,145,160,175,189 - [Medium] undefined typography tokens; h1 and KPI numbers render at 16px
- app/page.tsx:94,103,112,126,141,156,171,188 - [Medium] Material Symbols `<span>` ligature text not `aria-hidden="true"`
- app/page.tsx:35 - [Low] loading placeholder "…" and "Unavailable" swap in without any live region
- app/page.tsx:38 - [Low] error detail exposed only via `title` tooltip
- app/page.tsx:31 - [Low] fallback copy 'Unavailable' English-only in AR locale
- app/page.tsx:159,174 - [Low] `toLocaleString('en-US')` hard-coded locale; use `Intl.NumberFormat(locale)`
- app/page.tsx:183 - [Low] static `<section role="status">` misuses a live region
- app/page.tsx:97-114 - [Low] disabled buttons at `opacity-50` with hover-only `title`; opacity on `text-on-surface` drops below AA

## app/users/page.tsx
- app/users/page.tsx:463-470 - [High] drawer has `role="dialog" aria-modal="true"` but no focus trap, no focus move-in, no Escape handler, no focus return to opener; background stays tabbable (AdminDialog does this correctly; reuse it)
- app/users/page.tsx:261,280 - [High] `<select>` filters use `focus:outline-none` with no focus replacement
- app/users/page.tsx:56-59,131 - [Medium] page, search, status and role filters live only in `useState`; not reflected in URL
- app/users/page.tsx:375,389 - [Medium] `text-gray-600` (#4b5563) on `surface-container-low` ≈ 1.9:1 contrast; raw Tailwind grey instead of `text-outline`
- app/users/page.tsx:408 - [Medium] hand-rolled `toLocaleDateString('en-GB', ...)` instead of shared `formatDubaiDateTime`; `text-[11px]`
- app/users/page.tsx:469 - [Low] `bg-[#121824]` raw hex and physical `border-l` (RTL should be `border-s`)
- app/users/page.tsx:247,310 - [Low] `placeholder:text-gray-500` raw grey; placeholder ends with `...` not `…`
- app/users/page.tsx:253,272 - [Low] visible "Status:"/"Role:" text is `aria-hidden` span + `aria-label` on select; should be a clickable `<label htmlFor>`
- app/users/page.tsx:219 - [Low] `transition-all` on toast
- app/users/page.tsx:193 - [Low] decorative `animate-pulse` dot without `aria-hidden` or reduced-motion variant
- app/users/page.tsx:341-345 - [Low] `<tr onClick>` with `cursor-pointer`; row itself is a clickable non-interactive element
- app/users/page.tsx:351,356,395,490,495,500,505,521,538 - [Low] `text-[10px]` labels and badges below legible floor
- app/users/page.tsx:361,496,501 - [Low] email and UUID lack `translate="no"`; email has no `truncate`/`min-w-0`; UUID `text-[11px] text-gray-400`
- app/users/page.tsx:432-433 - [Low] manual pluralisation; Arabic plural ignored; use `Intl.PluralRules`
- app/users/page.tsx:488-533 - [Low] drawer field pairs are `<span>`s; use `<dl>/<dt>/<dd>`
- app/users/page.tsx:157,165,621 - [Low] copy exposes raw enum / system voice ("API confirmed status SUSPENDED for …")

## app/dealers/page.tsx
- app/dealers/page.tsx:214-219,362 - [Medium] full tenant list rendered and filtered client-side with no pagination or virtualization
- app/dealers/page.tsx:70,307 - [Medium] search filter not URL-synced
- app/dealers/page.tsx:468-473 - [Medium] Provision dialog: Escape closes and discards 5 typed fields with no unsaved-changes guard
- app/dealers/page.tsx:475,616 - [Low] `bg-[#121824]` raw hex instead of surface token
- app/dealers/page.tsx:267 - [Low] `to-[#b39129]` raw hex gradient stop; `hover:scale-[1.02]` with no reduced-motion variant
- app/dealers/page.tsx:227,310,693 - [Low] `focus:outline-none` with only `focus:border-primary`; `placeholder:text-gray-500`
- app/dealers/page.tsx:501-576,672-682 - [Low] inputs lack `name`, `autoComplete="off"`, `spellCheck={false}` (slug, email)
- app/dealers/page.tsx:581-585,703-707 - [Low] errors shown as one block, not inline per field; first invalid field not focused
- app/dealers/page.tsx:601,723 - [Low] "Provisioning..." / "Issuing..." use `...` not `…`; 310 placeholder likewise
- app/dealers/page.tsx:656 - [Low] `navigator.clipboard.writeText` promise unhandled; "Copied" state change not announced
- app/dealers/page.tsx:371,649 - [Low] slug and activation URL lack `translate="no"`
- app/dealers/page.tsx:367,490,498,515,530,550,564,592,631,649,669,686,715 - [Low] `text-gray-400`/`text-gray-300` raw greys instead of tokens
- app/dealers/page.tsx:376,396,443,457 - [Low] `text-[10px]`/`text-[11px]` badges and footer
- app/dealers/page.tsx:640 - [Low] "Cryptographic Token Generated!" exclamation/jargon copy
- app/dealers/page.tsx:240 - [Low] `animate-pulse` decorative dot, no `aria-hidden`

## app/audit-logs/page.tsx
- app/audit-logs/page.tsx:239 - [Medium] hand-built `toISOString().replace('T',' ').substring(0,19)` date; shows UTC while the project rule is Asia/Dubai display
- app/audit-logs/page.tsx:230-235 - [Medium] actor/tenant IDs truncated with `substring()+'...'` and marked `select-all`; selecting copies the truncated string; no `title`/full value
- app/audit-logs/page.tsx:188 - [Medium] client filter miss shows "No audit events recorded yet." even when events exist; needs a "no match" state
- app/audit-logs/page.tsx:25,29,31 - [Medium] offset, targetType and search not URL-synced
- app/audit-logs/page.tsx:120 - [Low] "Target type:" is `aria-hidden` span + `aria-label`; use `<label htmlFor>`
- app/audit-logs/page.tsx:116,139 - [Low] `focus:outline-none` with border-only replacement; `placeholder:text-gray-500`; 114 placeholder `...`
- app/audit-logs/page.tsx:200 - [Low] `text-gray-500` chevron ≈ 3.3:1 on `surface-container-low`
- app/audit-logs/page.tsx:227 - [Low] full target UUID not `translate="no"`, not truncated
- app/audit-logs/page.tsx:250 - [Low] `<pre>` metadata unbounded height; add `max-h` + scroll
- app/audit-logs/page.tsx:247,250 - [Low] `text-[10px]`/`text-[11px]`
- app/audit-logs/page.tsx:192 - [Low] 50 rows + expandable payloads via `.map`; at the virtualization threshold
- app/audit-logs/page.tsx:269 - [Low] `${total}` counts not `Intl.NumberFormat`
- app/audit-logs/page.tsx:81 - [Low] decorative `animate-pulse`

## app/verifications/page.tsx
- app/verifications/page.tsx:45,122,123,136-141,155,161,166,193 - [Medium] English-only strings in a bilingual page
- app/verifications/page.tsx:118-125 - [Medium] search icon `left-3` and input `pl-9 pr-4` are physical; in RTL icon overlaps typed text
- app/verifications/page.tsx:133,141,187 - [Medium] `text-left`/`text-right` physical table alignment; wrong in RTL
- app/verifications/page.tsx:136-140 - [Medium] `<th>` without `scope="col"`; header text hard-uppercased in source
- app/verifications/page.tsx:51-62,168 - [Medium] whole tenant list filtered/sorted client-side; no pagination; filters not URL-synced
- app/verifications/page.tsx:80,83 - [Medium] undefined typography tokens; h1 renders 16px
- app/verifications/page.tsx:93,118,194 - [Low] Material Symbols spans not `aria-hidden`; 194 chevron not mirrored for RTL
- app/verifications/page.tsx:108,125 - [Low] `focus:outline-none focus:ring-1` on `:focus` not `:focus-visible`; 1px ring faint
- app/verifications/page.tsx:176 - [Low] slug lacks `dir="ltr"`/`translate="no"`
- app/verifications/page.tsx:183 - [Low] raw enum "IN_REVIEW" shown; dealers page uses `kybLabel` (inconsistent)
- app/verifications/page.tsx:174 - [Low] `text-[11px]`
- app/verifications/page.tsx:121 - [Low] placeholder `...`

## app/verifications/[id]/page.tsx
- app/verifications/[id]/page.tsx:106,112-116,132,135,152-161,170,190,198,202,209,255,266-274 - [Medium] English-only labels, badges, buttons, dialog copy
- app/verifications/[id]/page.tsx:138,147,176,179 - [Medium] undefined typography tokens
- app/verifications/[id]/page.tsx:165 - [Low] `break-all` on every `<dd>` splits names mid-word; use `break-words` except for UUID/slug
- app/verifications/[id]/page.tsx:162 - [Low] UUID lacks `translate="no"`/`select-all`
- app/verifications/[id]/page.tsx:157 - [Low] licence expiry (a date) formatted with time + "GST"
- app/verifications/[id]/page.tsx:99 - [Low] chevron icon not `aria-hidden`
- app/verifications/[id]/page.tsx:169 - [Low] `text-[11px]` disclaimer
- app/verifications/[id]/page.tsx:325 - [Low] Retry button has no `hover:` state
- app/verifications/[id]/page.tsx:184-199 - [Low] disabled buttons rely on `title` for reason (hover-only); `opacity-50`

## app/moderation/page.tsx
- app/moderation/page.tsx:38,41,54,63 - [Medium] undefined typography tokens
- app/moderation/page.tsx:57-64 - [Low] UUID/slug input lacks `dir="ltr"`, `spellCheck={false}`, `autoComplete="off"`, `name`; placeholder no `…`
- app/moderation/page.tsx:68 - [Low] submit disabled until input non-empty
- app/moderation/page.tsx:76 - [Low] static `<section role="status">`
- app/moderation/page.tsx:81 - [Low] "policy" icon not `aria-hidden`

## app/moderation/listings/[id]/page.tsx
- app/moderation/listings/[id]/page.tsx:106,123,129-133,154,174-187,197,202,205,213,222,230,238,249,283-284,300-311 - [Medium] English-only copy throughout
- app/moderation/listings/[id]/page.tsx:158,169,208,245 - [Medium] undefined typography tokens
- app/moderation/listings/[id]/page.tsx:270 - [Low] `<img>` without `width`/`height` or `loading="lazy"`
- app/moderation/listings/[id]/page.tsx:191 - [Low] `break-all` on title/description-like values
- app/moderation/listings/[id]/page.tsx:176,184,185 - [Low] VIN, slug, UUID lack `translate="no"`
- app/moderation/listings/[id]/page.tsx:178 - [Low] `toLocaleString('en-US')` hard-coded locale
- app/moderation/listings/[id]/page.tsx:304-305 - [Low] straight quotes; use curly quotes
- app/moderation/listings/[id]/page.tsx:216-231 - [Low] Approve/Reject buttons have no `hover:` state
- app/moderation/listings/[id]/page.tsx:257-261 - [Low] `target="_blank"` link does not announce new tab
- app/moderation/listings/[id]/page.tsx:116,122 - [Low] icons not `aria-hidden`
- app/moderation/listings/[id]/page.tsx:201,261,272,282 - [Low] `text-[11px]`

## app/disputes/page.tsx
- app/disputes/page.tsx:28,31,44,48 - [Medium] undefined typography tokens
- app/disputes/page.tsx:43,63 - [Low] icons not `aria-hidden`
- app/disputes/page.tsx:38 - [Low] static `<section role="status">`

## app/data/page.tsx
- app/data/page.tsx:81-83,89-94 - [Low] two links per row to the same target (name + "Browse")
- app/data/page.tsx:86 - [Low] `toLocaleString('en-US')`
- app/data/page.tsx:85 - [Low] DB table name lacks `translate="no"`
- app/data/page.tsx:80,91 - [Low] `text-white` instead of `text-on-surface`
- app/data/page.tsx:59 - [Low] `text-[11px]` header
- app/data/page.tsx:47 - [Low] `animate-spin` without reduced-motion variant

## app/data/[model]/page.tsx
- app/data/[model]/page.tsx:192 - [Medium] `aria-sort` placed on the `<button>`; it is only valid on `<th>`
- app/data/[model]/page.tsx:235-241 - [Medium] "Edit" is `<button onClick={router.push}>`; navigation must be `<Link>`
- app/data/[model]/page.tsx:34-38 - [Medium] page, search, sort, dir not URL-synced
- app/data/[model]/page.tsx:224 - [Medium] `max-w-[260px] truncate` on `<td>` in auto table layout does not truncate
- app/data/[model]/page.tsx:227 - [Low] truncated id link has no `title`/full value and no `translate="no"`
- app/data/[model]/page.tsx:177 - [Low] placeholder lacks `…`
- app/data/[model]/page.tsx:155 - [Low] toast `role="status"` mounted together with its text; may not announce
- app/data/[model]/page.tsx:263 - [Low] `toLocaleString('en-US')`
- app/data/[model]/page.tsx:185,224 - [Low] `text-[11px]`
- app/data/[model]/page.tsx:238,270,279 - [Low] `text-white` instead of token

## app/error.tsx
- app/error.tsx:29-51 - [Medium] English-only; `useLocale` is available
- app/error.tsx:35 - [Medium] `text-outline/60` digest ≈ 2.6:1 on `surface-container`
- app/error.tsx:28 - [Low] `<h2>` with no `<h1>`
- app/error.tsx:23 - [Low] inline `<svg>` not `aria-hidden="true"`
- app/error.tsx:41 - [Low] `<button>` missing `type="button"`
- app/error.tsx:45,51 - [Low] button copy "Retry Governance View" / "Command Cockpit" not specific

## app/not-found.tsx
- app/not-found.tsx:9-19 - [Medium] English-only; server component can read the `ao_locale` cookie like layout.tsx
- app/not-found.tsx:9 - [Low] `<h2>` with no `<h1>`
- app/not-found.tsx:10,19 - [Low] jargon copy ("Governance Docket")

## app/loading.tsx
- app/loading.tsx:5 - [Low] skeleton has no `role="status"`/`aria-label="Loading…"`
- app/loading.tsx:7,20,28 - [Low] `animate-pulse` without `motion-reduce:animate-none`
- app/loading.tsx:7 - [Low] `border-r` physical; wrong side in RTL

## app/globals.css
- app/globals.css:30 - [High] off-canvas sidebar hidden with `transform: translateX(-110%)` at <1024px stays in the tab order and accessibility tree (needs `visibility:hidden`/`inert` when closed)
- app/globals.css:1-38 - [Medium] no `@media (prefers-reduced-motion: reduce)` anywhere
- app/globals.css:36 - [Low] backdrop `pointer-events: none`; tapping outside does not close the mobile nav
- app/globals.css:33-35 - [Low] `!important` and `.admin-app-sidebar ~ div` sibling selectors; brittle layout coupling
- app/globals.css:5-19 - [Low] no `touch-action: manipulation`, no `overscroll-behavior` for drawers/dialogs
- app/globals.css:6-9 - [Low] hex colours duplicated from `tailwind.config.js` (`color-scheme: dark` ✓)

## components/AdminSidebar.tsx
- components/AdminSidebar.tsx:31-35 - [High] when closed on <1024px the `<aside>` is visually hidden but focusable; when open there is no focus trap and focus is not moved into it
- components/AdminSidebar.tsx:41,72,88,104,120,143,157,171,185,198,209,228 - [Medium] every Material Symbols icon span lacks `aria-hidden="true"`
- components/AdminSidebar.tsx:63-189 - [Medium] active link has no `aria-current="page"`; state conveyed by colour only
- components/AdminSidebar.tsx:191-213 - [Medium] `<a>` with no `href`, `tabIndex={-1}`, `aria-disabled`, `opacity-50`; looks like navigation, unreachable by keyboard
- components/AdminSidebar.tsx:195,207 - [Medium] `opacity-50` on `text-on-surface-variant` over `surface-container-low` ≈ 3.1:1 for 13px text
- components/AdminSidebar.tsx:62,134 - [Low] two `<nav>` elements without distinct `aria-label`; section titles are `<span>` not headings
- components/AdminSidebar.tsx:37 - [Low] close button `absolute top-3 right-3` physical; wrong corner in RTL
- components/AdminSidebar.tsx:222-223 - [Low] `disabled` + redundant `aria-disabled`
- components/AdminSidebar.tsx:46,50,73 - [Medium] undefined typography tokens

## components/AdminHeader.tsx
- components/AdminHeader.tsx:62-79 - [Medium] at 390px the left block contains two non-truncating spans plus controls ≈ 480px; `body{overflow-x:hidden}` clips rather than wraps; add `truncate` or hide at `<sm`
- components/AdminHeader.tsx:105-186 - [Low] at exactly 1024px the right cluster ≈ 680px of ~736px available; tight
- components/AdminHeader.tsx:160 - [Low] `text-right` physical (use `text-end`)
- components/AdminHeader.tsx:161 - [Low] full email only via `title`
- components/AdminHeader.tsx:89,169 - [Low] "search"/"person" icon spans not `aria-hidden`
- components/AdminHeader.tsx:60 - [Low] menu button lacks `aria-controls` to the sidebar
- components/AdminHeader.tsx:115-144 - [Low] EN/عربي toggles ≈ 28×20px hit target
- components/AdminHeader.tsx:174-178 - [Low] `aria-label` overrides visible "Signing out…" text; busy state not announced
- components/AdminHeader.tsx:66,77,108 - [Medium] undefined typography tokens

## components/AdminDialog.tsx
- components/AdminDialog.tsx:102-111 - [Medium] panel has no `max-h-[100dvh]`/`overflow-y-auto`; a tall dialog on a 390px phone clips with no way to scroll
- components/AdminDialog.tsx:38 - [Low] default `bg-[#121824]` raw hex
- components/AdminDialog.tsx:102 - [Low] no `overscroll-behavior: contain`; body scroll not locked while open
- components/AdminDialog.tsx:103 - [Low] content outside the dialog not `inert`/`aria-hidden`
- Focus trap, Escape (suppressed while busy), labelledby, focus return: ✓

## components/ConfirmReasonModal.tsx
- components/ConfirmReasonModal.tsx:91-105 - [Medium] validation hint not associated with the textarea (`aria-describedby`/`aria-invalid`) and not live
- components/ConfirmReasonModal.tsx:124 - [Low] submit disabled until valid instead of enabled + inline error on submit
- components/ConfirmReasonModal.tsx:99 - [Low] `focus:outline-none` with border-only replacement
- components/ConfirmReasonModal.tsx:74,77,88,99,118 - [Low] `text-white`, `text-gray-300`, `text-gray-400` raw greys
- components/ConfirmReasonModal.tsx:62 - [Low] warning tone `bg-amber-500/90 text-black` raw palette
- components/ConfirmReasonModal.tsx:102,106 - [Low] `text-[11px]` hint/note

## components/DataConsoleShell.tsx
- components/DataConsoleShell.tsx:62 - [Medium] cascade-delete safety notice set at `text-[11px]`; raise to `text-xs`/`text-sm`
- components/DataConsoleShell.tsx:47 - [Low] current crumb lacks `aria-current="page"`
- components/DataConsoleShell.tsx:56 - [Low] `text-white` instead of `text-on-surface`

## components/DataRecordForm.tsx
- components/DataRecordForm.tsx:138,193-201 - [Medium] required marker `*` is `aria-hidden` and inputs carry neither `required` nor `aria-required`
- components/DataRecordForm.tsx:54-59 - [Medium] `noValidate` with a single error block; no per-field inline errors, no focus to first invalid field
- components/DataRecordForm.tsx:83-90 - [Medium] Cancel discards `touched` edits with no unsaved-changes guard
- components/DataRecordForm.tsx:127 - [Low] `id = f-${field.name}`; use `useId()`
- components/DataRecordForm.tsx:133 - [Low] type hint `text-[10px]`
- components/DataRecordForm.tsx:147 - [Low] `accent-[#d4af37]` raw hex; checkbox gets two labels
- components/DataRecordForm.tsx:148,159,179,189 - [Low] English-only literals
- components/DataRecordForm.tsx:187-201 - [Low] no `inputMode="numeric"`, `autoComplete="off"`, `spellCheck={false}` on numeric/uuid/datetime inputs
- components/DataRecordForm.tsx:101-104 - [Low] DateTime edited as raw UTC ISO; not Dubai display

## components/DataRecordPage.tsx
- components/DataRecordPage.tsx:62 - [Medium] `typeof window !== 'undefined' && new URLSearchParams(...)` read during render; hydration mismatch and not reactive; use `useSearchParams()`
- components/DataRecordPage.tsx:66,68 - [Low] truncated id in title/crumb lacks `translate="no"` and `title`
- components/DataRecordPage.tsx:94 - [Low] "Loading…" `<p>` without `role="status"`
- components/DataRecordPage.tsx:90 - [Low] Cancel navigates with no unsaved-changes check

## lib/api.ts (formatAedFromFils / formatDubaiDateTime)
- lib/api.ts:442-456 - [Medium] `formatAedFromFils` builds grouping with a regex and hard-codes "AED", "," and "."; not `Intl.NumberFormat`, not locale-aware
- lib/api.ts:459-470 - [Low] `formatDubaiDateTime` hard-codes `'en-GB'` and appends `' GST'` by string concat

## lib/locale.tsx
- lib/locale.tsx:53 - [Low] `t(en, ar)` pairs only; no plural or Intl hooks
- lib/locale.tsx:39 - [Low] cookie written without `Secure`
- First-visit locale falls back to `en` with no `Accept-Language` check — Low

## Summary
1. Totals: High 4, Medium 58, Low ~150.
2. #1: off-canvas sidebar remains focusable when hidden on <1024px and has no focus trap when open.
3. #2: users/page.tsx:463 drawer declares `aria-modal` but has no focus trap, Escape or focus return; reuse AdminDialog.
4. #3: undefined typography tokens across pages, sidebar, header: every h1/h2 renders at 16px — fix once in tailwind config.
5. #4: Material Symbols icon spans never `aria-hidden`.
6. #5: filters/pagination/search not URL-synced on users, dealers, audit-logs, verifications and data/[model]; dealers/verifications render the full unpaginated tenant list.
7. Token drift: `bg-[#121824]`, `text-gray-300/400/500/600`, `text-white`, `placeholder:text-gray-500`, `to-[#b39129]`, `accent-[#d4af37]`; contrast failures at users:375/389, sidebar:195, error.tsx:35.
8. i18n gaps: verifications (both pages), moderation listing detail, error.tsx, not-found.tsx English-only; `toLocaleString('en-US')` and manual plurals; `formatAedFromFils` not `Intl.NumberFormat`.
9. Forms: no unsaved-changes guard; `focus:outline-none` on users selects; ConfirmReasonModal hint not associated; DataRecordForm required state hidden from SR.
10. Small screens: header overflows at 390px, AdminDialog panel not scrollable; no `prefers-reduced-motion` handling; `aria-sort` on button and `<button onClick={router.push}>` navigation in data/[model].
