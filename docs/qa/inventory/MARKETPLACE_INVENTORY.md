# Marketplace (buyer app) — QA Inventory

Scope: `apps/marketplace` (Next.js 15 App Router, port 3000). Static read of source on branch `docs/staging-signed-in-qa`; nothing was executed. All paths are relative to the repo root unless stated. Line numbers reference the files as read on 2026-10-31.

Conventions used below
- **Auth**: `public` = no gate; `cookie-gated` = `apps/marketplace/middleware.ts:9-23` redirects to `/auth?tab=login&redirect=<path>` when the `ao_session` cookie is absent; `API-validated` = the server page calls the API with the cookie JWT and `lib/server-session.ts:23-34` redirects to sign-in on 401.
- **Data source**: real API endpoint(s) actually called. "Fixture" means Stitch fixture data that is only reachable when `NODE_ENV==='development' && NEXT_PUBLIC_ENABLE_FIXTURES==='true'` (`lib/api.ts:13-15`); every other environment surfaces the real API result or the error.
- Quoted labels are the exact English strings in JSX; Arabic equivalents exist for most of them and are noted only where they matter.

---

## 1. Route table

| Route | File | Auth | Data source | Server / client |
|---|---|---|---|---|
| `/` | `apps/marketplace/app/page.tsx` | public | `GET /api/v1/public/dealers?limit=4` (`:41`), `GET /api/v1/public/listings?emirate&page=1&limit=12` (`:58`), `GET /api/v1/me/favorites` (silent, `:77`), `POST/DELETE /api/v1/me/favorites` (`:94-97`) | client (`'use client'`) |
| `/access-denied` | `apps/marketplace/app/access-denied/page.tsx` | public | static; reads `?reason=disabled` | client |
| `/access-suspended` | `apps/marketplace/app/access-suspended/page.tsx` | public | static; reads `?reason=tenant_suspended`, env `NEXT_PUBLIC_SUPPORT_EMAIL` | client |
| `/account/enquiries` | `apps/marketplace/app/account/enquiries/page.tsx` → `components/buyer-enquiries-view.tsx` | cookie-gated + API-validated | `GET /api/v1/me/enquiries`, `GET /api/v1/me` (server, Bearer); `POST /api/v1/me/leads/:leadId/grant/revoke` (client) | server page + client view |
| `/account/garage` | `app/account/garage/page.tsx` → `components/buyer-garage-view.tsx` | cookie-gated + API-validated | `GET /api/v1/me/appointments`, `GET /api/v1/me`; `POST /api/v1/me/appointments/:id/cancel`, `POST .../reschedule` | server + client |
| `/account/profile` | `app/account/profile/page.tsx` → `components/buyer-profile-view.tsx` | cookie-gated + API-validated | `GET /api/v1/me`, `GET /api/v1/me/buyer-profile` (404 → empty), `GET /api/v1/me/enquiries`; `PATCH /api/v1/me/buyer-profile`; `POST /api/v1/me/leads/:leadId/grant/revoke` | server + client |
| `/account/profile/dossier` | `app/account/profile/dossier/page.tsx` | cookie-gated | none — `redirect('/account/profile')` (`:11`) | server |
| `/account/saved` | `app/account/saved/page.tsx` → `components/buyer-saved-view.tsx` | cookie-gated + API-validated | `GET /api/v1/me/saved-searches`, `GET /api/v1/me/favorites`, `GET /api/v1/me`; `DELETE /api/v1/me/saved-searches/:id`, `DELETE /api/v1/me/favorites/:listingId` | server + client |
| `/account/settings` | `app/account/settings/page.tsx` → `components/account-settings-view.tsx` | cookie-gated + API-validated | `GET /api/v1/me/settings`; `PATCH /api/v1/me/settings`; `POST /api/v1/auth/logout` | server + client |
| `/auth` (`?tab=login\|register`, `&redirect=`) | `app/auth/page.tsx` | public | `POST /api/v1/auth/login` (`:79`), `POST /api/v1/auth/signup` (`:154`) via same-origin `/api/*` rewrite | client (Suspense for `useSearchParams`) |
| `/auth/activate?token=` | `app/auth/activate/page.tsx` | public | `GET /api/v1/auth/activate/verify?token=`, `POST /api/v1/auth/activate/complete` | client |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | public | none — static "not available yet" notice (`:256-260`) | client |
| `/auth/login` | `app/auth/login/page.tsx` | public | none — `redirect('/auth?tab=login')` | server |
| `/auth/register` | `app/auth/register/page.tsx` | public | none — `redirect('/auth?tab=register')` | server |
| `/auth/verify-email?token=` | `app/auth/verify-email/page.tsx` | public | `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/resend-verification` | client |
| `/cars` | `app/cars/page.tsx` | public | `GET /api/v1/public/listings?q&emirate&make&condition&gccSpec&maxPriceFils&sort&page&limit=12` (`:104-113`); `GET /api/v1/me/favorites` (silent); `POST/DELETE /api/v1/me/favorites`; `POST /api/v1/me/saved-searches` (`:201`) | client |
| `/cars/[slug]` | `app/cars/[slug]/page.tsx` → `components/vehicle-detail-view.tsx` | public | server: `GET /api/v1/public/listings/:slug` (cached once per request, `:8`); client: `GET /api/v1/me/favorites` (silent), `POST/DELETE /api/v1/me/favorites`, modal: `GET /api/v1/me`, `POST /api/v1/public/listings/:listingId/leads` | server page + client view; 404 via `notFound()` (`:23,:47`) |
| `/cars/[slug]/enquire` | `app/cars/[slug]/enquire/page.tsx` | public (modal shows sign-in when 401) | re-export of `/cars/[slug]/enquiry` (`:1`) | server |
| `/cars/[slug]/enquiry` | `app/cars/[slug]/enquiry/page.tsx` → `enquiry-view.tsx` → `components/vip-enquiry-modal.tsx` | public (lead POST requires JWT) | server: `GET /api/v1/public/listings/:slug` (called twice: metadata + page, no `cache()`); client: `GET /api/v1/me`, `POST /api/v1/public/listings/:listingId/leads` | server + client |
| `/compare` (`?slugs=a,b`) | `app/compare/page.tsx` | public | `GET /api/v1/public/listings?limit=50` (`:43`), `GET /api/v1/public/listings/:slug` per selected slug (max 4) | client |
| `/dashboard` | `app/dashboard/page.tsx` | cookie-gated | `GET /api/v1/auth/me` (`credentials:'include'`, `:20`) then `router.replace` | client |
| `/dealers` | `app/dealers/page.tsx` | public | `GET /api/v1/public/dealers?emirate&page&limit=12` (`:34`) | client |
| `/dealers/[slug]` | `app/dealers/[slug]/page.tsx` → `components/dealer-storefront-view.tsx` | public | `GET /api/v1/public/dealers/:slug` + `GET /api/v1/public/listings?dealerSlug=:slug&limit=20` in parallel (`lib/api.ts:934-943`) | server page + client view; 404 via `notFound()`; own `not-found.tsx` |
| `/api/health` | `app/api/health/route.ts` | public | static JSON `{status:'ok',service:'marketplace'}` | route handler (takes precedence over the `/api/:path*` rewrite) |

Gateway rewrites (`apps/marketplace/next.config.mjs:12-27`): `/dealer/*` → `DEALER_SERVICE_URL` (default `http://localhost:3001`), `/admin/*` → `ADMIN_SERVICE_URL` (`:3002`), `/api/*` → `API_SERVICE_URL` (`:4000`). All client-side authenticated calls are same-origin through `/api/*` so the httpOnly `ao_session` cookie is sent (`lib/buyer-api-client.ts:54-60`). Public listing/dealer fetches from the browser go **directly** to `NEXT_PUBLIC_API_URL || http://localhost:4000` (`lib/api.ts:489,~530,~918,~935`), not through the rewrite — see gap G-05.

Error / loading boundaries: root `app/error.tsx` ("Something went wrong", "Try Again / إعادة المحاولة", "Return to Home"), root `app/not-found.tsx` ("Vehicle Dossier Not Found", "Browse Available Cars", "Home Showcase"), `app/cars/error.tsx` ("Vehicle Search Index Unavailable", "Retry Search", "Reset Filters"), `app/cars/[slug]/error.tsx` ("Unable to Load Vehicle Dossier", "Retry Dossier", "Browse Vehicles"), `app/account/error.tsx` ("Your account page could not be loaded", "Try Again / إعادة المحاولة", "Return to Home / الرئيسية"), `app/account/loading.tsx` (skeleton), `app/compare/loading.tsx` (skeleton), `app/dealers/[slug]/error.tsx`, `app/dealers/[slug]/not-found.tsx` ("Dealer not found", "Browse verified dealers / تصفح الوكلاء").

Root layout `app/layout.tsx:23` renders `<html lang="en" className="dark">` with **no** `dir` attribute; staging badge "STAGING · SYNTHETIC DATA · No live external approvals" when `NEXT_PUBLIC_APP_ENV==='staging'` (`:42-46`).

---

## 2. Per-route feature inventory

### 2.0 Shared chrome (used by `/`, `/cars`, `/cars/[slug]`, `/compare`, `/dealers`)

`packages/ui/src/components/header.tsx` — `MarketplaceHeader`

| Control | Label | Behaviour | States |
|---|---|---|---|
| Brand link | "Automotive.OS" / "UAE Collector Exchange" | `<a href="/">` | — |
| Emirate `<select>` | `aria-label="Filter by UAE Emirate"`; options "All Emirates", "Dubai", "Abu Dhabi", "Sharjah" | calls `onEmirateChange` (`:75`); hidden below `xl` breakpoint (`:53`) | no-op on `/cars/[slug]` (no handler passed, `vehicle-detail-view.tsx:146-152`) |
| Nav links | "Browse Stock" → `/cars`, "Verified Dealers" → `/dealers`, "Compare Vehicles" → `/compare` | plain `<a>`; active item gets gold underline | hidden below `lg` (`:96`); no mobile menu exists |
| Nav placeholder | "Sell & Consign" + "Soon" | `<span aria-disabled="true" title="Coming soon — not available in staging">` (`:113-121`) | always disabled |
| Language toggle | button `aria-label="Toggle Arabic / English language"`, shows "العربية \| EN" | calls `onLocaleToggle` → page-level `locale` state; sets `dir` on the page wrapper `<div>` only | state lost on navigation (each page owns its own `useState('en')`) |
| Favourites link | heart icon, `aria-label="View N saved vehicles"` → `/account/saved` | badge shows `favoritesCount` when >0 (`:160-164`) | `/compare` and `/dealers` always pass `favoritesCount={0}` (`compare/page.tsx:258`, `dealers/page.tsx:68`) |
| Profile link | `aria-label="User profile and garage"` → `/account/profile`; avatar text "VIP" when no `userDisplayName` (`:176`) | no page ever passes `userDisplayName` → always "VIP" | — |

