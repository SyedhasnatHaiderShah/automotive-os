# Route & UI State Audit — 2026-10-30

Branch: `feature/cf07-unified-auth-rbac` (after the platform audit fixes in `PLATFORM_AUDIT_2026-10-30.md` and the merge of `main` at `40589e0`).

Scope: every route in the marketplace, dealer and admin apps — data source, loading, error, empty/no-data, not-found, pagination, every button/link/form, status badges, accessibility and RTL.

Method: static code review (three parallel read-only reviewers, one per app), with every High finding re-checked by hand against the code. Each finding cites `file:line`.

Checks: browser, E2E, typecheck and lint were **NOT RUN** for this audit. Runtime behaviour marked UNVERIFIED is inferred from code only.

## Summary

| App | Routes | High | Medium | Low |
|---|---|---|---|---|
| Marketplace | 23 | 5 | 15 | 13 |
| Dealer | 13 | 3 | 7 | 9 |
| Admin | 9 | 0 | 13 | 13 |
| **Total** | **45** | **8** | **35** | **35** |

Verified as still fixed from the earlier audit: forgot-password honest notice, dossier redirect, enquiry consent unticked, UAE PASS disabled, account pages on real APIs only, fixtures gated, dealer role gates match API `@RequireRoles` (6/6), dealer DTO/enum shapes match Prisma, admin endpoints all behind `PlatformAdminGuard`, ConfirmReasonModal for destructive admin actions, no `href="#"` dead links.

## State coverage matrix

Legend: ✓ present and correct · ~ partial (see finding) · ✗ missing · — not applicable.

### Marketplace

| Route | Data | Loading | Error | Empty | Not-found | Paging | Notes |
|---|---|---|---|---|---|---|---|
| `/` | client: public listings, dealers | ✓ | ~ dealers no retry | ✓ no CTA | — | — | MK-06, MK-15, MK-16 |
| `/cars` | client: public listings, favorites | ✓ | ✓ (favorites load swallowed) | ✓ | — | ✓ | MK-03, MK-25 |
| `/cars/[slug]` | server: listing detail | ✓ | ~ MK-18 | ✓ | ✓ | — | MK-07 |
| `/cars/[slug]/enquiry`, `/enquire` | server: listing | ✓ | ~ | — | ✓ | — | MK-13 |
| `/compare` | client: listings + details | ✓ | ✓ | ✓ CTA | ~ unknown slug dropped | — | MK-24 |
| `/dealers` | client: public dealers | ✗ MK-20 | ~ no retry | ✓ no CTA | — | ✓ | |
| `/dealers/[slug]` | server: dealer + 20 listings | ✓ root | ~ inventory copy | ✓ | ✓ | ✗ capped 20 | MK-02 |
| `/auth` | POST login/signup | ✓ | ~ no role=alert | — | — | — | MK-04, MK-12, MK-21 |
| `/auth/login`, `/auth/register` | redirect | — | — | — | — | — | MK-21 |
| `/auth/verify-email` | POST verify/resend | ✓ | ✗ MK-04, MK-11 | — | — | — | |
| `/auth/activate` | GET verify, POST complete | ✓ | ~ MK-11 | — | — | — | |
| `/auth/forgot-password` | static honest notice | — | — | — | — | — | OK |
| `/access-denied`, `/access-suspended` | static | — | — | — | — | — | MK-14 |
| `/dashboard` | client: `/auth/me` | ✓ | ~ MK-33 | — | — | — | MK-05 |
| `/account/enquiries` | server: `/me/enquiries` | ✓ | ~ no account error.tsx | ✓ CTA | — | ✗ | MK-22 |
| `/account/garage` | server: `/me/appointments` | ✓ | ~ | ✓ CTA | — | ✗ | MK-10, MK-23 |
| `/account/saved` | server: saved searches, favorites | ✓ | ~ | ~ searches no CTA | — | ✗ | MK-17, MK-29 |
| `/account/profile` (+ `/dossier` redirect) | server: `/me`, buyer profile | ✓ | ~ | ✓ | — | — | MK-08 |
| `/account/settings` | server: `/me/settings` | ✓ | ~ | — | — | — | MK-09, MK-28 |

