# Local production-scale QA data set

Fictional, sanitized data that exercises every tenant, verification, user, stock,
listing, lead and appointment state at a volume where pagination, filters,
role redaction and RLS actually matter. Built on 2026-10-31.

## Why a separate database

`automotive_os` (the default local database) accumulates rows from the API's own
integration tests (`dealer-cf07-*` tenants, `unauth@test.ae`, …). Those rows are
not deleted; the QA set lives in its own database so neither contaminates the other.
The API is run against the QA database **as the RLS application role**
(`automotive_app_user`), not as `postgres`, so row-level security behaves as it
does on staging. Running the API as the superuser hides a whole class of defects
(see QA-LOCAL-02 in `LOCAL_QA_2026-10-31.md`).

## Build it

All commands from `packages/database`. `<SUPER_URL>` is the local superuser URL from
`packages/database/.env` with the database name changed to `automotive_os_qa` and
`localhost` replaced by `127.0.0.1` (the Windows service authenticates differently
over IPv6).

```bash
# 1. create the empty database once (psql or any client, as the superuser)
#    CREATE DATABASE automotive_os_qa;
# 2. schema, app role, RLS policies, baseline seed
DATABASE_URL=<SUPER_URL> MIGRATION_DATABASE_URL=<SUPER_URL> pnpm run prisma:deploy
DATABASE_URL=<SUPER_URL> MIGRATION_DATABASE_URL=<SUPER_URL> pnpm run init:role
DATABASE_URL=<SUPER_URL> pnpm run apply:policies
DATABASE_URL=<SUPER_URL> pnpm run seed
# 3. production-scale data (idempotent; SEED_SCALE=2 doubles volume)
DATABASE_URL=<SUPER_URL> pnpm run seed:scale
```

`seed:scale` refuses to run when `NODE_ENV` is production/staging or when
`DATABASE_URL` looks like a hosted database. Re-running adds nothing
(deterministic ids, `createMany … skipDuplicates`); it only refreshes passwords.

## Accounts

Every seeded account, plus the five baseline accounts (`tariq@alfuttaim-prestige.ae`,
`zayd@gargash-autos.ae`, `rashid.buyer@example.ae`, `fatima.buyer@example.ae`,
`admin@autonexa.ae`), shares one password. It is generated (or taken from
`SEED_PASSWORD`) and written **only** to `<repo>/.qa-credentials.local.json`
(gitignored, mode 600) together with an account directory. Never commit or paste it.

| Kind | Examples | Notes |
|---|---|---|
| Dealer staff | `<first.last>@<tenant-slug>.example`, one per role per dealership | All 8 `MembershipRole`s at Falcon Ridge, Corniche, Gulf Crescent, Desert Oasis, Zayed Avenue EV, Marina Luxury, Al Qusais |
| Edge staff | `group.director@falcon-ridge-motors.example` (OWNER Falcon + VIEWER Marina), `former.agent@…` (inactive membership), `suspended.manager@corniche-…`, `disabled.viewer@gulf-crescent-…`, `sso.only@zayed-avenue-ev-hub.example` (no password) | Membership, status and password edge cases |
| Platform admins | `ops.admin@automotive-os.example`, `compliance.officer@…` (second admin), `ops.suspended@…`, `ops.invited@…` (pending activation) | Last-admin and inactive-admin checks |
| Buyers | `<first.last><n>@buyers.example`, n = 1..60 | Profiles with budgets, emirates, languages, consents |
| Edge buyers | `unverified.buyer@…`, `locked.buyer@…` (locked until tomorrow), `suspended.buyer@…`, `no.profile@…` | Login and profile edge cases |

## Dealerships

| Slug | Emirate(s) | Tenant | KYB | Stock | Purpose |
|---|---|---|---|---|---|
| falcon-ridge-motors | Dubai (3 branches) | ACTIVE | APPROVED | 160 + 2 price-edge cars (AED 9,500 and AED 2,850,000) | Largest tenant, every role, TRAP-01 (a PUBLISHED listing left on a SOLD vehicle) |
| corniche-prestige-autos | Abu Dhabi (2) | ACTIVE | APPROVED | 90 | Luxury |
| gulf-crescent-cars | Sharjah (2) | ACTIVE | APPROVED | 70 | Mainstream |
| hajar-mountain-motors | Ras Al Khaimah | ACTIVE | APPROVED | 30 | Used by the harness for the suspend/reactivate drill |
| desert-oasis-automotive | Al Ain | ACTIVE | APPROVED | 45 | |
| pearl-coast-auto-trading | Ajman | ACTIVE | APPROVED | 25 | Small team (3 roles) |
| fujairah-harbour-cars | Fujairah | ACTIVE | APPROVED | 20 | Trialing subscription |
| zayed-avenue-ev-hub | Abu Dhabi | ACTIVE | APPROVED | 40 | Electric vehicles |
| marina-luxury-collection | Dubai | ACTIVE | APPROVED | 35 | Exotics |
| al-qusais-budget-cars | Dubai (2) | ACTIVE | APPROVED | 80 | PAST_DUE subscription |
| uaq-family-motors | Umm Al Quwain | ACTIVE | IN_REVIEW | 12 | Must stay invisible publicly |
| sandstorm-autos | Sharjah | SUSPENDED | APPROVED | 20 (listings PAUSED) | Suspended-tenant behaviour |
| dune-gate-motors | Dubai | PENDING | NOT_SUBMITTED | 0 | Pending invitation for its owner |
| iron-anchor-motors | Dubai | CLOSED | EXPIRED | 10 (ARCHIVED) | Closed tenant |

Volumes at `SEED_SCALE=1`: 26 makes / 84 models, 639 vehicles, 1,693 media rows
(object keys only — no object storage locally, so images render as
"Vehicle image not available"), 565 listings, 450 leads with grants (12% revoked),
88 appointments, 250 favourites, 90 saved searches, 3 plans / 14 subscriptions,
4 invitations, ~1,000 audit rows, ~440 outbox rows.

## Run the stack against it

- API: `DATABASE_URL=<APP_ROLE_URL>` (user `automotive_app_user`, same local dev
  password as `scripts/init-app-role.ts` sets), `JWT_SECRET` from the root `.env`,
  `NODE_ENV=development`, no `ALLOW_DEV_TOKENS`, no `S3_*`.
- Dealer app: `DEALER_AUTH_ENFORCED=true` so the sign-in gate is real on localhost.
- Admin app: no `ADMIN_DEV_BYPASS`.
- Acceptance harness (190 checks, writes a Markdown report):
  `DATABASE_URL=<SUPER_URL> node apps/api/scripts/qa/local-acceptance.mjs`
  (run from `apps/api`; paces logins under the 10/min per-IP limiter). The signup
  checks share the 5-per-10-minutes signup limiter, so leave 10 minutes between
  consecutive harness runs or the two signup checks report 429.
