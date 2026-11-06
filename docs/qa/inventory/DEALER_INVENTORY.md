# Dealer DMS (`apps/dealer`) — QA Inventory

Generated 2026-10-31 by static reading of `apps/dealer` and the API controllers it depends on. No app was run; every statement below cites `file:line`. Line numbers are from the current `docs/staging-signed-in-qa` branch (HEAD `90600a5`).

Runtime facts used throughout:

- App: Next.js 15 App Router, port 3001 (`apps/dealer/package.json:6`), `basePath: '/dealer'` (`apps/dealer/next.config.mjs:4`). Reached through the marketplace gateway rewrite `/dealer/:path*` → `http://localhost:3001/dealer/:path*` and `/api/:path*` → API (`apps/marketplace/next.config.mjs:12-24`).
- Gate: `apps/dealer/middleware.ts:19-52` checks only that the `ao_session` cookie exists. Dev bypass on localhost unless `DEALER_AUTH_ENFORCED=true` (`middleware.ts:26-32`). Non-HTML requests get `401` JSON (`:38-44`); HTML requests get `307` to `/auth?tab=login&redirect=<path>` on the gateway origin (`:46-51`).
- Session: `apps/dealer/lib/session.ts:66-123` calls `GET /api/v1/auth/me` with the cookie as bearer, keeps memberships with `active && tenantStatus === 'ACTIVE'` and uses the **first** one (`:96-99`). The API orders memberships `createdAt asc, id asc` (`apps/api/src/auth/auth.service.ts:151,246`). `hasMultipleTenants` is informational only (`session.ts:121`).
- Capabilities: `apps/dealer/lib/permissions.ts:49-54,64-83` (`canCreateVehicle`, `canManageListings`, `canSeeCost`, `canReadLeads`, `canChangeLeadStatus`, `canAssignLeads`). Unknown role → all false (`:65-73`).
- API authority: every `/api/v1/tenants/:tenantId/*` route is behind `JwtAuthGuard` + `TenantAccessGuard` (`apps/api/src/common/guards/tenant-access.guard.ts:26-113`): no membership → 403 `TENANT_FORBIDDEN` (`:62-66`); inactive membership → 403 `MEMBERSHIP_INACTIVE` (`:74-78`); tenant not ACTIVE → 403 `TENANT_INACTIVE` (`:80-84`); role not in `@RequireRoles` → 403 `INSUFFICIENT_ROLE_PERMISSIONS` (`:92-101`). Platform admins bypass with role OWNER (`:42-56`).
- Preview modules: `apps/dealer/lib/preview.ts:29` — served only when `NEXT_PUBLIC_ENABLE_PREVIEW_MODULES === 'true'`; otherwise their layouts call `notFound()` (`apps/dealer/app/sales/layout.tsx:11`, identical in `workshop`, `parts`, `finance`, `accounting`, `fleet` layouts). They import `VERIFIED_*_FIXTURE` from `apps/dealer/lib/api.ts` and never call the network (`api.ts:1-9`).
- Locale: `ao_locale` cookie → `<html lang dir>` in `apps/dealer/app/layout.tsx:24-26`; `persistLocale` writes the cookie and flips `document.documentElement` (`apps/dealer/lib/i18n.ts:27-31`).

---

## 1. Route table

| Route (gateway path) | File | Auth / role requirement | Data source | Server vs client | Preview banner |
|---|---|---|---|---|---|
| `/dealer` | `apps/dealer/app/page.tsx` | Middleware cookie gate; `getDealerSession()` (`page.tsx:22`); any of the 8 roles renders; leads block gated by `caps.canReadLeads` (`:26-27`) | Live: `GET /tenants/:t/vehicles?page=1&limit=50`, `…?limit=1&stockStatus=AVAILABLE|RESERVED|SOLD` (counts), `GET /tenants/:t/leads?page=1&limit=5`, `…?limit=1&status=NEW|CONTACTED|QUALIFIED|TEST_DRIVE_NEGOTIATION|WON` (`page.tsx:28-48`, `lib/dealer-api-server.ts:39-77`) | Server component; shell (`DealerShell`) is a client island (`components/dealer-shell.tsx:1`) | No (live) |
| `/dealer/dashboard` | `apps/dealer/app/dashboard/page.tsx:1` | Same as `/dealer` (re-export) | Same | Same | No |
| `/dealer/inventory` | `apps/dealer/app/inventory/page.tsx` | Cookie gate; session; any role; actions column gated by `canManageListings`; cost by `canSeeCost` | Live: `GET /tenants/:t/vehicles?page&limit[&stockStatus]` + 4 count calls (`inventory/page.tsx:30-36`) | Server component; `ListingActions` client island (`components/listing-actions.tsx:1`) | No |
| `/dealer/leads` | `apps/dealer/app/leads/page.tsx` | Cookie gate; session; `canReadLeads` else `AccessNotice` without calling the API (`leads/page.tsx:42-49`); row actions gated by `canChangeLeadStatus` / `canAssignLeads` (`:65,161-162`) | Live: `GET /tenants/:t/leads?page&limit[&status]` (`:54`); client PATCH `/leads/:id/status`, `/leads/:id/assignment` (`components/lead-row-actions.tsx:36-43`) | Server component; `LeadRowActions` client island | No |
| `/dealer/sales` | `apps/dealer/app/sales/page.tsx` | Cookie gate only (no `getDealerSession`, no role check); layout 404s unless preview flag (`sales/layout.tsx:11`) | `VERIFIED_SALES_ORDER_FIXTURE` (`sales/page.tsx:19`) | Client component (`'use client'`, `:1`) | Yes — `PreviewBanner` from layout (`components/preview-banner.tsx:7-20`) |
| `/dealer/workshop` | `apps/dealer/app/workshop/page.tsx` | Cookie gate only; preview flag | `VERIFIED_WORKSHOP_FIXTURE` | Client | Yes |
| `/dealer/parts` | `apps/dealer/app/parts/page.tsx` | Cookie gate only; preview flag | `VERIFIED_PARTS_FIXTURE` | Client | Yes |
| `/dealer/finance` | `apps/dealer/app/finance/page.tsx` | Cookie gate only; preview flag | `VERIFIED_FINANCE_DESK_FIXTURE` | Client | Yes |
| `/dealer/finance/exception` | `apps/dealer/app/finance/exception/page.tsx` | Cookie gate only; preview flag (inherits `finance/layout.tsx`) | `VERIFIED_SUBPRIME_DBR_EXCEPTION_FIXTURE` initial state, then `fetchSubprimeDbrExceptionData()` returns the same object (`:15,52-54`; `lib/api.ts:2351`) | Client | Yes |
| `/dealer/accounting` | `apps/dealer/app/accounting/page.tsx` | Cookie gate only; preview flag | `VERIFIED_ACCOUNTING_DESK_FIXTURE` | Client | Yes |
| `/dealer/accounting/exception/export` | `apps/dealer/app/accounting/exception/export/page.tsx` | Cookie gate only; preview flag (inherits `accounting/layout.tsx`) | `VERIFIED_EXPORT_DISCREPANCY_FIXTURE` | Client | Yes |
| `/dealer/fleet` | `apps/dealer/app/fleet/page.tsx` | Cookie gate only; preview flag | `VERIFIED_FLEET_CONSIGNMENT_FIXTURE` | Client | Yes |
| `/dealer/fleet/exception` | `apps/dealer/app/fleet/exception/page.tsx` | Cookie gate only; preview flag (inherits `fleet/layout.tsx`) | `VERIFIED_CUSTODY_FREEZE_FIXTURE` initial state, then `fetchCustodyFreezeData()` (`:15,39-41`) | Client | Yes |
| `/dealer/api/health` | `apps/dealer/app/api/health/route.ts` | None (excluded from middleware matcher, `middleware.ts:15`) | Static JSON | Route handler | n/a |
| Error boundary | `apps/dealer/app/error.tsx` | n/a | n/a | Client | n/a |
| Not found | `apps/dealer/app/not-found.tsx` | n/a | n/a | Server | n/a |
| Loading | `apps/dealer/app/loading.tsx` | n/a | Skeleton only | Server | n/a |

Totals: 13 page routes (4 live incl. the `/dashboard` alias, 9 fixture-backed) + health + error/not-found/loading.

---

## 2. Per-route feature inventory