### Dealer

| Route | Data | Loading | Error | Empty | Paging | Notes |
|---|---|---|---|---|---|---|
| `/`, `/dashboard` | server: vehicles, counts, leads | ✓ root | ~ one failure blanks page (DL-17) | ✓ | — | role-gated leads card |
| `/inventory` | server: vehicles + counts | ✓ root | ✓ retry | ✓ | ~ DL-02 | DL-04, DL-12 |
| `/leads` | server: leads | ✓ root | ✓ retry | ✓ | ~ DL-02 | DL-11 |
| `/sales`, `/workshop`, `/parts`, `/finance`, `/finance/exception`, `/fleet`, `/fleet/exception`, `/accounting`, `/accounting/exception/export` | static fixtures (preview) | — | — | — | — | DL-01, DL-03, DL-05, DL-06, DL-07 |
| Shell (session, header, sidebar) | `/auth/me` | — | ~ DL-10 | — | — | DL-08, DL-09 |

### Admin

| Route | Data | Loading | Error | Empty | Paging | Notes |
|---|---|---|---|---|---|---|
| `/` | tenants, users total, audit total | ✓ | ~ tooltip only (AD-21) | — | — | AD-09, AD-10 |
| `/audit-logs` | audit-logs | ✓ | ✓ retry | ~ AD-16 | ✓ | AD-11, AD-17 |
| `/dealers` | tenants (cap 500) | ✓ | ✓ retry | ✓ | ✗ AD-20 | AD-03, AD-04, AD-05, AD-12 |
| `/disputes` | static honest | — | — | — | — | OK |
| `/moderation` | none (no queue API) | — | — | ✓ honest | — | OK |
| `/moderation/listings/[id]` | listing detail | ✓ | ✓ | — | — | AD-08, AD-22 |
| `/users` | users (paged) | ✓ | ✓ retry | ✓ | ✓ | AD-02, AD-18, AD-19, AD-23 |
| `/verifications` | tenants (cap 500) | ✓ | ✓ retry | ✓ | ✗ | OK |
| `/verifications/[id]` | tenant detail | ✓ | ✓ | — | — | AD-04, AD-22 |
| Shell (middleware, header, sidebar) | `/auth/me` | — | ~ AD-06 | — | — | AD-01, AD-07, AD-13, AD-25 |

## Findings — High

