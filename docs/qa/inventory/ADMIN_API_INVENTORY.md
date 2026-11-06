# Admin Console + API Inventory (read-only code audit)

Date: 2026-10-31. Branch: `docs/staging-signed-in-qa` (HEAD `90600a5`).
Scope A: `apps/admin` (Next.js 15, port 3002, `basePath: '/admin'`, reached through the marketplace gateway rewrite `apps/marketplace/next.config.mjs:19-25` → `ADMIN_SERVICE_URL` / `API_SERVICE_URL`).
Scope B: `apps/api/src` (NestJS 10, port 4000, no global prefix; controllers hard-code `api/v1/...`).
Method: static read of every route, guard, DTO, service method, Prisma schema and RLS policy file. Nothing was executed. All "verified" claims below are code-reading claims; runtime behaviour is NOT RUN.

Conventions: `file:line` refers to the repo root. "logAction" = `AuditService.logAction` (`apps/api/src/audit/audit.service.ts:20-39`), which writes outside any caller transaction and swallows failures. "tx audit" = `tx.auditEvent.create` inside the same `$transaction` as the mutation.

---

## 1. Admin route table

All nine admin routes are `'use client'` components with no server data loading; the only server component is the root layout (`apps/admin/app/layout.tsx:19-54`, reads `ao_locale` cookie). Every route passes the same gate: Next middleware (`apps/admin/middleware.ts:127-275`) then per-call API guard `JwtAuthGuard + PlatformAdminGuard` on `/api/v1/admin/**` and `/api/v1/auth/verify-admin-session`.

Middleware gate (`apps/admin/middleware.ts`): health bypass `:130`; dev bypass only when `NODE_ENV=development` AND localhost AND `ADMIN_DEV_BYPASS=true` `:142`; fail-closed 503 if `JWT_SECRET` missing outside development `:147-153`; HS256 verify of `ao_session` cookie `:87-113,160`; requires `payload.isPlatformAdmin === true` `:163`; prefetch requests skip the network check `:166-168`; authoritative `GET {API}/api/v1/auth/verify-admin-session` with `Bearer` + `Cookie` `:175-187`; Cloudflare Access only when `CF_ACCESS_AUD`+`CF_ACCESS_CERTS_URL` set `:200-215`; Basic Auth fallback when `ADMIN_AUTH_USER`/`ADMIN_AUTH_PASSWORD` set `:218-243`; otherwise HTML → 307 to `/auth?tab=login&redirect=<path>` on the public origin `:245-265` (clears cookie only if cryptographically invalid `:261-263`); non-HTML → 401 JSON `{ error: { code: 'Unauthorized', ... } }` `:267-274`.

| Route | File | Gate (middleware + API guard) | Real API endpoints called | Mock / static | Server vs client |
|---|---|---|---|---|---|
| `/` | `apps/admin/app/page.tsx` | middleware; API `JwtAuthGuard+PlatformAdminGuard` | `GET /api/v1/admin/tenants/summary` (`:59`), `GET /api/v1/admin/users?page=1&limit=1` (`:60`), `GET /api/v1/admin/audit-logs?limit=1&offset=0` (`:61`), `GET /api/v1/auth/me` (header), `POST /api/v1/auth/logout` (header) | Static notice "Preview — metrics API not available" (`:183-198`); 2 disabled buttons | Client |
| `/audit-logs` | `apps/admin/app/audit-logs/page.tsx` | same | `GET /api/v1/admin/audit-logs?limit=50&offset=N[&targetType=]` (`:38`) | none | Client |
| `/dealers` | `apps/admin/app/dealers/page.tsx` | same | `GET /api/v1/admin/tenants` (`:102`), `POST /api/v1/admin/dealers` (`:137`), `PATCH /api/v1/admin/tenants/:id/status` (`:170`), `POST /api/v1/admin/dealers/:id/invite` (`:193`) | none | Client |
| `/disputes` | `apps/admin/app/disputes/page.tsx` | same (middleware only; page makes no admin API call except header `auth/me`) | none | Entire page is a static "Disputes module not available yet" notice (`:38-65`); no case data, no controls | Client |
| `/moderation` | `apps/admin/app/moderation/page.tsx` | same | none (navigates to `/moderation/listings/<ref>` `:25`) | Static "Queue API not available yet" notice (`:76-91`); no queue rows | Client |
| `/moderation/listings/[id]` | `apps/admin/app/moderation/listings/[id]/page.tsx` | same | `GET /api/v1/admin/listings/:idOrSlug` (`:70`), `POST /api/v1/admin/listings/:id/decision` (`:86`) | 1 disabled button "Request clarification (not available yet)" (`:232-239`) | Client |
| `/users` | `apps/admin/app/users/page.tsx` | same | `GET /api/v1/auth/me` (`:84`), `GET /api/v1/admin/users?page&limit=20[&search&status&role]` (`:104-113`), `PATCH /api/v1/admin/users/:id` (`:162`), `POST /api/v1/admin/users/:id/revoke-sessions` (`:152`) | none | Client |
| `/verifications` | `apps/admin/app/verifications/page.tsx` | same | `GET /api/v1/admin/tenants` (`:40`) | none (list is real tenants; filtering/sorting client-side) | Client |
| `/verifications/[id]` | `apps/admin/app/verifications/[id]/page.tsx` | same | `GET /api/v1/admin/verifications/:idOrSlug` (`:63` via `getTenant`, `apps/admin/lib/api.ts:249-251`), `PATCH /api/v1/admin/tenants/:id/status` (`:79`) | 2 disabled buttons "Approve KYB / Reject KYB (not available yet)" (`:184-199`) | Client |
| `/api/health` | `apps/admin/app/api/health/route.ts` | middleware bypass `:130` | — | static JSON | Server route handler |

Prior-audit claim check (F5 in `docs/qa/CODEBASE_KNOWLEDGE.md`): "disputes/moderation/verifications initialise from mocks; `executeDisputeAdjudication` fakes success". **Current state: no longer true.** `grep` of `apps/admin` finds no fixture/mock arrays and no `executeDisputeAdjudication`; `lib/api.ts:9-10` states "Failures always throw… no fixture or mock merge". Disputes and the moderation queue are now *empty honest placeholders* (no data, no controls); KYB registry lists real tenants; KYB decision buttons are rendered `disabled`. Mock-backed admin routes: **0**. Placeholder-only routes (no API-backed data): **2** (`/disputes`, `/moderation` list).

---

## 2. Admin per-route feature inventory

Shared chrome on every route:

| Control (visible label) | File | API | Roles | UI states | Flags |
|---|---|---|---|---|---|
| Sidebar links "Operations Command", "KYB Verification", "Listing Moderation", "Disputes & Sanctions", "Institutional Dealers", "User Governance", "Audit Activity Ledger" | `apps/admin/components/AdminSidebar.tsx:62-174` | none | admin (middleware) | active-state highlight by pathname | — |
| Sidebar "Dealer Tariffs", "Sovereign Gateways" | `AdminSidebar.tsx:176-198` | none | — | `<a aria-disabled tabIndex=-1>` without `href`, title "Not available yet: server-side integration required" | Dead controls (intentional, labelled) |
| Sidebar "Emergency Freeze (not available yet)" | `AdminSidebar.tsx:206-215` | none | — | `disabled` | Dead control (labelled) |
| Mobile "Toggle admin navigation" / "Close admin navigation" | `AdminHeader.tsx:60`, `AdminSidebar.tsx:36` | none | — | body class toggle, Escape closes (`AdminSidebar.tsx:13-19`) | — |
| Header "Universal search — not available yet" input | `AdminHeader.tsx:91-100` | none | — | `disabled` | Dead control (labelled) |
| Header "Notifications (not available yet)" | `AdminHeader.tsx:148-156` | none | — | `disabled` | Dead control (labelled) |
| Header language toggle "EN" / "عربي" | `AdminHeader.tsx:115-144` | none | — | `aria-pressed`; persists `ao_locale` cookie 1y and flips `<html lang dir>` (`apps/admin/lib/locale.tsx:36-45`) | — |
| Header identity block (name + "Platform Admin" / "Not a platform admin") | `AdminHeader.tsx:34-51,159-171` | `GET /api/v1/auth/me` (cached promise `lib/api.ts:153-161`) | any JWT | loading "…", error "Identity unavailable" | — |
| Header "Sign out" | `AdminHeader.tsx:174-194` | `POST /api/v1/auth/logout` (`lib/api.ts:169-188`) | any JWT | busy "Signing out…", disabled while busy, error `role=alert` ("Sign out failed." / network message); 401 treated as success; redirects to `/auth?tab=login` | No confirm (non-destructive). |
| Static status text "External gateways disconnected", "External integrations disabled" | `AdminHeader.tsx:74-79,106-111` | none | — | hardcoded | Static indicator, not API-derived (labelled honestly) |
| Staging badge "STAGING · SYNTHETIC DATA · No live external approvals" | `apps/admin/app/layout.tsx:46-50` | — | — | only when `NEXT_PUBLIC_APP_ENV=staging` | — |
| `ConfirmReasonModal` (shared) | `apps/admin/components/ConfirmReasonModal.tsx` | — | — | `role=dialog`, Escape blocked while `busy` (`AdminDialog.tsx:60-66`), focus trap, reason textarea `required` + `minLength` (default 5) with hint "Enter at least N characters.", submit disabled until valid or while busy, error `role=alert`, optional honesty `note` | Reason enforced client-side only; API `reason` is optional (see §7 G-07) |

### `/` Operations Command (`apps/admin/app/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Refresh" (`:89-97`) | re-runs the three GETs | per-card "…" loading, "Unavailable" with `title` = error message | — |
| "Export report (not available yet)" (`:98-106`) | none | `disabled`, title "Not available yet: no regulatory reporting API" | Dead (labelled) |
| "Circuit breaker (not available yet)" (`:107-115`) | none | `disabled` | Dead (labelled) |
| Card links "Dealerships" → `/dealers`, "KYB in review" → `/verifications`, "Platform users" → `/users`, "Audit events" → `/audit-logs` (`:121-180`) | `tenants/summary` (`total`, `byStatus.ACTIVE/SUSPENDED`, `byVerificationStatus.IN_REVIEW`), `users.total`, `audit-logs.total` | loading/error/ok per metric | Counts are exact server COUNT/GROUP BY (`admin.service.ts:95-136`) |
| Notice "Preview — metrics API not available" (`:183-198`) | none | static | honest placeholder |

### `/audit-logs` (`apps/admin/app/audit-logs/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Refresh Ledger" (`:93-100`) | `GET /admin/audit-logs` | spinner icon while loading | — |
| Search `type=search` "Filter this page by action, target type, or ID..." (`:110-117`) | none — client filter of the 50 loaded rows (`:64-69`) | — | Labelled "this page"; not a server search |
| "Target type:" text input, placeholder "e.g. tenant (server filter)" (`:121-140`) | `targetType` query param, exact match (`admin.service.ts:833-835`); applied on Enter or blur, resets offset | — | No autocomplete of valid values; exact-case match only |
| Row expander button `aria-expanded`/`aria-controls` (`:203-219`) + row click | none | shows `metadata` JSON `<pre>` | — |
| "Prev" / "Next" (`:274-291`) | offset ± 50 | disabled at bounds or while loading; counter "Events a–b of N" / "0 events" | — |
| Table states | — | error `role=alert` + "Retry"; "Loading audit events…"; "No audit events recorded yet." | — |
| Timestamp column "Timestamp (UTC)" (`:157,239`) | — | ISO UTC | Workspace rule says display Asia/Dubai (see §7 G-23) |