### 2.1 Shared shell (all 4 live routes) — `components/dealer-shell.tsx`, `dealer-header.tsx`, `dealer-sidebar.tsx`

| Control | Label (EN / AR) | Behaviour | API / state | Roles | States |
|---|---|---|---|---|---|
| Mobile nav toggle (`<lg` only) | aria-label "Toggle dealer navigation" / "فتح أو إغلاق التنقل" (`dealer-header.tsx:39`) | Toggles `body.dealer-mobile-nav-open`; sidebar slides in (`app/globals.css:30-37`) | Local DOM class | All | `aria-expanded` bound to state |
| Sidebar close | "✕", aria-label "Close dealer navigation" (`dealer-sidebar.tsx:103`) | Removes class, dispatches `dealer-nav-closed`; `Escape` also closes (`:27-31`) | Local | All | — |
| Active dealership chip | tenant name, or "Preview — no dealer session" when no identity (`dealer-header.tsx:43`) | Display only | — | All | — |
| Multi-tenant note | "First active dealership shown", title "Dealership switching is not available yet" (`dealer-header.tsx:46-50`, `i18n.ts:36-37`) | Display only; hidden below `md` | — | Users with >1 usable membership | — |
| Role badge | "Your role: <Role>" aria-label (`dealer-header.tsx:56-62`) | Display; hidden below `md` | — | All | — |
| Language toggle | "EN / عربي", aria-label "Toggle language" (`dealer-header.tsx:65-74`) | `toggleLocale` → `persistLocale` cookie + `router.refresh()` (`dealer-shell.tsx:23-29`) | Cookie `ao_locale`; server re-render | All | No loading indicator during transition |
| User block | display name + role; "Preview" / "Sample data only" on preview pages (`dealer-header.tsx:79-82`) | Display | — | All | — |
| Nav "Dashboard" | `href="/"` (`dealer-sidebar.tsx:39`) | Link; `aria-current="page"` when active (`:87`) | — | All | — |
| Nav "Inventory" | `href="/inventory"` (`:40`) | Link | — | All | — |
| Nav "Add Vehicle" | badge "Unavailable", title/sr "Vehicle intake needs the catalogue API — not available yet" (`:41-46`, `permissions.ts:86`) | **Always disabled** (`aria-disabled` span, `:69-81`) | — | All | Disabled |
| Nav "Leads" | `href="/leads"`; disabled with "Your role cannot view leads" when `!canReadLeads` (`:47-52`) | Link or disabled span | — | Enabled: OWNER, ADMIN, SALES_MANAGER, SALES_AGENT | Disabled for others |
| Nav "Test Drives" | badge "Soon", "Not available yet" (`:53`) | Disabled span | — | All | Disabled (no appointments UI exists) |
| Nav "Dealership Settings" | badge "Soon" (`:54`) | Disabled span | — | All | Disabled |
| Preview group header | "Preview modules" + chip "Sample data" (`:134-141`) | Display | — | All | — |
| Preview nav ×6 | "Sales Orders & Quotes", "Workshop & Bays", "Parts & Procurement", "Finance & Insurance", "Invoices & Accounting", "Fleet & Consignment", badge "Preview" (`:57-64,143-153`) | Links when `PREVIEW_MODULES_ENABLED`; otherwise disabled with "Preview module with sample data — not enabled in this build" | — | All (no role gate) | Disabled when flag off |
| Sidebar identity footer | tenant, "<name> • <Role>" or "Preview page — no dealer session is loaded here." (`:157-170`) | Display | — | All | — |
| **Sign-out** | — | **No sign-out control exists in the shell.** `DealerSignOutButton` is rendered only inside `DealerServiceError` (`components/dealer-service-error.tsx:91`) | — | — | Gap G-01 |

Staging badge: "STAGING · SYNTHETIC DATA · No live external approvals" when `NEXT_PUBLIC_APP_ENV === 'staging'` (`app/layout.tsx:45-49`).

### 2.2 `/dealer` and `/dealer/dashboard` — `app/page.tsx`, `components/dashboard-cockpit-view.tsx`

| Control | Label | Behaviour | API / state | Roles | States |
|---|---|---|---|---|---|
| Link "Inventory" | `t.navInventory` (`cockpit:63-69`) | → `/dealer/inventory` | — | All | — |
| Link "Leads" | `t.navLeads` (`:70-78`) | → `/dealer/leads` | — | `canReadLeads` | Hidden otherwise |
| Button "Add vehicle (unavailable)" | title/aria "Add vehicle — Vehicle intake needs the catalogue API — not available yet" (`:79-90`) | **Disabled, non-functional** | — | `canCreateVehicle` (OWNER, ADMIN, INVENTORY_MANAGER, SALES_MANAGER) | Disabled |
| Stat cards "Total stock", "Available", "Reserved", "Sold" | note "All vehicles" (`:99-102`) | Exact API `total` per status (`page.tsx:44-47`) | `GET vehicles?limit=1[&stockStatus]` | All | — |
| Stat "Available asking value" | note "All vehicles in this dealership" or "Latest N of M vehicles only" (`:103-109`, `:49-53`) | Sum of `askingPriceFils` of AVAILABLE vehicles **in the first 50 rows only**; `AED 0` fallback | Derived from `GET vehicles?page=1&limit=50` | All | Honest note when sample incomplete |
| Lead stat cards "All leads", "New", "Contacted", "Qualified", "Test drive / negotiation", "Won" (`:118-125`) | notes "All time" / "Awaiting first contact" | Exact `total`s | `GET leads?limit=1&status=…` ×5 + `limit=5` | `canReadLeads` | `AccessNotice` "Leads hidden for your role" otherwise (`:127`) |
| "Listing status" list (`:132-152`) | status pills with counts | Counts over the 50-row sample; "No vehicles yet." when empty | Derived | All | Empty state |
| "Recent leads" list + "View all" link (`:154-181`) | 5 latest leads: listing title, buyer display name (masked unless consented), intent, Dubai time, status pill | Link → `/dealer/leads` | `GET leads?page=1&limit=5` | `canReadLeads`; others see "Not available for your role." | Empty "No leads yet." |
| Error card | see §2.5 | `DealerServiceError` with `retryPath="/dealer"` (`page.tsx:70-79`) | — | — | — |

Loading: `app/loading.tsx` skeleton (route-level). No per-card loading. Dashboard makes up to 10 parallel API calls per render (`page.tsx:28-48`).

### 2.3 `/dealer/inventory` — `app/inventory/page.tsx`, `components/inventory-matrix-view.tsx`, `components/listing-actions.tsx`