| ID | Where | Problem | Fix |
|---|---|---|---|
| MK-01 | `apps/api/src/listings/listings.service.ts:799-831`; `packages/ui/src/components/vehicle-card.tsx:37` | Public list API omits `gccSpec` and `VehicleCard` defaults it to `true`, so every card on `/` and `/cars` shows "GCC Spec", including non-GCC cars. | Add `gccSpec` to the public summary mapping; default the card to unknown/false. |
| MK-02 | `apps/marketplace/components/dealer-storefront-view.tsx:41,305` | Storefront GCC filter relies on the same missing field: count is always 0 and choosing it empties the grid. | Same as MK-01; hide the filter while the field is absent. |
| MK-03 | `apps/marketplace/app/cars/page.tsx:30-31,99-100` | `/cars` always sends `gccSpec=true` and `maxPriceFils` (default AED 2M, slider max AED 3M), hiding non-GCC and higher-priced stock without any visible chip; cars above AED 3M are unreachable. | Send these only when the user sets them; add "Any" max; show active-filter chips. |
| MK-04 | `apps/marketplace/app/auth/page.tsx:163-166`; `app/auth/verify-email/page.tsx:74-79`; `apps/api/src/auth/auth.service.ts:470-479` | Signup and resend tell users a verification email was sent, but the API has no email delivery at all; resend ignores `res.ok`, so 400/429 show success. Outside dev, new buyers cannot verify and login returns `EMAIL_NOT_VERIFIED`. | Add email delivery (approval needed for provider) or label verification unavailable; check `res.ok`; read `error.message`. |
| MK-05 | `apps/api/src/auth/auth.service.ts:95,104`; `apps/marketplace/app/dashboard/page.tsx:88,91` | SALES_MANAGER lands on `/dealer/crm` and SERVICE_ADVISOR on `/dealer/service`; neither route exists in the dealer app, so these roles hit a 404 after login. | Point them to `/dealer/leads` and `/dealer/workshop`, or add the pages. |
| DL-01 | `apps/dealer/lib/preview.ts:13-20` | Preview feedback neutraliser only matches English keywords; Arabic "sent/exported successfully" messages still reach users (e.g. `accounting/page.tsx:1397`, `sales/page.tsx:50`, `parts/page.tsx:118`). | Always return the locale's "Preview only — nothing was sent" message; drop keyword matching. |
| DL-03 | `apps/dealer/app/finance/exception/page.tsx:1294-1297`; `apps/dealer/app/fleet/exception/page.tsx:1116-1119,893-895` | Modals headed "Preview only — nothing was sent" then claim a CBUAE override was logged and a court escrow bond deposited; the button label flips to "Interpleader Motion Filed". | Replace body copy with a neutral preview note or disable the confirm buttons. |
| DL-04 | `apps/dealer/components/listing-actions.tsx:37-48` | If draft creation succeeds and submit then fails (publish gates), the page never refreshes, so the table still shows "No listing" while a DRAFT exists. | `router.refresh()` after draft creation (or in `finally`); message "Draft created; submit failed: …". |

## Findings — Medium

### Marketplace
- **MK-06** `app/page.tsx:63-67,96,430` — Home favourite hearts are local state only, lost on navigation, header count disagrees with `/account/saved`. Fix: use the favourites API like `/cars`.
- **MK-07** `components/vehicle-detail-view.tsx:143` — Header favourites badge is `isSaved ? 1 : 0`. Fix: real count or hide.
- **MK-08** `components/buyer-profile-view.tsx:54-55,71-73`; `apps/api/src/me/me.service.ts:78-84` — Clearing budget/emirate sends `undefined`; API keeps old value, UI says "Preferences saved". Fix: send and accept `null`.
- **MK-09** `components/account-settings-view.tsx:42,162`; `schema.prisma:195`; `me.service.ts:736` — WhatsApp consent shows ticked for users who never opted in (DB default `true`). Privacy risk. Fix: default `false` (schema change needs migration approval).
- **MK-10** `apps/api/src/me/me.service.ts:457-458,488`; `components/buyer-garage-view.tsx:161-163` — Appointment thumbnail may use private media; broken image with no fallback. Fix: filter `isPublic`, add `onError` fallback.
- **MK-11** `app/auth/activate/page.tsx:53,106`; `app/auth/verify-email/page.tsx:44` — Errors read `data.message`, API sends `{error:{message}}`; users never see the reason. Fix: read `data.error?.message`.
- **MK-12** `app/auth/page.tsx:91,113` — `EMAIL_NOT_VERIFIED` shows raw code, no path to verify/resend. Fix: detect code, link to `/auth/verify-email`.
- **MK-13** `app/cars/[slug]/enquiry/page.tsx:25-27` — Metadata claims "VIP Allocation Protocol" and Dubai Autodrome track sessions. Fix: neutral copy.
- **MK-14** `app/access-suspended/page.tsx:47-48,52,65` — Fabricated "UAE Federal Authority (CBUAE / MOEC)" jurisdiction; personal-domain support email. Fix: remove claim, configurable support address.
- **MK-15** `app/page.tsx:238-266` — Static GT3 RS hero card with "AED 1,480,000" price (still open). Fix: real featured listing or drop price.
- **MK-16** `app/page.tsx:172-176` — Condition tabs label NEW as "Off-Market Allocations" and USED as "Direct Consignment". Fix: label New / Used.
- **MK-17** `components/buyer-saved-view.tsx:173-178` — No UI creates saved searches; empty state has no CTA. Fix: add "Save this search" on `/cars` or mark unavailable.
- **MK-18** `app/error.tsx:51`; `app/cars/[slug]/error.tsx:30` — Retry calls only `reset()` (likely no server refetch); no `account/error.tsx` or `dealers/[slug]` boundary, so failures show inventory copy. Fix: `router.refresh()` + `reset()` in a transition; add route error files.
- **MK-19** Accessibility: unlabelled inputs and icon-only buttons across `auth/page.tsx:289-486`, `cars/page.tsx:256-437` (span chips not keyboard-accessible), `app/page.tsx:195,209`, `compare/page.tsx:352,508`, `verify-email:174`, `activate:193,206`. Fix: `htmlFor`/`id`, `aria-label`, chips as buttons.
- **MK-20** `app/dealers/page.tsx:140-145` — Blank loading state. Fix: skeleton or status line.

