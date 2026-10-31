# Staging signed-in QA — 2026-10-31

Environment: Railway staging, `main` at `5d13f80` (after PRs #37–#41).

Method: the built-in browser drove the marketplace gateway (`automotive-marketplace-staging.up.railway.app`) as three temporary accounts: a buyer, a Gargash Emirates Autos OWNER and a platform admin. The accounts were created with `apps/api/scripts/staging-qa/qa-users.mjs` and deleted after the run. Database and storage checks used the owner connection from the gitignored `.env.staging-qa.local`. No secret values were printed.

## Data and infrastructure

| Item | Result | Evidence |
|---|---|---|
| Migrations | PASS | `prisma migrate status`: 8 of 8 applied, schema up to date |
| Consent migration (MK-09) | PASS | `whatsapp_comms_consent` and `aecb_refresh_consent` default `false`; 0 of 3 buyers have either set |
| Search indexes | PASS | `vehicles_make_id_idx`, `vehicles_model_id_idx`, `vehicles_tenant_id_branch_id_idx`, `listings_status_asking_price_fils_idx` present |
| Vehicle images | PASS (placeholders) | 4 missing objects uploaded as "Staging sample image" placeholders, 1 existing object untouched; `/api/v1/public/media/...` returns 200 `image/jpeg` |
| Dealer deploy (QA-POST-01) | PASS | Railway healthcheck path changed to `/dealer/api/health`; middleware redirect fixed in #37 |

## Buyer (`/account/*`, enquiry modal)

| Flow | Before fixes | After #39–#41 |
|---|---|---|
| Login and redirect to `/account/settings` | PASS | PASS |
| `/account/settings` | FAIL: error page, `/me/settings` 404 | PASS; WhatsApp consent unticked |
| Buyer profile get, set and clear (MK-08) | FAIL: 404 | PASS: emirate and budget set, then cleared to `null` |
| Saved search create (MK-17) | FAIL (RLS) | PASS (201) |
| Favourite add and list; header count (MK-06/07) | FAIL: 500 | PASS (201/200); header "View 1 saved vehicles" |
| Enquiry modal: identity from `/auth/me`, all share and consent boxes unticked, UAE PASS "Coming soon" | PASS | PASS |
| Send enquiry | FAIL: 500 ("Enquiry not sent" shown honestly) | PASS: reference `#LEAD-245EEC12`, listed on `/account/enquiries` with granted fields |
| Book, reschedule and cancel a test drive | not reachable | PASS (201/200/200); `/account/garage` shows masked VIN and GST time |
| Revoke dealer data grant | not reachable | PASS; `revokedAt` reflected in the enquiries list |

Root causes fixed:
- **#39:** the verified user was never bound to the DB context, so RLS hid the buyer's own rows.
- **#40:** buyer reads joined `listing -> vehicle`, which are tenant rows hidden by RLS. Listing cards are now loaded by id, read-only, with public fields only.
- **#41:** buyer writes to tenant tables (leads, grants, appointments, outbox, audit) now run in the owning tenant's context, taken from server rows.

## Dealer (OWNER, Gargash Emirates Autos)

| Flow | Result |
|---|---|
| Login lands on `/dealer` | PASS |
| Dashboard with real stock counts | PASS |
| Inventory: real vehicle, cost visible to OWNER, Unpublish action, status filters, paginator | PASS |
| Out-of-range page (`?page=5`) shows "Page 5 does not exist. There is 1 page." | PASS |
| Leads: honest empty state (0 leads, matching the DB at the time), filters, paginator | PASS |
| Preview module (`/dealer/finance/exception`): banner and static "Sample role" label | PASS |
| Arabic toggle: `ao_locale` cookie, `<html lang="ar" dir="rtl">`, persists across pages, mirrored layout | PASS |

## Admin

| Flow | Result |
|---|---|
| Login with an admin session cookie gets past the Basic Auth gate | PASS |
| Home counts from `GET /admin/tenants/summary` (2 dealerships, 2 active, 2 APPROVED) | PASS |
| Users, audit logs and tenants APIs | PASS (200) |
| Moderation detail returns signed `previewUrl` (5 minutes) | PASS |
| Self-suspend blocked | PASS: 400 `CANNOT_MODIFY_OWN_ACCOUNT` |

## New findings (not fixed)

| ID | Severity | Finding |
|---|---|---|
| QA-SI-01 | **High (security)** | Migration `20261020140500_enable_rls_and_app_role` creates `automotive_app_user` with the fixed password `app_secure_dev_password`, and the staging Postgres is reachable through Railway's public proxy. Rotate that role's password on every environment and move it out of the migration. |
| QA-SI-02 | Medium (a11y) | Enquiry modal checkboxes (Name, Phone, Email, consent) expose the accessible name "on"; labels are not associated. |
| QA-SI-03 | Low (a11y) | Listing detail buttons include icon ligature text in their accessible name, e.g. "sports_motorsports Request viewing"; icon spans need `aria-hidden`. |
| QA-SI-04 | Low | During a synthetic click on the dealer login redirect, the page wrote to the OS clipboard. Investigate which handler copies on click. |
| QA-SI-05 | Info | Login email and password inputs expose only their placeholder as the accessible name in the accessibility tree; verify the `htmlFor`/`id` pairing from MK-19 on the deployed build. |

## Cleanup
- Deleted QA users: 3, plus 2 leads with their grants, 1 appointment, 1 favourite, 1 saved search and 4 sessions (cascade).
- `.qa-credentials.local.json` removed.
- Audit and outbox rows from the run are kept; the ledger is append-only.
- The placeholder images stay in the staging bucket.
- `.env.staging-qa.local` still holds the owner DB URL and storage keys on the operator's machine. Delete it when staging QA is finished.