### `/dealers` Institutional Dealers (`apps/admin/app/dealers/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Refresh" (`:253-260`) | `GET /admin/tenants` | spinner | — |
| "Provision Dealership" (`:261-271`) opens `AdminDialog` "Provision New Dealership" | — | focus to slug input | — |
| Search "Search dealerships by name or slug..." (`:303-311`) | none (client filter of ≤500 rows) | footer text explains "returns the full list without server-side pagination" (`:457-462`) | — |
| Row "Invite" (`aria-label` "Invite employee to X") (`:416-422`) | opens invite dialog | — | Offered for every tenant status incl. CLOSED/SUSPENDED (API accepts, see §7 G-18) |
| Row "Suspend" (ACTIVE) / "Activate" (SUSPENDED) (`:426-441`) | `PATCH /admin/tenants/:id/status` `{status, reason}` via `ConfirmReasonModal` (`:731-761`) | disabled while `actionLoading`; modal titles "Suspend this dealership?" / "Reactivate this dealership?", confirm "Suspend dealership" / "Reactivate dealership", description warns "The API unpublishes its active listings."; error "Not saved: …" inside modal; success toast "API confirmed X is now STATUS." (`:171-177`) | Confirmation + reason present. CLOSED never offered. |
| Row text "Closed (final)" / "Awaiting KYB approval" (`:443-447`) | — | PENDING and CLOSED rows get no status button | matches API transition rules |
| Provision form: "Dealership Slug (URL Identifier)", "Legal Registered Entity Name", "Customer Display Name", "Principal Contact Name", "Principal Email Address" — all `required` (`:496-603`) | `POST /admin/dealers` body `{slug, legalName, displayName, adminEmail, adminName}` | submit "Confirm Provisioning" → "Provisioning..."; Cancel/X disabled while busy; error "Not created: …" `role=alert` inside dialog; success toast "API created dealership 'X'." | Slug lower-cased client side; server also requires `^[a-z0-9-]+$` (`admin-dealer.dto.ts:9`). No confirmation step beyond the form (creation is non-destructive). |
| Invite form: "Staff Member Email" (`required`, `type=email`), "Assigned Role" select of 7 roles (`SALES_AGENT, SALES_MANAGER, INVENTORY_MANAGER, SERVICE_ADVISOR, FINANCE_MANAGER, ADMIN, VIEWER`, `:53-61`) | `POST /admin/dealers/:id/invite` `{email, role}` | submit "Generate Invitation Token" → "Issuing..."; error "Invitation not issued: …"; on success shows activation link `${origin}/auth/activate?token=…` with "Copy Activation Link" / "Copied to Clipboard!" and text "expires in 48 hours" (`:637-671`) | OWNER not offered in UI though API accepts it. Raw token shown on screen (by design). Throws if API omits `activationToken` (`:198-200`). |
| Toast (`:276-292`) | — | `role=status`, auto-hide 4 s | — |

### `/disputes` (`apps/admin/app/disputes/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| Notice "Disputes module not available yet" + "Go to Institutional Dealers" link (`:38-65`) | none | static | No case list, no adjudication, no escrow controls. `executeDisputeAdjudication` does not exist anymore. |

### `/moderation` (`apps/admin/app/moderation/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| Form "Listing UUID or slug" + "Open listing" (`:49-73`) | none; `router.push('/moderation/listings/<encoded ref>')` | submit disabled when empty | — |
| Notice "Queue API not available yet" (`:76-91`) | none | static | No queue endpoint exists in API (confirmed: `admin-listings.controller.ts` has only `GET :id` and `POST :id/decision`). |

### `/moderation/listings/[id]` (`apps/admin/app/moderation/listings/[id]/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Back to moderation" link (`:115`) | — | — | — |
| Load (`:61-79`) | `GET /admin/listings/:ref` | "Loading listing…" `role=status`; error section `role=alert` "Listing unavailable" + "No moderation decision has been made." + "Retry"; empty ref → "No listing identifier was provided." | — |
| Facts grid (`:173-193`) | — | shows `askingPriceFils` via `formatAedFromFils` (BigInt, no float), VIN (full; admin by design), stock number, mileage, GCC spec, fuel, transmission, colour, stock status, slug, UUID, created/updated in Asia/Dubai | `purchaseCostFils` never requested/rendered |
| "Approve & publish" / "Reject with reason" (`:216-231`) | `POST /admin/listings/:id/decision` `{decision, reason?}` (`lib/api.ts:701-712`) via `ConfirmReasonModal` (`:298-316`) | both `disabled` unless `status === 'PENDING_REVIEW'` and not submitting; hint "Decisions apply to listings in PENDING_REVIEW. This listing is X."; modal titles "Approve and publish this listing?" / "Reject this listing?"; reject reason label "Rejection reason (required, sent to the API)" min 5; approve reason label "Review notes (optional, sent to the API)" min 0; error "Decision was NOT saved. …"; success banner "API saved the decision. Listing status is now X." then reload | Success asserted only if API returns `status` string (`:87-89`). Approve reason is sent as `reason` but the API ignores it on APPROVE (not stored/audited; `listings.service.ts:358-414`). |
| "Request clarification (not available yet)" (`:232-239`) | none | `disabled` | Dead (labelled) |
| Media grid (`:243-291`) | uses `previewUrl` (signed, 300 s TTL) else `url`/`objectKey` if absolute | DOCUMENT/VIDEO render as "Open file (temporary link)"; images `<img>`; fallbacks "Preview unavailable (object storage not configured)" / "Private — not previewable"; badge `public`/`private` | — |

### `/users` User Governance (`apps/admin/app/users/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Refresh Roster" (`:205-212`) | `GET /admin/users` | spinner | — |
| Search "Search by email, name, or phone..." (`:241-248`) | `search` param, debounced 300 ms, resets page (`:71-80`) | — | server `contains` on email/displayName/phoneE164 (`admin.service.ts:383-390`) |
| "Status:" select (`ALL, ACTIVE, SUSPENDED, DISABLED, PENDING_VERIFICATION`) (`:254-268`) | `status` param | resets page | — |
| "Role:" select (`ALL, PLATFORM_ADMIN, OWNER, ADMIN, SALES_MANAGER, SALES_AGENT, BUYER`) (`:273-289`) | `role` param | resets page | Omits `INVENTORY_MANAGER, SERVICE_ADVISOR, FINANCE_MANAGER, VIEWER` |
| Row click / "Manage" (`:341-345,412-421`) | opens drawer "Identity Dossier" | — | Drawer is a hand-rolled `role=dialog aria-modal` without focus trap or Escape handling (not `AdminDialog`) |
| "Prev" / "Next" (`:437-454`) | `page` ± 1 | disabled at bounds/loading; "N users · page a of b" | — |
| Table states | — | error `role=alert` + "Retry"; "Loading users…"; "No platform users matching criteria." | — |
| Drawer identity: "Display Name", "Email Address", "UUID", "Current Status", "Dealership Roles" (`:487-533`) | — | — | Does not call `GET /admin/users/:id`; uses list row |
| Drawer gating (`:542-557`) | `GET /auth/me` for self id | "Confirming your administrator identity…" while loading; `role=alert` "Your administrator identity could not be confirmed, so account actions are hidden." on error; "This is your own account. Suspend, disable and session revocation are not offered…" when self | Fail-closed self guard (AD-02) |
| "Suspend User Account" (if ACTIVE) / "Reactivate User Account" (otherwise) (`:560-580`) | `PATCH /admin/users/:id` `{status:'SUSPENDED'|'ACTIVE', reason}` via `ConfirmReasonModal` ("Suspend this account?" / "Reactivate this account?", confirm "Suspend account"/"Reactivate account") | disabled while busy; error "Not saved: …"; toast "API confirmed status X for Y."; optimistic drawer status update after success (`:167`) | Reactivate offered for DISABLED and PENDING_VERIFICATION too |
| "Revoke Active Sessions" (`:582-590`) | `POST /admin/users/:id/revoke-sessions` via modal "Revoke all active sessions?" confirm "Revoke sessions" | toast "API revoked N active session(s) for X."; modal note "The API audit-logs session revocation but does not yet store the reason text." (`:626-633`) | Reason collected but not sent (honestly labelled) |
| "Disable Account (Soft Delete)" (hidden when already DISABLED) (`:592-602`) | `PATCH /admin/users/:id` `{status:'DISABLED', reason}` via modal "Disable this account?" confirm "Disable account" | as above | UI never calls `DELETE /admin/users/:id` |
| "Close identity dossier" X (`:477-484`) | — | — | — |

### `/verifications` KYB registry (`apps/admin/app/verifications/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Refresh" (`:88-96`) | `GET /admin/tenants` | spinner | — |
| "Verification status:" select (`ALL` + distinct values present) (`:105-115`) | none (client filter) | — | — |
| Filter "Filter by dealer name or slug..." (`:120-126`) | none (client filter) | — | English-only labels on this page (no `t()`) |
| Row link (dealer name) and "Open dossier" → `/verifications/<id>` (`:171-195`) | — | sorted IN_REVIEW → NOT_SUBMITTED → EXPIRED → REJECTED → APPROVED (`:19-25`) | — |
| Table states | — | error `role=alert` + "Retry"; "Loading dealerships…"; "No dealerships match." | — |

### `/verifications/[id]` KYB dossier (`apps/admin/app/verifications/[id]/page.tsx`)

| Control | API | UI states | Flags |
|---|---|---|---|
| "Back to KYB registry" (`:98`) | — | — | — |
| Load (`:54-72`) | `GET /admin/verifications/:ref` | "Loading dealer dossier…"; error `role=alert` "Dealer dossier unavailable" + "No verification or dealer approval has occurred." + "Retry" | — |
| Registry record grid (`:150-171`) | — | Tenant UUID, slug, legal/display name, "Trade licence ref", "Trade licence expiry", vehicles, listings, created, updated; footnote "no live DED/registry check is performed" | — |
| "Approve KYB (not available yet)" / "Reject KYB (not available yet)" (`:184-199`) | none | `disabled`, title "Not available yet: no KYB decision endpoint" | Dead (labelled). No API exists (see §7 G-16). |
| "Suspend dealership" (ACTIVE) / "Reactivate dealership" (SUSPENDED) (`:203-218`) | `PATCH /admin/tenants/:id/status` via `ConfirmReasonModal` (`:264-280`) | pending/closed text instead of button (`:223-231`); feedback "API confirmed tenant status X."; error "Not saved: …" | Suspend button not disabled while busy (modal handles busy) |
| Branches list (`:238-257`) | from dossier `branches` | "No branches on file." | — |

---

## 3. Full API endpoint catalogue