### Dealer
- **DL-02** `components/dealer-ui.tsx:71-72,82-94` — Page beyond last shows "Showing 81–30 of 30", "Page 5 / 2" and "No vehicles/leads yet". Fix: clamp or redirect; "Page out of range" link.
- **DL-05** `app/finance/exception/page.tsx:104-120`; `app/fleet/exception/page.tsx:79-90` — Fake clickable RBAC role toggle survives the earlier fix. Fix: remove or static "Sample role".
- **DL-06** `app/accounting/page.tsx:55-72` — Preview inserts invoice with "XML Filed & Cleared" FTA status. Fix: "Preview — not filed" or no mutation.
- **DL-07** `middleware.ts:33`; `components/dealer-sidebar.tsx:11` — Preview routes served in every build; flag only hides nav links. Fix: `notFound()` in preview layouts unless flag is on.
- **DL-08** `components/dealer-shell.tsx:14-20`; `app/layout.tsx:22` — Locale resets on navigation; live pages only translate sidebar; layout not mirrored; `html lang` static. Fix: persisted locale, logical CSS classes, Arabic strings.
- **DL-09** `lib/session.ts:80`; `apps/api/src/auth/auth.service.ts:183` — Active tenant picked from unordered memberships; multi-dealer users may switch tenant between requests. Fix: deterministic `orderBy` + tenant switcher.
- **DL-10** `components/dealer-service-error.tsx:18-36`; `lib/session.ts:39` — No-membership, suspended tenant and API 401/403 all get "Retry Connection" (loops) and raw error codes. Fix: per-code messages, sign-out/switch, strip prefix.

### Admin
- **AD-01** `components/ConfirmReasonModal.tsx:46-59` — Escape handler captures stale `busy` (deps `[open]`); Escape closes mid-request and later errors are never shown. No focus trap/return. Fix: refs or full deps; focus trap.
- **AD-02** `app/users/page.tsx:75-79,148,503`; `apps/api/src/admin/admin.service.ts:450-470` — Self-action guard fails open when `/auth/me` errors; API has no self-check. Fix: hide actions until id known; reject self-actions in API.
- **AD-03** `app/dealers/page.tsx:101-103,142,197-212` — Create/invite errors render as a toast behind the modal backdrop. Fix: inline `role="alert"` in modal.
- **AD-04** `app/dealers/page.tsx:327`; `app/verifications/[id]/page.tsx:210-217` — "Activate" offered for CLOSED and PENDING tenants regardless of KYB. Fix: SUSPENDED→ACTIVE only, or warn + require APPROVED; server transition rules.
- **AD-05** `app/dealers/page.tsx:287-290` — KYB badge gold + ShieldCheck for every status; REJECTED looks verified. Fix: per-status mapping from `verifications/page.tsx:176-185`.
- **AD-06** `lib/api.ts:85-88` — 401/403 mid-session shows raw message, no redirect. Fix: 401 → `/auth?tab=login&redirect=…`; 403 → "not a platform admin".
- **AD-07** `components/AdminHeader.tsx` — No sign-out anywhere in admin. Fix: Sign out → `POST /api/v1/auth/logout`.
- **AD-08** `app/moderation/listings/[id]/page.tsx:35-39,250-259`; `listings.service.ts:527` — API returns raw media keys; moderators approve without seeing photos. Fix: short-lived signed admin URLs.
- **AD-09** `app/page.tsx:18-25`; `admin.service.ts:58` — Dealer/KYB counts from a list capped at 500. Fix: count endpoints.
- **AD-10** `admin.service.ts:46,91,278` — Every admin read writes an audit row (one per debounced users search); inflates "Audit events" KPI. Fix: drop/sample read audits or filter KPI.
- **AD-11** `app/audit-logs/page.tsx:185-188` — Expandable rows mouse-only. Fix: `<button aria-expanded>`.
- **AD-12** `app/dealers/page.tsx:218-224,354-509` — Modals lack dialog role/Escape; X buttons unlabeled; labels not associated. Fix: dialog pattern, `htmlFor`/`id`.
- **AD-13** `app/page.tsx:46` (all pages); `layout.tsx:22` — RTL state per page, resets on navigation; most table/modal text English only. Fix: shared locale, `html lang`/`dir`.