`packages/ui/src/components/footer.tsx` — `MarketplaceFooter`: "AED / Asia-Dubai UTC+4", "GCC SPEC ONLY"; "Privacy Notice", "Terms of Service", "UAE Consumer Rights" are `<span aria-disabled="true">` with title "Legal document is not published for this staging demonstration" (`:47-49`) — not links.

`packages/ui/src/components/vehicle-card.tsx` — `VehicleCard` (used on `/` and `/cars`)

| Control | Label | Behaviour | States |
|---|---|---|---|
| Image link / title link / "View Dossier & VIN" | → `/cars/:slug` | plain `<a>` | image fallback `role="img" aria-label="Image unavailable for {title}"` + "Vehicle image not available" (`:76-80`) |
| Favourite button | `aria-label` "Save for this session" / "Remove session favorite"; `title="Favorites are saved for this browser session until buyer sign-in is connected"` (`:116-117`) | `onFavoriteToggle(id)` → page-level `toggleFavorite` → `POST/DELETE /api/v1/me/favorites`; signed-out → full redirect to `/auth?tab=login&redirect=<current>` (`app/page.tsx:101-104`, `app/cars/page.tsx:172-175`) | no pending state; label text is stale (favourites are real, see G-01) |
| Price | `"AED 1,420,000"` (en) / `"1,420,000 د.إ"` (ar) from `Math.round(fils/100).toLocaleString('en-US')` (`:47-51`) | — | — |
| Mileage ribbon | `"1,850 km"`; `null` mileage renders "Brand New" (`:53-60`) | — | see G-19 |
| Badges | "Verified Dealer" (when `seller.verified`), "GCC Spec", condition raw enum ("NEW"/"USED", `:156`) | — | — |

### 2.1 `/` — Marketplace home (`app/page.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Condition tabs | "All" / "New" / "Used" (`aria-pressed`) `:218-236` | sets `selectedCondition`; only applied on submit | — |
| 2 | Keyword input | `id=home-search-query`, sr-only label "Search vehicles", placeholder "Search make, model, or chassis keyword..." | state only | — |
| 3 | Emirate `<select>` | `id=home-search-emirate`, "All Emirates/Dubai/Abu Dhabi/Sharjah" | immediately refetches the inventory grid (`:54-72`) and is also used on submit | — |
| 4 | Submit | "Search Available Stock" | `window.location.href='/cars?q&emirate&condition'` (`:115-122`) | — |
| 5 | Hero card | "Latest listing • {emirate}", title, dealer, price `AED {Math.round(fils/100)}`, link "View details →" | first item of the grid result (`:111`) | loading: "Loading listings…"; empty: "Browse published stock from verified dealers." + "Browse live stock →"; image error → car icon (`:296-309`) |
| 6 | "Explore Makes:" pills | Porsche, Toyota, Mercedes-Benz, Land Rover, Ferrari, Bentley | `<a href="/cars?make=…">` (`:362-369`) | see G-07 (make list mismatch with `/cars`) |
| 7 | Dealers section | heading "Verified UAE Dealerships"; link "View All {dealersTotal} Verified Showrooms" → `/dealers`; cards with "KYB Verified" badge, dealer name link → `/dealers/:slug`, "{n} Active Cars" | `GET /api/v1/public/dealers?limit=4` | loading "Loading verified dealerships…"; empty "No verified dealerships yet."; error `role="alert"` "Verified dealerships could not be loaded." (`:408-417`) |
| 8 | Inventory grid | heading "Verified Dealership Inventory"; link "View All Available Stock ({total})" → `/cars`; 12 `VehicleCard`s | `GET /api/v1/public/listings?emirate&page=1&limit=12` | loading `VehicleGridSkeleton` (6); empty `role="status"` "No published vehicles are available in this location yet."; error `role="alert"` "Vehicle inventory unavailable" + message + "Retry loading" (`<a href="/">`) (`:488-497`) |
| 9 | Favourite error | `role="alert"` `{favoriteError}` (`:481-485`) | shown when favourite API fails for a non-401 reason | — |
| 10 | Trust pillars | "100% Verified Dealerships", "Verified GCC Specifications", "Purpose-Scoped Privacy Grants" | static copy; decorative "✓", "GCC", "VIP" glyphs not `aria-hidden` (`:529-559`) | — |

Silent swallows: `fetchFavorites().catch(() => {})` (`:81-83`) — intentional for signed-out visitors but also hides API outages (favourite hearts simply render unsaved).

### 2.2 `/access-denied` (`app/access-denied/page.tsx`)

Static. Heading "Account Permanently Disabled" when `?reason=disabled`, else "403 Forbidden Access"; code box "ACCOUNT_DISABLED" / "INSUFFICIENT_ROLE_PERMISSIONS", "Defense-in-Depth RLS & RBAC". Links: "Return to Login" → `/auth?tab=login`, "Marketplace Home" → `/`. English only; no language toggle.

### 2.3 `/access-suspended` (`app/access-suspended/page.tsx`)

Static. Heading "Dealership Account Suspended" (`?reason=tenant_suspended`) or "Access Privileges Suspended"; code "TENANT_INACTIVE" / "ACCOUNT_SUSPENDED". Links: "Return to Login"; "Contact Support" (`mailto:` with subject "Account Suspension Inquiry") only when `NEXT_PUBLIC_SUPPORT_EMAIL` is set (`:9,:49-54,:65-73`). English only.

### 2.4 Account shell (all `/account/*`) — `components/account-shell.tsx`

| Control | Label | Behaviour |
|---|---|---|
| Brand link | "AutomotiveOS" → `/` | — |
| Main nav (`lg+`) | "Browse Stock", "Verified Dealers", "Compare Vehicles" | `Link`s |
| Language group | `role="group" aria-label="Language"`, buttons "EN" / "العربية" with `aria-pressed` (`:89-103`) | sets `locale`; wrapper `<div dir lang>` (`:56-60`) — `<html lang>` unchanged; state not persisted across pages |
| Profile pill | `{displayName}` or "My account" → `/account/profile` | real name from `GET /api/v1/me` |
| Account nav | "Enquiries", "Appointments", "Saved", "Profile & privacy", "Settings" with `aria-current="page"` (`:122-140`) | — |
| `formatDubai()` | `toLocaleString('en-GB', {timeZone:'Asia/Dubai'})` (`:200-211`) | all account timestamps; views append literal " GST" |
| `StatusMessage` | `role="alert"` for errors, `role="status"` otherwise (`:193`) | — |

### 2.5 `/account/enquiries` (`components/buyer-enquiries-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Empty state | "No enquiries yet", "When you enquire about a vehicle, it will appear here with its status.", link "Browse vehicles" → `/cars` (`:64-84`) | — | shown when list empty |
| 2 | Enquiry list buttons | title, dealership, status label; `aria-current="true"` on selected (`:134-148`) | `setSelectedId`; first item preselected (`:60`) | — |
| 3 | Status labels | NEW→"Sent to dealer", CONTACTED→"Dealer contacted you", QUALIFIED→"Qualified by dealer", TEST_DRIVE_NEGOTIATION→"Test drive / negotiation", WON→"Completed", LOST/SPAM→"Closed"; unknown → raw status (`:16-40`) | — | — |
| 4 | Detail header | title, dealer, "Ref #{id.slice(0,8).toUpperCase()} · {intent label}" (`:159-164`); link "View listing" → `/cars/:slug` when slug present | — | — |
| 5 | "Status timeline" `<ol>` | "Enquiry sent" + `formatDubai(createdAt) GST`; then pipeline steps or "Closed" (`:109-124,:179-195`) | built from real `status`/`updatedAt` only | intermediate steps have no timestamps (only the current step shows `updatedAt`) |
| 6 | "Your message" | `selected.message` (`buyerMessage`) | — | hidden when empty |
| 7 | "Appointments" card | rows `formatDubai(startsAt) GST` + raw `a.status` (e.g. "REQUESTED", `:218-219`); link "Manage appointments" → `/account/garage` | — | "No appointments for this enquiry." |
| 8 | "Details shared with the dealer" | chips of `grant.fields` (raw keys "name"/"phone"/"email"); "Granted {date} GST" or "Revoked {date} GST" | — | "No contact details were shared." when `grant` null |
| 9 | "Revoke dealer access" button | disabled while `revoking`; spinner | `POST /api/v1/me/leads/:leadId/grant/revoke` (`lib/api.ts:1073`); on success local `revokedAt=now`, "Dealer access to your details was revoked."; on 401 → `/auth?tab=login&redirect=/account/enquiries`; other errors → `StatusMessage` error with API message (`:88-107`) | hidden once `revokedAt` set |

### 2.6 `/account/garage` (`components/buyer-garage-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Summary tile | "Active bookings" = count of `status !== 'CANCELLED'` (`:122,:131`) | — | counts COMPLETED/NO_SHOW as active (G-20) |
| 2 | Empty state | "No appointments yet", "Request a viewing or test drive from any vehicle page.", "Browse vehicles" | — | — |
| 3 | Appointment card | thumbnail (falls back to car icon on `onError`, `:163-173`), title, dealership, "VIN {vinMasked}", "#{id.slice(0,8)}", `formatDubai(startsAt) GST`, status label (REQUESTED/PENDING→"Awaiting dealer confirmation", CONFIRMED→"Confirmed", CANCELLED→"Cancelled", COMPLETED→"Completed", NO_SHOW→"Missed") | — | note text shown when present |
| 4 | "Reschedule" button | opens inline `datetime-local` `id=resched-{id}` labelled "New date & time (GST)", `min=dubaiNowLocal()` | — | hidden when status CANCELLED/COMPLETED/NO_SHOW (`:157`) |
| 5 | "Submit" (reschedule) | disabled when busy or empty | converts GST wall-clock → UTC ISO (`:26-30`); keeps original duration or 60 min (`:93-95`); `POST /api/v1/me/appointments/:id/reschedule {startsAt,endsAt}`; success "Reschedule request sent to the dealer."; validation "Choose a valid future date and time."; 401 → login redirect; else API message (`:87-120`) | — |
| 6 | "Back" | closes inline editor | — | — |
| 7 | "Cancel" button | native `window.confirm("Cancel this appointment?")` (`:72`) then `POST /api/v1/me/appointments/:id/cancel {}`; success "Appointment cancelled." and local status CANCELLED | — | disabled while busy |
| 8 | "Virtual garage" card | "Owned-vehicle management is not available yet." (`:269-274`) | static honesty notice | — |

