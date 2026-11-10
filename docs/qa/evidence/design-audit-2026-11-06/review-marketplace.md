# Web Interface Guidelines review — apps/marketplace + packages/ui (static, 2026-11-06)

Rules fetched from vercel-labs/web-interface-guidelines `command.md` (all groups). Read-only.

Cross-cutting:
- No `prefers-reduced-motion` handling anywhere in app or UI package. [Medium]
- `transition-all` in ~25 places (Button, Card, chips, CTAs). [Low]
- No `translate="no"` on any VIN, stock number, reference code, trade-licence ref, status code. [Low]
- `text-outline` (#99907c) ≈5.85:1 on #101419, 5.2:1 on surface-container, 4.55:1 on surface-container-high, <4.5 on surface-container-highest; every alpha variant (`/80 /60 /50 /30`) fails AA. `text-gray-500` on #0b0f17 ≈3.98:1 (fail), `text-stone-500` placeholder ≈4.1:1 (fail), `text-on-surface-variant/50-60` ≈3.7–4.3:1 (fail). `text-[9px]/[10px]/[11px]` used 40+ times.

## apps/marketplace/app/layout.tsx
- layout.tsx:28 - [Medium] Root `lang/dir` from cookie, but `useMarketplaceLocale()` initialises to `'en'` in every page; Arabic users get English content inside an RTL document until the mount effect runs
- layout.tsx:32-41 - [Medium] Fonts via render-blocking Google CSS (5 families); no `next/font`/preload
- layout.tsx:43 - [Medium] Material Symbols with `display=block`: icons invisible until the font loads; ligature names render on failure
- layout.tsx:47 - [Medium] No skip link; no `<main id>` target
- layout.tsx:50 - [Low] Staging badge `right-3` not RTL; `z-[80]` above dialogs; `role="status"` on static text
- layout.tsx:9 - [Low] `<title>` ~70 chars; metadata English-only

## apps/marketplace/app/globals.css
- globals.css:1 - [Medium] No `@media (prefers-reduced-motion: reduce)`
- globals.css:1 - [Medium] No `scroll-padding-top` under the fixed 80px header
- globals.css:1 - [Low] No `touch-action: manipulation`, `overscroll-behavior`, `text-wrap: balance`, tabular-nums utility
- globals.css:22-28 - [Low] `.no-scrollbar` unused
- globals.css:7 - ✓ `color-scheme: dark`

## apps/marketplace/tailwind.config.js
- tailwind.config.js:62-76 - [Medium] `font-label-caps`, `font-data-currency-lg`, `font-data-mono-num` have no Arabic fallback
- tailwind.config.js:30 - [Medium] `outline` #99907c used as body text fails on `surface-container-highest` and all alpha variants
- tailwind.config.js:1 - [Low] `animate-fade-in`, `font-heading`, `font-arabic` used but undefined
- tailwind.config.js:1 - [Low] No `presets` from `packages/ui/src/tailwind-preset.ts`; no `fontSize` floor

## apps/marketplace/app/page.tsx
- page.tsx:298-303 - [Medium] Hero `<img>` (LCP) no `width/height`, no `fetchPriority="high"`
- page.tsx:122,104 - [Medium] Search submit and auth redirect use `window.location.href` (full reload)
- page.tsx:330 - [Medium] Price via `toLocaleString('en-US')` with manual `${currency}` prefix; Outfit not tabular
- page.tsx:401 - [Medium] "View All ${dealersTotal} Verified Showrooms" renders "View All 0 …" during load
- page.tsx:498 - [Medium] Empty state English-only
- page.tsx:490-494 - [Medium] Error state English-only; retry is `<a href="/">`
- page.tsx:246-257 - [Medium] Search `<input type="text">` → `type="search"`; no `name`/`autoComplete`; placeholder `...`
- page.tsx:178,183,185 - [Medium] "• N available listings", "AED / UTC+4", "KYB VERIFIED SHOWROOMS" untranslated
- page.tsx:264-276 - [Low] `<select>` no `name`; emirates untranslated
- page.tsx:332-337,347 - [Low] `text-[11px]` links; "→" not RTL-flipped
- page.tsx:359 - [Low] `mr-2` → `me-2`
- page.tsx:402-403,478 - [Low] Decorative arrows not `aria-hidden`
- page.tsx:446 - [Low] "{n} Active Cars" no pluralisation
- page.tsx:531,545,559 - [Low] Decorative tiles read aloud
- page.tsx:192,195,200 - [Low] h1 lacks `text-balance`; hard `<br/>`
- page.tsx:173 - [Low] `animate-pulse` live dot
- page.tsx:318,433 - [Low] `text-[10px]` labels/badges

## apps/marketplace/app/cars/page.tsx
- cars/page.tsx:620-707 - [High] Mobile filter drawer: focus not moved into dialog, no focus trap, focus not restored; background not `inert`
- cars/page.tsx:350 - [Medium] `<h3>` directly after `<h1>` (also 625)
- cars/page.tsx:606-611 - [Medium] Pagination labels English-only
- cars/page.tsx:565-567 - [Medium] Error heading/button English-only; straight apostrophe
- cars/page.tsx:643-654 - [Medium] Mobile Make `<select>` shows raw option value `ALL`; emirates untranslated
- cars/page.tsx:628-635 - [Medium] Drawer close button ~24px target, no focus-visible ring; `ml-auto`/`border-l` not RTL
- cars/page.tsx:368-375 - [Medium] Keyword input `type="text"`, no `name`, placeholder `...`; border-only focus (also 329,411,647,666)
- cars/page.tsx:291-301 - [Medium] "Filters & Refine" `aria-expanded` without `aria-controls`
- cars/page.tsx:583 - [Medium] Results grid `xl:grid-cols-3` vs skeleton `lg:grid-cols-3` → CLS at 1024–1279px
- cars/page.tsx:200,207 - [Low] straight quotes; 'All vehicles' English-only
- cars/page.tsx:245 - [Low] `scrollTo({behavior:'smooth'})` ignores reduced motion
- cars/page.tsx:311-319 - [Low] casing inconsistency; "(Institutional)" copy
- cars/page.tsx:452-465 - [Low] GCC checkbox and label are siblings; `text-[10px]` helper
- cars/page.tsx:621 - [Low] `animate-fade-in` undefined
- cars/page.tsx:29 - [Low] hardcoded "AED " prefix
- cars/page.tsx:569-570 - [Low] Grid has no `aria-busy`
- ✓ URL is source of truth; chips are real buttons; range `aria-valuetext`; live notice roles

## apps/marketplace/app/compare/page.tsx
- compare/page.tsx:503-580 - [High] Add-vehicle modal: no focus move/trap/restore, no Escape, no scroll lock, background not inert
- compare/page.tsx:65-85 - [Medium] Add/remove never updates `?slugs=`
- compare/page.tsx:291-302 - [Medium] "Highlight Differences" toggle no `aria-pressed`
- compare/page.tsx:342,347,452 - [Medium] Header cells lack `scope="col"`; row-label `<td>` should be `<th scope="row">`
- compare/page.tsx:111,125,570 - [Medium] `toLocaleString()` with no locale
- compare/page.tsx:353-361 - [Medium] Remove button ~24px target, `right-0` not RTL
- compare/page.tsx:510-517 - [Medium] Modal close ~24px, no focus-visible ring
- compare/page.tsx:127,414,456 - [Medium] `text-[10px] text-outline/80`, `text-[9px] text-primary/80` fail contrast/legibility
- compare/page.tsx:20,258 - [Medium] Header emirate selector filters nothing on this page
- compare/page.tsx:364-368,552-556 - [Low] `<img>` no dims/lazy; alt duplicates heading
- compare/page.tsx:338,447,568 - [Low] physical alignment utilities
- compare/page.tsx:269-277 - [Low] Breadcrumb lacks `<nav aria-label>`; `<a>` not `<Link>`
- compare/page.tsx:234 - [Low] Masked VIN no `translate="no"`
- compare/page.tsx:143,194 - [Low] "KYB Verified" via `title` only; "GCC Spec ✓/Non-GCC" English-only
- compare/page.tsx:304-309 - [Low] "Export PDF" = `window.print()` with no print stylesheet
- compare/page.tsx:408,504 - [Low] hover scale without reduced-motion; `animate-fade-in` undefined
- compare/page.tsx:44,542 - [Low] Picker maps 50 listings in a modal

## apps/marketplace/app/dealers/page.tsx
- dealers/page.tsx:103-114 - [Medium] Emirate filter buttons no `aria-pressed`
- dealers/page.tsx:190 - [Medium] `<h3>` under `<h1>` (no h2)
- dealers/page.tsx:122-129 - [Medium] Input `text-xs` (iOS zoom), border-only focus, no `name`
- dealers/page.tsx:113,142 - [Low] Emirate names untranslated
- dealers/page.tsx:170,190 - [Low] hover styling on a non-clickable card
- dealers/page.tsx:175-182,208-210 - [Low] Decorative svgs not `aria-hidden`
- dealers/page.tsx:184 - [Low] `text-[10px]` badge
- dealers/page.tsx:198-200 - [Low] "{n} Published listings" no pluralisation
- ✓ loading status, skeletons `aria-hidden`, pagination localized

## apps/marketplace/app/auth/page.tsx
- auth/page.tsx:250-279 - [Medium] Tabs are plain buttons without tab semantics; "Sign In here" switches tab without URL change
- auth/page.tsx:594-597 - [Medium] Register submit disabled until valid → user cannot submit to see errors
- auth/page.tsx:305,432 - [Medium] On error, focus not moved; errors not inline
- auth/page.tsx:362-365,530-533 - [Medium] Show/hide password `absolute right-3` + `pr-12` not RTL; hit area ~16px
- auth/page.tsx:335,360,459,475,491,528 - [Medium] `placeholder:text-gray-600` on `bg-black/40` ≈2.6:1
- auth/page.tsx:543-558,627 - [Medium] Unmet checklist items `text-gray-500 text-[11px]` ≈3.98:1; footer same
- auth/page.tsx:208,211,283 - [Medium] Off-theme palette (`#0b0f17`, `#121824`, `text-gray-*`)
- auth/page.tsx:327-336,352-361,451,467,484,520 - [Low] Inputs lack `name`; `focus:` not `focus-visible:`
- auth/page.tsx:380,600 - [Low] "Authenticating..." → `…`
- auth/page.tsx:291-293,420 - [Low] "Single Sign-On (SSO) Portal" inaccurate; English-only
- auth/page.tsx:341,348,517 - [Low] "Master Passcode" jargon
- auth/page.tsx:396-409 - [Low] Internal routes shown to buyers in `text-[11px]`
- auth/page.tsx:484-492 - [Low] Phone input lacks `dir="ltr"`
- auth/page.tsx:194-197 - [Low] Auto-switches tab after 4 s
- auth/page.tsx:628 - [Low] Hard-coded "© 2026"
- auth/page.tsx:637 - [Low] `Suspense fallback={null}`

## apps/marketplace/app/auth/forgot-password/page.tsx
- forgot-password/page.tsx:53 - [Low] casing; otherwise ✓ pass

## apps/marketplace/app/auth/verify-email/page.tsx
- verify-email/page.tsx:1-236 - [Medium] Entire page English-only, no `dir`
- verify-email/page.tsx:101-170 - [Medium] Status swaps not in a live region
- verify-email/page.tsx:185-193 - [Medium] Input no visible label, no `name`/`autoComplete`; `placeholder-stone-500` ≈4.1:1
- verify-email/page.tsx:98,224 - [Medium] Off-theme `stone-*` / `#070707` palette
- verify-email/page.tsx:166,199,228 - [Low] "..." → `…`; jargon
- verify-email/page.tsx:102-121 - [Low] Spinner not `aria-hidden`
- verify-email/page.tsx:194-200 - [Low] Submit no focus-visible ring

## apps/marketplace/app/dashboard/page.tsx
- dashboard/page.tsx:131-135 - [Medium] Error block lacks `role="alert"`; status text not live
- dashboard/page.tsx:1-145 - [Medium] English-only, no `dir`
- dashboard/page.tsx:121-122 - [Medium] Off-theme palette
- dashboard/page.tsx:9,68,70,72,101,106 - [Low] "..." → `…`
- dashboard/page.tsx:123-124,138 - [Low] animation without reduced motion; icon not `aria-hidden`
- dashboard/page.tsx:120 - [Low] No `<main>` landmark

## apps/marketplace/app/access-suspended/page.tsx
- access-suspended/page.tsx:1-87 - [Medium] English-only, no `dir`
- access-suspended/page.tsx:46,51 - [Medium] `text-gray-500` ≈3.9:1
- access-suspended/page.tsx:16-18 - [Medium] Off-theme palette
- access-suspended/page.tsx:30-42 - [Low] Passive voice; no next step when `SUPPORT_EMAIL` unset
- access-suspended/page.tsx:47 - [Low] Status code no `translate="no"`; `text-left`
- access-suspended/page.tsx:20,22,62 - [Low] Icons not `aria-hidden`; no RTL flip
- access-suspended/page.tsx:83 - [Low] `Suspense fallback={null}`

## apps/marketplace/app/access-denied/page.tsx
- access-denied/page.tsx:1-77 - [Medium] English-only, no `dir`
- access-denied/page.tsx:41,45 - [Medium] `text-gray-500` ≈3.9:1
- access-denied/page.tsx:15-17 - [Medium] Off-theme palette
- access-denied/page.tsx:46 - [Low] "Defense-in-Depth RLS & RBAC" jargon exposed to buyers
- access-denied/page.tsx:60 - [Low] `hover:scale-[1.02]` without reduced motion
- access-denied/page.tsx:18,55 - [Low] Icons not `aria-hidden`
- access-denied/page.tsx:73 - [Low] `Suspense fallback={null}`

## apps/marketplace/app/cars/[slug]/enquiry/enquiry-view.tsx
- enquiry-view.tsx:50-54 - [Medium] `VipEnquiryModal` rendered with default `locale='en'`; Arabic buyers get an English LTR form
- enquiry-view.tsx:50 - [Medium] Modal SSR'd here; `typeof window` branch produces server/client `href` mismatch
- enquiry-view.tsx:23-56 - [Medium] No `<h1>`/`<main>`; fixed dialog covers the "Back to …" link
- enquiry-view.tsx:15-20 - [Low] Close via `window.location.href`
- enquiry-view.tsx:26-31 - [Low] Full-size photo as blurred background
- enquiry-view.tsx:43-44 - [Low] `arrow_back` not `rtl:rotate-180`; "Back to {title}" English-only

## apps/marketplace/components/vehicle-detail-view.tsx
- vehicle-detail-view.tsx:280-284 - [Medium] Gallery `<img>` (LCP) no `width/height`, no `fetchPriority="high"`
- vehicle-detail-view.tsx:320-335 - [Medium] Thumbnails lack `aria-pressed`; labels English-only; no dims/lazy; only first 6 rendered
- vehicle-detail-view.tsx:581-609 - [Medium] Fixed mobile dock: no safe-area padding; covers footer and focused elements at the bottom
- vehicle-detail-view.tsx:448-449 - [Medium] Masked VIN without `dir="ltr"` and `translate="no"`
- vehicle-detail-view.tsx:532 - [Medium] `item.date` rendered raw
- vehicle-detail-view.tsx:371,388-392 - [Medium] Finance disclaimer at `text-[10px] text-outline`
- vehicle-detail-view.tsx:265-269,76-77 - [Low] Price `fils/100` unrounded; manual "AED"; Outfit not tabular
- vehicle-detail-view.tsx:159-181 - [Low] Breadcrumb `<a>` not `<Link>`; no `aria-current`; stock number no `translate="no"`
- vehicle-detail-view.tsx:291,296 - [Low] `left-4`/`right-4` not RTL; labels EN-only; counter not live
- vehicle-detail-view.tsx:283,325-328 - [Low] motion/opacity without reduced-motion
- vehicle-detail-view.tsx:357-365,589-597 - [Low] `target="_blank"` without "(opens in new tab)"
- vehicle-detail-view.tsx:254,385,548 - [Low] "KM", "/ 60 mo", ", UAE" English-only
- vehicle-detail-view.tsx:408-409 - [Low] Dealer initials tile read by SR
- vehicle-detail-view.tsx:467,496-498,584 - [Low] `text-[10px]` labels
- vehicle-detail-view.tsx:434,515 - [Low] `whitespace-pre-line` without `break-words`
- vehicle-detail-view.tsx:146 - [Low] `rtl`/`ltr` dead classes
- ✓ modal lazy-loaded; server locale seeds hook; `aria-pressed`, focus-visible; `<dl>` specs

## apps/marketplace/components/dealer-storefront-view.tsx
- dealer-storefront-view.tsx:22,121 - [Medium] Local `isRtl` `useState(false)` ignores the persisted `ao_locale` cookie
- dealer-storefront-view.tsx:384-390 - [Medium] "Showing the first N of M" with no load-more/pagination/link
- dealer-storefront-view.tsx:339 - [Medium] Inventory `<img>` no dims, no lazy, hover scale
- dealer-storefront-view.tsx:96-128 - [Low] Bespoke header duplicates `MarketplaceHeader`; no `aria-current`
- dealer-storefront-view.tsx:46,55,63,71,360 - [Low] `text-white` off-token; no `tabular-nums`; manual compact notation; "SQ. FT"/"KM" EN-only
- dealer-storefront-view.tsx:80 - [Low] Hard-coded hex; `font-arabic` undefined
- dealer-storefront-view.tsx:84-94 - [Low] Toast `right-6` not RTL; `text-[#99907c]` on #262a30 ≈4.5:1
- dealer-storefront-view.tsx:158-165,263 - [Low] Trade-licence ref, jurisdiction, Makani no `translate="no"`
- dealer-storefront-view.tsx:174-176 - [Low] Initials tile not `aria-hidden`
- dealer-storefront-view.tsx:256 - [Low] `<span>` acting as heading
- dealer-storefront-view.tsx:344,351 - [Low] GCC badge `left-2.5`; `text-[10px]`/`text-[11px]` meta
- dealer-storefront-view.tsx:334 - [Low] `transition-all` + hover translate without reduced motion
- dealer-storefront-view.tsx:197,367,373 - [Low] casing inconsistency

## apps/marketplace/components/vip-enquiry-modal.tsx
- vip-enquiry-modal.tsx:159-165 - [High] Dialog: no initial focus, no focus trap, no focus restore, background not inert, body scroll not locked
- vip-enquiry-modal.tsx:198-221,307-320 - [Medium] `role="radiogroup"` without roving `tabIndex`/arrow keys
- vip-enquiry-modal.tsx:383-387 - [Medium] Validation error single `role="alert"` after fields; focus not moved
- vip-enquiry-modal.tsx:88-91 - [Medium] `typeof window` href differs server/client
- vip-enquiry-modal.tsx:272,285,304,324 - [Low] Field labels `text-[11px] uppercase`; helper `text-[11px]`
- vip-enquiry-modal.tsx:275-294 - [Low] Date/time inputs `text-xs`, no `name`; `focus:` ring
- vip-enquiry-modal.tsx:28-30 - [Low] `dubaiTomorrow` via manual `+4h`
- vip-enquiry-modal.tsx:87 - [Low] `fils/100` unrounded, manual "AED"
- vip-enquiry-modal.tsx:172-175 - [Low] `<img>` no dims; alt duplicates `<h2>`
- vip-enquiry-modal.tsx:187-194 - [Low] Close button 36×36
- vip-enquiry-modal.tsx:226 - [Low] nested scroll; no `overscroll-behavior: contain`
- vip-enquiry-modal.tsx:327-334 - [Low] `maxLength={1000}` with no counter
- ✓ fieldset/legend, label-wrapped checkboxes, live roles, `rtl:rotate-180`

## apps/marketplace/components/account-shell.tsx
- account-shell.tsx:90-103 - [Medium] Language buttons ~28px tall; `aria-label="Language"` EN-only
- account-shell.tsx:105-107 - [Low] `pl-2 pr-4` not RTL
- account-shell.tsx:120 - [Low] `<main class="overflow-hidden">` clips focus rings; no `id`
- account-shell.tsx:165-178 - [Low] `AccountCard` is a `<section>` even when unlabelled
- account-shell.tsx:205 - [Low] `formatDubai` hardcodes `en-GB`
- account-shell.tsx:60,62,82 - [Low] Hard-coded hex
- ✓ `lang`+`dir`, `aria-current="page"`, status roles, Intl date in Asia/Dubai

## apps/marketplace/components/buyer-garage-view.tsx
- buyer-garage-view.tsx:178-181 - [Medium] "VIN {vinMasked}" and "#{id}" without `dir="ltr"`/`translate="no"`
- buyer-garage-view.tsx:212-220 - [Low] Reschedule "Submit" disabled until value; no `aria-busy`
- buyer-garage-view.tsx:72 - [Low] Native `window.confirm`
- buyer-garage-view.tsx:26-36 - [Low] Manual `+4h` arithmetic
- buyer-garage-view.tsx:165-170 - [Low] `<img>` no dims/lazy (onError fallback ✓)
- buyer-garage-view.tsx:128,186,192 - [Low] `text-[11px]` meta; "GST" EN-only
- ✓ labels, `[color-scheme:dark]`, focus rings, icon `aria-hidden`

## apps/marketplace/components/buyer-enquiries-view.tsx
- buyer-enquiries-view.tsx:256-265 - [Medium] "Revoke dealer access" irreversible with no confirmation/undo
- buyer-enquiries-view.tsx:60,136-140 - [Medium] Selected enquiry not URL-synced
- buyer-enquiries-view.tsx:220 - [Medium] Appointment status rendered as raw enum
- buyer-enquiries-view.tsx:243-247 - [Low] Grant fields shown as raw API keys
- buyer-enquiries-view.tsx:29-35 - [Low] `INTENT_LABELS` English-only
- buyer-enquiries-view.tsx:181-194 - [Low] Timeline state conveyed by icon/colour only
- buyer-enquiries-view.tsx:162,192,218,252 - [Low] Ref code no `translate="no"`; "GST" EN-only
- buyer-enquiries-view.tsx:203 - [Low] `whitespace-pre-wrap` without `break-words`

## apps/marketplace/components/buyer-saved-view.tsx
- buyer-saved-view.tsx:230-249 - [Medium] "Delete" saved search — no confirmation/undo
- buyer-saved-view.tsx:24-31,205-215 - [Medium] Filter chips render raw JSON keys/values
- buyer-saved-view.tsx:115-119 - [Low] `<img>` no dims/lazy/fallback
- buyer-saved-view.tsx:181-182 - [Low] Straight quotes
- buyer-saved-view.tsx:123,200 - [Low] Titles without `line-clamp`
- buyer-saved-view.tsx:17-21,124 - [Low] manual "AED" prefix; not tabular
- buyer-saved-view.tsx:128,216,219 - [Low] `text-[11px]` meta

## apps/marketplace/components/buyer-profile-view.tsx
- buyer-profile-view.tsx:231-239 - [Medium] "Revoke" irreversible without confirmation
- buyer-profile-view.tsx:144-168 - [Low] Inputs lack `name`/`autoComplete`; budget fields no `dir="ltr"`
- buyer-profile-view.tsx:173-180 - [Low] Save label unchanged while saving; no unsaved-changes guard
- buyer-profile-view.tsx:171 - [Low] Error global; focus not moved
- buyer-profile-view.tsx:225 - [Low] `text-[11px] font-mono` dates
- ✓ focus-visible, `<select>` with explicit bg/color, `inputMode="numeric"`

## apps/marketplace/components/account-settings-view.tsx
- account-settings-view.tsx:145-154 - [Medium] "Preferred currency" offers USD/EUR though the app is AED-only
- account-settings-view.tsx:112-131 - [Low] No `name`, `maxLength`; no unsaved-changes guard
- account-settings-view.tsx:189-196 - [Low] Save label unchanged while saving

## packages/ui/src/components/header.tsx
- header.tsx:36 - [High] Logo `<a … focus:outline-none>` with no focus-visible replacement
- header.tsx:73-78 - [High] Emirate `<select … focus:outline-none>` with no replacement; `bg-transparent` native select; `aria-label` EN-only; `pr-2` not RTL
- header.tsx:96-125 - [Medium] Desktop nav hidden below `lg` and no mobile nav anywhere
- header.tsx:101-111 - [Medium] Nav uses `<a>` (full reload); no `aria-current="page"`
- header.tsx:113-121 - [Medium] "Sell & Consign" `<span aria-disabled>`: `/50` ≈3.7:1 fails, `text-[9px]` "Soon", tooltip unreachable
- header.tsx:130-139 - [Medium] Language toggle ≈30px tall; `aria-label` EN-only; `transition-all`
- header.tsx:142-165 - [Low] Favourites 36px target; badge `right-0.5` not RTL; `text-[10px]`
- header.tsx:170-183 - [Low] Shows "VIP" avatar for signed-out visitors; `userDisplayName` never supplied
- header.tsx:44 - [Low] `text-[10px]` tagline
- header.tsx:54-72 - [Low] Decorative svg not `aria-hidden`

## packages/ui/src/components/vehicle-card.tsx
- vehicle-card.tsx:74 - [High] Image `<a … focus:outline-none>` with no replacement
- vehicle-card.tsx:74,160,190 - [Medium] Three `<a>`s to the same href per card → 36 redundant tab stops per 12-card grid
- vehicle-card.tsx:116,118,76,80 - [Medium] Favourite `aria-label`/`title` and "Image unavailable…" English-only
- vehicle-card.tsx:47-51 - [Medium] Price `${currency} ${toLocaleString('en-US')}`; Outfit not tabular
- vehicle-card.tsx:178 - [Medium] `text-right` not RTL
- vehicle-card.tsx:53-60 - [Medium] `mileageKm == null` rendered as "Brand New"
- vehicle-card.tsx:68-71 - [Low] `Card variant="interactive"` hover lift on a non-clickable `<div>`
- vehicle-card.tsx:83-89 - [Low] `<img>` no `width/height`; `loading="lazy"` on above-fold row
- vehicle-card.tsx:109-119 - [Low] Favourite button 32×32
- vehicle-card.tsx:154-158 - [Low] `condition` raw enum untranslated
- vehicle-card.tsx:170,182 - [Low] `text-[10px]`/`text-[11px]` labels
- vehicle-card.tsx:194-203 - [Low] "View Dossier & VIN" jargon

## packages/ui/src/components/footer.tsx
- footer.tsx:47-49 - [Medium] Privacy Notice / Terms / Consumer Rights are unfocusable faded spans (≈4.3:1); no reachable legal copy
- footer.tsx:45 - [Low] `new Date().getFullYear()` in a non-client component
- footer.tsx:32-41 - [Low] "GCC SPEC ONLY" contradicts non-GCC listings; EN-only
- footer.tsx:13 - [Low] No `env(safe-area-inset-bottom)`

## packages/ui/src/components/badge.tsx, button.tsx, card.tsx, empty-state.tsx, loading-skeleton.tsx
- badge.tsx:39-53 - [Low] off-token palette; :62-72 svg not `aria-hidden`
- button.tsx:26 - [Low] `transition-all`; `active:scale` no reduced motion; `disabled:pointer-events-none` blocks tooltips; :38,44 `pill`/`sm` below 44px; ✓ focus-visible ring on every variant
- card.tsx:15,23 - [Low] `transition-all`; interactive `<div>` with cursor-pointer
- empty-state.tsx:38 - [Low] fixed `<h3>` level
- loading-skeleton.tsx:23 - [Medium] `VehicleGridSkeleton` has no `role="status"`; children not `aria-hidden`
- loading-skeleton.tsx:23 - [Medium] Skeleton `lg:grid-cols-3` ≠ results `xl:grid-cols-3` → CLS at 1024–1279px
- loading-skeleton.tsx:5 - [Low] `animate-pulse` without reduced motion

## Summary
1. Counts: High 6 · Medium 71 · Low ~150.
2. ✓ pass (Low notes only): forgot-password, card, empty-state, badge, button. Strongest: account-shell, buyer-profile-view, account-settings-view, cars URL-state handling.
3. Top 1 — modals/drawers (vip-enquiry-modal:159, compare:503, cars:620): no focus move/trap/restore, no inert background.
4. Top 2 — `focus:outline-none` with no replacement on header logo, header select and every VehicleCard image link.
5. Top 3 — navigation gaps: no mobile nav below `lg`; "Sell & Consign" and footer legal links unfocusable; compare URL not synced; enquiries selection not in URL.
6. Top 4 — i18n/RTL defects on real buyer paths (storefront ignores locale, enquiry page forces EN, dashboard/verify/access EN-only, physical utilities, VINs without `dir`/`translate`, locale hook starts `'en'`).
7. Top 5 — destructive actions without confirmation (revoke grant, delete saved search); register submit disabled before request.
8. Theming/contrast: off-Stitch palette on auth/verify/dashboard/access pages; `text-gray-500`, `text-stone-500`, alpha variants fail AA; 40+ uses of 9–11px text incl. the finance disclaimer.
9. Motion/perf: zero reduced-motion handling; render-blocking Google Fonts; LCP images lack `fetchPriority`; skeleton/grid mismatch.
10. Forms/typography: inputs lack `name`/`autoComplete`/`spellCheck`; border-only focus; 12px inputs (iOS zoom); `...`; straight quotes; hand-formatted prices/dates; no `tabular-nums`.