## Findings — Low

### Marketplace
- **MK-21** Tab switch and `/auth/login`, `/auth/register` drop `?redirect=` (`auth/page.tsx:229,244`; `login/page.tsx:4`; `register/page.tsx:4`).
- **MK-22** Enquiry intents/appointment status/granted fields raw or English-only; ENQUIRY intent unmapped (`buyer-enquiries-view.tsx:29-35,219,243`).
- **MK-23** "Active bookings" counts COMPLETED and NO_SHOW (`buyer-garage-view.tsx:120`).
- **MK-24** Compare: unknown slugs dropped silently, double-add possible, selections not in URL, picker not a dialog (`compare/page.tsx:42-84`).
- **MK-25** `/cars` favourite toggle no pending guard; hardcoded make list (`cars/page.tsx:150-169,195`).
- **MK-26** Vehicle card: "Brand New" for null mileage, heart label mentions "session", raw condition enum (`vehicle-card.tsx:60,116-117,156`).
- **MK-27** Lead reference format differs between modal and account; consent version always `en-AE`; no focus trap (`vip-enquiry-modal.tsx:25,426`).
- **MK-28** Currency and garage-visibility settings have no effect (`account-settings-view.tsx:145-183`).
- **MK-29** Saved search "Run search" ignores price/GCC (`buyer-saved-view.tsx:34-42`).
- **MK-30** English-only strings on bilingual pages (home, cars, compare, detail, auth, verify-email, activate, access pages, dashboard); enquiry view never passes `locale`.
- **MK-31** 404 page says "Vehicle Dossier Not Found" for every route (`not-found.tsx:16`).
- **MK-32** Listing slug not URL-encoded (`lib/api.ts:577`).
- **MK-33** Any non-401 error on `/dashboard` redirects a valid session to login after 2 s (`dashboard/page.tsx:244-249`).

### Dealer
- **DL-11** Lead status (incl. LOST/SPAM) changes on select with no confirm or success feedback (`lead-row-actions.tsx:63-65`).
- **DL-12** Unpublish has no confirm or success message (`listing-actions.tsx:60-68`).
- **DL-13** Preview forms: 57 controls, 0 `htmlFor`; 16 "✕" buttons without aria-label.
- **DL-14** Native `alert()` with fixture data (`sales/page.tsx:364,456`).
- **DL-15** "View leads" icon opens unfiltered `/leads` (`inventory-matrix-view.tsx:213`).
- **DL-16** Test Drives disabled "Not available yet" though `GET /tenants/:id/appointments` exists (`dealer-sidebar.tsx:53`).
- **DL-17** One failed count call blanks the whole dashboard (`app/page.tsx:39-45`); use `Promise.allSettled`.
- **DL-18** Client calls and images use root `/api/v1`; work only behind the marketplace gateway (UNVERIFIED runtime).
- **DL-19** `/accounting/exception/export` has no inbound link; preview banner English only.