Global behaviour: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, enableImplicitConversion: true })` (`apps/api/src/main.ts:104-113`); `HttpExceptionFilter` → `{ error: { code, message, correlationId, details } }` (`apps/api/src/common/filters/http-exception.filter.ts:72-79`); per-request `AsyncLocalStorage` DB context created empty by `TenantContextMiddleware` (`apps/api/src/common/middleware/tenant-context.middleware.ts:13-14`); `PlatformAdminGuard` sets `store.isAdmin = true` + `userId` (`apps/api/src/common/guards/platform-admin.guard.ts:17-23`); `TenantAccessGuard` sets `store.tenantId` (+`isAdmin` for platform admins) (`apps/api/src/common/guards/tenant-access.guard.ts:41-56,68-72`); `JwtStrategy.validate` sets `store.userId` (`apps/api/src/auth/jwt.strategy.ts:65-68`). Prisma extension applies `set_config('app.tenant_id'|'app.user_id'|'app.is_admin', …, true)` inside a transaction per operation or per `$transaction` block (`apps/api/src/database/prisma.service.ts:79-127`). Rate limiting exists only on auth routes (`AuthRateLimitGuard`, per-IP fixed window, process-local, disabled when `NODE_ENV=test`, `apps/api/src/common/guards/auth-rate-limit.guard.ts:43-50`). No admin/tenant/me route has a rate limit. No `@MaxLength` and no `ParseUUIDPipe`/`@IsUUID` anywhere in `apps/api/src` (grep). No explicit JSON body-size limit set in `main.ts` (Express default ~100 kB applies).

Abbreviations: PA = `JwtAuthGuard, PlatformAdminGuard`; TA = `JwtAuthGuard, TenantAccessGuard` (+`@RequireRoles`); J = `JwtAuthGuard` only; Pub = `@Public()` (no auth). DB ctx: `admin` = `isAdmin=true` (+userId) set by guard or `runWithDbContext({isAdmin:true})`; `tenant` = `tenantId` from route param; `user` = `userId` only.

### 3.1 `AdminController` — `apps/api/src/admin/admin.controller.ts` (`@UseGuards(JwtAuthGuard, PlatformAdminGuard)` `:36`, prefix `api/v1/admin`)

| # | Method | Path | Guards / roles | Request DTO + validation | Response shape | DB ctx | Audit | Outbox | Rate limit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | GET | `/api/v1/admin/tenants` (`:45-56`) | PA | header `x-correlation-id` optional | `AdminTenantSummaryDto[]` `{id, slug, legalName, displayName, status, verificationStatus (NOT_SUBMITTED when no row), staffCount (active memberships), vehicleCount, createdAt}`; `take: 500` cap (`admin.service.ts:60-87`) | admin (guard) | none (AD-10, `:54-55`) | none | none |
| 2 | GET | `/api/v1/admin/dealers` (`:58-65`) | PA | — | alias of #1 | admin | none | none | none |
| 3 | POST | `/api/v1/admin/dealers` (`:67-75`) 201 | PA | `AdminCreateDealerDto` (`admin-dealer.dto.ts:5-35`): `slug` IsString IsNotEmpty `Matches(/^[a-z0-9-]+$/)`; `legalName` IsString IsNotEmpty; `displayName` IsString IsNotEmpty; `adminEmail` IsEmail; `adminName` IsString IsNotEmpty; `currency?` IsOptional IsString default `'AED'` | `{id, slug, legalName, displayName, status:'ACTIVE', adminEmail, createdAt}` (`admin.service.ts:760-768`); 409 if slug exists (`:665-669`) | admin | `PLATFORM_ADMIN_CREATE_DEALER` via logAction AFTER tx (`:747-758`) | `tenant.created` in tx (`:728-742`) | none |
| 4 | POST | `/api/v1/admin/dealers/:id/invite` (`:77-86`) 201 | PA | `AdminInviteDealerStaffDto` (`:37-50`): `email` IsEmail; `role` IsEnum(MembershipRole); `name?` IsOptional IsString (unused) | `{success:true, invitationId, email, role, expiresAt (+48h), activationToken (raw hex 64)}` (`admin.service.ts:802-809`); 404 tenant | admin | `PLATFORM_ADMIN_INVITE_DEALER_STAFF` logAction after insert (`:789-800`) | none | none |
| 5 | GET | `/api/v1/admin/tenants/summary` (`:89-97`) | PA | — | `AdminTenantCountsResponse {total, byStatus{PENDING,ACTIVE,SUSPENDED,CLOSED}, byVerificationStatus{NOT_SUBMITTED,IN_REVIEW,APPROVED,REJECTED,EXPIRED}}` (`admin.service.ts:95-136`) | admin | none | none | none |
| 6 | GET | `/api/v1/admin/tenants/:id` (`:99-115`) | PA | `:id` UUID or slug (`admin.service.ts:144-151`) | `{id, slug, legalName, displayName, status, verificationStatus, tradeLicenseNumber, tradeLicenseExpiry, branches (raw Branch rows), vehicleCount, listingCount, createdAt, updatedAt}` (`:172-190`); 404 | admin | `PLATFORM_ADMIN_GET_TENANT` logAction BEFORE read, even on 404 (`:134-142`) | none | none |
| 7 | GET | `/api/v1/admin/verifications/:id` (`:117-132`) | PA | same | alias of #6 | admin | same | none | none |
| 8 | PATCH | `/api/v1/admin/tenants/:id/status` (`:134-152`) | PA | `UpdateTenantStatusDto` (`update-tenant-status.dto.ts`): `status` IsEnum(TenantStatus) IsNotEmpty; `reason?` IsString IsOptional. `:id` must be UUID (findUnique by id; non-UUID → Prisma error → 500) | `AdminTenantSummaryDto` (`admin.service.ts:309-321`); 404; 409 `TENANT_STATUS_UNCHANGED` / `TENANT_CLOSED_TERMINAL` / `TENANT_STATUS_TRANSITION_INVALID` / `TENANT_KYB_NOT_APPROVED` (`:332-370`) | admin | `PLATFORM_ADMIN_UPDATE_TENANT_STATUS` logAction AFTER tx (`:295-307`) with `{previousStatus,newStatus,reason}` | in tx: `tenant.status_updated` always (`:276-290`); `listing.unpublished` per PUBLISHED listing when → SUSPENDED/CLOSED (`:243-274`) | none |
| 9 | GET | `/api/v1/admin/users` (`:158-165`) | PA | `AdminUserFilterDto` (`admin-user.dto.ts:6-40`): `search?` IsString; `status?` IsEnum(4 values); `role?` IsString (free text; `PLATFORM_ADMIN`/`BUYER` special, else cast to MembershipRole); `tenantId?` IsString; `page` Type Number IsInt Min(1) default 1; `limit` Type Number IsInt Min(1) default 20 (no Max; service caps 100 `admin.service.ts:411`) | `{users:[{id,email,displayName,phoneE164,isPlatformAdmin,status,createdAt,updatedAt,emailVerifiedAt,memberships:[{tenantId,tenantName,tenantSlug,role,active}],isBuyer}], total, page, limit, totalPages}` (`:438-462`) | admin | none (AD-10) | none | none |
| 10 | GET | `/api/v1/admin/users/:id` (`:167-174`) | PA | `:id` UUID (findUnique) | `{id, identitySubject, email, phoneE164, displayName, isPlatformAdmin, status, emailVerifiedAt, mfaEnabled, failedLoginAttempts, lockedUntil, createdAt, updatedAt, memberships[+tenantStatus], buyer (FULL BuyerProfile row incl. trn, escrowIban, consents), activeSessionCount, recentSessions[{id,userAgent,ipAddress,createdAt,expiresAt}] (≤10)}` (`admin.service.ts:495-535`). No passwordHash/mfaSecret. | admin | `PLATFORM_ADMIN_GET_USER` logAction before read (`:475-481`) | none | none |
| 11 | PATCH | `/api/v1/admin/users/:id` (`:176-184`) | PA | `AdminUpdateUserDto` (`admin-user.dto.ts:42-64`): `displayName?` IsString; `status?` IsEnum(4); `isPlatformAdmin?` Transform('true'/'false') IsBoolean; `reason?` IsString | `{id,email,displayName,isPlatformAdmin,status,updatedAt}` (`admin.service.ts:603-610`); 404; 400 `CANNOT_DISABLE_LAST_PLATFORM_ADMIN` (`:559-563`); 400 `CANNOT_MODIFY_OWN_ACCOUNT` (`:568-577`) | admin | `PLATFORM_ADMIN_UPDATE_USER` logAction AFTER update (`:589-601`) | none | none |
| 12 | POST | `/api/v1/admin/users/:id/revoke-sessions` (`:186-194`) 200 | PA | none | `{revokedCount, success:true}` (`admin.service.ts:643`); 400 `CANNOT_REVOKE_OWN_SESSIONS` (`:614-618`); no 404 for unknown user | admin | `PLATFORM_ADMIN_REVOKE_SESSIONS` logAction after updateMany (`:625-632`) | none | none |
| 13 | DELETE | `/api/v1/admin/users/:id` (`:196-203`) | PA | none | same as #11 with `{status:'DISABLED', reason:'Soft-deleted by platform administrator'}` (`admin.service.ts:637-644`) | admin | as #11 | none | none |
| 14 | GET | `/api/v1/admin/audit-logs` (`:209-225`) | PA | raw `@Query` `limit` (controller clamps 1..200 `:219`; service clamps 1..100 `admin.service.ts:829`), `offset` (≥0), `targetType` exact match | `AuditLogListResponse {events:[{id,action,tenantId,actorUserId,targetType,targetId,metadata,createdAt}], total, limit, offset}` (`:838-852`) | admin | none | none | none |
| 15 | POST | `/api/v1/admin/outbox/process` (`:231-248`) 200 | PA | `limit` query clamped 1..200 | `{processedCount, metrics:{pending,processing,sent,failed,total}}` (`admin.service.ts:868-881`) | admin + nested `runWithDbContext({isAdmin})` in `OutboxService` (`outbox.service.ts:56`) | `PLATFORM_ADMIN_PROCESS_OUTBOX` logAction BEFORE processing (`:864-872`) | mutates outbox rows (PROCESSING/SENT/FAILED) | none |
| 16 | GET | `/api/v1/admin/outbox/metrics` (`:250-256`) | PA | — | `OutboxMetricsDto` | admin | none | none | none |
| 17 | POST | `/api/v1/admin/outbox/retry-failed` (`:258-266`) 200 | PA | — | `{retriedCount}` | admin (guard store) | `PLATFORM_ADMIN_RETRY_OUTBOX` logAction before (`:890-897`) | FAILED→PENDING, attempts=0 (`outbox.service.ts:221-229`) | none |

Not consumed by the admin UI: #2, #6 (UI uses alias #7), #10, #13, #15, #16, #17.

### 3.2 `AdminListingsController` — `apps/api/src/listings/admin-listings.controller.ts` (PA `:26`, prefix `api/v1/admin/listings`)

| # | Method | Path | Guards | Request DTO | Response | DB ctx | Audit | Outbox | RL |
|---|---|---|---|---|---|---|---|---|---|
| 18 | GET | `/api/v1/admin/listings/:id` (`:31-41`) | PA | `:id` UUID or slug (`listings.service.ts:475-482`) | untyped `{id, slug, title, description, askingPriceFils (string), status, qualityScore, tenant{id,slug,displayName,verificationStatus}, vehicle{id, vin (FULL), stockNumber, modelYear, makeName, modelName, trim, mileageKm, colorExterior, fuel, transmission, gccSpec, stockStatus, media:[…VehicleMedia row (id,tenantId,vehicleId,kind,objectKey,altText,sortOrder,isPublic,createdAt), previewUrl (SigV4 GET, 300 s) or null, previewExpiresAt]}, createdAt, updatedAt}` (`:538-571`). **Not** included: `purchaseCostFils`, branch, buyer data. Private media (incl. DOCUMENT) ARE previewable by admin. | admin | `ADMIN_PRIVATE_MEDIA_PREVIEW_ISSUED` logAction only when ≥1 private media got a signed URL (`:521-536`); otherwise no audit of the read | none | none |
| 19 | POST | `/api/v1/admin/listings/:id/decision` (`:43-56`) 200 | PA | `AdminListingDecisionDto` (`dto/admin-listing-decision.dto.ts`): `decision` IsEnum(APPROVE|REJECT) IsNotEmpty; `reason?` IsString IsOptional (service requires non-blank for REJECT `listings.service.ts:417-419` → 400). `:id` must be UUID (findUnique by id) | `ListingResponseDto {id, tenantId, vehicleId, slug, title, description, askingPriceFils (string), status, qualityScore, verifiedAt, publishedAt, createdAt, updatedAt}`; 404; 409 if status ≠ PENDING_REVIEW (`:352-356`); 400 publish-gate failures on APPROVE (`:757-797`) | admin | **tx audit** `LISTING_APPROVED` (`:391-403`) / `LISTING_REJECTED` (`:445-456`) | in tx: `listing.published` (`:373-388`) / `listing.rejected` (`:430-442`); plus direct in-memory projection sync after commit (`:409-412`, `:462-465`) | none |

### 3.3 `AuthController` — `apps/api/src/auth/auth.controller.ts` (prefix `api/v1/auth`)

| # | Method | Path | Guards | Request DTO | Response | DB ctx | Audit | Outbox | RL |
|---|---|---|---|---|---|---|---|---|---|
| 20 | POST | `/api/v1/auth/login` (`:44-74`) 200 | Pub + `AuthRateLimitGuard` | `LoginDto`: `email` IsEmail + lowercase Transform; `password` IsString IsNotEmpty | `LoginResponseDto {success, accessToken (HS256 JWT, 7d, claims sub,userId,email,isPlatformAdmin,sessionId,iss,aud), tokenType:'Bearer', expiresIn:604800, user{id,email,displayName,isPlatformAdmin,status,primaryRole,tenantId?,tenantSlug?,redirectUrl}}`; sets `ao_session` cookie httpOnly, `secure` only in production/staging, `sameSite:lax`, 7 d (`:62-71`). 401 generic for bad password / unknown / locked (`auth.service.ts:255-304`); 403 `ACCOUNT_DISABLED`/`ACCOUNT_SUSPENDED`/`EMAIL_NOT_VERIFIED` only after correct password (`:307-323`); lock after 5 failures for 15 min (`:282-288`) | `runWithDbContext({isAdmin})` (`auth.service.ts:240`) | direct `auditEvent.create`: `AUTH_LOGIN_FAILED` / `AUTH_LOGIN_ACCOUNT_LOCKED` (`:290-301`), `AUTH_LOGIN_SUCCESS` (`:366-376`) | none | 10 / 60 s per IP |
| 21 | POST | `/api/v1/auth/signup` (`:76-85`) 201 | Pub + RL | `CustomerSignupDto`: `email` IsEmail lowercased; `password` IsString MinLength(10) + `validatePasswordStrength` (10+, upper, lower, digit, special; `password.util.ts:85-102`); `displayName` IsNotEmpty; `phone?`; `emirate?`; `consentPdpl` IsBoolean Equals(true); `consentMarketing?` IsBoolean | `{success, userId, email, status:'PENDING_VERIFICATION', message, verificationToken? (dev/test only)}`; 409 duplicate email/phone | admin ctx | none | none | 5 / 10 min |
| 22 | POST | `/api/v1/auth/verify-email` (`:87-96`) | Pub + RL | `VerifyEmailDto.token` IsString IsNotEmpty | `{success, message, email?}`; 400 invalid/expired (24 h) | admin ctx | `USER_EMAIL_VERIFIED` direct create (`auth.service.ts:513-521`) | none | 20 / 10 min |
| 23 | POST | `/api/v1/auth/resend-verification` (`:98-109`) | Pub + RL | `ResendVerificationDto.email` IsEmail | generic `{success:true, message, verificationToken? (dev/test)}` (no enumeration) | admin ctx | none | none | 3 / 10 min |
| 24 | GET | `/api/v1/auth/activate/verify?token=` (`:111-119`) | Pub (NO rate limit) | raw `@Query('token')` string | `VerifyActivationTokenResponseDto {valid:true, email, isPlatformAdmin, requiresMfa:false, role, tenantName}`; 400 invalid/accepted/expired | admin ctx | none | none | **none** |
| 25 | POST | `/api/v1/auth/activate/complete` (`:121-133`) | Pub + RL | `CompleteActivationDto`: `token` IsNotEmpty; `password` MinLength(10) + strength; `mfaCode?` IsOptional (ignored; MFA always disabled `auth.service.ts:643-644,655-656`) | `{success, message, redirectUrl:'/auth?tab=login'}`; creates/updates user ACTIVE + upserts membership (role overwritten) + marks invitation accepted (`:624-688`) — NOT in a transaction | admin ctx | `PLATFORM_ADMIN_ACTIVATED` / `USER_INVITATION_ACCEPTED` direct create (`:690-705`) | none | 10 / 10 min |
| 26 | GET | `/api/v1/auth/verify-admin-session` (`:135-141`) | PA | — | `{valid:true, user:AuthenticatedUser}`; 403 unless `isPlatformAdmin && status==='ACTIVE'` (`auth.service.ts:715-722`) | admin | none | none | none |
| 27 | GET | `/api/v1/auth/me` (`:143-149`) | J | — | `{id, identitySubject, email, phoneE164, displayName, isPlatformAdmin, status, emailVerified, mfaEnabled, memberships[], buyerProfile{preferredLanguage,preferredEmirate}|null, resolvedDashboardUrl}` (`auth.service.ts:756-781`) | admin ctx | none | none | none |
| 28 | POST | `/api/v1/auth/logout` (`:151-162`) 200 | J | — | `{success:true}`; clears `ao_session` cookie; revokes only the JWT's `sessionId` (`auth.service.ts:785-795`) | admin ctx | none | none | none |
| 29 | POST | `/api/v1/auth/token` (`:164-189`) | Pub | `DevLoginDto {identitySubject IsNotEmpty, email?, name?}` | `{accessToken, tokenType, subject}`; 403 unless `ALLOW_DEV_TOKENS=true` and not production/staging | — | none | none | **none** |
| 30 | POST | `/api/v1/auth/register` (`:191-199`) | Pub + RL | `RegisterVipLeadDto` (`register-vip.dto.ts`): `tier` IsEnum; `legalName`, `phone` IsNotEmpty; `email` IsEmail; `emiratesId?`, `emirate?`, `marques?[]`, `password?` (unused); `consentPdpl` Equals(true) | `RegisterVipResponseDto {success, userId, registrationId, email, tier, status:'PENDING_VERIFICATION', requiresVerification:true, message}`; 409 duplicate | admin ctx | none | none | 5 / 10 min |

JWT verification (`apps/api/src/auth/jwt.strategy.ts`): Bearer header or `ao_session` cookie (`:28-31`); `algorithms: ['HS256']` only (`:37`); issuer/audience enforced (`:34-35`, defaults `https://auth.autonexa.ae` / `autonexa-api`); session row must exist, belong to the subject, not be revoked, not be expired (`auth.service.ts:189-199`); user status DISABLED/SUSPENDED → 403 at every request (`:201-211`). `isPlatformAdmin` is re-read from DB on each request (`:219`), not trusted from the token.