| Control | Label | Behaviour | API / state | Roles | States |
|---|---|---|---|---|---|
| Button "Intake Vehicle" | + helper "Vehicle intake needs the catalogue API — not available yet" (`matrix:62-75`) | **Disabled, non-functional**; `aria-describedby="intake-unavailable"` | — | `canCreateVehicle` | Disabled |
| Stat cards "Total stock", "Available", "Reserved", "Sold" (`:79-82`) | notes "All vehicles in this dealership", "All stock, status …" | Exact API totals (`inventory/page.tsx:32-35`) | 4 × `GET vehicles?limit=1` | All | — |
| Stat "Listings on this page" (`:83-89`) | "P / R", note "Published / in review among the N vehicles shown" | Counts over current page | Derived | All | — |
| Filter chips | "All stock", "Intake", "Available", "Reserved", "Sold", "Transferred", "Archived" (`:93-102`, `i18n.ts:53-60`) | Links `/inventory?page=1&limit=L[&stockStatus=X]`; `aria-current="true"` on active | `GET vehicles?stockStatus=` | All | Unknown `stockStatus` param ignored (`inventory/page.tsx:27-28`) |
| Table columns | "Vehicle & stock number", "VIN", "Specification", "Stock", "Listing", "Cost / Asking" **or** "Asking", "Actions" (`:110-116`) | Cost column header and "Cost: AED …" + margin % only when `canSeeCost` (`:115,195-205`) | `purchaseCostFils` is `null` from the API for other roles (`apps/api/src/inventory/vehicles.service.ts:496-502`) | Cost: OWNER, ADMIN, INVENTORY_MANAGER, FINANCE_MANAGER | — |
| Row image | first public EXTERIOR/INTERIOR media via `/api/v1/public/media/<key>` (`lib/dealer-api.ts:199-206`) | Placeholder icon when none | — | All | — |
| Stock pill / Listing pill | localised status; "No listing" when null (`:184-191`) | Display | — | All | — |
| Button "Submit for review" | title "Submit to marketplace moderation" (`listing-actions.tsx:75-83`) | If no listing: `POST /tenants/:t/vehicles/:id/listing` `{askingPriceFils}` then `POST /listings/:id/submit`; else submit only (`:31-57`). `router.refresh()` on success | Shown when stock `AVAILABLE` and listing null/DRAFT/PAUSED/REJECTED (`:25-29`) | `canManageListings` (OWNER, ADMIN, INVENTORY_MANAGER, SALES_MANAGER) — same as API `@RequireRoles` (`apps/api/src/listings/listings.controller.ts:38-43,82-87`) | "Saving…" + disabled while pending; `role="alert"` error text; special "Draft listing created, but it was not submitted for review: …" (`:52`) |
| Button "Unpublish" (`:65-73`) | `POST /tenants/:t/listings/:id/unpublish` → PAUSED (`listings.service.ts:281-287`) | Shown when listing `PUBLISHED` | `canManageListings` | Same pending/error states |
| "—" placeholder | when neither action applies (`:59-61`) | — | — | `canManageListings` | — |
| Icon link "View leads" (`matrix:220-224`) | sr-only "View leads" | → `/dealer/leads` (**not filtered to the vehicle**) | — | `canReadLeads && vehicle.listingId` | — |
| Empty row | "No vehicles in stock yet" (only when `totals.all === 0` and no filter) or "No vehicles with this stock status" (`:120-135`) | — | — | All | Empty |
| Out-of-range | "Page out of range" / "Page N does not exist. There are M pages." + "Go to page 1" / "Go to last page" (`dealer-ui.tsx:71-100`) | Links | — | All | Shown when `total > 0 && page > pages` |
| Pager | "Showing a–b of N vehicles", "Page p / P", "Previous", "Next" (`dealer-ui.tsx:103-154`) | Links keep `stockStatus`; disabled spans with `aria-disabled` at bounds | — | All | — |
| Error card | `retryPath="/dealer/inventory"` (`inventory/page.tsx:59-68`) | — | — | — | — |

Flags: both intake buttons are rendered-but-non-functional by design (`permissions.ts:85-86`). No vehicle detail route exists; `GET /tenants/:t/vehicles/:id` and `PATCH` are unused by the UI.

### 2.4 `/dealer/leads` — `app/leads/page.tsx`, `components/lead-row-actions.tsx`

| Control | Label | Behaviour | API / state | Roles | States |
|---|---|---|---|---|---|
| Access notice | "Leads are not available for your role" / message (`leads/page.tsx:42-49`, `i18n.ts:140-142`) | Rendered **without** calling the leads API | — | INVENTORY_MANAGER, SERVICE_ADVISOR, FINANCE_MANAGER, VIEWER | — |
| Header summary | "N [status ]lead(s). Buyer names show only when the buyer granted that field." (`:86-88`, `i18n.ts:143-144`) | Display | `GET leads` total | `canReadLeads` | — |
| Filter chips | "All", "New", "Contacted", "Qualified", "Test Drive Negotiation", "Won", "Lost", "Spam" (`:92-101`) | Links `/leads?page=1&limit=L[&status=X]`; unknown status ignored (`:52-53`) | `GET leads?status=` | `canReadLeads` | — |
| Assignment note | "Assignment can only pick staff already assigned to a lead on this page or clear the assignment. A staff directory is not available yet." (`:103-107`) | Display | — | `canAssignLeads` | — |
| Table columns | "Received (Dubai)", "Buyer", "Listing", "Intent / Contact", "Status", "Assigned to", "Actions" (`:115-121`) | Received shown via `formatDubaiDateTime` (`lib/dealer-api.ts:176-187`); "Prefers <channel>"; "Unassigned" | — | — | — |
| Select "Status" (`lead-row-actions.tsx:56-74`) | options = all 7 `LEAD_STATUSES` humanised (English only) | `PATCH /tenants/:t/leads/:id/status {status}` on change; `router.refresh()` | API: OWNER, ADMIN, SALES_MANAGER, SALES_AGENT (`leads.controller.ts:86-91`) = UI `canChangeLeadStatus` | Disabled while pending; "Saving…" `aria-live`; `role="alert"` error. **No transition rules client- or server-side** (`leads.service.ts:271-300`) |
| Select "Assigned" (`:75-95`) | "Unassigned" + staff seen on this page (`leads/page.tsx:57-64`) | `PATCH /tenants/:t/leads/:id/assignment {assignedMembershipId|null}` | API: OWNER, ADMIN, SALES_MANAGER (`leads.controller.ts:109-113`) = UI `canAssignLeads`; API rejects memberships of another tenant or inactive with 400 (`leads.service.ts:380-389`) | Same pending/error states |
| Empty row | "No leads yet." / "No leads with this status" or `PageOutOfRange` (`:125-138`) | — | — | — | Empty |
| Pager | as inventory, noun "leads", keeps `status` (`:172`) | — | — | — | — |
| Error card | `retryPath="/dealer/leads"` (`:177-185`) | — | — | — | — |

There is no lead detail route; `GET /tenants/:t/leads/:id` is unused by the UI. Buyer contact fields are never rendered in the dealer UI (only `buyerDisplayName`, masked to "Prospective Buyer" unless the `name` grant exists — `leads.service.ts:190-197`).

### 2.5 Error / not-found / loading surfaces

| Surface | Controls | Notes |
|---|---|---|
| `DealerServiceError` (`components/dealer-service-error.tsx`) | "Sign In" (→ `/auth?tab=login&redirect=<retryPath>`) for NOT_SIGNED_IN / 401; "Sign out" (`POST /api/v1/auth/logout` then `/auth?tab=login`, `dealer-sign-out-button.tsx:14-27`) + "Back to marketplace" for NO_DEALER_MEMBERSHIP / 403 / ACCOUNT_RESTRICTED / TENANT_SUSPENDED; "Retry" otherwise (`:84-101`) | Localised headings per `ErrorKind` (`:60-69`); raw codes never shown. `role="alert"`. |
| `app/error.tsx` | "Retry Connection" (`reset()`), "DMS Cockpit" (→ `/dealer/dashboard`) (`:41-52`) | English only; shows `error.message` and digest (`:31-37`). |
| `app/not-found.tsx` | "Return to Operations Cockpit" (→ `/dealer/dashboard`) (`:15-20`) | English only. Also what disabled preview modules render. |
| `app/loading.tsx` | none | Skeleton header + 4 KPI + 5 rows. |

### 2.6 Fixture-backed preview routes (9) — common facts