### Admin
- **AD-14** "Copied" shown even if clipboard write fails (`dealers/page.tsx:478-481`).
- **AD-15** UNVERIFIED possible redirect loop when `verify-admin-session` fails for a valid admin (`middleware.ts:169-190,243-263`).
- **AD-16** Audit empty state ignores active filters (`audit-logs/page.tsx:174-178`).
- **AD-17** Audit timestamps in UTC, not Asia/Dubai (`audit-logs/page.tsx:146,214`).
- **AD-18** Users role filter misses 4 roles; API accepts any string (`users/page.tsx:247-253`; `admin-user.dto.ts:17-20`).
- **AD-19** User drawer: no Escape or focus trap (`users/page.tsx:424-446`).
- **AD-20** Dealers footer claims "full list" despite 500 cap (`dealers/page.tsx:345-347`).
- **AD-21** Home metric errors only in a `title` tooltip (`app/page.tsx:35-41`).
- **AD-22** 404 on `[id]` detail pages shows a pointless Retry.
- **AD-23** "Reactivate" on PENDING_VERIFICATION user skips email verification (`users/page.tsx:519-528`).
- **AD-24** Toast timers never cleared; dealers toast lacks `role="status"`.
- **AD-25** Mobile off-canvas nav focusable when closed; backdrop tap does not close.
- **AD-26** Admin standalone on :3002 has no `/api` rewrite; works only behind gateway.

## Suggested fix order

1. **Data truth (High):** MK-01/02 `gccSpec` in public list API, MK-03 `/cars` default filters, MK-05 role landing routes, DL-04 listing refresh.
2. **Fake success (High):** DL-01 preview neutraliser, DL-03 preview modal copy, MK-04 resend `res.ok` check and honest verification messaging (email provider needs a product decision).
3. **Admin safety (Medium):** AD-01, AD-02 (API self-check), AD-04 (transition rules), AD-05, AD-06, AD-07.
4. **Buyer data integrity (Medium):** MK-08, MK-09 (schema default needs migration approval), MK-10, MK-11, MK-12.
5. **Copy and claims:** MK-13, MK-14, MK-15, MK-16, DL-05, DL-06, DL-07.
6. **Error/empty/paging states:** MK-18, MK-20, DL-02, DL-10, DL-17, AD-03, AD-16, AD-22.
7. **Accessibility and RTL:** MK-19, MK-30, DL-08, DL-13, AD-11, AD-12, AD-13, AD-19, AD-25.

## Fix log — High findings (2026-10-30)