### 2.7 `/account/profile` (`components/buyer-profile-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | "Preferred language" `<select id=pref-lang>` | "English" / "العربية" | saved as `preferredLanguage`; does **not** change the UI locale (G-10) | — |
| 2 | "Preferred emirate" `<select id=pref-emirate>` | "Not set" + 7 emirates (`:14,:130-138`) | `preferredEmirate` (null when cleared) | — |
| 3 | "Minimum budget (AED)" / "Maximum budget (AED)" `inputMode=numeric` | digits only (`:149,:161`) | ×100 → `budgetMinFils/budgetMaxFils`; empty → `null` (`:73-74`) | validation: "Enter budgets as whole AED amounts.", "Minimum budget is above maximum." (`:56-66`) |
| 4 | "Preferred makes (comma separated)" | free text | split/trim → `preferredMakes[]` | — |
| 5 | "Save preferences" | disabled while saving; spinner | `PATCH /api/v1/me/buyer-profile`; success "Preferences saved."; 401 → login; else API message | — |
| 6 | "Identity verification" card | "UAE PASS connection is not available yet."; disabled button "Connect UAE PASS — Not available yet" (`aria-disabled`, `:194-201`) | none | always disabled |
| 7 | "Shared contact details" list | per grant: dealership, listing title, fields joined, "Granted {date}" / "Revoked {date}"; button "Revoke" | `POST /api/v1/me/leads/:leadId/grant/revoke`; success "Dealer access revoked." | "You have not shared details with any dealer." when empty |

### 2.8 `/account/profile/dossier` — server redirect to `/account/profile` (`:11`). No UI.

### 2.9 `/account/saved` (`components/buyer-saved-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | "Favorite vehicles (N)" cards | thumbnail/car icon, title, `formatAed(askingPriceFils)` → "AED 1,420,000" or "—" (`:17-21`), "No longer listed" when `status !== 'PUBLISHED'` (`:110,:125-127`), "Saved {date}" | — | — |
| 2 | "View listing" | → `/cars/:slug` | only when listed | — |
| 3 | "Remove" (`aria-label="Remove {title}"`) | `DELETE /api/v1/me/favorites/:listingId`; success "Removed from favorites."; 401 → login; else API message (`:70-86`) | disabled while busy | — |
| 4 | Favourites empty | "You have not saved any vehicles yet." + "Browse vehicles" | — | — |
| 5 | "Saved searches (N)" cards | name, "Alerts on"/"Alerts off" (always off from this UI), chips from `filterJson` (raw keys, e.g. `make: Porsche`, `maxPrice: AED 500,000`, `gccSpec: true`, `:24-31`), "Created {date}", notice "Changing alert settings is not available yet." | — | — |
| 6 | "Run search" | `Link` to `/cars?make&model&emirate&q&condition&sort&gcc=true&maxPrice=` (`:34-46`) | `model`/`dealerSlug`/`minPriceFils` not understood by `/cars` (G-13) | — |
| 7 | "Delete" | `DELETE /api/v1/me/saved-searches/:id`; success "Saved search deleted." | disabled while busy | — |
| 8 | Searches empty | 'No saved searches yet. Set your filters on the vehicle search page, then choose "Save this search".' + "Search vehicles" | — | — |

### 2.10 `/account/settings` (`components/account-settings-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | "Last updated: {formatDubai(updatedAt)}" | — | — | — |
| 2 | "Display name" `id=displayName` (required) | sent as DTO field `handle` only when changed (`:63`; `lib/api.ts:1327-1341`) | validation "Display name is required." (`:56-58`) | — |
| 3 | "Company (optional)" `id=affiliation` | sent as `affiliation` when changed (empty string allowed) | — | — |
| 4 | "Email" | read-only `<p>` `{settings.email \|\| '—'}` | — | — |
| 5 | "Preferred currency" `<select id=currency>` | "AED" / "USD" / "EUR" → `settlementCurrency` (`:145-154`) | not used anywhere for display (G-21) | — |
| 6 | Checkbox "I agree to receive messages on WhatsApp" | `whatsappComms` | wrapped in `<label>` (`:162-172`) | default = API value |
| 7 | Checkbox "Show my garage on my profile" | `garageVisibility` | wrapped in `<label>` | default = API value |
| 8 | "Save changes" | `PATCH /api/v1/me/settings`; success "Settings saved."; 401 → login; else API message | disabled while saving | — |
| 9 | "Sign out" | `POST /api/v1/auth/logout` (clears cookie server-side) then `router.push('/auth?tab=login')`; error → `StatusMessage` "Sign-out failed." / API message (`:83-94`) | disabled while signing out | — |
| 10 | Notice | "Data export and account deactivation are not available yet. Contact support for these requests." | static | — |