- All are `'use client'`, hold `locale` in local state (`useState<'en'|'ar'>('en')`), render `<DealerSidebar locale>` and `<DealerHeader locale onLocaleToggle>` **without identity** (e.g. `sales/page.tsx:15,118-124`), so the header reads "Preview — no dealer session" / "Sample data only" and the sidebar footer "Preview page — no dealer session is loaded here." (`dealer-header.tsx:43,82`, `dealer-sidebar.tsx:168`).
- The language toggle on these pages only flips local state (`sales/page.tsx:123`); it does **not** call `persistLocale`, does not update `<html lang/dir>`, and ignores an existing `ao_locale` cookie (page always starts in `en` while the root layout may already be `dir="rtl"`).
- Every feedback message passes through `previewSafeMessage` and becomes "Preview only — nothing was sent." / "معاينة فقط — لم يتم إرسال أي شيء." (`lib/preview.ts:19-22`; wired at e.g. `sales/page.tsx:26-27`, `workshop/page.tsx:22-23`, `parts/page.tsx:28-29`, `finance/page.tsx:29-30`, `finance/exception/page.tsx:22-23`, `accounting/page.tsx:22-23`, `accounting/exception/export/page.tsx:24-25`, `fleet/page.tsx:31-32`, `fleet/exception/page.tsx:22-23`). "Dismiss" / "✕" clears it.
- Banner: fixed bottom "Preview — sample data, no actions are sent" (`components/preview-banner.tsx:17`), English only, `role="status"`, `data-preview-banner`.
- Sample-role label: only `finance/exception/page.tsx:105-120` and `fleet/exception/page.tsx:78-93` render "Sample role: Dealer Principal" (`role` is a constant `'PRINCIPAL'`, `:19`). The other 7 pages hold `const [role] = useState<'PRINCIPAL' | 'SALES_REP'>('PRINCIPAL')` with **no setter and no label** (`sales:16`, `parts:16`, `finance:17`, `accounting:14`, `accounting/exception/export:16`, `fleet:16`; `workshop` has none). All `role === 'SALES_REP'` branches (masking "••••••", disabled buttons) are therefore unreachable dead code (e.g. `finance/page.tsx:347-357,651,773,1013-1032`, `fleet/page.tsx:310,876-907`, `parts/page.tsx:347,779,800`, `accounting/page.tsx:262,852,863`, `accounting/exception/export/page.tsx:217-942`).
- Modals: 43 overlays total built as `<div className="fixed inset-0 …">`; none has `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap or Escape handling (grep counts: `role="dialog"`=0 and `aria-modal`=0 in all 9 files; overlays: sales 3 `:1147,1225,1278`; workshop 4 `:945,1041,1094,1147`; parts 5 `:1281-1670`; finance 4 `:1339-1590`; finance/exception 8 `:1270-1897`; accounting 4 `:1242-1482`; accounting/exception/export 5 `:1319-1552`; fleet 4 `:1251-1535`; fleet/exception 6 `:1093-1454`).
- Every "confirm/transmit/release/download" button only mutates local React state or sets the neutral feedback text. None calls `fetch` (grep `fetch(` = 0 in all 9 files). They are **fixture-backed actions that look like success** even though the toast is honest.

Per-page control summary (counts by grep of `<button`, `<input`, `<select`, `<textarea`, overlays):

| Route | Buttons | Inputs | Selects | Textarea | Modals | Notable controls (visible labels) | Non-functional / fake-success flags |
|---|---|---|---|---|---|---|---|
| `/dealer/sales` | 27 | 4 | 0 | 0 | 3 | Filters "All Orders 18", "Quotation Draft 5", "In Escrow Review 4", "Trade-in Valuation 3", "Delivery Scheduled 6"; presets "Populated Quotation (GT3 RS)", "Trade-In Heavy Order (Ferrari 296)" (+BLANK/COMPLIANCE); "Create Quotation [Draft]" modal (inputs client name, vehicle, asking price → "Save Draft" adds a local pipeline row); "Export FTA Tax Schema" / "Compliance & FTA Export" modal → "Download File"; "Schedule Silk Handover Slot" modal → "Confirm Slot"; "Resend Prompt", "Manual Override" (toggle `step2State`); "Add Custom Line" (adds AED 6,500 line, recomputes VAT 5%); "CRM Card", "Inspect Spec Sheet →"; copy-VIN; breadcrumb `Link href="/"` (`:160`) | "CRM Card" and "Inspect Spec Sheet →" use native `alert()` (`sales/page.tsx:364,456`) bypassing `previewSafeMessage`; "Download File" downloads nothing; "Manual Override" text claims executive override is "Recorded to immutable audit trail" before neutralisation. No sample-role label. |
| `/dealer/workshop` | 27 | 3 | 1 | 0 | 4 | Demonstrator presets "Populated Live Bays (Default)", "Empty Morning Shift (08:00)", "Bay Congestion & Overrun Alert", "Technician Clock-In Matrix"; "Create Repair Order (RO)" modal → "Create RO"; "Order Parts" modal → "Reserve & Dispatch"; "Tasjeel Pass Sheet" modal → "Print & Attach"; "Clock Out & Complete" modal → "Confirm Clock-Out"; "Live Hoist Telemetry", "Technician Dispatch", "Hold / Customer Query", bay filter icon; header text "DMS Phase 1.4 Spec Preview" (`:107`) | "Live Hoist Telemetry" label implies live sensor data; all actions local. No sample-role label. |
| `/dealer/parts` | 46 | 7 | 5 | 0 | 5 | Marque chips "All Marques", "Porsche (840)", "Mercedes-AMG (210)", "Ferrari (285)", "Aston Martin (85)"; category toggles; search input + clear; demonstrators "Populated Inventory", "Low Stock & Urgent", "Inbound PO Staging", "Annual Stocktake Audit"; "Create Purchase Order (PO)" modal → "Confirm & Transmit PO"; "Scan OEM Barcode / EPC" modal → "Query EPC"; "Receive Stock / Bin Intake" / "Scan Intake QR" modal → "Confirm Intake & Update Ledger"; "Allocate RO" modal → "Confirm Draw & Allocate"; "Flag Customs or Line Discrepancy" / "DMS & Bayan Schema" / "Track Bayan" modal; "1-Tap Reorder", "Verify" (audit toggle), "Dispense Litres", "Packing Slip", CSV export icon, margin calculator icon, "View All 24 Active Vendor Contracts", pager "Prev"/"Next" | "Confirm & Transmit PO" / "Track Bayan" imply customs/EPC integration; local only. No sample-role label. |
| `/dealer/finance` | 24 | 7 | 2 | 0 | 4 | Demonstrators "Approved Syndication (GT3 RS)", "High DBR / Subprime Warning", "Islamic Murabaha Contract State", "Insurance Claim Exception"; "Submit Bank Dossier" modal → "Transmit Encrypted Dossier"; "Simulate Financing Terms" modal (tenor buttons, inputs) → "Close Simulator"; "Rate Sheet Matrix (Q4)" modal; "Export Compliance Log" modal → "Export & Save"; "Select Offer" per lender; "Transmit Sanction Letter (UAE PASS)"; "Request Bank Waiver", "Counter-Offer Margin"; link to `/finance/exception` (`:866`) | "Transmit …" and "UAE PASS" labels imply bank/UAE PASS integration; none exists. No sample-role label. |
| `/dealer/finance/exception` | 44 | 4 | 2 | 1 | 8 | "Sample role: Dealer Principal" chip (`:105-120`); pipeline filters "All Bank Files (18)", "Approved / Sanction Ready (8)", "Committee Review (6)", "Settled / Funded (4)"; scenario chips "High DBR / Subprime Warning", "Islamic Murabaha Contract State", "Insurance Claim Exception"; cure options "Option A: Structure 30% Down" → modal "Confirm & Apply Cure"; "Option B: Sovereign Wealth Guarantor" / "Attach Co-Signer / Sovereign Wealth Dossier" → "Bind & Authorize Guarantor"; "Escalate to Chief Risk Officer (CRO) Review" (disabled until cured) → "Authorize Statutory Override"; "Submit Bank Dossier" (blocked message when `!isCured && role !== 'PRINCIPAL'`, `:276`) → "Confirm Dispatch"; "Simulate Financing Terms", "Rate Sheet Matrix (Q4)", "Export Compliance Log" → "Download Audit PDF"; "Revert to Breach State"; own "عربي (RTL)" toggle button (`aria-label="Toggle language"`); `Link`s to `/dashboard`, `/finance` (`:91,95,1208`) | Honest footer "This is a sample-data preview. No override was logged and nothing was sent to any regulator, lender or court." (`:1292-1297`). "Confirm Dispatch" / "Download Audit PDF" do nothing external. |
| `/dealer/accounting` | 27 | 4 | 1 | 0 | 4 | Demonstrators "Standard Tax Invoice (GT3 RS)", "GCC Cross-Border (0% Zero-Rated)", "Trade-in Offset & Credit Note", "FTA Audit Discrepancy Flag"; "Generate FTA Tax Invoice" modal → "Sign & Generate Invoice" (adds local row `PREVIEW-INV-…` with "Preview — no settlement" / "Preview — not filed", `:47-69`); "Reconcile Escrow" modal → "Confirm Reconciliation"; "Inspect UBL 2.1 XML" modal; "Export FAF (XML)" / "Export Full FAF Tax Ledger (.xml / .csv)" modal → "Download XML File"; "Batch VAT Return Form 201 Schedule" with badge **"Live Sync"** (`:211`); "Issue Credit Note / Debit Note"; "Release Escrow to Dealership Account" → "Authorize Escrow Disbursement"; "PDF Print", share icon | "Live Sync" badge claims live EmaraTax sync; "Authorize Escrow Disbursement" / "Download XML File" are local only. No sample-role label. |
| `/dealer/accounting/exception/export` | 30 | 2 | 1 | 0 | 5 | Demonstrators "Standard Tax Invoice (GT3 RS)", "GCC Cross-Border (0% Zero-Rated)", "Trade-in Offset & Credit Note", "FTA Audit Discrepancy Flag (Active Exception)"; "Upload Certified Port of Exit Bill of Lading (Bayan)" / "Upload Exit Bayan" modal → "Cure Discrepancy & Release Escrow"; "File FTA Article 45 Export Extension" / "FTA Article 45 Extension Appeal" modal → "Submit Extension Appeal"; "Generate ZATCA Bilateral Certificate" / "View ZATCA Audit Dossier" modal; "View Escrow Deed" modal; "Inspect UBL 2.1 XML" modal; "Release Uncontested Funds (AED 3.99M)" → "Release Cleared AED 3.99M"; "Submit Customs Guarantee Deposit AED 210K"; "PDF Print"; link to `/accounting` (`:115`) | Upload modal has no real file input handling; "Release …" / "Submit …" local only. No sample-role label. |
| `/dealer/fleet` | 36 | 10 | 2 | 0 | 4 | Demonstrators "Populated Active Consignments & Fleets", "Urgent Mulkiya Expiration Batch", "Consignor Legal Dispute Hold", "Consignment Sold / Settlement Reconciliation"; vault filters "All Consignments", "Active on Showroom Floor 22", "Off-Site Climate Storage 8", "Sold / Payout Pending 2"; "Onboard Consignment" (`id="btnOnboardConsignment"`) modal → "Enroll Consignment"; "Create Corporate Fleet" modal → "Establish Fleet Account"; "Execute Buyer Offer" modal → "Accept & Fund Escrow"; "View Bailment PDF" modal; "Initiate Batch RTA Renewal 8 Units" → "Bulk Mulkiya Renewal"; "Issue Settlement Wire (WPS/CBUAE) 2 Pending"; "Generate Monthly Fleet Invoice Net-30"; "Recalculate Split Tiers"; "Update Pricing"; "Fast-Track", "Dispatch"; copy-VIN; "Columns"; link to `/fleet/exception` (`:1233`) | "Issue Settlement Wire (WPS/CBUAE)" and "Accept & Fund Escrow" imply payment rails; local only. No sample-role label. |
| `/dealer/fleet/exception` | 38 | 1 | 0 | 0 | 6 | "Sample role: Dealer Principal" chip (`:78-93`); vault filters "All Consignments (32)", "Active on Showroom Floor (22)", "Off-Site Climate Storage (8)", "Sold / Payout Pending (2)"; scenario chips "Consignor Legal Dispute Hold (Active)", "Urgent Mulkiya Expiration Batch", "Consignment Sold / Settlement Reconciliation"; "Enforce Quarantine Protocol" / "Quarantine Bailment Log" modal; "Submit Dealership Interpleader Motion" (disabled for SALES_REP) modal → "Deposit Bond & Lift Quarantine" (`setInterpleaderFiled(true)`); "RTA Impound Immunity Petition (Pending Filing)" modal → "File Petition"; "View Court Injunction" / "Court Bailment Injunction:" modal → "Download Certified PDF"; "Contact Consignor Legal Counsel (Al Tamimi & Co)" modal → "Dispatch Legal Notice"; "Escrow Bond Cert" modal; "Revert to Freeze State"; "Onboard Consignment", "Create Corporate Fleet", "Bulk Mulkiya Renewal"; own "عربي (RTL)" toggle; `Link`s to `/dashboard`, `/fleet` (`:64,68,1034`) | Honest footer `:1115-1120`. "File Petition" / "Dispatch Legal Notice" / "Deposit Bond" local only. |

Preview totals: 299 buttons, 42 inputs, 14 selects, 1 textarea, 43 modal overlays.

---

## 3. Role matrix

UI columns come from `permissions.ts:49-54`; API columns from `@RequireRoles` in `apps/api/src/inventory/vehicles.controller.ts`, `listings/listings.controller.ts`, `leads/leads.controller.ts`, `leads/appointments.controller.ts`, `tenants/tenants.controller.ts`, plus cost redaction in `vehicles.service.ts:31,496-502`. All API statuses assume an active membership in an ACTIVE tenant; otherwise every tenant route is 403 regardless of role.

### 3.1 UI capability flags

| Role | canCreateVehicle | canManageListings | canSeeCost | canReadLeads | canChangeLeadStatus | canAssignLeads |
|---|---|---|---|---|---|---|
| OWNER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SALES_MANAGER | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| SALES_AGENT | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| INVENTORY_MANAGER | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| SERVICE_ADVISOR | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| FINANCE_MANAGER | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| VIEWER | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### 3.2 Route / control × role (V = visible & enabled, H = hidden, D = rendered disabled, N = access notice; API expected status in parentheses)

| Route / control | OWNER | ADMIN | SALES_MGR | SALES_AGENT | INV_MGR | SERVICE_ADV | FINANCE_MGR | VIEWER |
|---|---|---|---|---|---|---|---|---|
| `/dealer` page, stock cards (`GET vehicles`, no role list → 200 all) | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) |
| `/dealer` lead cards + recent leads (`GET leads`: O/A/SM/SA) | V (200) | V (200) | V (200) | V (200) | N (403 if called; UI does not call) | N (403) | N (403) | N (403) |
| `/dealer` "Leads" link | V | V | V | V | H | H | H | H |
| `/dealer` "Add vehicle (unavailable)" (API `POST vehicles`: O/A/IM/SM) | D (201 if it existed) | D | D | H (403) | D | H (403) | H (403) | H (403) |
| Sidebar "Leads" | V | V | V | V | D | D | D | D |
| Sidebar "Add Vehicle" / "Test Drives" / "Dealership Settings" | D | D | D | D | D | D | D | D |
| `/dealer/inventory` table | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) | V (200) |
| Inventory "Intake Vehicle" | D | D | D | H | D | H | H | H |
| Inventory "Cost / Asking" column + "Cost:" + margin (API `purchaseCostFils`: O/A/IM/FM) | V (value) | V (value) | H (`null`) | H (`null`) | V (value) | H (`null`) | V (value) | H (`null`) |
| Inventory "Actions" column — "Submit for review" (`POST vehicles/:id/listing`, `POST listings/:id/submit`: O/A/IM/SM) | V (201/200) | V (201/200) | V (201/200) | H (403) | V (201/200) | H (403) | H (403) | H (403) |
| Inventory "Unpublish" (`POST listings/:id/unpublish`: O/A/IM/SM) | V (200) | V (200) | V (200) | H (403) | V (200) | H (403) | H (403) | H (403) |
| Inventory "View leads" icon (needs `canReadLeads` + listing) | V | V | V | V | H | H | H | H |
| `/dealer/leads` list (`GET leads`: O/A/SM/SA) | V (200) | V (200) | V (200) | V (200) | N (403) | N (403) | N (403) | N (403) |
| Leads "Status" select (`PATCH leads/:id/status`: O/A/SM/SA) | V (200) | V (200) | V (200) | V (200) | H (403) | H (403) | H (403) | H (403) |
| Leads "Assigned" select (`PATCH leads/:id/assignment`: O/A/SM) | V (200) | V (200) | V (200) | H (403) | H (403) | H (403) | H (403) | H (403) |
| Leads assignment note | V | V | V | H | H | H | H | H |
| Appointments (`GET/PATCH appointments`: O/A/SM/SA) | no UI (200) | no UI (200) | no UI (200) | no UI (200) | no UI (403) | no UI (403) | no UI (403) | no UI (403) |
| Media upload (`POST vehicles/:id/media`: O/A/IM/SM/SA) | no UI | no UI | no UI | no UI | no UI | no UI (403) | no UI (403) | no UI (403) |
| `GET tenants/:t/privileged-management` (O/A) | no UI (200) | no UI (200) | no UI (403) | no UI (403) | no UI (403) | no UI (403) | no UI (403) | no UI (403) |
| Preview routes ×9 (no role check) | V | V | V | V | V | V | V | V |
| Language toggle, mobile nav, breadcrumbs | V | V | V | V | V | V | V | V |

### 3.3 UI ↔ API consistency

- No mismatch found between `permissions.ts` role lists and the `@RequireRoles` lists for vehicles create/patch, listings (3 routes), leads read/status/assignment, or cost redaction. `LISTING_MANAGE` = `VEHICLE_CREATE` = API list `O/A/IM/SM`; `LEAD_READ` = `LEAD_STATUS` = API `O/A/SM/SA`; `LEAD_ASSIGN` = API `O/A/SM`; `COST_ACCESS` = `PRIVILEGED_COST_ROLES` (`vehicles.service.ts:31`).
- Capabilities exist in the API but have no UI: media upload (incl. SALES_AGENT), vehicle PATCH / stock status change, appointments, lead detail, privileged-management. The sidebar documents "Test Drives" and "Dealership Settings" as "Soon".
- Platform admins (`isPlatformAdmin`) get OWNER on any tenant at the API (`tenant-access.guard.ts:42-56`) but have no dealer membership, so `getDealerSession` throws `NO_DEALER_MEMBERSHIP` — the dealer UI cannot be used by platform admins (intentional; note for test accounts).

---

## 4. Workflows

### W1 Dealer login → `/dealer` → dashboard counts
1. Unauthenticated `GET /dealer` (prod or `DEALER_AUTH_ENFORCED=true`): middleware `307` → `/auth?tab=login&redirect=/dealer` (`middleware.ts:47-51`). In dev on localhost without the flag, the page renders `DealerServiceError` "Dealer Sign-In Required" with "Sign In" (`session.ts:69-71`, `dealer-service-error.tsx:61,84-88`).
2. `/auth` login honours same-origin `redirect` (`apps/marketplace/app/auth/page.tsx:118-124`); without it, API `redirectUrl` is `/dealer` (OWNER/ADMIN/FM/SA-less roles), `/dealer/leads` (SALES_MANAGER, SALES_AGENT), `/dealer/inventory` (INVENTORY_MANAGER) (`apps/api/src/auth/auth.service.ts:92-106`).
3. `/dealer` resolves session, picks first active membership in an ACTIVE tenant, then issues vehicle count calls and, when `canReadLeads`, lead count calls (`app/page.tsx:26-48`). Cards show API `total` values; "Available asking value" and "Listing status" are computed over the latest 50 rows and say so (`dashboard-cockpit-view.tsx:49-53`).

### W2 Inventory browse → filter → paginate → "open vehicle" → cost → unpublish
1. `/dealer/inventory` loads page 1, limit 20 (`lib/dealer-api.ts:113-124`); chips add `stockStatus`; pager adds `page`/`limit` (max 50, `PAGE_LIMIT_MAX`).
2. There is **no vehicle detail page**; "open vehicle" = reading the row. Cost appears only for cost roles and is `null` in the API payload for others (`vehicles.service.ts:496-502`).
3. "Unpublish" on a PUBLISHED listing → `POST /tenants/:t/listings/:id/unpublish` → status PAUSED, outbox + audit (`listings.service.ts:281-311`); UI refreshes; public search excludes non-PUBLISHED (`listings.service.ts:587-589,743-747`). "Submit for review" on DRAFT/PAUSED/REJECTED + AVAILABLE stock creates the draft if needed and submits; API publish gates (KYB approved, tenant ACTIVE, stock AVAILABLE, media) return 400 shown in the row (`listings.service.ts:758-772`).

### W3 Lead list filter → "lead detail" → status change → assignment
1. Chips set `status`; unknown values are dropped. There is **no lead detail page**; the row is the detail.
2. "Status" select → `PATCH …/status`; API validates enum only (`update-lead-status.dto.ts:538-540`), **any transition is accepted**, outbox `lead.status_updated` + audit written (`leads.service.ts:324-347`).
3. "Assigned" select → `PATCH …/assignment`; options are only staff already assigned on the page or "Unassigned" (`leads/page.tsx:57-64`); API rejects memberships not in tenant / inactive with 400 (`leads.service.ts:380-389`).

### W4 Appointment status change
No dealer UI. API `GET/PATCH /tenants/:t/appointments[/:id/status]` exists for O/A/SM/SA (`appointments.controller.ts:35-56`). Sidebar shows "Test Drives — Soon".

### W5 Locale switch
Live pages: header "EN / عربي" → cookie `ao_locale` + `documentElement.lang/dir` + `router.refresh()` so server strings follow (`dealer-shell.tsx:23-29`, `i18n.ts:27-31`, `app/layout.tsx:24-26`). Preview pages: local state only, wrapper `dir` only, not persisted, cookie ignored (`sales/page.tsx:15,116,123`).

### W6 Multi-tenant user
First usable membership wins (`session.ts:96-99`, API order `createdAt asc`). Header shows "First active dealership shown" (`dealer-header.tsx:46-50`, hidden `<md`). No switcher. Memberships that are inactive or whose tenant is not ACTIVE are skipped.

### W7 Suspended tenant / inactive membership / restricted account
- All memberships inactive, or none → `NO_DEALER_MEMBERSHIP` → "No active dealership access" + "Sign out" / "Back to marketplace" (`session.ts:107-110`, `dealer-service-error.tsx:63,89-96`).
- An active membership whose tenant is SUSPENDED (or PENDING/CLOSED) and no other usable one → `TENANT_SUSPENDED` → "Dealership suspended" (`session.ts:101-105`).
- User SUSPENDED/DISABLED → `/auth/me` 403 (`auth.service.ts:201-209`) → `ACCOUNT_RESTRICTED` → "Account restricted" (`session.ts:87-90`).
- API-side 403 during data load (e.g. membership deactivated after login) → `forbidden` card "Access to this dealership was refused" (`dealer-service-error.tsx:38,64`).

### W8 Sign-out
Only from an error card: `POST /api/v1/auth/logout` (clears `ao_session`, `auth.controller.ts:152-162`) then `window.location.assign('/auth?tab=login')` (`dealer-sign-out-button.tsx:14-27`). No sign-out on the live shell (G-01).

---

## 5. Acceptance criteria

### `/dealer` (dashboard)
1. With a dealer cookie whose first ACTIVE membership is tenant T, every stat equals `SELECT count(*) FROM vehicles WHERE tenant_id=T [AND stock_status=…]` and the equivalent lead counts for T; no other tenant's rows influence any number.
2. For INVENTORY_MANAGER, SERVICE_ADVISOR, FINANCE_MANAGER, VIEWER the leads section shows "Leads hidden for your role" and the network log contains **no** `GET /tenants/T/leads` call.
3. When the tenant has more than 50 vehicles, the "Available asking value" card note reads "Latest 50 of N vehicles only"; when ≤50 it reads "All vehicles in this dealership".
4. A buyer-only account (no memberships) sees "No active dealership access" with working "Sign out" and "Back to marketplace"; a request without `ao_session` in enforced mode is redirected (307) to `/auth?tab=login&redirect=/dealer`.
5. Toggling "EN / عربي" sets cookie `ao_locale=ar`, re-renders with `<html lang="ar" dir="rtl">`, Arabic headings, and survives a full reload.

### `/dealer/inventory`
1. "Cost / Asking" header, "Cost:" values and margin % render only for OWNER/ADMIN/INVENTORY_MANAGER/FINANCE_MANAGER; for all other roles the header is "Asking" **and** `purchaseCostFils` is `null` in the `GET /tenants/T/vehicles` JSON.
2. `?page=999` on a non-empty tenant shows "Page out of range — Page 999 does not exist. There are N pages." with working "Go to page 1" / "Go to last page"; the pager footer shows the same message rather than "Showing …".
3. With 0 vehicles the table shows "No vehicles in stock yet"; with vehicles but an empty filter it shows "No vehicles with this stock status".
4. "Unpublish" on a PUBLISHED listing results in listing status PAUSED, the row refreshing to "Paused", and the car disappearing from `GET /api/v1/public/listings` and the marketplace search within the same request cycle.
5. "Submit for review" for SALES_AGENT/SERVICE_ADVISOR/FINANCE_MANAGER/VIEWER is not rendered; a hand-crafted `POST /tenants/T/listings/:id/submit` as those roles returns 403 `INSUFFICIENT_ROLE_PERMISSIONS`.
6. `?limit=500` is clamped to 50 by the UI (`parsePaging`), and the API returns 400 for a direct `limit=500`.

### `/dealer/leads`
1. OWNER/ADMIN/SALES_MANAGER/SALES_AGENT see the table; the other four roles see "Leads are not available for your role" and no leads request is made.
2. Buyer column shows the real name only for leads whose grant includes `name` and is not revoked; otherwise "Prospective Buyer". No phone/email appears anywhere on the page.
3. Changing "Status" issues exactly one `PATCH /tenants/T/leads/:id/status` and the pill updates after refresh; a 403 (role) or network failure shows an inline `role="alert"` message ending "Nothing was changed." and the pill keeps the old status.
4. "Assigned" select is rendered only for OWNER/ADMIN/SALES_MANAGER, lists only memberships already assigned on the page plus "Unassigned", and a `PATCH` with a membership id from another tenant returns 400.
5. Status chips preserve `limit` and reset `page=1`; `?status=BOGUS` is treated as "All".

### Preview modules (`/dealer/sales`, `/workshop`, `/parts`, `/finance`, `/finance/exception`, `/accounting`, `/accounting/exception/export`, `/fleet`, `/fleet/exception`)
1. With `NEXT_PUBLIC_ENABLE_PREVIEW_MODULES` unset the route returns 404 ("DMS Module or Record Not Found") and the sidebar items are disabled with "Preview module with sample data — not enabled in this build".
2. When enabled, a fixed banner "Preview — sample data, no actions are sent" (`data-preview-banner`) is visible on every preview route at 390px and 1280px, and the header reads "Preview — no dealer session" / "Sample data only".
3. Every action button results in the toast "Preview only — nothing was sent." (or its Arabic form) and the network log shows **zero** requests to `/api/*`.
4. A static "Sample role: Dealer Principal" label is visible on the page (currently only true for `/finance/exception` and `/fleet/exception` — fails on the other 7, see G-05).
5. No visible text claims a live integration ("Live Sync", "Live Hoist Telemetry", "UAE PASS", "WPS/CBUAE") without the preview qualifier (currently fails, see G-06).

### Cross-cutting
1. Any `/tenants/X/...` call where X ≠ the caller's tenant returns 403 `TENANT_FORBIDDEN`; any `/tenants/T/vehicles|listings|leads/<id-of-other-tenant>` returns 404.
2. All money renders as `AED n,nnn` from integer fils (`formatAed`) and all times in Asia/Dubai (`formatDubaiDateTime`).
3. Direct `GET /dealer/inventory` with `Accept: application/json` and no cookie returns `401 {"error":{"code":"Unauthorized"}}` in enforced mode.

---

## 6. Risk-based edge cases

| Prio | Case | Expected (from code) | Where to look |
|---|---|---|---|
| High | No `ao_session`, enforced mode (`DEALER_AUTH_ENFORCED=true` or non-localhost) | 307 to `/auth?tab=login&redirect=/dealer/<path>` with absolute `Location` on the gateway origin | `middleware.ts:34-51`, `lib/public-origin.ts:10-20` |
| High | No cookie, dev bypass active | Page renders "Dealer Sign-In Required" card; preview routes render fully with no session at all | `session.ts:69-71`; `sales/page.tsx` has no session call |
| High | Buyer-only account opens `/dealer` | "No active dealership access" card; **but** `/dealer/sales` etc. still render (cookie present, no membership check) when preview flag on | `session.ts:107-110`; preview layouts only check the flag |
| High | SALES_AGENT tampers `tenantId` in `PATCH /leads/:id/status` body/URL to another tenant | 403 `TENANT_FORBIDDEN`; UI shows "HTTP 403: Your role is not allowed to do this. Nothing was changed." (misleading wording) | `tenant-access.guard.ts:60-66`, `dealer-api.ts:152-158` |
| High | SALES_AGENT calls `POST /listings/:id/unpublish` or reads cost | 403; cost already `null` in list payload | `listings.controller.ts:64-69`, `vehicles.service.ts:496-502` |
| High | Membership set inactive after login | `/auth/me` still returns it; dealer skips it → "No active dealership access"; direct API → 403 `MEMBERSHIP_INACTIVE` | `session.ts:96-99`, `tenant-access.guard.ts:74-78` |
| High | Tenant SUSPENDED mid-session | Next server render → "Dealership suspended"; client PATCH → 403 `TENANT_INACTIVE` → row alert | `session.ts:101-105`, `tenant-access.guard.ts:80-84` |
| High | Lead status NEW→WON, WON→NEW, SPAM→QUALIFIED, LOST→CONTACTED | **All accepted (200)**; no state machine in UI or API | `lead-row-actions.tsx:63-65`, `leads.service.ts:271-300` |
| High | Lead assignment to a membership of another tenant or inactive | 400 "…"; UI cannot build this request without tampering | `leads.service.ts:380-389` |
| Medium | VIEWER on every route | Dashboard stock only + "Leads hidden"; inventory without Actions/Cost; leads → access notice; sidebar Leads disabled; preview routes fully usable | `permissions.ts:49-54`, `dealer-sidebar.tsx:47-52` |
| Medium | FINANCE_MANAGER | Sees cost (UI and API) but no listing actions; leads blocked | `permissions.ts:51` |
| Medium | Multi-tenant user whose first-created membership is inactive | Second membership used silently; header note only if ≥2 usable | `session.ts:96-99,121` |
| Medium | Tenant PENDING or CLOSED (not SUSPENDED) | Message still says "Dealership suspended" | `session.ts:101-105` |
| Medium | 0 vehicles / 0 leads | "No vehicles in stock yet", "No leads yet."; dashboard "No vehicles yet." list; `AED 0` card | `inventory-matrix-view.tsx:129-130`, `leads/page.tsx:133`, `dashboard-cockpit-view.tsx:135` |
| Medium | 1000+ vehicles | 50 pages at limit 20; dashboard sample note "Latest 50 of 1000 vehicles only"; each inventory render = 5 API calls, dashboard = up to 10 | `app/page.tsx:43-48`, `inventory/page.tsx:30-36` |
| Medium | `?page=0`, `?page=abc`, `?limit=0`, `?limit=9999` | UI normalises to page 1 / default 20 / max 50 | `dealer-api.ts:113-124` |
| Medium | `?status=bogus` direct to API (bypassing UI) | `@Query('status')` has no `IsEnum`; Prisma receives invalid enum → likely 500 | `leads.controller.ts:302` |
| Medium | 390px mobile | Sidebar off-canvas, hamburger in header, overlay is `pointer-events: none` (tap outside does not close), role badge and multi-tenant note hidden, tables scroll horizontally; preview banner and staging badge both fixed at bottom | `globals.css:30-37`, `dealer-header.tsx:47,57`, `preview-banner.tsx:14`, `app/layout.tsx:46` |
| Medium | RTL (`ao_locale=ar`) | Live pages: `dir="rtl"`, logical `start/end` classes, Arabic strings; English leftovers: lead/listing action labels, API error text, `en-GB` dates, preview banner; preview pages start in `en` regardless of cookie | `lead-row-actions.tsx:58,77,87,98`, `listing-actions.tsx:72,82`, `dealer-api.ts:141-158,179`, `preview-banner.tsx:17` |
| Medium | Keyboard / ARIA on menus and dialogs | Live: sidebar closes on `Escape`, links have `aria-current`, selects are native, alerts `role="alert"`, intake button `aria-describedby`. Preview: 43 modals with no `role="dialog"`, no focus trap, no `Escape` | `dealer-sidebar.tsx:27-31`; §2.6 |
| Medium | Submit-for-review when KYB not approved | Draft may be created, submit fails → "Draft listing created, but it was not submitted for review: HTTP 400: Publish gate failed…" and table refresh shows "Draft" | `listing-actions.tsx:49-53`, `listings.service.ts:758-762` |
| Low | Dealer app opened directly on `:3001/dealer` (not via gateway) | Relative `/api/*`, `/auth`, media URLs 404; sign-in redirect goes to `:3001/auth` | `dealer-api.ts:133`, `dealer-sign-out-button.tsx:26`, `public-origin.ts:19` |
| Low | `GET /dealer/api/health` without cookie | 200 JSON (excluded from matcher) | `middleware.ts:15`, `api/health/route.ts` |
| Low | Session expired mid-action (PATCH 401) | Row alert "HTTP 401: Your session has expired. Sign in again. Nothing was changed."; next navigation → "Dealer Sign-In Required" | `dealer-api.ts:153-154`, `session.ts:84-86` |
| Low | API unreachable | Server pages: "The dealership service is not responding right now…" + "Retry"; client: "The API could not be reached. Nothing was changed." | `dealer-service-error.tsx:67`, `dealer-api.ts:141` |
| Low | Sales preview "CRM Card" / "Inspect Spec Sheet →" | Native `alert()` with fixture text, bypassing the honest toast | `sales/page.tsx:364,456` |

---

## 7. Known gaps found while reading

| ID | Severity | Finding | Location |
|---|---|---|---|
| G-01 | Medium | No sign-out control on any live dealer page; the only "Sign out" lives on the error card. A signed-in dealer cannot end the session from the DMS. | `components/dealer-header.tsx` (no button), `components/dealer-sidebar.tsx:157-170`, `dealer-service-error.tsx:91` |
| G-02 | Medium | Lead status select allows every transition; API has no transition validation either (NEW→WON, WON→NEW, SPAM→QUALIFIED all succeed and emit `lead.status_updated`). | `components/lead-row-actions.tsx:59-73`; `apps/api/src/leads/leads.service.ts:271-300` |
| G-03 | Medium | Preview modules are reachable by any account with an `ao_session` cookie (buyer-only included) because they never call `getDealerSession`; in dev bypass they are reachable with no cookie. Sample data only, but contradicts "dealer console". | `app/sales/page.tsx` (no session import), `app/sales/layout.tsx:10-13` |
| G-04 | Medium | Preview pages hold locale in local state: ignore `ao_locale` cookie, do not persist, do not update `<html lang/dir>`; a user in Arabic sees the root `dir="rtl"` with an English `ltr` preview wrapper. | `app/sales/page.tsx:15,116,123` (same pattern in all 9) |
| G-05 | Medium | Static "Sample role" label exists only on 2 of 9 preview pages; the other 7 have a `role` state with no setter and no label, leaving `role === 'SALES_REP'` branches as unreachable dead code. | `finance/exception/page.tsx:105-120`, `fleet/exception/page.tsx:78-93` (present); `sales:16`, `parts:16,347,779,800`, `finance:17,347-357,651,773,1013-1032`, `accounting:14,262,852,863`, `accounting/exception/export:16,217-942`, `fleet:16,310,876-907` (absent) |
| G-06 | Medium | Preview labels claim live integration: "Live Sync" badge on "Batch VAT Return Form 201 Schedule", "Live Hoist Telemetry", "Transmit Sanction Letter (UAE PASS)", "Issue Settlement Wire (WPS/CBUAE)", "Confirm & Transmit PO", "Authorize Escrow Disbursement". Toast is neutralised but button/badge text is not. | `accounting/page.tsx:211`, `workshop/page.tsx` ("Live Hoist Telemetry"), `finance/page.tsx` ("Transmit Sanction Letter (UAE PASS)"), `fleet/page.tsx` ("Issue Settlement Wire (WPS/CBUAE)"), `parts/page.tsx` ("Confirm & Transmit PO") |
| G-07 | Medium | 43 preview modals lack `role="dialog"`, `aria-modal`, labelled title, focus trap and Escape handling. | §2.6 line list; grep `role="dialog"` = 0 in all 9 preview files |
| G-08 | Medium | Sales preview uses native `alert()` for "CRM Card" and "Inspect Spec Sheet →", bypassing `previewSafeMessage` and showing fixture client/VIN text as if real. | `app/sales/page.tsx:364,456` |
| G-09 | Medium | `lint` and `test` scripts are `echo` stubs, so any "lint PASS / test PASS" for the dealer app is hollow. | `apps/dealer/package.json:9,12` |
| G-10 | Medium | E2E "rejects unauthenticated access" passes if the URL contains `/dealer` (i.e. always), so it does not prove the redirect. | `tests/e2e/auth-dealer.spec.ts:4-11` |
| G-11 | Low | English-only strings inside live client islands and client errors in Arabic mode: "Status", "Assigned", "Unassigned", "Saving…", lead status option labels (`humanizeEnum`), "Unpublish", "Submit for review", "Draft listing created…", all `DealerApiError` messages; dates use `en-GB`; preview banner English only. | `lead-row-actions.tsx:58,69,77,87,98`, `listing-actions.tsx:46,52,72,82`, `dealer-api.ts:141-158,179`, `preview-banner.tsx:17` |
| G-12 | Low | 403 from the API is always worded "Your role is not allowed to do this." even when the cause is tenant mismatch, inactive membership or suspended tenant. | `lib/dealer-api.ts:155-156` |
| G-13 | Low | `TENANT_SUSPENDED` is raised for any non-ACTIVE tenant status (PENDING, CLOSED) and the copy says "suspended". | `lib/session.ts:101-105`, `i18n.ts:192-194` |
| G-14 | Low | "View leads" row icon links to the unfiltered `/leads`; API has no `listingId` filter, so the link is not vehicle-specific. | `components/inventory-matrix-view.tsx:220-224` |
| G-15 | Low | Lead assignment can only pick staff already assigned on the current page (no staff directory API); new staff can never be assigned from the UI. | `app/leads/page.tsx:57-64`, `i18n.ts:147-148` |
| G-16 | Low | No vehicle detail, vehicle edit (stock status/repricing), media upload, lead detail or appointments UI although the API exposes `GET/PATCH vehicles/:id`, `POST vehicles/:id/media`, `GET leads/:id`, `GET/PATCH appointments`. `SCREEN_COVERAGE.csv` S13 acceptance ("CRUD … repricing … stock transitions persist") is therefore not met by the UI. | `apps/api/src/inventory/vehicles.controller.ts:83-142`, `leads.controller.ts:66-83`, `appointments.controller.ts:35-56`; `docs/implementation/SCREEN_COVERAGE.csv` row S13 |
| G-17 | Low | `VehicleIntakeModal` is dead code (never mounted). | `components/vehicle-intake-modal.tsx:16-18` |
| G-18 | Low | Mobile nav overlay has `pointer-events: none`, so tapping outside does not close the drawer; drawer has no focus trap. | `app/globals.css:37`, `dealer-sidebar.tsx:26-32` |
| G-19 | Low | Header role badge and multi-tenant note are hidden below `md`; at 390px the only role indication is the sidebar footer (hidden until the drawer opens). | `dealer-header.tsx:47,57` |
| G-20 | Low | API `GET /tenants/:t/leads?status=` is not enum-validated (`@Query('status')` without a DTO), so a bogus status reaches Prisma. UI sanitises, so only direct callers hit it. | `apps/api/src/leads/leads.controller.ts:300-304` |
| G-21 | Low | Dashboard issues up to 10 API calls and inventory 5 per render (count calls with `limit=1`); no caching. | `app/page.tsx:28-48`, `app/inventory/page.tsx:30-36` |
| G-22 | Low | Draft listing price is posted as `Number(askingPriceFils)` from a bigint string; safe for AED values but loses precision above 2^53 fils. | `components/listing-actions.tsx:41` |
| G-23 | Low | `error.tsx`, `not-found.tsx` and `loading.tsx` are English only and `error.tsx` exposes `error.message`/digest. | `app/error.tsx:28-37`, `app/not-found.tsx:9-13` |
| G-24 | Low | Staging badge (`bottom-3 right-3`, z-80) overlaps the preview banner's right end on desktop when both are present. | `app/layout.tsx:46`, `preview-banner.tsx:14` |
| G-25 | Info | No hardcoded tenant UUIDs or token-less tenant calls remain in `apps/dealer` (grep for UUID pattern in `.ts/.tsx` returned no files; all tenant calls carry the bearer or `credentials: 'include'`). The earlier F4 note in `docs/qa/CODEBASE_KNOWLEDGE.md:56` is resolved. | `lib/dealer-api-server.ts:16-23`, `lib/dealer-api.ts:127-139` |
| G-26 | Info | Platform-admin accounts cannot use the dealer UI (no membership → `NO_DEALER_MEMBERSHIP`) even though the API grants them OWNER on every tenant. | `session.ts:96-110`, `tenant-access.guard.ts:42-56` |

---

### Counts

- Routes: 13 page routes (4 live incl. `/dashboard` alias; 9 fixture-backed) + health + error/not-found/loading.
- Live user-facing controls (shell + dashboard + inventory + leads + error surfaces): 62 distinct controls (see §2.1–2.5).
- Preview controls: 299 buttons, 42 inputs, 14 selects, 1 textarea, 43 modal overlays across 9 routes.
- Fixture-backed routes: 9 of 13.
- Known gaps: 26 (G-01…G-26; 0 High, 10 Medium, 14 Low, 2 Info).