### 3.4 `MeController` — `apps/api/src/me/me.controller.ts` (J `:47`, prefix `api/v1/me`)

| # | Method | Path | Request DTO | Response | DB ctx | Audit | Outbox |
|---|---|---|---|---|---|---|---|
| 31 | GET | `/api/v1/me` (`:52-57`) | — | `MeResponseDto` | user | none | none |
| 32 | GET | `/api/v1/me/buyer-profile` (`:63-70`) | — | `BuyerProfileResponseDto` (fils as strings); 404 | user | none | none |
| 33 | PATCH | `/api/v1/me/buyer-profile` (`:72-80`) | `UpdateBuyerProfileDto`: `preferredLanguage?` IsString; `preferredEmirate?` IsString (nullable); `budgetMinFils?`/`budgetMaxFils?` IsInt Min(0) Type Number (nullable); `preferredMakes?` IsArray IsString each | `BuyerProfileResponseDto` (upsert) | user | none | none |
| 34 | GET | `/api/v1/me/settings` (`:86-93`) | — | `AccountSettingsResponseDto {userId, displayName, email, phoneE164, affiliation, trn, settlementCurrency, escrowIban, garageVisibility, aecbRefreshConsent, whatsappCommsConsent, updatedAt}` | user | none | none |
| 35 | PATCH | `/api/v1/me/settings` (`:95-103`) | `UpdateAccountSettingsDto`: all optional IsString/IsBoolean (`firstName, lastName, handle, affiliation, trn, settlementCurrency, escrowIban, garageVisibility, aecbRefresh, whatsappComms`) — no format validation on TRN/IBAN/currency | same | user | none | none |
| 36 | GET | `/api/v1/me/favorites` (`:109-116`) | — | `FavoriteResponseDto[]` (≤200; cards via admin-ctx read of public fields only `me.service.ts:68-112`) | user + nested admin read | none | none |
| 37 | POST | `/api/v1/me/favorites` (`:118-127`) 201 | `AddFavoriteDto.listingId` IsNotEmpty | `FavoriteResponseDto`; 404 unless listing PUBLISHED | user | none | none |
| 38 | DELETE | `/api/v1/me/favorites/:listingId` (`:129-138`) | — | `{success}`; 404 | user | none | none |
| 39 | GET | `/api/v1/me/saved-searches` (`:144-151`) | — | `SavedSearchResponseDto[]` (≤200) | user | none | none |
| 40 | POST | `/api/v1/me/saved-searches` (`:153-162`) 201 | `CreateSavedSearchDto {name IsNotEmpty, filterJson IsObject IsNotEmpty, alertsEnabled? IsBoolean}` | `SavedSearchResponseDto` | user | none | none |
| 41 | DELETE | `/api/v1/me/saved-searches/:id` (`:164-173`) | — | `{success}`; 404 if not owner | user | none | none |
| 42 | GET | `/api/v1/me/enquiries` (`:179-186`) | — | `BuyerEnquiryResponseDto[]` (≤200; grants read under admin ctx `me.service.ts:41-59`) | user (+admin reads) | none | none |
| 43 | POST | `/api/v1/me/leads/:leadId/appointments` (`:188-198`) 201 | `CreateAppointmentDto {startsAt IsDateString, endsAt IsDateString, note?}`; end>start | `AppointmentResponseDto` status REQUESTED; 404 if lead not buyer's | `runWithDbContext({tenantId: lead.tenantId, userId})` (`me.service.ts:424`) | tx audit `APPOINTMENT_REQUESTED` | tx `appointment.requested` |
| 44 | POST | `/api/v1/me/leads/:leadId/grant/revoke` (`:200-212`) 200 | — | `{success, revokedAt}`; idempotent if already revoked; 404 | tenant+user ctx (`me.service.ts:699-700`) | tx audit `LEAD_GRANT_REVOKED` | tx `lead.grant_revoked` |
| 45 | GET | `/api/v1/me/appointments` (`:218-225`) | — | untyped array with `listing{id,slug,title,vinMasked,imageUrl,dealershipName}` | user (+admin reads) | none | none |
| 46 | POST | `/api/v1/me/appointments/:appointmentId/cancel` (`:227-237`) 200 | `CancelAppointmentDto {reason?}` | `AppointmentResponseDto` CANCELLED (no state check) | tenant+user ctx | tx audit `APPOINTMENT_CANCELLED` | tx `appointment.cancelled` |
| 47 | POST | `/api/v1/me/appointments/:appointmentId/reschedule` (`:239-255`) 200 | `RescheduleAppointmentDto {startsAt, endsAt IsDateString}` | `AppointmentResponseDto` REQUESTED | tenant+user ctx | tx audit `APPOINTMENT_RESCHEDULED` | tx `appointment.rescheduled` |

### 3.5 `VehiclesController` — `apps/api/src/inventory/vehicles.controller.ts` (TA `:40`, prefix `api/v1/tenants/:tenantId/vehicles`)

`TenantAccessGuard`: platform admins bypass with `userRole=OWNER` and `isPlatformAdminBypass=true` (`tenant-access.guard.ts:42-56`); members need `membership.active` and `tenantStatus==='ACTIVE'` (`:74-84`), else 403 `MEMBERSHIP_INACTIVE` / `TENANT_INACTIVE`; no membership → 403 `TENANT_FORBIDDEN` (`:62-66`); role mismatch → 403 `INSUFFICIENT_ROLE_PERMISSIONS` (`:92-101`). `purchaseCostFils` is visible/settable only for `OWNER, ADMIN, FINANCE_MANAGER, INVENTORY_MANAGER` (`vehicles.service.ts:31-36,497-503`); others receive `null` and get 403 on write (`:52-59,224-231`).

| # | Method | Path | Roles | Request DTO | Response | DB ctx | Audit | Outbox |
|---|---|---|---|---|---|---|---|---|
| 48 | POST | `/api/v1/tenants/:tenantId/vehicles` (`:45-67`) 201 | OWNER, ADMIN, INVENTORY_MANAGER, SALES_MANAGER | `CreateVehicleDto`: `branchId, makeId, modelId, stockNumber` IsNotEmpty; `vin?`; `trim?`; `modelYear` IsInt 1990..2030; `condition` IsEnum; `mileageKm?` IsInt Min0; `colorExterior?`; `fuel?` IsEnum; `transmission?` IsEnum; `gccSpec?` IsBoolean; `purchaseCostFils?` IsInt Min0 (privileged roles only); `askingPriceFils` IsInt Min1; `stockStatus?` IsEnum default INTAKE | `VehicleResponseDto` (fils as strings; `purchaseCostFils` null unless privileged); 400 branch/make-model mismatch; 409 P2002 | tenant | `VEHICLE_CREATED` logAction after create | none |
| 49 | GET | `…/vehicles` (`:69-81`) | any active member | `ListVehiclesQueryDto {stockStatus? IsEnum, makeId?, condition? IsEnum, page? Min1, limit? 1..50}` | `{items: VehicleResponseDto[], total}` | tenant | none | none |
| 50 | GET | `…/vehicles/:id` (`:83-95`) | any | — | `VehicleResponseDto`; 404 (composite `tenantId_id`) | tenant | none | none |
| 51 | PATCH | `…/vehicles/:id` (`:97-121`) | OWNER, ADMIN, INVENTORY_MANAGER, SALES_MANAGER | `UpdateVehicleDto` (all optional, same rules; `stockStatus?` IsEnum) | `VehicleResponseDto`; 404 | tenant | `VEHICLE_UPDATED` logAction after tx | in tx `listing.unpublished` when AVAILABLE→non-AVAILABLE with PUBLISHED listing (`vehicles.service.ts:291-330`) |
| 52 | POST | `…/vehicles/:id/media` (`:123-142`) 201 | + SALES_AGENT | `CreateMediaUploadDto {kind IsEnum(MediaKind), fileName IsNotEmpty, contentType IsIn(jpeg,png,webp,pdf), fileSizeBytes IsInt 1..50 MB (images 15 MB), isPublic? IsBoolean, altText?, sortOrder? Min0}` | `MediaUploadResponseDto {mediaId, objectKey tenants/<t>/vehicles/<v>/<uuid>-<name>, uploadUrl (SigV4 PUT, 15 min), expiresAt, isPublic}`; `isPublic` forced false for DOCUMENT and for SALES_AGENT (`vehicles.service.ts:476-479`); 503 when storage unconfigured | tenant | none | none |

### 3.6 `PublicMediaController` — `apps/api/src/inventory/public-media.controller.ts`