### 2.11 `/auth` (`app/auth/page.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Header | brand link → `/`; language button "العربية"/"English" (no `aria-label`; `:220-226`); link "Browse Cars" → `/` | — | — |
| 2 | Tab pill | "Sign In" / "Customer Signup" (plain buttons, no `role=tab`) | `setActiveTab` + `router.replace('/auth?tab=…')` (`:242-271`); `?tab=` read on load and on change (`:25,:61-66`) | — |
| **Login tab** | | | | |
| 3 | Badge | "Single Sign-On (SSO) Portal"; h1 "Welcome to Automotive OS" | — | — |
| 4 | "Email Address" `id=login-email` (`type=email`, required) | lower-cased/trimmed on submit (`:87`) | — | — |
| 5 | "Master Passcode" `id=login-password` + show/hide button (`aria-label` "Show password"/"Hide password", `aria-pressed`, `:354-362`) | — | — | — |
| 6 | "Forgot passcode?" | → `/auth/forgot-password` | — | — |
| 7 | Submit "Sign In to Dashboard" / "Authenticating..." | `POST /api/v1/auth/login {email,password}`; API sets httpOnly `ao_session`; removes legacy `localStorage` keys `ao_token`,`ao_user` (`:109-114`); redirect to safe `?redirect=` (must start with `/`, not `//` or `/\`) else `data.user.redirectUrl` else `/dashboard` (`:118-124`) | disabled while loading; client validation "Please provide both email and master password"; error `role="alert"` with API message; `EMAIL_NOT_VERIFIED` → message "Your email address is not verified yet. …" + link "Verify email or resend link" → `/auth/verify-email` (`:96-103,:302-309`) | ACCOUNT_DISABLED / ACCOUNT_SUSPENDED / lockout / 429 messages are shown raw from the API |
| 8 | Info list | "Automatic Role-Based Redirection:" Platform Admin `/admin`, Dealership Staff `/dealer`, Verified Buyer `/account/garage` | static | matches `auth.service.ts:70-116` |
| **Register tab** | | | | |
| 9 | Badge "Retail Buyer & VIP Collector"; h1 "Create Customer Account"; copy "Customer self-registration only. …" | — | — | — |
| 10 | "Full Name / Primary Contact *" `id=register-name` | → `displayName` | required | — |
| 11 | "Email Address *" `id=register-email` | → `email` (lower-cased) | required | — |
| 12 | "UAE Mobile (Optional)" `id=register-phone` (`type=tel`) | → `phone` raw string or `undefined` (`:164`) | no format validation (API `IsString` only) | — |
| 13 | "Primary Emirate" `<select id=register-emirate>` | 7 emirates, default "Dubai" | → `emirate` | — |
| 14 | "Create Master Password *" `id=register-password` + show/hide | checklist "10+ Characters", "Uppercase Letter", "Lowercase Letter", "Number & Special Symbol" (`:53-59,:534-551`) | mirrors API `validatePasswordStrength` (`apps/api/src/auth/password.util.ts:85-102`) | — |
| 15 | PDPL checkbox | "I consent to personal data intake under UAE Federal Decree-Law No. 45/2021 (PDPL) for verified vehicle enquiries and garage management." — default **unchecked** (`:46`), `required`, wrapped in `<label>` (`:556-583`) | → `consentPdpl: true` only when ticked | — |
| 16 | Submit "Complete Registration" / "Creating Account..." | disabled until `isPasswordValid && consentPdpl` (`:588`); `POST /api/v1/auth/signup`; success banner: with `NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED==='true'` "Account created. Please open the verification link sent to your email before logging in." else "Account created, but verification emails are not being sent yet. Your account cannot be activated until email delivery is connected or support activates it." (`:176-184`); after 4 s switches to login tab with email prefilled (`:186-189`) | validation: "Please complete all required fields", "Password does not meet all security complexity requirements", "Explicit consent under UAE PDPL Law No. 45/2021 is mandatory"; API error e.g. duplicate email shown in `role="alert"` | — |
| 17 | "Already have an account? Sign In here" | `setActiveTab('login')` (no URL update, unlike the pill) | — | — |

### 2.12 `/auth/activate?token=` (`app/auth/activate/page.tsx`) — staff/admin invitation flow hosted in the marketplace app

States: loading "Verifying secure activation token..."; missing token "Missing activation token. Please verify your invitation link."; invalid → "Activation Link Invalid" + API message + "Back to Login"; form "Set Up Your Account", badge "Platform Administrator Setup"/"Staff Account Activation", "Target Identity: {email}", inputs "Create Password" (`id=activate-password`, `minLength=10`, placeholder "Min. 10 characters with symbols & numbers") and "Confirm Password"; submit "Activate Account & Enforce Security" / "Activating Account..."; client checks "Password must be at least 10 characters long.", "Passwords do not match." (`:75-83`); success "Account Successfully Activated" + auto-redirect to `/auth?tab=login` after 3 s + "Proceed to Login Now". Complexity (upper/lower/digit/special) is enforced only by the API; its message is surfaced via `apiErrorMessage`.

### 2.13 `/auth/forgot-password` (`app/auth/forgot-password/page.tsx`)

Honest stub: `role="status"` "Self-service password reset is not available yet. Please contact support to regain access to your account."; line "No reset email has been sent"; link "Back to sign in" → `/auth?tab=login`; language toggle (`aria-label` "Switch to English"/"التبديل إلى العربية") flips `dir` on wrapper. No form, no API.

### 2.14 `/auth/verify-email?token=` (`app/auth/verify-email/page.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Auto verify on load | h1 "Verifying Your Email" → "Email Verified!" / "Verification Unsuccessful" / "Email Verification" (no token) | `POST /api/v1/auth/verify-email {token}` (`:363-367`) | success shows API `message` or default and link "Proceed to Login"; error shows API message or "Invalid or expired verification token."; non-JSON response → "Network error communicating with the verification service." (`res.json()` unguarded, `:369`) |
| 2 | Resend form (error/idle) | h2 "Request a New Verification Link"; input `aria-label="Registered email address"` placeholder "Enter your registered email"; button "Send Verification Link" / "Sending..." | `POST /api/v1/auth/resend-verification {email}`; 429 → "Too many requests. Please wait a few minutes and try again."; success text depends on `EMAIL_DELIVERY_AVAILABLE`: "If an unverified account exists for this email, a verification link has been sent." vs "Request recorded, but verification emails are not being sent yet. Please contact support to activate your account." (`:394-428`) | `role="alert"`/`role="status"` on the message |
| 3 | "Return to Login" | → `/auth?tab=login` | — | — |

### 2.15 `/cars` — search results (`app/cars/page.tsx`)

URL is the source of truth: `q, emirate, condition, make, gcc=true, maxPrice (AED), sort, page` restored on load and `popstate` (`:57-76`); state changes `replaceState` (`:83-97`); pagination `pushState` (`:226-235`). Query debounced 300 ms (`:78-81`).

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Heading | "Search Results: {total} Verified Vehicles" (`…` while loading); "Published listings from KYB-verified dealers" | — | — |
| 2 | "Filters & Refine" button (`<lg`, `aria-expanded`) | opens mobile drawer | — | — |
| 3 | "Save this search" / "Saving…" | builds `filterJson` + name from active filters (name "All vehicles" when none) → `POST /api/v1/me/saved-searches {name,filterJson,alertsEnabled:false}` (`:185-213`; `lib/api.ts:1137-1146`) | success `role="status"` "Search saved to your account." + link "View saved searches" → `/account/saved`; 401 → redirect to login with `redirect=` back; error `role="alert"` API message | disabled while saving |
| 4 | "Sort:" `<select id=cars-sort>` (`aria-label="Sort results"`) | "Recently Listed" (`recent`), "Price: High to Low (Institutional)" (`price-desc`), "Price: Low to High" (`price-asc`) | resets page to 1 | — |
| **Desktop sidebar (`lg+`) "Filter Criteria"** | | | | |
| 5 | "Reset All" | clears every filter, page 1 (`:215-224`) | — | — |
| 6 | "Keywords" `id=cars-keywords` placeholder "e.g. GT3, GR-Sport..." | → `q` | — | — |
| 7 | "Make" group (`role=group`) buttons `aria-pressed` | "All", "Porsche", "Toyota", "Mercedes-AMG", "Land Rover", "Ferrari" (`:241`) | → `make` | a make arriving via URL that is not in the list shows no pressed button (G-07) |
| 8 | "UAE Emirate" `<select id=cars-emirate>` | "All Emirates", "Dubai", "Abu Dhabi", "Sharjah" | → `emirate` | only 3 of 7 emirates (G-08) |
| 9 | "Condition" group | "All" / "New" / "Used" | → `condition` NEW/USED | — |
| 10 | Checkbox "GCC Spec Only" `id=cars-gcc-only` (`htmlFor` label, hint "Verified UAE specification") | → `gccSpec=true` | default unchecked | — |
| 11 | "Max Price (AED)" range `id=cars-max-price` min 100,000 max 3,000,000 step 50,000, `aria-valuetext` "AED 1,250,000" / "Any price" (`:467-477`) | → `maxPriceFils = aed*100`; at max = no cap (`:23-28`) | no minimum-price control exists | — |
| **Results column** | | | | |
| 12 | Active filter chips | `<button aria-label="Remove filter: {value}">` wrapping Badge, "×" `aria-hidden` (`:486-525`) | removes that filter | — |
| 13 | Grid | 12 `VehicleCard`s per page | — | loading skeleton; error `role="alert"` "Couldn't load vehicle results" + message + "Retry loading" (`window.location.reload()`, `:552-557`); empty `EmptyState` "No matching vehicles found" / "Try broadening your budget range or clearing make filters to view certified inventory." + "Reset All Filters" button |
| 14 | Pagination `<nav aria-label="Pagination">` | "Showing {a}–{b} of {total}", "Previous", "Page {p} / {n}", "Next" (`:594-603`) | `goToPage` clamps to `[1,totalPages]`; initial `?page=` from URL is **not** clamped (G-09) | buttons disabled at bounds; hidden when `total===0` or error |
| 15 | Favourite error | `role="alert"` `{favoriteError}` | — | — |
| **Mobile drawer (`role="dialog" aria-modal aria-label="Filters & Sort"`)** | | | | |
| 16 | Close "✕" (`aria-label="Close filters"`); Escape key closes; body scroll locked (`:129-141`) | — | no focus trap / initial focus | — |
| 17 | "Make" `<select id=cars-mobile-make>` (raw values incl. "ALL"), "Emirate" `<select id=cars-mobile-emirate>`, "Max Price" range `id=cars-mobile-max-price` | same state as desktop | drawer lacks Keywords, Condition, GCC and Sort controls (`:627-684`) | — |
| 18 | "Reset" / "Apply" | reset all / close drawer (filters already applied live) | — | — |

### 2.16 `/cars/[slug]` — vehicle dossier (`components/vehicle-detail-view.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Breadcrumb `<nav aria-label="Breadcrumb">` | "Marketplace" → `/cars`; `{emirate}` → `/cars?emirate=`; `{makeName}` → `/cars?make=`; `{modelName}`; `{stockNumber}` when present (`:158-180`) | — | `stockNumber` is never returned by the public API (`lib/api.ts:548` defaults `''`) |
| 2 | "Save" / "Saved" (`aria-pressed`, material icon `aria-hidden`) | `GET /api/v1/me/favorites` on mount (silent on error); toggle → `POST/DELETE /api/v1/me/favorites`; 401 → `router.push('/auth?tab=login&redirect=<pathname>')`; notices `role="status"` "Saved to favorites." / "Removed from favorites.", `role="alert"` error (`:118-142`) | disabled while saving | — |
| 3 | "Share" | `navigator.clipboard.writeText(location.href)` → "Link copied to clipboard." / "Could not copy the link." | — | — |
| 4 | Title block | badges `{trim}`, "GCC Spec"; h1 "{year} {make} {model} ({chassisCode})"; location "{city}, {emirate}"; "{mileage} KM" | — | — |
| 5 | Price card | "Asking price" "AED {formattedPrice}" where `formattedPrice = (fils/100).toLocaleString('en-US')` (`:75-76`) | — | — |
| 6 | Gallery | main `<img alt={altText\|\|title}>`; counter "{i} / {n}"; "Previous image" / "Next image" buttons (wrap-around); thumbnails `aria-label="View photo {i}"` (first 6 only, `:319`) | — | "No photos provided" when empty |
| 7 | "Request viewing / test drive" (primary) and mobile dock "Enquire" | opens `VipEnquiryModal` (dynamic import, `:11-13`) | — | — |
| 8 | "WhatsApp dealer" / dock WhatsApp (`aria-label="Contact dealer via WhatsApp"`) | `https://wa.me/{digits}?text=…` | rendered only when `seller.whatsappNumber` has ≥8 digits (`:25-29,:355`) — the public API never sends this field (G-15) | — |
| 9 | "Indicative finance estimate" | "Down payment (20%) AED …", "Assumed flat rate 2.49% p.a.", "Monthly AED … / 60 mo", disclaimer "Illustrative assumption only, not a bank offer. Actual terms are set by the lender." (`:20-23,:77-81,:368-392`) | pure client arithmetic | — |
| 10 | "Dealer" card | "Verified dealer" badge when `seller.verified`; 3-letter avatar; name; city/emirate; link "View showroom" → `/dealers/:slug` | — | — |
| 11 | "Description" ("Description provided by the dealer."), "VIN (partially hidden)" + "The dealer can share the full VIN after you send an enquiry.", "Specifications" `<dl>`, "Condition" ("As declared by the dealer.") with `inspectionScore`/paint readings, "Factory options", "Service history" | all sections render only when data exists | with the real API only description/VIN/4 spec items (transmission, fuel, exterior colour) can appear; powertrain/torque/etc. exist only in the Stitch fixture (`lib/api.ts:81-110`) | — |
| 12 | "Location" card | "{emirate}, UAE", address or city/emirate, "Open in Maps" (Google Maps link, only with `seller.latitude/longitude`), "Phone" `tel:` (only with `seller.directPhone`) | public API never sends coords/phone/address for a listing seller (G-15) | — |
| 13 | Sticky mobile dock (`<lg`) | "Price AED {…}", WhatsApp icon, "Enquire" | — | — |

### 2.17 `/cars/[slug]/enquiry` and `/enquire` (`enquiry-view.tsx` + `components/vip-enquiry-modal.tsx`)

Page wrapper: back link "Back to {vehicle.title}" with a Material icon span **without** `aria-hidden` (`enquiry-view.tsx:184`, G-02); closing the modal navigates to `/cars/:slug` via `window.location.href` (`:156-161`).

`VipEnquiryModal` (`role="dialog" aria-modal aria-labelledby="modal-vip-title"`, Escape closes `:76-83`; no focus trap)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Header | thumbnail, title, "{dealer} • {emirate} • AED {price}"; close button `aria-label="Close dialog"` | — | — |
| 2 | Enquiry type `role="radiogroup" aria-label="Enquiry type"` buttons `role="radio" aria-checked` | "Viewing / test drive" (`TEST_DRIVE`, default) / "Make an offer" (`OFFER`) | → `intent` | no arrow-key handling |
| 3 | Signed-out banner `role="status"` | "You need to sign in to send an enquiry." + "Sign in" → `/auth?tab=login&redirect=<pathname>` | shown when `GET /api/v1/me` returns 401 (`:58-74`) | other `fetchBuyerMe` failures are swallowed → identity shows "—" and submit stays enabled (G-16) |
| 4 | "Your details" | `{me.displayName \|\| '—'}`, `{me.email \|\| '—'}`, "Details come from your account. You can change them in account settings." | read-only | — |
| 5 | Disabled button | "Sign in with UAE PASS — Coming soon" (`disabled aria-disabled`, `:255-262`) | none | always disabled |
| 6 | "Preferred time (optional)": "Date" `id=enq-date` (`type=date`, `min=dubaiTomorrow()`, default tomorrow Dubai, `:27-30,:275-282`), "Time (GST)" `id=enq-time` | folded into `message` as "Preferred date YYYY-MM-DD, time HH:MM GST." (`:117-120`) — no appointment is created | note "This is a request only; the dealer confirms the actual appointment." | — |
| 7 | "Preferred contact channel" `role="radiogroup" aria-labelledby="enq-channel"` | "Phone" (default) / "WhatsApp" / "Email" | → `preferredContact` | — |
| 8 | "Message to the dealer (optional)" `id=enq-note` textarea `maxLength=1000` | appended to `message` | — | — |
| 9 | Fieldset "What you share with this dealer" (sr legend "Data sharing") | copy "{dealer} only sees the fields you select below, to respond to this enquiry. You can revoke access later from My enquiries."; checkboxes "Name", "Phone", "Email" — all default **unchecked** (`:47-49`), each wrapped in `<label>` | → `fieldsToShare` subset of `name/phone/email` | validation "Select at least one detail the dealer may use to contact you." (`:102-109`) |
| 10 | Consent checkbox | "I consent to sharing the selected details with {dealer} for this enquiry." default unchecked (`:50`) | — | validation "Please confirm consent to share the selected details." |
| 11 | "Cancel" | `onClose` | — | — |
| 12 | "Send enquiry" (`type=submit`, disabled when signed out) | `POST /api/v1/public/listings/{vehicle.id}/leads {intent,preferredContact,message?,fieldsToShare,consentTextVersion:'buyer-lead-disclosure-en-AE-v1'}` (`lib/api.ts:653-670`) | loading `role="status"` "Sending your enquiry…"; success `role="status"` "Reference #LEAD-{id8}", "Enquiry sent", "{dealer} will contact you to confirm details. No appointment is booked until the dealer confirms it.", buttons "View my enquiries" → `/account/enquiries`, "Close"; error `role="alert"` "Enquiry not sent" + API message (401: "Please sign in to send an enquiry. Nothing was submitted." + "Sign in"), "Back" returns to form with values intact | — |

### 2.18 `/compare` (`app/compare/page.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Init | reads `?slugs=a,b,c,d` (first 4), loads each via `GET /api/v1/public/listings/:slug` and the picker list via `GET /api/v1/public/listings?limit=50` (`:37-48`) | — | unknown slugs silently dropped (`:48`); loading `role="status"` "Loading vehicles…"; error `role="alert"` "Vehicles could not be loaded. {msg}" + "Try again" (reload) |
| 2 | Breadcrumb | "Home" → `/`, "Inventory" → `/cars`, "Comparison Matrix"; copy "Compare up to 4 vehicles side-by-side by specification, asking price and dealer." | — | — |
| 3 | "Highlight Differences" toggle button | visual only; rows with differing values get gold tint; label chip "Diff" appears when values differ regardless (`:454-458`) | no `aria-pressed` | — |
| 4 | "Export PDF" | `window.print()` (`:94-98`) — no print stylesheet | — | — |
| 5 | Empty state | "No vehicles currently selected for comparison." + "+ Add Vehicle to Compare" | — | — |
| 6 | Column header per vehicle | remove button `aria-label="Remove {title} from comparison"`; image; "{year} • {emirate}"; title; "Dossier" → `/cars/:slug`; "Enquire" → `/cars/:slug/enquiry` | — | — |
| 7 | Empty slot | "Add Vehicle to Compare" / "{n} slots remaining"; "Selected Vehicles ({n}/4)" | opens picker | hidden at 4 |
| 8 | Rows | "Asking Price" `AED {(fils/100).toLocaleString()}` (no locale arg, `:110`), "Monthly Est. (Indicative)" + "*Illustrative assumption, not a bank offer", "Showroom / Dealer" (+ "✓" `title="KYB Verified"`), "Emirate", "Model Year", "Mileage", "Condition" badge, "Regional Specs" ("GCC Spec ✓"/"Non-GCC"/"—"), "Engine & Output", "Transmission", "Warranty", "Chassis Masked VIN" (`dir="ltr"`) | missing values render "—" | — |
| 9 | Picker dialog `role="dialog" aria-modal aria-label="Select Vehicle to Compare"` | close `aria-label="Close vehicle picker"`; search `id=compare-picker-q` (sr label "Search loaded vehicles", placeholder "Filter by title…") filters the already-loaded 50 only; rows show title, "{year} • {emirate} • {dealer}", price, "+ Select" | `addVehicle` → `GET /api/v1/public/listings/:slug`; closes on success | "No more published vehicles to add."; `role="alert"` "This vehicle is no longer available." (404) or API error; already-compared items hidden (`:244-247`) |
| 10 | Disclaimer | "Regulatory Disclosure: All specifications and vehicle estimates are non-binding dealer quotations subject to final showroom contracts." | — | — |

### 2.19 `/dashboard` (`app/dashboard/page.tsx`)

Interstitial after login. Calls `GET /api/v1/auth/me` with the cookie. 401/403 → `/access-denied?reason=disabled` when the error message contains `ACCOUNT_DISABLED`, otherwise `/auth?tab=login` (`:26-36`; a suspended account's 401 therefore lands on login, not `/access-suspended` — G-17). `status==='SUSPENDED'` → `/access-suspended`; `'DISABLED'` → `/access-denied?reason=disabled`; else `resolvedDashboardUrl` (same-origin check) or role fallback (`/admin`, `/dealer[/leads|/inventory]`, `/account/garage`) (`:56-97`). Status copy: "Resolving session and access privileges...", "Authorizing Platform Administrator Console...", "Loading Dealership Console...", "Loading Private Garage & Dossier...". Network/5xx → red box with message then redirect to login after 2 s (`:98-104`). No controls.

### 2.20 `/dealers` (`app/dealers/page.tsx`)

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Emirate chips | "All Emirates", "Dubai", "Abu Dhabi", "Sharjah" (no `aria-pressed`, `:101-114`) | server-side `emirate` filter, page reset | — |
| 2 | "Filter this page" search `id=dealer-filter` (placeholder "Filter this page by name or location...") | client-side filter of the **current page only** (`:28-29,:53-57`) | — | — |
| 3 | Grid | skeleton cards while loading (`aria-busy`, `:149-165`); card: "KYB Verified" badge (always rendered — API only returns approved dealers), name, cities/emirates, "{n} Published listings", "Visit Showroom Storefront" → `/dealers/:slug` | `GET /api/v1/public/dealers?emirate&page&limit=12` | `role="status"` "Loading verified dealerships…"; empty "No verified dealerships match these filters."; `role="alert"` "The dealership directory could not be loaded. {msg}" |
| 4 | Pagination `<nav aria-label="Pagination">` | "Previous", "Page {p} of {n} · {total} dealerships", "Next" | shown only when `total > 12` | disabled at bounds / while loading |

### 2.21 `/dealers/[slug]` (`components/dealer-storefront-view.tsx`) — own header, not `MarketplaceHeader`

| # | Control | Label | Action / API | States |
|---|---|---|---|---|
| 1 | Header | brand "Automotive.OS" → `/`; nav (`lg+`) "Browse Stock", "Verified Dealers" (active), "Compare Vehicles"; language button "العربية"/"EN" (`aria-label` "Switch to English"/"التبديل إلى العربية") toggles `dir` + `font-arabic` (`:119-126`) | — | — |
| 2 | Toast | `role="status"`/`"alert"` with dismiss "✕" `aria-label="Dismiss"` (`:84-94`) | — | — |
| 3 | Breadcrumb | "Dealers" → `/dealers`, "{emirate} / {city}", name | — | — |
| 4 | Verification chips | "Verified dealer" (when `isKybVerified`), `{tradeLicenseRef}`, `{jurisdiction}` (`:150-167`) | — | — |
| 5 | Hero | initials avatar, name, tagline, address, "{n} years established" | `tagline`/rating/facility/years are `null` from the API (`apps/api/src/tenants/tenants.service.ts:163-174`) → hidden | — |
| 6 | "Choose a vehicle to request a viewing" | `<a href="#inventory">` | — | — |
| 7 | "Call" (`tel:`) / "WhatsApp" (`wa.me`) | only when `contact.directPhone`/`whatsappNumber` — API returns `null` for both → never rendered with real data (G-15) | — | — |
| 8 | "Share storefront" | clipboard → "Storefront link copied." / "Could not copy to clipboard." | — | — |
| 9 | Stats `<dl>` | "Published listings" `{inventoryTotal ?? liveGroundedStock}`; "Listed inventory value" "AED {x.x}M" when >0 (`:49-59`); "Rating", "Facility" only when non-null | — | — |
| 10 | About / address cards | branch name or "About the showroom"; description or "The dealer has not added a description yet."; "Showroom address" or "Address not provided"; "Makani: …"; "Get directions" (Google Maps, when `gpsCoordinates` parse within ±90/±180, `:13-19`); "Copy address" | — | — |
| 11 | "Available vehicles" filter `role="group" aria-label="Filter"` | "All loaded ({n})" / "GCC spec ({n})" with `aria-pressed` (`:301-320`); counter "Showing {x} of {total}" | client-side over the ≤20 loaded items | — |
| 12 | Vehicle cards `<ul>` | image / "No photo", "GCC Spec" badge, "{year} • {km} KM", title, "AED {Math.round(fils/100)}", "View details" → `/cars/:slug`, "Request viewing" → `/cars/:slug/enquiry` | — | "No published vehicles right now." |
| 13 | Overflow notice | "Showing the first {n} of {total} published vehicles." (`:384-390`) | no link to the rest; `/cars` does not accept `dealerSlug` in its URL (G-14) | — |

---

## 3. Workflows

W1. **Browse → filter → detail → compare**
1. `/` — pick "New/Used", type keyword, choose emirate → "Search Available Stock" → `/cars?q&emirate&condition`.
2. `/cars` — refine with make chips, "GCC Spec Only", "Max Price (AED)", "Sort:"; chips show active filters; URL updates (shareable); "Next"/"Previous" paginate (12/page).
3. Click a card ("View Dossier & VIN") → `/cars/:slug` (server-rendered, real 404 for unknown slug).
4. From detail, breadcrumbs back to `/cars?emirate=`/`?make=`; "View showroom" → `/dealers/:slug`.
5. `/compare` — "+ Add Vehicle to Compare" → pick up to 4 from the first 50 published listings, or open `/compare?slugs=a,b` directly; "Highlight Differences"; "Dossier"/"Enquire" per column; "Export PDF" = browser print.

W2. **Register → verify → login → redirect**
1. `/auth?tab=register` (or legacy `/auth/register`) — fill name, email, optional phone, emirate, password meeting the 4 checklist items, tick PDPL → "Complete Registration" → `POST /api/v1/auth/signup` (201, status `PENDING_VERIFICATION`).
2. Success banner states whether verification mail is sent (`NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED`); after 4 s the login tab opens with the email prefilled.
3. `/auth/verify-email?token=…` → auto `POST /api/v1/auth/verify-email` → "Email Verified!" → "Proceed to Login". Without a token: resend form.
4. `/auth?tab=login` → `POST /api/v1/auth/login` → httpOnly `ao_session` → `router.push(redirect || user.redirectUrl || '/dashboard')`; buyer `redirectUrl` is `/account/garage`.
5. Unverified login → error + "Verify email or resend link". `/dashboard` (if reached) resolves via `GET /api/v1/auth/me`.

W3. **Enquire with consent → view enquiry → book/reschedule/cancel → revoke grant**
1. `/cars/:slug` → "Request viewing / test drive" (or `/cars/:slug/enquiry`, or dealer storefront "Request viewing").
2. Signed out → banner "You need to sign in to send an enquiry." → "Sign in" → `/auth?tab=login&redirect=/cars/:slug[/enquiry]` → back after login.
3. Choose "Viewing / test drive" or "Make an offer", optional date/time (GST)/message, channel, tick ≥1 of Name/Phone/Email, tick consent → "Send enquiry" → `POST /api/v1/public/listings/:id/leads` → "Enquiry sent", "Reference #LEAD-XXXXXXXX".
4. "View my enquiries" → `/account/enquiries` — select the enquiry, see "Status timeline", "Your message", "Details shared with the dealer".
5. Appointments are created by the dealer (buyer `POST /api/v1/me/leads/:leadId/appointments` exists but no marketplace UI calls it). Once one exists: `/account/garage` → "Reschedule" → pick "New date & time (GST)" → "Submit"; or "Cancel" → confirm dialog.
6. Revoke: `/account/enquiries` → "Revoke dealer access", or `/account/profile` → "Revoke" in "Shared contact details". Button disappears; "Revoked {date} GST" shown.

W4. **Favourite and saved search**
1. Heart on any card (`/`, `/cars`) or "Save" on `/cars/:slug` → `POST /api/v1/me/favorites`; signed out → redirected to login and back.
2. Header heart badge count updates on `/`, `/cars`, `/cars/:slug` (not on `/compare`, `/dealers`).
3. `/cars` with filters → "Save this search" → "Search saved to your account." → "View saved searches".
4. `/account/saved` → favourites "View listing"/"Remove"; searches "Run search" (→ `/cars?…`) / "Delete".

W5. **Update profile / settings**
1. `/account/profile` — language, emirate, min/max budget (AED), makes → "Save preferences" → `PATCH /api/v1/me/buyer-profile` (fils integers).
2. `/account/settings` — display name, company, currency, two consent checkboxes → "Save changes" → `PATCH /api/v1/me/settings` (`handle`, `affiliation`, `settlementCurrency`, `whatsappComms`, `garageVisibility`).

W6. **Forgot password**: `/auth` → "Forgot passcode?" → `/auth/forgot-password` → static "Self-service password reset is not available yet…" → "Back to sign in". No API.

W7. **Language switch**: header toggle (public pages), "EN/العربية" group (account pages), "العربية/English" (auth), "EN/العربية" (storefront). Effect: `dir` + translated strings on the page wrapper only; resets on every navigation; `<html lang="en">` never changes.

W8. **Logout**: `/account/settings` → "Sign out" → `POST /api/v1/auth/logout` (session revoked, cookie cleared) → `/auth?tab=login`. Afterwards any `/account/*` URL → middleware redirect to login with `redirect=`.

W9. **Access states**: `/dashboard` → `/access-suspended` (status SUSPENDED / `?reason=tenant_suspended`) or `/access-denied?reason=disabled`; both offer "Return to Login".

---

## 4. Acceptance criteria

Global (apply to every route)
- G-A1 Money: every price is `AED` + integer AED derived from fils (`fils/100`), thousands separated with `,` (e.g. `AED 1,420,000`); no decimals, no raw fils, no `$`.
- G-A2 Time: every timestamp on account pages reads in Asia/Dubai (`en-GB` day-month-year, 24 h) followed by "GST"; the stored value is UTC ISO.
- G-A3 Redaction: no page shows dealer cost, private notes, full VIN (only `WP0AF2A97********`-style), or another buyer's name/phone/email. Lead creation sends only `name|phone|email` keys, never values.
- G-A4 Consent: every consent/grant checkbox renders unchecked on first paint; submit is blocked or rejected without it.
- G-A5 External rails: "Sign in with UAE PASS — Coming soon", "Connect UAE PASS — Not available yet", "Sell & Consign … Soon", footer legal spans, "Owned-vehicle management is not available yet.", "Data export and account deactivation are not available yet." are visibly disabled/non-interactive; nothing claims AECB/UAE PASS/escrow is live.
- G-A6 Arabic: the toggle flips `dir="rtl"` on the page wrapper, mirrors flex/grid order, Arabic strings replace English in all labelled controls, prices keep Western digits with `د.إ`. (Known to fail: `<html lang>`/`dir` unchanged — G-03.)
- G-A7 Errors: API failures render a `role="alert"` with the API message; loading renders a `role="status"`/skeleton; no fixture or persona data appears unless `NODE_ENV=development` **and** `NEXT_PUBLIC_ENABLE_FIXTURES=true`.
- G-A8 390 px: no horizontal scroll; primary actions reachable; fixed header 80 px does not cover content; detail page dock does not cover the footer's last link or the staging badge.

| Route / workflow | Acceptance criteria |
|---|---|
| `/` | 1. Grid shows exactly the first 12 published listings for the selected emirate and the ribbon total equals API `total`. 2. Hero card is the newest listing with a real price; with 0 listings it shows "Browse published stock from verified dealers." and no price. 3. "Search Available Stock" navigates to `/cars` carrying `q`, `emirate`, `condition`. 4. Dealer section lists ≤4 KYB-approved dealers and the "View All N" count equals API total. 5. Heart click while signed out redirects to `/auth?tab=login&redirect=%2F`. 6. API outage shows "Vehicle inventory unavailable" with a retry link, never fixture cars. |
| `/cars` | 1. Every filter change updates the URL without a reload; reloading the URL restores the same filters, sort and page. 2. Result count in the H1, chips, and pagination "Showing a–b of N" agree with each other and with the API. 3. Max-price slider at the right end sends no `maxPriceFils`; any other value sends `aed*100`. 4. "GCC Spec Only" sends `gccSpec=true` and all results carry the GCC badge. 5. Sorting by price orders results by `price.amountFils`. 6. Zero results shows the EmptyState with a working "Reset All Filters". 7. "Save this search" signed-in stores a search whose chips reproduce the active filters; signed-out redirects to login and back. 8. Mobile drawer opens with "Filters & Refine", closes on Escape/"Apply", and body does not scroll behind it. |
| `/cars/[slug]` | 1. Unknown slug returns HTTP 404 with "Vehicle Dossier Not Found". 2. Title, price, year, mileage, emirate, dealer match the list card. 3. VIN shows exactly 9 leading characters followed by `*`; full VIN is absent from the DOM. 4. Gallery arrows wrap and the counter matches; thumbnails switch the main image. 5. "Save" reflects the real favourite state after reload. 6. Finance block is labelled "Indicative"/"Illustrative assumption only, not a bank offer." 7. WhatsApp/Phone/Maps appear only when the API supplies the data (currently never). |
| `/cars/[slug]/enquiry` | 1. Signed out: banner + disabled "Send enquiry"; nothing is POSTed. 2. All five checkboxes start unchecked. 3. Submitting with no field selected shows "Select at least one detail the dealer may use to contact you."; with fields but no consent shows "Please confirm consent to share the selected details."; no request is sent. 4. Successful POST returns 201 and the dialog shows "Enquiry sent" with a reference; `/account/enquiries` then lists the lead with the same fields granted. 5. API 4xx (unpublished/sold/rate-limited) shows "Enquiry not sent" with the API message and "Back" preserves the form. 6. Closing the standalone page returns to `/cars/:slug`. |
| `/compare` | 1. `?slugs=` with 1–4 valid slugs renders that many columns; a 5th slug is ignored; unknown slugs are dropped. 2. Add slot disappears at 4; "Selected Vehicles (n/4)" is accurate. 3. "Highlight Differences" tints only rows whose values differ; "Diff" chip appears on those rows. 4. Missing specs show "—", never fabricated values. 5. Picker excludes vehicles already in the matrix; "No more published vehicles to add." when none remain. 6. Prices formatted as AED integers. |
| `/dealers` | 1. Only KYB-approved dealers appear; each shows "KYB Verified". 2. Emirate chip filters server-side and resets to page 1. 3. Text box narrows only the current page and is labelled "Filter this page". 4. Pagination appears only when total > 12. 5. Error shows "The dealership directory could not be loaded." |
| `/dealers/[slug]` | 1. Unknown slug → HTTP 404 "Dealer not found". 2. Inventory shows only this dealer's PUBLISHED listings (≤20) and the "Showing x of total" counter is correct. 3. Stats that the API returns as null (rating, facility, years, tagline) are absent, not zero. 4. "Listed inventory value" equals Σ asking prices / 100 / 1e6 to one decimal. 5. "Request viewing" leads to `/cars/:slug/enquiry` for that vehicle. 6. Language button flips the whole storefront to RTL. |
| `/auth` login | 1. Wrong password → `role="alert"` with API message; after 5 failures the lockout message is shown and a correct password is refused for 15 min. 2. Unverified account → verification message + link. 3. Success sets an httpOnly `ao_session` cookie (not readable from JS, no `ao_token` in localStorage) and navigates to the `redirect` param when it is a same-origin path, else to the role landing. 4. `redirect=//evil.com` or `https://…` is ignored. 5. >10 attempts/min → 429 message surfaced. |
| `/auth` register | 1. Submit disabled until password passes all four checks and PDPL is ticked; PDPL defaults unticked. 2. Duplicate email → API error shown, no success banner. 3. Success banner text matches the `NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED` flag and never claims an email was sent when the flag is off. 4. After 4 s the login tab opens with the email prefilled. |
| `/auth/verify-email` | 1. Valid token → "Email Verified!" + "Proceed to Login". 2. Invalid/expired → "Verification Unsuccessful" + resend form. 3. Resend 429 → "Too many requests…". 4. Resend success copy matches the email-delivery flag. |
| `/auth/forgot-password` | 1. No form fields, no network request; states reset is unavailable and "No reset email has been sent". 2. "Back to sign in" works. 3. Arabic toggle mirrors the card. |
| `/auth/activate` | 1. Missing/invalid token → "Activation Link Invalid". 2. Mismatched passwords → "Passwords do not match." client-side. 3. Weak password → API complexity message shown. 4. Success → redirect to login within 3 s. |
| `/dashboard` | 1. Without cookie → middleware redirect to `/auth?tab=login&redirect=%2Fdashboard`. 2. Buyer → `/account/garage`; dealer staff → `/dealer…`; admin → `/admin`. 3. Suspended → `/access-suspended`; disabled → `/access-denied?reason=disabled`. 4. API down → error text then login after 2 s. |
| `/account/*` (all) | 1. No cookie → redirect to `/auth?tab=login&redirect=<original path+query>`. 2. Expired/revoked cookie → API 401 → same redirect (no error page, no stale data). 3. Header shows the real display name from `GET /api/v1/me`. 4. Account nav marks the current page with `aria-current="page"`. 5. All dates show "… GST" in Dubai time. |
| `/account/enquiries` | 1. Only this buyer's leads are listed; the first is preselected. 2. Timeline marks completed stages up to the current status; LOST/SPAM shows "Closed". 3. Shared fields equal those ticked at submission. 4. "Revoke dealer access" → 200 → "Revoked {date} GST" and the button disappears; a second revoke is impossible from the UI. 5. Empty state offers "Browse vehicles". |
| `/account/garage` | 1. Only this buyer's appointments; times in GST. 2. Reschedule with a past time → "Choose a valid future date and time." and no request. 3. Reschedule success keeps the original duration (end−start) and shows "Reschedule request sent to the dealer.". 4. Cancel asks for confirmation, then shows "Cancelled" and hides Reschedule/Cancel. 5. "Virtual garage" states the feature is unavailable. |
| `/account/saved` | 1. Favourites list equals `GET /api/v1/me/favorites`; unpublished ones show "No longer listed" without a "View listing" button. 2. Remove → item disappears and "Removed from favorites." appears. 3. Saved search chips reflect `filterJson`; "Run search" opens `/cars` with the same filters applied. 4. Delete → "Saved search deleted.". 5. "Alerts off" and "Changing alert settings is not available yet." are shown. |
| `/account/profile` | 1. Budgets are entered in AED and stored ×100; clearing a field stores null. 2. min > max → "Minimum budget is above maximum." client-side. 3. Saved values survive reload. 4. UAE PASS button is disabled and labelled not available. 5. Grants list mirrors `/account/enquiries` and revoke works from here too. |
| `/account/settings` | 1. Empty display name → "Display name is required." and no request. 2. Save → "Settings saved." and "Last updated" advances. 3. Checkbox states persist after reload. 4. "Sign out" revokes the session: pressing Back and reloading `/account/settings` redirects to login. |
| `/access-denied`, `/access-suspended` | 1. Correct heading/code for `?reason`. 2. "Contact Support" only with `NEXT_PUBLIC_SUPPORT_EMAIL`. 3. Both link back to login. |

---

## 5. Risk-based edge cases

**High**
- H1 Unauthenticated `GET /account/{enquiries,garage,saved,profile,settings}` and `/dashboard` → 307 to `/auth?tab=login&redirect=…`; verify the `redirect` round-trips including query strings (`middleware.ts:14-18`).
- H2 Expired or server-revoked `ao_session` (e.g. after "Sign out" in another tab, or admin revoke) on any `/account/*` → must redirect to login, not render `account/error.tsx` or stale data (`server-session.ts:23-34`). Also test client actions after expiry: revoke/cancel/save → `BuyerAuthRequiredError` → redirect.
- H3 Cross-user IDs: tamper `leadId`/`appointmentId`/`listingId` in `POST /api/v1/me/leads/:id/grant/revoke`, `/appointments/:id/cancel|reschedule`, `DELETE /favorites/:id`, `DELETE /saved-searches/:id` with another buyer's UUID → expect 404 "… not found for this buyer" and no state change (API enforces `buyerUserId`, `me.service.ts:409,:541,:608,:694`). UI must show the error, not success.
- H4 Lead POST on a listing that became SOLD / unpublished / tenant suspended between page load and submit → API 400 ("Vehicle is no longer available…", "Listing is not currently published…", "Dealership is currently inactive") surfaced in "Enquiry not sent"; no grant created.
- H5 Consent bypass: submit the modal with all three field checkboxes unticked, or with fields ticked but consent unticked, and via devtools with `fieldsToShare: []` → client validation / API `ArrayNotEmpty` 400. Also send `fieldsToShare:['ssn']` — API accepts any strings (no allow-list, `leads.service.ts:99`); verify dealer UI cannot resolve such keys to data.
- H6 Login abuse: 6th wrong password → "ACCOUNT_LOCKED"/lock message and 15-min refusal of the correct password; 11th attempt in 60 s from one IP → 429 "Too many attempts…" shown in the alert. Confirm the UI never shows "success" on 429.
- H7 Unverified email login → `EMAIL_NOT_VERIFIED` path with the resend link; verify the raw `EMAIL_NOT_VERIFIED:` prefix is not displayed.
- H8 Open-redirect: `/auth?tab=login&redirect=//evil.com`, `redirect=https://evil.com`, `redirect=/\evil.com` must fall back to role landing (`auth/page.tsx:118-123`).
- H9 Redaction on `/cars/[slug]` and `/compare`: DOM must not contain full VIN, dealer cost, `buyerMessage`, private notes, or non-public media (`listings.service.ts` `mapPublicDetail`).
- H10 Arabic RTL on every route: `dir="rtl"` wrapper, mirrored header/nav/chips/pagination, Arabic labels on inputs/buttons, `aria-label`s translated; **expected FAIL**: `<html lang="en">` with no `dir` (`layout.tsx:23`), locale resets on navigation (G-03/G-04).
- H11 390 px mobile: `/cars` drawer, `/cars/[slug]` sticky dock vs footer and staging badge, VIP modal `max-h-[75vh]` scroll with keyboard open, `/compare` table horizontal scroll (`min-w-[800px]`), `/auth` card, account nav wrap.
- H12 Keyboard/ARIA: focus is not trapped in the VIP modal, cars drawer or compare picker (Tab leaves the dialog); Escape closes VIP modal and drawer but not the compare picker; `role="radio"` buttons have no arrow-key navigation; check every checkbox's accessible name (candidates for the earlier "announced as on" finding: `vip-enquiry-modal.tsx:358-364,:369-374`, `auth/page.tsx:557-563`, `account-settings-view.tsx:163-178`, `cars/page.tsx:448-454`); check icon ligature leakage: `enquiry-view.tsx:184` "arrow_back" is exposed; all other Material spans carry `aria-hidden`.

**Medium**
- M1 Unknown slug: `/cars/does-not-exist` and `/dealers/does-not-exist` → HTTP 404 status (not 200) and the correct not-found copy; `/cars/does-not-exist/enquiry` → root not-found (vehicle copy).
- M2 `/cars?page=999` (beyond `totalPages`) → API returns empty `items` with `total>0`; UI shows EmptyState while pagination reads "Showing 11977–11988 of N" — G-09. Also `?page=0`, `?page=-1`, `?page=abc` → coerced to 1.
- M3 Price filter inverted: UI has no min control; call `/api/v1/public/listings?minPriceFils=200000000&maxPriceFils=100000000` directly → expect empty set (no 400). `?maxPrice=-5` / `?maxPrice=abc` in the UI URL → ignored (`cars/page.tsx:66-67`). Slider cannot exceed AED 3,000,000 except "Any price" (vehicles between 3M and ∞ cannot be isolated).
- M4 Empty results for each filter combination (emirate with no stock, make "Mercedes-AMG" when titles say "Mercedes-Benz", GCC only, keyword gibberish) → EmptyState with reset; saved-search of an empty result still saves.
- M5 Listing becomes SOLD/unpublished: favourite card shows "No longer listed" without "View listing"; `/cars/:slug` → 404; compare `addVehicle` → "This vehicle is no longer available."; `/compare?slugs=` silently drops it (no message).
- M6 Duplicate favourite: double-click heart quickly → second `POST` is an idempotent upsert (201) but local state may flip twice; removing a non-existent favourite → API 404 "Favorite not found" surfaced as `favoriteError`.
- M7 Compare max: `?slugs=a,b,c,d,e` → only 4; add slot hidden at 4; removing one re-shows the slot; adding the same vehicle twice is prevented (`compare/page.tsx:69-70`).
- M8 Weak/invalid password on register (9 chars, no symbol, no uppercase) → button disabled; bypass via devtools → API 400 message. Activation page: 10 lowercase letters passes client check, fails API.
- M9 PDPL unticked → submit disabled; remove `disabled` via devtools → client alert "Explicit consent under UAE PDPL Law No. 45/2021 is mandatory"; POST with `consentPdpl:false` → API 400 `Equals(true)`.
- M10 Signup rate limit 5/10 min per IP → 429 message in `role="alert"`.
- M11 Email-delivery flag: with `NEXT_PUBLIC_EMAIL_DELIVERY_ENABLED` unset, register and resend copy must say emails are **not** sent; with `true`, copy claims sending — confirm a provider is actually live before enabling (INTEGRATION_TRUTH_TABLE).
- M12 Reschedule boundaries: time exactly now, 23:59 GST on DST-free day, year rollover; appointment with `endsAt <= startsAt` from the API (duration fallback 60 min); reschedule a CANCELLED appointment via devtools → API should refuse.
- M13 Revoke twice (second tab) → API 404/409 → `StatusMessage` error; UI already hid the button in the first tab.
- M14 Profile budget: `min=''` `max='500000'`; `min=0`; values ≥ 2^53/100; non-integer paste (`"1,000"` → digits stripped to `1000`).
- M15 Settings: display name of 1 char / 200 chars / emoji / RTL text; `handle` is what the API stores — confirm the header name updates after save without reload (`AccountShell` receives `initialSettings.displayName`, not the updated one — see G-22).
- M16 Logout then browser Back → `/account/settings` served from bfcache may show the old page; reload must redirect.
- M17 Header emirate `<select>` on `/cars/[slug]` has no handler — changing it does nothing (G-11); on `/compare` and `/dealers` it changes state that no fetch uses (`compare/page.tsx:257`, `dealers/page.tsx:67` does refetch — OK).
- M18 `NEXT_PUBLIC_API_URL` unset in staging → browser calls `http://localhost:4000` for public listings (G-05); CORS/HTTPS mixed-content failure shows "Couldn't load vehicle results".
- M19 Dealer storefront with >20 listings → "Showing the first 20 of N" with no way to reach the rest (G-14).
- M20 `/dashboard` for a SUSPENDED account whose login returns 401 → lands on `/auth` instead of `/access-suspended` (G-17).

**Low**
- L1 `/cars?make=Mercedes-Benz` (from home pills) → results filter correctly but no make chip is pressed; mobile `<select>` shows blank (G-07).
- L2 Compare "Export PDF" prints the fixed header over the table; Arabic digits may appear in prices because `toLocaleString()` has no locale (G-18).
- L3 Enquiries page shows raw appointment status ("REQUESTED") while garage shows "Awaiting dealer confirmation" (G-23).
- L4 Reference format differs: modal "Reference #LEAD-XXXXXXXX" vs enquiries "Ref #XXXXXXXX" (G-24).
- L5 Saved-search chips expose raw keys (`gccSpec: true`, `q: …`); "Run search" drops `model`/`dealerSlug`/`minPriceFils` (G-13).
- L6 Home "View All 0 Verified Showrooms" flashes before the dealer fetch resolves.
- L7 `VehicleCard` shows "Brand New" for `mileageKm === null` even for USED condition (G-19); condition enum "USED" is untranslated in Arabic.
- L8 Favourite button `aria-label`/`title` say "session" favourites (G-01).
- L9 `/auth` page footer hardcodes "© 2026"; `/access-*` pages have no Arabic.
- L10 Root `not-found.tsx` copy is vehicle-specific for any unknown URL (e.g. `/foo`).
- L11 `fetchBuyerMe` non-401 failure in the modal leaves "—" identity and an enabled submit (G-16).
- L12 Trust-pillar glyphs "✓"/"GCC"/"VIP" on `/` are read by screen readers.
- L13 `/cars/[slug]/enquiry` fetches the listing twice per request (metadata + page) unlike `/cars/[slug]` which uses `cache()` (`enquiry/page.tsx:117,:134`).
- L14 Verify-email `res.json()` on a non-JSON body reports "Network error…" instead of the HTTP status (`verify-email/page.tsx:369`).

---

## 6. Known gaps found while reading

| ID | Severity | Location | Finding |
|---|---|---|---|
| G-01 | Low (a11y/copy) | `packages/ui/src/components/vehicle-card.tsx:116-117` | Favourite button `aria-label` "Save for this session"/"Remove session favorite" and `title` "Favorites are saved for this browser session until buyer sign-in is connected" are stale — favourites are persisted via `POST /api/v1/me/favorites`. Screen-reader users are told the wrong thing. |
| G-02 | Medium (a11y) | `apps/marketplace/app/cars/[slug]/enquiry/enquiry-view.tsx:184` | `<span className="material-symbols-outlined">arrow_back</span>` lacks `aria-hidden`; link name becomes "arrow_back Back to {title}" — the icon-ligature leak reported by prior QA. All other Material spans carry `aria-hidden="true"`. |
| G-03 | High (RTL/i18n) | `apps/marketplace/app/layout.tsx:23` | `<html lang="en" className="dark">` is static; no page sets `dir` or `lang` on `<html>`. Arabic mode only sets `dir` on a wrapper `<div>` (`app/page.tsx:135`, `cars/page.tsx:246`, `account-shell.tsx:57-58`, …). Acceptance "Arabic RTL mirrors `<html lang dir>`" cannot pass. |
| G-04 | Medium (i18n) | every page's `useState<'en'\|'ar'>('en')` e.g. `app/page.tsx:23`, `cars/page.tsx:32`, `account-shell.tsx:50`, `dealer-storefront-view.tsx:22` | Locale is per-page component state; it resets to English on every navigation and is not linked to the saved `preferredLanguage` (`buyer-profile-view.tsx:38,:70`). |
| G-05 | Medium (deploy) | `apps/marketplace/lib/api.ts:489,:530,:918,:935` | Public listing/dealer fetches use `NEXT_PUBLIC_API_URL \|\| 'http://localhost:4000'` directly from the browser instead of the same-origin `/api/*` rewrite used for buyer calls. Requires CORS + a correct env var in staging; `next: { revalidate: 10 }` is passed from client code where it has no effect. |
| G-06 | Low (dead code) | `lib/api.ts:134-146,:150-162,:671-676` | `CreateLeadEnquiryPayload` fields `buyerName/buyerPhone/buyerEmail/licenseTier/evaluationMode/targetDate/targetSlot` and response fields `hostName/scheduledDate/scheduledSlot/venue` are never sent by the API nor rendered; `submitVehicleLeadEnquiry` fills them with `''`. |
| G-07 | Medium (UX) | `app/page.tsx:124-131` vs `app/cars/page.tsx:241` | Home "Explore Makes" uses "Mercedes-Benz" and "Bentley"; `/cars` make list is `Porsche, Toyota, Mercedes-AMG, Land Rover, Ferrari`. Arriving with `?make=Mercedes-Benz` filters via API but no sidebar button is pressed and the mobile `<select>` renders an unknown value. Make lists are hardcoded, not derived from inventory. |
| G-08 | Medium (coverage) | `app/cars/page.tsx:242`, `app/page.tsx:269-275`, `header.tsx:79-91`, `dealers/page.tsx:101` | Emirate filters offer only Dubai/Abu Dhabi/Sharjah while registration/profile accept all 7 emirates and the API accepts any string. Stock in Ajman/RAK/Fujairah/UAQ is reachable only under "All Emirates". |
| G-09 | Medium (bug) | `app/cars/page.tsx:70,:226-235,:594-603` | `?page=` from the URL is not clamped to `totalPages` (only `goToPage` clamps). Out-of-range page shows EmptyState plus pagination text "Showing 11977–… of N" and a disabled Next with no way back except Previous. |
| G-10 | Low (contract) | `components/buyer-profile-view.tsx:38,:69-70` | `preferredLanguage` is saved but never read to initialise the UI locale (see G-04). |
| G-11 | Low (dead control) | `components/vehicle-detail-view.tsx:146-152` | `MarketplaceHeader` on the detail page receives `selectedEmirate` but no `onEmirateChange`; the header `<select>` is inert. |
| G-12 | Low (header state) | `app/compare/page.tsx:258`, `app/dealers/page.tsx:68`, `header.tsx:176` | `favoritesCount={0}` hardcoded on `/compare` and `/dealers`; no page passes `userDisplayName` so the avatar always reads "VIP" even when signed in. |
| G-13 | Low (round-trip) | `components/buyer-saved-view.tsx:34-46` vs `app/cars/page.tsx:57-72` | `searchHref` emits `model`; `/cars` never reads `model`, `dealerSlug` or `minPrice`. Saved searches created elsewhere (API) lose those filters silently on "Run search". |
| G-14 | Medium (coverage) | `components/dealer-storefront-view.tsx:384-390`, `lib/api.ts:941`, `app/cars/page.tsx:57-72` | Storefront loads only 20 listings and says "Showing the first 20 of N" with no link; `/cars` has no `dealerSlug` URL filter, so a dealer with >20 published cars cannot be fully browsed. |
| G-15 | Low (dead branches with real data) | `components/vehicle-detail-view.tsx:355-365,:555-573,:587-597`; `components/dealer-storefront-view.tsx:199-220,:262-264` | WhatsApp, phone, address, Makani and map links depend on `seller.whatsappNumber/directPhone/latitude/longitude/address` and `contact.directPhone/whatsappNumber/makaniNumber`, which the API never populates (`listings.service.ts:853-860` seller has no contact fields; `tenants.service.ts:170-174` returns `null`). Only Stitch fixtures exercise these paths. CSV S06 claims "contact actions routed" — not verifiable with real data. |
| G-16 | Low (swallowed error) | `components/vip-enquiry-modal.tsx:68-70` | `fetchBuyerMe().catch` only handles `BuyerAuthRequiredError`; network/5xx errors leave `me=null`, identity shows "—", and "Send enquiry" stays enabled (the later POST will surface the error). |
| G-17 | Medium (routing) | `app/dashboard/page.tsx:26-36` | On 401/403 only `ACCOUNT_DISABLED` is detected; `ACCOUNT_SUSPENDED` (thrown at `auth.service.ts:209,:315`) sends the user to `/auth?tab=login` instead of `/access-suspended`. Status-based branches at `:45-54` are reachable only when `/auth/me` succeeds. |
| G-18 | Low (formatting) | `app/compare/page.tsx:110,:124,:569` | `toLocaleString()` without `'en-US'` — thousands separator/digits follow the browser locale (Arabic-Indic digits possible), inconsistent with every other price formatter. |
| G-19 | Low (copy) | `packages/ui/src/components/vehicle-card.tsx:53-60,:156` | `mileageKm === null` renders "Brand New" regardless of `condition`; condition is shown as the raw enum "NEW"/"USED" and is not translated in Arabic. |
| G-20 | Low (metric) | `components/buyer-garage-view.tsx:122,:131` | "Active bookings" counts every non-CANCELLED appointment including COMPLETED and NO_SHOW. |
| G-21 | Low (contract) | `components/account-settings-view.tsx:145-154`, `lib/api.ts:1327-1341` | "Preferred currency" offers USD/EUR and is stored as `settlementCurrency`, but no view formats money in anything other than AED (product rule: AED only). The DTO also exposes `trn`, `escrowIban`, `aecbRefresh` (`update-account-settings.dto.ts:29-57`) that the UI correctly does not surface. |
| G-22 | Low (stale header) | `components/account-settings-view.tsx:24,:69-70` | After a successful rename, the shell's profile pill still shows `initialSettings.displayName` until reload (`AccountShell` is given the initial value, not `settings.displayName`). |
| G-23 | Low (inconsistency) | `components/buyer-enquiries-view.tsx:219` vs `components/buyer-garage-view.tsx:16-23` | Enquiries page shows raw appointment status (`REQUESTED`); garage maps it to "Awaiting dealer confirmation". |
| G-24 | Low (inconsistency) | `lib/api.ts:672` vs `components/buyer-enquiries-view.tsx:162` | Modal reference "LEAD-XXXXXXXX" vs enquiries "Ref #XXXXXXXX" for the same lead. |
| G-25 | Low (a11y) | `app/cars/page.tsx:610-696`, `app/compare/page.tsx:503-579`, `components/vip-enquiry-modal.tsx:159-166` | Dialogs set `aria-modal` but implement no focus trap or initial focus; compare picker has no Escape handler. |
| G-26 | Low (fixture filtering) | `lib/api.ts:525-558` | Dev-only fixture fallback ignores `q`, `gccSpec`, `minPriceFils`, `sort`, `page`/`limit` — fixture results will not match the filters shown. Harmless outside dev but misleading in local previews. |
| G-27 | Medium (docs mismatch) | `docs/implementation/SCREEN_COVERAGE.csv` rows S27, S28, S29, S30, S31, S06 | CSV marks VERIFIED/PASS with descriptions of features that do not exist in code: S29 "segmented 6-digit OTP … PIN reset" (page is a static "not available" notice, `forgot-password/page.tsx:256-260`); S31 "AECB score gauge (842/900), AED 8.95M valuation" (route is a redirect, `dossier/page.tsx:11`); S27/S28 "UAE PASS biometric challenge / auto-fill, persona switching" (not implemented); S30 "FIDO2 passkeys, FAB escrow IBAN" (not in settings view). The CSV is the declared source of truth; these rows describe the Stitch design, not the shipped flow. |
| G-28 | Low (API contract, cross-cutting) | `apps/api/src/leads/leads.service.ts:99,:118,:134`; `create-lead-enquiry.dto.ts:45-48` | `fieldsToShare` is not validated against an allow-list (`name\|phone\|email`); arbitrary strings are persisted into `LeadDataGrant.fieldsGranted` and the outbox payload. UI only ever sends the three known keys. |
| G-29 | Low (perf/duplication) | `app/cars/[slug]/enquiry/page.tsx:117,:134` | `generateMetadata` and the page each call `fetchPublicListingBySlug` (two API round-trips) whereas `/cars/[slug]/page.tsx:8` wraps it in `cache()`. |
| G-30 | Low (copy) | `app/cars/page.tsx:324` | Sort option label "Price: High to Low (Institutional)" — unexplained jargon in a buyer-facing control. |
| G-31 | Low (copy/env) | `app/auth/page.tsx:620` | Footer "© 2026 Automotive OS …" hardcoded (other footers compute the year). |
| G-32 | Low (nav) | `packages/ui/src/components/header.tsx:96,:53` | Desktop nav hidden below `lg` and emirate select hidden below `xl` with no mobile menu; on phones the only header actions are language, favourites and profile. Public pages rely on in-page links to reach `/dealers` and `/compare`. |

Totals: 24 routes inventoried (23 `page.tsx` routes including the 3 pure redirects `/auth/login`, `/auth/register`, `/account/profile/dossier`, plus `/api/health`); 177 control rows in §2 covering roughly 220 individual user-facing controls (rows such as pagination, gallery and checkbox groups bundle several); 32 gaps (1 High, 9 Medium, 22 Low).