| ID | Change | Files |
|---|---|---|
| MK-01 | Public listing summary now includes `gccSpec` (Prisma list path and search-projection path); `VehicleCard` defaults `gccSpec` to `false`, so no badge is shown when the value is unknown. | `apps/api/src/listings/dto/public-listing-response.dto.ts`, `listings.service.ts`, `listing-search-sync.service.ts`, `packages/ui/src/components/vehicle-card.tsx` |
| MK-02 | Storefront GCC filter and count now work because list items carry `gccSpec` (no storefront code change needed). | — |
| MK-03 | `/cars` no longer filters by default: GCC is off unless chosen (`?gcc=true`), and the top slider position means "Any price" (no `maxPriceFils` sent). Active GCC and price caps show as removable chips. Old `?gcc=false` links behave as "no GCC filter". | `apps/marketplace/app/cars/page.tsx` |
| MK-04 | Signup and resend no longer claim an email was sent unless `NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED=true`. Resend checks `res.ok` (429 gets a rate-limit message), errors read the API `error.message` envelope, and the result is announced with `role=alert`/`status`. The email provider itself is still a product decision. | `apps/marketplace/lib/email-delivery.ts` (new), `app/auth/page.tsx`, `app/auth/verify-email/page.tsx` |
| MK-05 | SALES_MANAGER and SALES_AGENT land on `/dealer/leads`, INVENTORY_MANAGER on `/dealer/inventory`, everyone else (incl. SERVICE_ADVISOR, FINANCE_MANAGER, whose modules are sample-data previews) on `/dealer`. API and client fallback match; integration test updated. | `apps/api/src/auth/auth.service.ts`, `apps/marketplace/app/dashboard/page.tsx`, `apps/api/test/cf07-unified-auth-rbac.spec.ts` |
| DL-01 | `previewSafeMessage` now always returns "Preview only — nothing was sent." (Arabic when the page's message is Arabic) instead of keyword matching. | `apps/dealer/lib/preview.ts` |
| DL-03 | CRO override and interpleader confirmations now say no override was logged / no motion filed / no bond deposited; success icon replaced with a neutral info icon; the fleet button reads "Preview completed — nothing was filed". | `apps/dealer/app/finance/exception/page.tsx`, `apps/dealer/app/fleet/exception/page.tsx` |
| DL-04 | When a draft listing is created but submission fails, the error says "Draft listing created, but it was not submitted for review: …" and the table refreshes to show the draft. | `apps/dealer/components/listing-actions.tsx` |

Checks after fixes:
- Typecheck: api, marketplace, dealer, admin, packages/ui — PASS
- API jest: 24 suites, 232/232 — PASS
- `next build`: marketplace, dealer, admin — PASS
- Browser/E2E verification of the changed flows — NOT RUN

Remaining: all Medium and Low findings above are still open. MK-04 still needs an email provider decision before buyers can self-verify outside development.

## Fix log — Medium findings (2026-10-30)

### Marketplace
| ID | Status | Change |
|---|---|---|
| MK-06 | Fixed | Home favourites use the real favourites API, 401 redirects to login, header count is the real total. |
| MK-07 | Fixed | Detail page header count comes from the favourites API. |
| MK-08 | Fixed | Profile sends `null` for cleared budget/emirate; `UpdateBuyerProfileDto` accepts null and `me.service` clears the column (undefined still means unchanged). |
| MK-09 | Partial | New buyer/settings rows default WhatsApp consent to `false` and the API fallback is `false`. **Open:** existing rows created with the DB default `true` cannot be told apart from real opt-ins; needs a schema default change plus backfill/re-consent decision (migration approval required). `aecbRefreshConsent` default needs the same review. |
| MK-10 | Fixed | Appointment thumbnails only use public EXTERIOR/INTERIOR media; broken images fall back to an icon. |
| MK-11 | Fixed | Activate page reads the API `error.message` envelope. |
| MK-12 | Fixed | `EMAIL_NOT_VERIFIED` login shows a bilingual message with a link to `/auth/verify-email`. |
| MK-13 | Fixed | Neutral enquiry metadata. |
| MK-14 | Fixed | Fabricated jurisdiction removed; support email from `NEXT_PUBLIC_SUPPORT_EMAIL` (hidden when unset). |
| MK-15 | Fixed | Home hero shows the first real published listing instead of the static priced card. |
| MK-16 | Fixed | Condition tabs read All / New / Used. |
| MK-17 | Fixed | "Save this search" on `/cars` calls `POST /me/saved-searches` (alerts off); saved-search empty state explains and links to search. |
| MK-18 | Fixed | Error retry refreshes server data; new `account/error.tsx`, `dealers/[slug]/error.tsx`, `dealers/[slug]/not-found.tsx`; neutral root error copy. |
| MK-19 | Fixed | Labels, aria-labels, keyboard-accessible filter chips, dialog roles on auth, cars, home, compare, activate. |
| MK-20 | Fixed | Dealers page loading skeleton with `role="status"`. |

### Dealer
| ID | Status | Change |
|---|---|---|
| DL-02 | Fixed | Out-of-range pages show "Page N does not exist" with links to page 1 and last page; empty copy distinguishes no stock from no match. |
| DL-05 | Fixed | Fake role toggles replaced with a static "Sample role" label. |
| DL-06 | Fixed | Preview invoice rows say "Preview — not filed". Seeded fixture rows in `lib/api.ts` still contain filed-style statuses (follow-up). |
| DL-07 | Fixed | Preview module layouts return 404 unless `NEXT_PUBLIC_ENABLE_PREVIEW_MODULES=true` (set it on staging to keep them visible). |
| DL-08 | Fixed | `ao_locale` cookie sets `<html lang dir>`; shell uses logical (RTL-aware) classes; dashboard, inventory, leads, pager, shell and error card translated. Enum values (fuel, transmission, intent) remain English. |
| DL-09 | Fixed | Membership includes ordered by `createdAt, id` in login, OIDC validation and `/auth/me`. Tenant switcher remains a product item. |
| DL-10 | Fixed | Error card branches by cause (sign in, no membership, account restricted, tenant suspended, API down) with sign-out and marketplace links; raw codes no longer shown. |

### Admin
| ID | Status | Change |
|---|---|---|
| AD-01 | Fixed | Shared `AdminDialog` (focus trap, focus return, Escape blocked while busy) used by ConfirmReasonModal. |
| AD-02 | Fixed | User actions hidden until the admin id is known; API rejects self suspend/disable/demote/revoke with 400. |
| AD-03 | Fixed | Create/invite errors shown inside the modal. |
| AD-04 | Fixed | UI offers Activate only from SUSPENDED; API enforces transitions (CLOSED terminal, no return to PENDING, PENDING→ACTIVE needs approved KYB) with 409. |
| AD-05 | Fixed | Per-status KYB badge shared with verifications. |
| AD-06 | Fixed | 401 redirects to login; 403 shows "Your account is not a platform admin." |
| AD-07 | Fixed | Sign out button in the header. |
| AD-08 | Fixed | Admin listing detail returns 5-minute signed preview URLs (null when storage is not configured); moderation page renders them. Decision needed: moderators can now open private documents. |
| AD-09 | Fixed | New `GET /api/v1/admin/tenants/summary` counts endpoint used by the home page. |
| AD-10 | Partial | Users-list read audit removed. Tenant-list and single-record read audits kept (existing E2E requires them). |
| AD-11 | Fixed | Expandable audit rows use a button with `aria-expanded`. |
| AD-12 | Fixed | Dealers modals use the accessible dialog; labelled controls. |
| AD-13 | Fixed | Locale persisted in `ao_locale` cookie via a provider; main tables, modals, toasts translated; icons mirror under RTL. |

Checks after Medium fixes:
- Typecheck: api, marketplace, dealer, admin, packages/ui — PASS
- API jest: 26 suites, 250/250 — PASS
- `next build`: marketplace, dealer, admin — PASS
- Browser/E2E — NOT RUN

Decisions needed: MK-09 migration and backfill; AD-08 moderator access to private documents (and whether to audit each open); AD-04 transition rules; review of all new Arabic copy; `NEXT_PUBLIC_SUPPORT_EMAIL` and `NEXT_PUBLIC_ENABLE_PREVIEW_MODULES` deploy settings.

## Decisions applied (2026-10-30)

- **MK-09 / consent (approved):** migration `20261030150000_consent_defaults_opt_in` changes `whatsapp_comms_consent` and `aecb_refresh_consent` defaults to `false` and resets every existing `true` value to `false`; buyers opt in again from settings. API fallbacks for both are now `false`. Migration is applied manually with `prisma migrate deploy` (the API container does not migrate on start).
- **AD-08:** moderators keep 5-minute signed previews; each response that issues a link to private media writes `ADMIN_PRIVATE_MEDIA_PREVIEW_ISSUED` (media ids and expiry only, never the URL).
- **AD-10:** tenant-list reads are no longer audited (test updated). Single-record reads and all mutations remain audited.
- **AD-04:** transition rules kept as built.

Checks: API typecheck PASS; API jest 27 suites, 252/252 PASS; Prisma validate PASS. Migration NOT RUN against any database from this machine.