| # | Method | Path | Guards | Validation | Response | DB ctx | Audit/Outbox |
|---|---|---|---|---|---|---|---|
| 53 | GET | `/api/v1/public/media/*` (`:38-108`) | none (no `@Public`, but no guard either) | key from `req.path`, `decodeURIComponent`, strip leading `/`; 400 if contains `..`, `\`, `\0` (`:52-55`) | streams object only if `vehicleMedia` row matches `{objectKey, isPublic:true, kind != DOCUMENT, tenant.status ACTIVE, vehicle.stockStatus AVAILABLE}` (`:62-72`), else 404; 404 when storage unconfigured; `Cache-Control: public, max-age=86400, s-maxage=604800, immutable` (`:97`) | `runWithDbContext({isAdmin})` | none |

### 3.7 Leads — `apps/api/src/leads/*.controller.ts`

| # | Method | Path | Guards / roles | Request DTO | Response | DB ctx | Audit | Outbox |
|---|---|---|---|---|---|---|---|---|
| 54 | GET | `/api/v1/tenants/:tenantId/leads` (`leads.controller.ts:40-64`) | TA; OWNER, ADMIN, SALES_MANAGER, SALES_AGENT | raw `status?`, `page?`, `limit?` (no DTO; capped 50) | `{items: DealerLeadSummaryDto[], total}` — `buyerDisplayName` is real name only if grant active and includes `name`, else "Prospective Buyer" (`leads.service.ts:191-200`) | tenant | none | none |
| 55 | GET | `…/leads/:id` (`:66-83`) | same | — | `DealerLeadDetailDto` with `buyerContact {name,phone,email,grantStatus ACTIVE|REVOKED|NO_GRANT}` — each field null unless in `fieldsGranted` and not revoked (`leads.service.ts:460-486`) | tenant | none | none |
| 56 | PATCH | `…/leads/:id/status` (`:85-106`) | same | `UpdateLeadStatusDto.status` IsEnum(LeadStatus) | `DealerLeadDetailDto`; any→any | tenant | tx audit `LEAD_STATUS_UPDATED` | tx `lead.status_updated` |
| 57 | PATCH | `…/leads/:id/assignment` (`:108-128`) | OWNER, ADMIN, SALES_MANAGER | `AssignLeadDto.assignedMembershipId?` IsString (nullable) | `DealerLeadDetailDto`; 400 if membership not in tenant / inactive | tenant | tx audit `LEAD_ASSIGNED` | tx `lead.assigned` |
| 58 | POST | `/api/v1/public/listings/:listingId/leads` (`public-leads.controller.ts:31-44`) 201 | J (buyer) | `CreateLeadEnquiryDto {intent IsEnum, preferredContact IsEnum, message?, fieldsToShare IsArray ArrayNotEmpty IsString each (no allowlist), consentTextVersion IsNotEmpty}` | `LeadEnquiryCreatedResponseDto {id, status:NEW, listingId, tenantId, createdAt}`; 404; 400 if not PUBLISHED / stock not AVAILABLE / tenant not ACTIVE | admin read then `runWithDbContext({tenantId, userId})` tx | tx audit `LEAD_ENQUIRY_CREATED` | tx `lead.created` | in-memory 5 / min per buyer (`enquiry-rate-limiter.service.ts:5-6`) |
| 59 | GET | `/api/v1/tenants/:tenantId/appointments` (`appointments.controller.ts:35-48`) | TA; OWNER, ADMIN, SALES_MANAGER, SALES_AGENT | — | `AppointmentResponseDto[]` (≤500) | tenant | none | none |
| 60 | PATCH | `…/appointments/:id/status` (`:50-71`) | same | `UpdateAppointmentStatusDto.status` IsEnum(AppointmentStatus) | `AppointmentResponseDto`; any→any | tenant | tx audit `APPOINTMENT_STATUS_UPDATED` | tx `appointment.status_updated` |

### 3.8 Listings — `apps/api/src/listings/listings.controller.ts` (TA, prefix `api/v1/tenants/:tenantId`) and `public-listings.controller.ts` (Pub)

| # | Method | Path | Roles | Request DTO | Response | DB ctx | Audit | Outbox |
|---|---|---|---|---|---|---|---|---|
| 61 | POST | `…/vehicles/:id/listing` (`:36-60`) 201 | OWNER, ADMIN, INVENTORY_MANAGER, SALES_MANAGER | `CreateDraftListingDto {title?, description?, askingPriceFils? IsInt Min1}` | `ListingResponseDto` DRAFT; 409 if existing listing PUBLISHED/PENDING_REVIEW; otherwise existing listing (DRAFT/REJECTED/PAUSED/SOLD/ARCHIVED) is reset to DRAFT (`listings.service.ts:76-114`) | tenant | `LISTING_DRAFT_CREATED` logAction (create path only; update path unaudited) | none |
| 62 | POST | `…/listings/:id/unpublish` (`:62-78`) 200 | same | — | `ListingResponseDto` PAUSED; 400 unless PUBLISHED | tenant | tx audit `LISTING_UNPUBLISHED` (`:307-316`) | tx `listing.unpublished` |
| 63 | POST | `…/listings/:id/submit` (`:80-103`) 200 | same | — | `ListingResponseDto` PENDING_REVIEW; 400 if already PUBLISHED/PENDING_REVIEW or any publish gate fails (KYB APPROVED, tenant ACTIVE, stock AVAILABLE, price>0, ≥1 public EXTERIOR photo `:757-797`) | tenant | `LISTING_SUBMITTED_FOR_REVIEW` logAction after tx | tx `listing.submitted_for_review` |
| 64 | GET | `/api/v1/public/listings` (`public-listings.controller.ts:17-27`) | Pub | `PublicListingQueryDto {emirate?, make?, dealerSlug?, model?, condition? IsEnum, gccSpec? bool transform, minPriceFils?/maxPriceFils? IsInt Min0, q? IsString, sort? IsIn(recent,price-asc,price-desc), page? Min1, limit? 1..50}` | `PublicListingSearchResponseDto` — only PUBLISHED + stock AVAILABLE + tenant ACTIVE; media `isPublic:true` only; no cost, no VIN, no notes (`listings.service.ts:586-706, 839-873`) | `runWithDbContext({isAdmin})` | none | none |
| 65 | GET | `/api/v1/public/listings/:slug` (`:29-40`) | Pub | — | `PublicListingDetailDto` + `maskedVin` (first 9 chars + `********`); 404 unless PUBLISHED/AVAILABLE/ACTIVE | admin ctx | none | none |

### 3.9 Tenants — `apps/api/src/tenants/tenants.controller.ts` (TA) and `public-dealers.controller.ts` (Pub)

| # | Method | Path | Roles | Request | Response | DB ctx | Audit/Outbox |
|---|---|---|---|---|---|---|---|
| 66 | GET | `/api/v1/tenants/:tenantId/context` (`:18-26`) | any active member / admin bypass | — | `TenantContextResponseDto {tenantId, slug, legalName, displayName, status, callerRole, isPlatformAdminBypass, branches[]}` | tenant | none |
| 67 | GET | `/api/v1/tenants/:tenantId/privileged-management` (`:28-42`) | OWNER, ADMIN | — | `{status:'authorized', message, tenantId, role}` | tenant | none |
| 68 | GET | `/api/v1/public/dealers` (`public-dealers.controller.ts:17-26`) | Pub | `PublicDealerQueryDto {emirate?, page? Min1, limit? 1..50}` | `PublicDealerListResponseDto` — only ACTIVE + KYB APPROVED tenants; `liveGroundedStock` counts PUBLISHED+AVAILABLE | admin ctx | none |
| 69 | GET | `/api/v1/public/dealers/:slug` (`:28-39`) | Pub | — | `PublicDealerDetailDto` (verification `status/tradeLicenseRef/licenseExpiry/jurisdiction` exposed publicly; stats nulls where no source); 404 unless ACTIVE | admin ctx | none |

### 3.10 Health — `apps/api/src/health/health.controller.ts` (no prefix, no guard)

| # | Method | Path | Response |
|---|---|---|---|
| 70 | GET | `/health` (`:9-12`) | `{status:'ok'|'degraded', service:'api', timestamp, uptimeSeconds, environment, details{nodeVersion, memoryUsage}, database}` |
| 71 | GET | `/health/ready` (`:14-25`) | `{status:'ready', database:'connected'}` or 503 `{status:'unready', database:'disconnected', error}` |

**Total route handlers: 71** (admin 17 + admin-listings 2 + auth 11 + me 17 + vehicles 5 + public-media 1 + leads 7 + listings 5 + tenants 4 + health 2).

### 3.11 Redaction matrix (who sees what)

| Field | Public (`/public/*`) | Buyer (`/me/*`) | Dealer member (`/tenants/:id/*`) | Platform admin |
|---|---|---|---|---|
| `Vehicle.purchaseCostFils` | never (not selected) | never | only OWNER/ADMIN/FINANCE_MANAGER/INVENTORY_MANAGER (`vehicles.service.ts:497-503`); other roles get `null` | **never** via admin routes (not in `getAdminListingById`); would be visible via tenant bypass on `/tenants/:id/vehicles` because bypass sets `userRole=OWNER` (`tenant-access.guard.ts:52`) |
| `Vehicle.vin` | masked `9 + ********` (`listings.service.ts:880-882`) | masked `3•••••4` on cards (`me.service.ts:105`) | full | full (`listings.service.ts:555`) |
| `VehicleMedia` kind DOCUMENT / `isPublic:false` | excluded (`isPublic:true` filter; media proxy also rejects DOCUMENT `public-media.controller.ts:67`) | excluded (EXTERIOR/INTERIOR public only `me.service.ts:85`) | all kinds (`vehicles.service.ts:526-533`) | all kinds + signed preview URLs, audited when private (`listings.service.ts:502-536`) |
| Buyer `displayName/phoneE164/email` | never | own | only fields in active `LeadDataGrant.fieldsGranted` (`leads.service.ts:460-486`); summary name only if `name` granted | `GET /admin/users` returns email + phone for all users; `GET /admin/users/:id` additionally returns full `BuyerProfile` (trn, escrowIban, consents) and session IP/UA |
| `User.passwordHash`, `mfaSecret`, `emailVerificationTokenHash` | never | never | never | never (not mapped) |
| `DealerVerification.tradeLicenseRef/licenseExpiry/jurisdiction` | exposed on `/public/dealers/:slug` (`tenants.service.ts:141-151`) | — | — | exposed |
| Invitation raw token | — | — | — | returned once in `POST /admin/dealers/:id/invite` response (`admin.service.ts:817`); only the SHA-256 hash is stored |

---

## 4. State machines

### 4.1 Tenant status (`TenantStatus`: PENDING, ACTIVE, SUSPENDED, CLOSED; schema default PENDING `packages/database/prisma/schema.prisma:215`)

| From → To | Driven by | Validation | Side effects |
|---|---|---|---|
| (new) → ACTIVE | `POST /admin/dealers` (`admin.service.ts:672`) | none; also creates `DealerVerification APPROVED` directly (`:673-679`) | outbox `tenant.created` in tx; audit after tx |
| PENDING → ACTIVE | `PATCH /admin/tenants/:id/status` | 409 `TENANT_KYB_NOT_APPROVED` unless verification APPROVED (`:361-369`) | outbox `tenant.status_updated`; audit after tx |
| SUSPENDED → ACTIVE | same | allowed (`:329`) | **does not** republish PAUSED listings; dealer must re-draft (`listings.service.ts:76-114`) and re-submit |
| ACTIVE/PENDING/SUSPENDED → SUSPENDED or CLOSED | same | allowed | all PUBLISHED listings → PAUSED (`:246-254`) + one `listing.unpublished` outbox per listing (`:256-272`), in the same tx; `TenantAccessGuard` then blocks every member request with 403 `TENANT_INACTIVE` (`tenant-access.guard.ts:80-84`); login redirect `/access-suspended?reason=tenant_suspended` (`auth.service.ts:83-89`); public listings/dealers/media filter `status ACTIVE` (`listings.service.ts:591-593,745`; `tenants.service.ts:28,117`; `public-media.controller.ts:68`); projection eviction happens via `listing.unpublished` dispatch (`outbox.service.ts:142-148`) — the `tenant.suspended` handler at `:156-158` is never fed because the emitted type is `tenant.status_updated` (`admin.service.ts:281`) |
| any → PENDING | same | 409 `TENANT_STATUS_TRANSITION_INVALID` (`:356-360`) | — |
| CLOSED → any | same | 409 `TENANT_CLOSED_TERMINAL` (`:351-355`) | — |
| X → X | same | 409 `TENANT_STATUS_UNCHANGED` (`:337-341`) | — |
| PENDING_REVIEW listings of a suspended tenant | — | admin APPROVE re-runs publish gates → 400 "Dealership tenant is not active" (`listings.service.ts:765-770`) | — |

UI offers only ACTIVE↔SUSPENDED (`dealers/page.tsx:426-441`; `verifications/[id]/page.tsx:203-218`); CLOSED is reachable only by direct API call.

### 4.2 User status (`UserStatus`: ACTIVE, SUSPENDED, DISABLED, PENDING_VERIFICATION; default ACTIVE `schema.prisma:155`)

| Transition | Driven by | Validation | Side effects |
|---|---|---|---|
| (new) → PENDING_VERIFICATION | `POST /auth/signup` (`auth.service.ts:453`), `POST /auth/register` (`:860`) | — | 24 h verification token (`:444`) |
| PENDING_VERIFICATION → ACTIVE | `POST /auth/verify-email` (`:506`); `POST /auth/activate/complete` (`:640,652`) | token hash match, not expired | audit `USER_EMAIL_VERIFIED` / `USER_INVITATION_ACCEPTED` |
| (new) → ACTIVE | `POST /admin/dealers` principal user (`admin.service.ts:702`), dev-token auto-provision (`auth.service.ts:171`) | — | principal gets no password/invitation |
| any → any of the 4 | `PATCH /admin/users/:id` (`admin.service.ts:579-588`), `DELETE /admin/users/:id` → DISABLED (`:637-644`) | 400 `CANNOT_DISABLE_LAST_PLATFORM_ADMIN` only for target admin and only for DISABLED/SUSPENDED/demotion (`:536-555`); 400 `CANNOT_MODIFY_OWN_ACCOUNT` only for DISABLED/SUSPENDED/demotion (`:559-568`); **no check for → PENDING_VERIFICATION**; no transition graph | DISABLED/SUSPENDED → all sessions revoked in a separate statement (not same tx) (`:581-587`); audit after; no outbox |
| Effects of status | `validateOidcPayload` 403 `ACCOUNT_DISABLED`/`ACCOUNT_SUSPENDED` on every request (`auth.service.ts:201-211`); login 403 for DISABLED/SUSPENDED/PENDING_VERIFICATION-or-unverified-email (`:307-323`); `verifyAdminSession` requires ACTIVE (`:716`); `PlatformAdminGuard` does **not** check status (`platform-admin.guard.ts:11`) | | |
| Lockout (not a status) | 5 failed logins → `lockedUntil = now+15 min`, counter reset (`auth.service.ts:282-288`); cleared on success (`:326-334`) | | audit `AUTH_LOGIN_ACCOUNT_LOCKED` |

### 4.3 Dealer verification (`VerificationStatus`: NOT_SUBMITTED, IN_REVIEW, APPROVED, REJECTED, EXPIRED; default NOT_SUBMITTED `schema.prisma:238`)

| Transition | Driven by |
|---|---|
| (row absent) reported as NOT_SUBMITTED | `admin.service.ts:81-83,187-189,130-133`; `listings.service.ts:550-551` |
| (new) → APPROVED | `POST /admin/dealers` only (`admin.service.ts:673-679`) |
| any other transition | **no endpoint**. `docs/references/engineering/API_CONTRACTS.md:28-29` lists `/admin/verification/queue` and `/admin/verification/:tenantId/review`; neither exists. Admin UI buttons are disabled (`verifications/[id]/page.tsx:184-199`). |
| Effects | publish gate requires APPROVED (`listings.service.ts:758-763`); public dealer directory requires APPROVED (`tenants.service.ts:29`); PENDING→ACTIVE tenant requires APPROVED (`admin.service.ts:361-369`); `seller.verified` badge (`listings.service.ts:859-860`) |

### 4.4 Listing status (`ListingStatus`: DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, PAUSED, SOLD, ARCHIVED; default DRAFT `schema.prisma:393`)

| From → To | Driven by | Validation | Side effects (same tx unless noted) |
|---|---|---|---|
| (none) → DRAFT | `POST /tenants/:t/vehicles/:id/listing` (`listings.service.ts:141-152`) | vehicle in tenant | audit `LISTING_DRAFT_CREATED` (logAction, after) |
| DRAFT/REJECTED/PAUSED/SOLD/ARCHIVED → DRAFT | same, update branch (`:76-114`) | 409 if PUBLISHED or PENDING_REVIEW (`:77-84`) | no audit, no outbox |
| DRAFT/REJECTED/PAUSED/SOLD/ARCHIVED → PENDING_REVIEW | `POST …/listings/:id/submit` (`:222-252`) | 400 if PUBLISHED/PENDING_REVIEW (`:210-216`); 5 publish gates (`:757-797`) | outbox `listing.submitted_for_review`; audit after (logAction) |
| PENDING_REVIEW → PUBLISHED | `POST /admin/listings/:id/decision {APPROVE}` (`:358-414`) | 409 unless PENDING_REVIEW (`:352-356`); gates re-checked (`:360`) | sets `verifiedAt`, `publishedAt`; outbox `listing.published`; tx audit `LISTING_APPROVED`; projection sync after commit |
| PENDING_REVIEW → REJECTED | `{REJECT, reason}` (`:415-468`) | 400 "Rejection reason is required" if blank (`:417-419`) | outbox `listing.rejected`; tx audit `LISTING_REJECTED` |
| PUBLISHED → PAUSED | `POST …/listings/:id/unpublish` (`:272-320`) | 400 unless PUBLISHED | outbox `listing.unpublished`; tx audit `LISTING_UNPUBLISHED` |
| PUBLISHED → PAUSED | tenant → SUSPENDED/CLOSED (`admin.service.ts:243-274`) | — | outbox per listing |
| PUBLISHED → SOLD | vehicle `stockStatus` AVAILABLE→SOLD (`vehicles.service.ts:292-330`) | — | outbox `listing.unpublished` (newStatus SOLD) |
| PUBLISHED → PAUSED | vehicle AVAILABLE→RESERVED/TRANSFERRED/ARCHIVED/INTAKE (`:297-300`) | — | outbox `listing.unpublished` |
| any → ARCHIVED | **no code path** | | |
| PAUSED → PUBLISHED | **no direct path** (must re-draft → submit → approve) | | |
| Projection (in-memory) | `listing.published` → index; `listing.unpublished`/`listing.rejected` → evict (`outbox.service.ts:134-155`); public reads do **not** use the projection (`listings.service.ts:663`) | | |

### 4.5 Stock status (`StockStatus`: INTAKE, AVAILABLE, RESERVED, SOLD, TRANSFERRED, ARCHIVED; default INTAKE via DTO `vehicles.service.ts:109`)

| Transition | Driven by | Validation | Side effects |
|---|---|---|---|
| any → any | `PATCH /tenants/:t/vehicles/:id {stockStatus}` (`vehicles.service.ts:281`) | none (no graph) | only when leaving AVAILABLE with a PUBLISHED listing: listing → SOLD (if SOLD) else PAUSED + outbox in tx (`:250-253,291-330`); audit `VEHICLE_UPDATED` after tx (logAction) |
| Effects | publish gates require AVAILABLE (`listings.service.ts:772-777`); public search/detail/dealer counts/media proxy/lead creation require AVAILABLE (`listings.service.ts:589,744`; `tenants.service.ts:65,106`; `public-media.controller.ts:69`; `leads.service.ts:71`) | | |

### 4.6 Lead status (`LeadStatus`: NEW, CONTACTED, QUALIFIED, TEST_DRIVE_NEGOTIATION, WON, LOST, SPAM)

| Transition | Driven by | Validation | Side effects |
|---|---|---|---|
| (new) → NEW | `POST /public/listings/:id/leads` (`leads.service.ts:90`) | listing PUBLISHED, stock AVAILABLE, tenant ACTIVE (`:67-77`); 5/min per buyer | `LeadDataGrant` created with `fieldsGranted` as sent (no allowlist); outbox `lead.created`; tx audit `LEAD_ENQUIRY_CREATED` |
| any → any | `PATCH /tenants/:t/leads/:id/status` (`:272-356`) | IsEnum only; no graph (WON → NEW allowed) | outbox `lead.status_updated`; tx audit |
| grant ACTIVE → REVOKED | `POST /me/leads/:id/grant/revoke` (`me.service.ts:686-762`) | owner only; idempotent | dealer views redact to nulls (`leads.service.ts:471-477`); outbox `lead.grant_revoked`; tx audit |

### 4.7 Appointment status (`AppointmentStatus`: REQUESTED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)

| Transition | Driven by | Validation | Side effects |
|---|---|---|---|
| (new) → REQUESTED | `POST /me/leads/:id/appointments` (`me.service.ts:433`) | lead owned by buyer; end > start | outbox `appointment.requested`; tx audit |
| any → CANCELLED | `POST /me/appointments/:id/cancel` (`:549`) | owner only; **no state check** (COMPLETED can be cancelled) | outbox `appointment.cancelled`; tx audit |
| any → REQUESTED (+ new times) | `POST /me/appointments/:id/reschedule` (`:630`) | owner; end > start; no state check | outbox `appointment.rescheduled`; tx audit |
| any → any | `PATCH /tenants/:t/appointments/:id/status` (`appointments.service.ts:60-105`) | IsEnum only | outbox `appointment.status_updated`; tx audit |

### 4.8 Outbox status (`OutboxStatus`: PENDING, PROCESSING, SENT, FAILED; default PENDING)

| Transition | Driven by |
|---|---|
| (new) → PENDING | every `tx.outboxEvent.create` listed above |
| PENDING → PROCESSING (attempts+1) | `processPendingEvents` (`outbox.service.ts:73-79`), triggered only by `POST /admin/outbox/process` — `startWorker()` is never called anywhere (grep: no callers outside the service) |
| PROCESSING → SENT (`processedAt`) | `:89-95` |
| PROCESSING → PENDING (attempts < 3) / FAILED (attempts+1 ≥ 3) | `:104-111` |
| FAILED → PENDING (attempts = 0) | `POST /admin/outbox/retry-failed` (`:221-229`) |
| PROCESSING → (stuck) | no path: a crash between `:73` and `:89` leaves rows in PROCESSING forever; `processPendingEvents` selects PENDING only (`:57-63`) |
| Dispatch handlers | `listing.published`, `listing.unpublished`, `listing.rejected`, `tenant.suspended` (`:134-163`); all other event types are marked SENT without work |

---

## 5. Acceptance criteria

### 5.1 Admin console routes

**Gate (all routes)**
- A1. Request without `ao_session` from a browser (`Accept: text/html`) → 307 to `/auth?tab=login&redirect=/admin<path>` on the public origin; `Cache-Control: no-store`; cookie not cleared (`middleware.ts:245-265`).
- A2. Cryptographically invalid or expired `ao_session` → same redirect AND `Set-Cookie: ao_session=; Max-Age=0` (`:261-263`).
- A3. Valid buyer/dealer session (`isPlatformAdmin` false) → redirect without clearing the cookie (`:163`, `:259-263`).
- A4. Valid admin cookie but `/api/v1/auth/verify-admin-session` returns non-200 or `{valid:false}` (demoted, revoked, suspended) → redirect to login (`:182-191`).
- A5. Non-HTML request without session → 401 JSON `{ error: { code: 'Unauthorized', message } }` (`:267-274`).
- A6. Outside development with `JWT_SECRET` unset → 503 for every console path (`:147-153`); `ADMIN_DEV_BYPASS=true` has no effect unless `NODE_ENV=development` and host is localhost (`:142`).

**`/`**
- A7. Dealership card value equals `GET /admin/tenants/summary.total`; subtitle equals `byStatus.ACTIVE` / `byStatus.SUSPENDED`; "KYB in review" equals `byVerificationStatus.IN_REVIEW`.
- A8. Each metric independently shows "Unavailable" with the API message in `title` when its call fails; the others still render.
- A9. "Export report" and "Circuit breaker" are `disabled` and never issue a request.

**`/audit-logs`**
- A10. First load issues exactly one `GET /admin/audit-logs?limit=50&offset=0`; "Next" issues `offset=50`; "Prev" disabled at `offset=0`; "Next" disabled when `offset+50 >= total`.
- A11. Entering a target type + Enter re-queries with `targetType=<value>` and `offset=0`; a non-matching type shows "No audit events recorded yet." with `0 events`.
- A12. The search box never triggers a network request.

**`/dealers`**
- A13. Suspend/Activate buttons appear only for ACTIVE/SUSPENDED rows; PENDING shows "Awaiting KYB approval"; CLOSED shows "Closed (final)".
- A14. Confirm button in the reason modal is disabled until the reason has ≥5 non-blank characters; Escape does nothing while the request is in flight.
- A15. A 409 from the API (e.g. KYB not approved) is rendered inside the modal as "Not saved: …" and no toast is shown; the list is not refetched.
- A16. Successful PATCH shows toast "API confirmed X is now SUSPENDED." and refetches `GET /admin/tenants`.
- A17. Provisioning with a slug containing uppercase/space is lower-cased client-side; a server 400/409 is displayed inside the open dialog.
- A18. Invite success shows the `/auth/activate?token=` link and never shows success if the response lacks `activationToken`.

**`/disputes`, `/moderation`**
- A19. No network call other than header `GET /auth/me`; page contains the literal "not available yet" notice; no button performs a write.
- A20. `/moderation` "Open listing" is disabled for blank input and navigates to `/admin/moderation/listings/<encodeURIComponent(ref)>`.

**`/moderation/listings/[id]`**
- A21. For `status !== 'PENDING_REVIEW'`, Approve/Reject are `disabled` and the hint names the current status.
- A22. Reject requires ≥5-char reason; Approve requires none; request body is exactly `{decision}` or `{decision, reason}` (no extra keys — otherwise `forbidNonWhitelisted` → 400).
- A23. Success banner appears only when the response contains a string `status`; the listing is reloaded and buttons become disabled.
- A24. Price renders from `askingPriceFils` with two-decimal AED and thousands separators, no floating point (`lib/api.ts:442-456`).

**`/users`**
- A25. Account action buttons are hidden until `GET /auth/me` succeeds; on failure an alert explains they are hidden.
- A26. For the signed-in admin's own row, no Suspend/Disable/Revoke buttons render.
- A27. Suspend/Disable/Revoke each require confirmation; Revoke sends no body; status changes send `{status, reason}`.
- A28. Search is debounced (~300 ms) and resets to page 1; changing a filter resets to page 1; in-flight list requests are aborted on change.
- A29. A 400 `CANNOT_MODIFY_OWN_ACCOUNT` / `CANNOT_DISABLE_LAST_PLATFORM_ADMIN` from the API is shown inside the modal and no toast appears.

**`/verifications`, `/verifications/[id]`**
- A30. Registry rows come only from `GET /admin/tenants`; sort order IN_REVIEW first.
- A31. Dossier renders `tradeLicenseNumber`/`tradeLicenseExpiry` or "Not on file"; Approve/Reject KYB are `disabled` and issue no request.
- A32. Suspend from the dossier calls `PATCH /admin/tenants/<uuid>/status` with the dossier `id` (not the slug used in the URL).

### 5.2 API endpoint groups

**Auth & guards (all `/admin/**`, `/me/**`, `/tenants/**`)**
- B1. Missing/invalid/expired JWT → 401 with envelope `{ error: { code, message, correlationId } }`.
- B2. JWT signed with another algorithm (`none`, `RS256`) or wrong `iss`/`aud` → 401 (`jwt.strategy.ts:34-37`).
- B3. JWT whose `sessionId` is revoked, expired, missing, or belongs to another user → 401 `SESSION_REVOKED` / `SESSION_REQUIRED` (`auth.service.ts:140-142,189-199`).
- B4. User DISABLED/SUSPENDED → 403 `ACCOUNT_DISABLED`/`ACCOUNT_SUSPENDED` on every authenticated route, regardless of token claims.
- B5. Authenticated non-admin on any `/api/v1/admin/**` or `/auth/verify-admin-session` → 403 `PLATFORM_ADMIN_REQUIRED` (`platform-admin.guard.ts:11-15`); the token's `isPlatformAdmin` claim is ignored in favour of the DB value.
- B6. Admin demoted after login: next request → 403 (DB re-read `auth.service.ts:219`), and `verify-admin-session` → 403 so the console redirects.
- B7. `POST /auth/token` → 403 unless `ALLOW_DEV_TOKENS=true` and `NODE_ENV` ∉ {production, staging}.
- B8. Login: 10 attempts/min/IP → 429 `RATE_LIMIT_EXCEEDED` with `Retry-After`; wrong password 5× → 15-min lock, still 401 generic; correct password on PENDING_VERIFICATION → 403 `EMAIL_NOT_VERIFIED`.
- B9. Login response never contains `passwordHash`, `mfaSecret`, or verification token hashes; `verificationToken` appears only when `NODE_ENV` ∈ {development, test}.

**Admin tenants/dealers**
- B10. `PATCH /admin/tenants/:id/status` same status → 409 `TENANT_STATUS_UNCHANGED`; from CLOSED → 409 `TENANT_CLOSED_TERMINAL`; to PENDING → 409; PENDING→ACTIVE without APPROVED KYB → 409 `TENANT_KYB_NOT_APPROVED`.
- B11. ACTIVE→SUSPENDED with N PUBLISHED listings: afterwards all N are PAUSED, N `listing.unpublished` + 1 `tenant.status_updated` outbox rows exist with `tenantId`, and one `audit_events` row `PLATFORM_ADMIN_UPDATE_TENANT_STATUS` with `actorUserId=<admin>`, `targetId=<tenant>`, `metadata.previousStatus/newStatus/reason`.
- B12. Body with unknown field (`{status:'SUSPENDED', note:'x'}`) → 400 (`forbidNonWhitelisted`); `status:'ACTIVE '` or lowercase → 400 (IsEnum).
- B13. `POST /admin/dealers` duplicate slug → 409; slug `Al Futtaim` → 400 (regex); response `status` is `ACTIVE` and `GET /admin/tenants/:id` shows `verificationStatus: APPROVED`.
- B14. `POST /admin/dealers/:id/invite` → 201 with 64-hex `activationToken`, `expiresAt` ≈ now+48 h; DB stores only `tokenHash`; `GET /auth/activate/verify?token=<raw>` → `valid:true`; second `activate/complete` with same token → 400.
- B15. Unknown tenant UUID → 404; non-UUID id on PATCH/invite → 500 today (see G-05) — acceptance should require 404/400.

**Admin users**
- B16. `PATCH /admin/users/<self> {status:'SUSPENDED'}` → 400 `CANNOT_MODIFY_OWN_ACCOUNT`; `{isPlatformAdmin:false}` → same; `POST /admin/users/<self>/revoke-sessions` → 400 `CANNOT_REVOKE_OWN_SESSIONS`.
- B17. With exactly one ACTIVE platform admin, `PATCH` that admin with `status:'DISABLED'|'SUSPENDED'` or `isPlatformAdmin:false` → 400 `CANNOT_DISABLE_LAST_PLATFORM_ADMIN`; with two ACTIVE admins the same call → 200 and the target's sessions are revoked (`revokedAt` set).
- B18. `isPlatformAdmin:'false'` (string) is coerced to `false` and `'yes'` → 400 (`admin-user.dto.ts:56-57`).
- B19. Every successful PATCH/DELETE/revoke writes an `audit_events` row with `actorUserId=<admin>`, `targetType='user'`, `targetId=<user>` and `metadata.reason` (revoke: `metadata.revokedCount`).
- B20. `GET /admin/users?limit=1000` → 200 with `limit:100`; `limit=0` or `page=0` → 400; `status=FOO` → 400; `role=FOO` → should be 400 (today 500, see G-10).

**Admin listings**
- B21. `GET /admin/listings/<slug>` and `/<uuid>` both resolve; response has `askingPriceFils` as a decimal string, no `purchaseCostFils` key, and every media item carries `previewUrl` (string or null) and `isPublic`.
- B22. If ≥1 private media got a `previewUrl`, an audit row `ADMIN_PRIVATE_MEDIA_PREVIEW_ISSUED` with `metadata.mediaIds` exists and contains no URL.
- B23. `POST …/decision {decision:'REJECT'}` without reason → 400; with reason → 200 `status:'REJECTED'`, outbox `listing.rejected` and audit `LISTING_REJECTED` in the same transaction (both rows exist, or neither).
- B24. `{decision:'APPROVE'}` on a listing whose tenant is SUSPENDED or KYB not APPROVED or vehicle not AVAILABLE → 400 publish-gate message and status unchanged.
- B25. Second decision on the same listing → 409.
- B26. Decision on a listing of tenant B by a platform admin succeeds (cross-tenant by design, audited with `tenantId=B`); by a dealer of tenant A → 403 (not an admin).

**Audit log / outbox**
- B27. `GET /admin/audit-logs?limit=500` → `limit:100`; `offset=-5` → `offset:0`; `targetType=user` returns only rows with `targetType==='user'`.
- B28. `POST /admin/outbox/process` returns `processedCount` and metrics; a PENDING `listing.published` row becomes SENT with `processedAt`; re-running returns `processedCount:0` and changes nothing.
- B29. `POST /admin/outbox/retry-failed` sets every FAILED row to PENDING with `attempts:0` and writes audit `PLATFORM_ADMIN_RETRY_OUTBOX`.

**Tenant-scoped (dealer) routes**
- B30. Member of tenant A calling `/tenants/<B>/vehicles` → 403 `TENANT_FORBIDDEN`; inactive membership → 403 `MEMBERSHIP_INACTIVE`; tenant SUSPENDED → 403 `TENANT_INACTIVE`.
- B31. SALES_AGENT `GET /tenants/:t/vehicles/:id` → `purchaseCostFils: null`; `PATCH` with `purchaseCostFils` → 403.
- B32. `PATCH vehicle {stockStatus:'SOLD'}` with PUBLISHED listing → listing `SOLD`, outbox `listing.unpublished` in same tx; `GET /public/listings/<slug>` → 404; `GET /public/media/<key>` → 404.
- B33. Lead detail shows `buyerContact.phone` only if `fieldsGranted` includes `phone`; after `POST /me/leads/:id/grant/revoke` → all three null and `grantStatus:'REVOKED'`.

**Cross-cutting**
- B34. Every error body is `{ error: { code, message, correlationId[, details] } }`; `correlationId` echoes `x-correlation-id` when supplied.
- B35. All money fields in requests are integers (fils) and in responses are decimal strings; `askingPriceFils: 1.5` or `"1e3"` → 400.
- B36. No response body contains `passwordHash`, `mfaSecret`, `tokenHash`, `emailVerificationTokenHash`, S3 credentials, or `JWT_SECRET`.

---

## 6. Risk-based edge cases (prioritised)

**High**
- E1. Audit write path under RLS: `audit_events` has only a `FOR SELECT` policy (`packages/database/prisma/tenant_policies.sql:191-194`) while `FORCE ROW LEVEL SECURITY` is on (`:188-189`). On a non-BYPASSRLS role every `INSERT` is default-denied; `AuditService.logAction` catches and logs the error (`audit.service.ts:36-38`) so admin mutations would succeed with **no audit row** silently. Test: run as `automotive_app_user`, PATCH a tenant, count audit rows.
- E2. Concurrent double decision: two `POST /admin/listings/:id/decision` (APPROVE + REJECT) racing; the pre-check at `listings.service.ts:352` is outside the transaction and the update at `:363`/`:422` has no `status` predicate → last writer wins, two outbox rows, two audit rows. Same pattern for `PATCH /admin/tenants/:id/status` (`admin.service.ts:199-232`).
- E3. Last-admin bypass via `status:'PENDING_VERIFICATION'`: `updateUser` guards only DISABLED/SUSPENDED/demotion (`admin.service.ts:536-568`); setting the sole admin (or yourself) to PENDING_VERIFICATION is accepted, and login then fails with `EMAIL_NOT_VERIFIED` (`auth.service.ts:319`) → lockout.
- E4. Tampered JWT: `alg:none`, RS256-with-shared-secret, wrong `iss`/`aud`, future `iat` — expect 401 at `jwt.strategy.ts:27-38`; verify `ao_session` cookie path too (cookie extractor `:8-19`).
- E5. Revoked-session reuse and cross-user session: token with `sessionId` of user B presented for user A's `sub` → 401 (`auth.service.ts:194`); replay after `POST /admin/users/:id/revoke-sessions` → 401 on next request, including on `verify-admin-session` so the console drops out.

**Medium**
- E6. Admin demoted mid-session: API 403 immediately (`auth.service.ts:219`); console prefetches still pass the middleware on the stale cookie claim (`middleware.ts:166-168`) — only the shell, no data.
- E7. Tenant suspended while a dealer is signed in: next tenant-scoped call → 403 `TENANT_INACTIVE`; `/auth/me.resolvedDashboardUrl` becomes `/access-suspended?reason=tenant_suspended`; PENDING_REVIEW listings of that tenant cannot be approved (gate) but stay PENDING_REVIEW; DRAFT listings untouched.
- E8. Moderation decision on a listing whose tenant differs from any expectation: no tenant check exists for admins (by design); audit row records `tenantId` of the listing (`listings.service.ts:393,447`). Verify `tenantId` in the outbox row equals the listing's tenant, not null.
- E9. Non-UUID path params: `PATCH /admin/tenants/foo/status`, `PATCH /admin/users/foo`, `POST /admin/users/foo/revoke-sessions`, `POST /admin/dealers/foo/invite`, `POST /admin/listings/foo/decision` → Prisma `P2023` → 500 generic message (filter `http-exception.filter.ts:56-57`) instead of 400/404.
- E10. `GET /admin/users?role=<anything>`: value is cast to `MembershipRole` and sent to Prisma (`admin.service.ts:393-398`) → Prisma validation error → 500. `role=PLATFORM_ADMIN&tenantId=<uuid>` loses the role filter (`:402-408` overwrites `where.memberships`).
- E11. Pagination bounds: `/admin/users?limit=101` silently capped (no 400); `/admin/audit-logs?limit=150` controller accepts but service returns 100 (`admin.controller.ts:219` vs `admin.service.ts:829`); `offset=-1` → 0; `page=1e9` → empty page, `totalPages` unaffected.
- E12. Reason missing: `PATCH /admin/tenants/:id/status {status:'CLOSED'}` and `PATCH /admin/users/:id {status:'DISABLED'}` succeed with no reason (DTOs `IsOptional`); audit stores `reason: null` / default text. UI cannot produce this; direct API can.
- E13. Invalid enum: `{status:'closed'}` → 400 `details:[…]`; `{decision:'approve'}` → 400; `{status: 1}` → 400 (implicit conversion does not coerce to enum).
- E14. Oversized payloads: no `@MaxLength` anywhere; `reason`, `displayName`, `legalName`, `description` accept up to the Express body limit (~100 kB) and are copied into `audit_events.metadata` / `outbox_events.payload` JSON. Test a 90 kB reason.
- E15. Outbox retry idempotency: `processPendingEvents` is guarded by a process-local `isProcessing` flag (`outbox.service.ts:50-53`) → two concurrent `POST /admin/outbox/process` return `processedCount:0` for the loser (not an error). Rows left in PROCESSING by a crash are never re-selected (`:57-63`). `retry-failed` resets `attempts` to 0 so a permanently failing event cycles forever every 3 attempts.
- E16. RLS context missing in a lazy Prisma call: `runWithDbContext` awaits inside the ALS scope (`prisma.service.ts:13-18`) and the extension re-reads the store per operation (`:88-93`). Remaining risk: `OutboxService.retryFailedEvents` (`outbox.service.ts:221-229`) relies on the guard-set store rather than its own `runWithDbContext`; if invoked from a scheduler it would run without `is_admin` and update 0 rows silently.
- E17. Dealer principal identity collision: `POST /admin/dealers` with `adminEmail` of an existing user (buyer, another dealer's owner, or a platform admin) silently attaches an OWNER membership to that account (`admin.service.ts:691-716`). Then `POST /admin/dealers/:id/invite` for the same email with a lower role and activation → `membership.upsert` overwrites OWNER with the invited role (`auth.service.ts:662-679`).
- E18. `GET /admin/users/:id` exposes buyer `trn`, `escrowIban`, session `ipAddress`/`userAgent` to any platform admin, audited as `PLATFORM_ADMIN_GET_USER` (`admin.service.ts:465-535`). Verify the audit row precedes the read and that a 404 still writes the audit row.

**Low**
- E19. `/public/media/*` path traversal: `..`, `\`, `%00`, `%2e%2e` (decoded then checked `public-media.controller.ts:52-55`), double-encoding `%252e%252e` (decoded once → literal `%2e%2e`, not `..`; S3 key lookup then 404).
- E20. Media of SOLD vehicle / SUSPENDED tenant / DOCUMENT kind / `isPublic:false` → 404 (`:62-75`); but CDN `Cache-Control: public, max-age=86400, s-maxage=604800, immutable` (`:97`) means an already-cached object stays reachable at the edge for up to 7 days after unpublish.
- E21. Injection via `q`/`search`/`targetType`: all go through Prisma parameterised `contains`/equality (`listings.service.ts:600-604`; `admin.service.ts:385-389,833-835`); test `%`, `_`, `'`, `\`, `$ne`-style strings for 200 with sane results, not 500.
- E22. Basic Auth staging gate: valid `ADMIN_AUTH_USER/PASSWORD` grants the console shell without any `ao_session` (`middleware.ts:223-235`); every data call then 401s and `redirectToLogin` fires (`lib/api.ts:123-124`) — verify no infinite loop.
- E23. Cookie flags: `secure` only when `NODE_ENV` ∈ {production, staging} (`auth.controller.ts:62-71`); `sameSite:'lax'` is the only CSRF control for cookie-authenticated POST/PATCH on `/api/v1/admin/**` (no CSRF token). Cross-site form POST with `Content-Type: application/json` is blocked by CORS preflight; `text/plain` form posts are not JSON-parsed by Nest → 400.
- E24. `AuthRateLimitGuard` keyed by `req.ip` with `trust proxy = 1` (`main.ts:11`); spoofed `X-Forwarded-For` from a direct (non-proxied) client shifts the bucket.
- E25. `GET /auth/activate/verify` has no rate limit (`auth.controller.ts:111-119`) → token enumeration is bounded only by 256-bit entropy.
- E26. Users page drawer (`users/page.tsx:462-608`) has no focus trap/Escape; keyboard users can tab behind the overlay.

---

## 7. Known gaps found while reading

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| G-01 | High | Audit rows for admin mutations are written **after** the transaction via `logAction`, which swallows errors — violates the workspace rule "audit sensitive changes and record outbox events in same transaction". Affected: tenant status (`admin.service.ts:295-307`), create dealer (`:747-758`), invite (`:789-800`), update user (`:589-601`), revoke sessions (`:625-632`), vehicle create/update (`vehicles.service.ts:120-130,336-346`), listing draft/submit (`listings.service.ts:154-164,254-263`). Done correctly (tx audit) only in `adminDecision`, `unpublishListing`, leads, appointments, `me` grants. | `audit.service.ts:20-39` |
| G-02 | High | `audit_events` RLS has a SELECT-only policy under FORCE RLS → INSERT default-denied for the app role; combined with G-01 this is silent audit loss. Runtime NOT RUN. | `tenant_policies.sql:188-194` |
| G-03 | High | Last-admin and self-modification guards ignore `status:'PENDING_VERIFICATION'`; `isPlatformAdmin:true` promotion has no second gate and no outbox event. | `admin.service.ts:536-577` |
| G-04 | Medium | Race on moderation decision and tenant status: pre-read outside tx, update without status predicate. | `listings.service.ts:331-356,363,422`; `admin.service.ts:199-232` |
| G-05 | Medium | No UUID validation on any `:id` param (`grep ParseUUIDPipe|IsUUID` → none); non-UUID on `findUnique({id})` paths → 500. | `admin.controller.ts:82,142,181,191,201`; `admin-listings.controller.ts:52` |
| G-06 | Medium | User status change + session revocation are two separate statements, not one transaction; no outbox event for `user.status_updated`/`user.sessions_revoked`. | `admin.service.ts:570-596,620-623` |
| G-07 | Medium | `reason` optional server-side for suspend/close/disable while UI mandates ≥5 chars; API accepts destructive change with no justification. | `update-tenant-status.dto.ts:20-22`; `admin-user.dto.ts:60-63` |
| G-08 | Medium | `POST /admin/dealers` bypasses the KYB state machine (creates `APPROVED` with no documents, `reviewNotes` boilerplate) and attaches OWNER to any pre-existing user with that email; the principal receives no activation/invitation. | `admin.service.ts:672-716` |
| G-09 | Medium | `completeActivation` upsert overwrites an existing membership's role with the invitation role (possible silent demotion of an OWNER) and is not transactional (user update, membership upsert, invitation accept, audit are 4 statements). | `auth.service.ts:624-705` |
| G-10 | Medium | `AdminUserFilterDto.role` free string cast to `MembershipRole` → Prisma error → 500; `tenantId` filter overwrites `role` membership filter. | `admin-user.dto.ts:17-20`; `admin.service.ts:393-408` |
| G-11 | Medium | Error envelope `code` is not machine-stable: Nest exceptions yield `code:'Bad Request'|'Conflict'|'Forbidden'` and the real code is a prefix inside `message` (e.g. `CANNOT_MODIFY_OWN_ACCOUNT: …`). Validation errors put a string[] into `message`. Only 429 and middleware 401 emit proper codes. | `http-exception.filter.ts:45-50`; `admin.service.ts:560,575,616` |
| G-12 | Medium | `GET /admin/users/:id` returns full buyer financial/identity fields (`trn`, `escrowIban`) and session IP/UA; admin access should be policy-limited (AGENTS.md). Not used by UI. | `admin.service.ts:517,528-525` |
| G-13 | Medium | Outbox: `startWorker()` never invoked (grep); events are processed only when an admin manually POSTs `/admin/outbox/process` (no UI control exists); PROCESSING rows are never recovered. | `outbox.service.ts:57-63,170-182` |
| G-14 | Medium | `tenant.suspended` dispatcher branch is dead: the service emits `tenant.status_updated`. Public reads do not use the in-memory projection, so the projection is write-only. | `outbox.service.ts:156-158`; `admin.service.ts:281`; `listings.service.ts:663` |
| G-15 | Medium | `PlatformAdminGuard` does not require `status==='ACTIVE'` (a PENDING_VERIFICATION admin passes API guards), whereas `verify-admin-session` does. | `platform-admin.guard.ts:11`; `auth.service.ts:716` |
| G-16 | Medium | No KYB decision/queue endpoints exist although `API_CONTRACTS.md:28-29` specifies them and the UI renders disabled buttons; `VerificationStatus` IN_REVIEW/REJECTED/EXPIRED are unreachable through the API. | `admin.controller.ts` (absent); `verifications/[id]/page.tsx:184-199` |
| G-17 | Medium | Admin listing DTO is untyped (`Promise<any>`) and spreads raw `VehicleMedia` rows (`tenantId`, `vehicleId`, `objectKey`) into the response; approve `reason` is accepted but discarded. | `listings.service.ts:474,508-517,358-414` |
| G-18 | Low | Invite accepted for SUSPENDED/CLOSED tenants (no tenant status check); `AdminInviteDealerStaffDto.name` ignored; UI omits OWNER from invite roles while API allows it. | `admin.service.ts:767-770`; `dealers/page.tsx:53-61` |
| G-19 | Low | `GET /admin/tenants/:id` audits before the read (audit row even on 404) and loads `memberships.user` without returning them; returns raw `Branch` rows. | `admin.service.ts:134-167,185` |
| G-20 | Low | Audit-log `limit` ceiling inconsistent: controller 200 vs service 100. | `admin.controller.ts:219`; `admin.service.ts:829` |
| G-21 | Low | `revokeUserSessions` does not 404 for unknown users; writes an audit row for a non-existent target. | `admin.service.ts:613-635` |
| G-22 | Low | `createDraftListing` resets SOLD/ARCHIVED listings to DRAFT without audit; `ARCHIVED` listing status has no producer. | `listings.service.ts:76-114` |
| G-23 | Low | Audit page shows timestamps in UTC (`Timestamp (UTC)`), other admin pages use Asia/Dubai; workspace rule says display Asia/Dubai. Verifications list page is English-only (no `t()`). | `audit-logs/page.tsx:157,239`; `verifications/page.tsx` |
| G-24 | Low | No `@MaxLength` on any DTO string; free-text copied into JSON audit/outbox columns. | `apps/api/src/**/dto` (grep) |
| G-25 | Low | `GET /auth/activate/verify` lacks `AuthRateLimitGuard`. | `auth.controller.ts:111-119` |
| G-26 | Low | Users page "Reactivate" sets ACTIVE on PENDING_VERIFICATION users whose email is unverified; login still blocked by `emailVerifiedAt` check — confusing but safe. | `users/page.tsx:570-580`; `auth.service.ts:319` |
| G-27 | Low | `public/dealers/:slug` publishes `tradeLicenseRef`, `licenseExpiry`, `jurisdiction` to anonymous callers. | `tenants.service.ts:141-151` |
| G-28 | Low | `AuthModule` JWT default `expiresIn:'1d'` vs login override `'7d'` and cookie 7 d; dev tokens live 1 d. Cookie `secure` false outside production/staging (e.g. a `NODE_ENV=preview` deploy). | `auth.module.ts:15`; `auth.service.ts:362`; `auth.controller.ts:62-71` |

### Doc contradictions (code values are authoritative)

| Topic | Code | Docs |
|---|---|---|
| Last-admin protection status/code | **400** `BadRequestException` `CANNOT_DISABLE_LAST_PLATFORM_ADMIN` (`admin.service.ts:559-563`) | `docs/qa/CF07_TEST_MATRIX.md:36` says 400 `CANNOT_DEMOTE_LAST_ADMIN`; `docs/qa/cf07-e2e/ADMIN_USER_MANAGEMENT_RESULTS.md:37` shows `ConflictException` (409) with a different message; `docs/qa/CODEBASE_KNOWLEDGE.md:72` records the 400-vs-409 conflict |
| Activation/invitation token expiry | **48 h** (`admin.service.ts:775`); UI text "expires in 48 hours" (`dealers/page.tsx:643`) | `docs/architecture/CF07_EXISTING_SYSTEM_AUDIT.md:178` says 24 h; `docs/qa/cf07-e2e/SECURITY_FINDINGS.md:79` says 72 h |
| Email verification token expiry | 24 h (`auth.service.ts:444,548`) | consistent where mentioned |
| Password minimum | **10** chars + upper/lower/digit/special (`activate.dto.ts:45`; `customer-signup.dto.ts:13`; `password.util.ts:85-102`) | `docs/qa/cf07-e2e/SECURITY_FINDINGS.md:89` says 12; `CODEBASE_KNOWLEDGE.md:72` lists 8/10/12 |
| MFA on activation | `requiresMfa:false`, `mfaCode` ignored, `mfaEnabled:false` always (`auth.service.ts:593,643-644,655-656`) | `docs/qa/cf07-e2e/AUTH_TEST_RESULTS.md:43` claims "prompts for password + TOTP" |
| KYB endpoints | none | `docs/references/engineering/API_CONTRACTS.md:28-29` lists queue + review |
| Prior audit F5 (admin mocks, fake adjudication) | no mocks; disputes/moderation list are static notices; no `executeDisputeAdjudication` | `docs/qa/CODEBASE_KNOWLEDGE.md` F5 is stale |
| Prior audit D1 (`$transaction` loses atomicity) | `PrismaService` proxy joins the enclosing interactive transaction via `activeTxStorage` (`prisma.service.ts:26,83-87,107-127`) — code addresses it; runtime NOT RUN | `docs/qa/CODEBASE_KNOWLEDGE.md` D1 |

Checks executed: NOT RUN (static inventory only). No files modified other than this document.


## Addendum 2026-11-06 — data console
New admin routes `/admin/data`, `/admin/data/[model]`, `/admin/data/[model]/new`, `/admin/data/[model]/[id]` and API `api/v1/admin/data/*` (7 handlers). See `docs/qa/LOCAL_QA_2026-10-31.md` (AD-20) for the contract, guards, redaction rules and the browser test `tests/e2e/admin-data-console.spec.ts`.
