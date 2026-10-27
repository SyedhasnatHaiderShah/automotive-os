# CF-07: Comprehensive Quality Assurance Test Matrix

## 1. Test Execution Summary

| Test Domain | Target Suite | Test Executed | Total Tests | Pass | Fail | Execution Time |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **API Integration** | `apps/api/test/cf07-unified-auth-rbac.spec.ts` | Unified Auth & RBAC API Suite | 16 | 16 | 0 | ~4.2s |
| **Full API Suite** | `apps/api` (All 21 test suites) | Complete Backend Monolith Suite | 204 | 204 | 0 | ~12.2s |
| **Database RLS** | `packages/database/test/rls-isolation.test.ts` | Multi-Tenancy & RLS Gate Suite | 16 | 16 | 0 | ~1.8s |
| **Database Backup** | `packages/database/test/backup-and-rls-verification.test.ts` | Backup & Fail-Closed Gate Suite | 14 | 14 | 0 | ~2.1s |
| **Monorepo Types** | `pnpm exec turbo run typecheck` | Monorepo TypeScript Compilation | 10 pkgs | 10 | 0 | ~3.3s |
| **Code Style** | `pnpm run lint` | Monorepo ESLint & Code Standards | 10 pkgs | 10 | 0 | ~0.5s |
| **App Builds** | `marketplace`, `admin`, `dealer`, `api` | Production Builds with BasePaths | 4 apps | 4 | 0 | ~45s |
| **Admin Bootstrap**| `scripts/bootstrap-platform-admins.ts` | Idempotent Provisioning & MFA | 2 admins| 2 | 0 | ~1.1s |

---

## 2. Granular Test Cases (`cf07-unified-auth-rbac.spec.ts`)

| # | Test Description | Input / Condition | Expected Result | Verified Result |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Customer Registration (`BUYER`) | Valid customer DTO (`consentPdpl: true`) | HTTP 201, User created with `BUYER` role | **PASS** |
| 2 | Self-Registration Role Injection Rejection | Attempted `isPlatformAdmin: true` payload | Stripped by DTO, created as `BUYER` | **PASS** |
| 3 | Public Registration Tenant Injection Rejection | Attempted `tenantId` payload | Ignored, no memberships created | **PASS** |
| 4 | Valid Credential Login | Correct email + password | HTTP 200, sets `ao_session` HttpOnly cookie | **PASS** |
| 5 | Invalid Password Login | Incorrect password | HTTP 401 Unauthorized, increments failed count | **PASS** |
| 6 | Non-Existent User Login | Unregistered email | HTTP 401 Unauthorized | **PASS** |
| 7 | Suspended User Login Rejection | User with `status = SUSPENDED` | HTTP 403 Forbidden | **PASS** |
| 8 | Disabled User Login Rejection | User with `status = DISABLED` | HTTP 403 Forbidden | **PASS** |
| 9 | `/auth/me` with Valid Cookie Session | `ao_session` cookie supplied | HTTP 200, returns user profile & memberships | **PASS** |
| 10 | `/auth/me` without Credentials | No cookie or header | HTTP 401 Unauthorized | **PASS** |
| 11 | Role Resolver: Platform Admin | User with `isPlatformAdmin = true` | `redirectUrl === '/admin'` | **PASS** |
| 12 | Role Resolver: Dealership Staff | User with `role = SALES_MANAGER` | `redirectUrl === '/dealer/crm'` | **PASS** |
| 13 | Role Resolver: Customer | User with `BuyerProfile` | `redirectUrl === '/account/garage'` | **PASS** |
| 14 | Platform Admin User Governance | Admin updates user status to `SUSPENDED` | HTTP 200, user status mutated | **PASS** |
| 15 | Last Platform Admin Protection | Attempt to demote/disable last admin | HTTP 400 Bad Request (`CANNOT_DEMOTE_LAST_ADMIN`) | **PASS** |
| 16 | Instant Session Revocation | Admin revokes all user sessions | HTTP 200, sessions purged from PostgreSQL | **PASS** |

---

## 3. Database RLS Verification Gate (`rls-isolation.test.ts`)

| Category | Target Policy | Tested Invariant | Result |
| :--- | :--- | :--- | :---: |
| **Composite FK Integrity** | Branch Linking | Rejects linking branch across differing `tenant_id` | **PASS** |
| **Composite FK Integrity** | Lead Linking | Rejects linking lead to vehicle belonging to another dealer | **PASS** |
| **Dealer Asset Isolation** | Vehicles Table | Dealer A cannot read Dealer B private stock | **PASS** |
| **Dealer Asset Isolation** | Vehicles Table | Dealer A cannot update or delete Dealer B stock | **PASS** |
| **Buyer Profile Isolation**| BuyerProfiles Table | Buyer A cannot inspect Buyer B contact details or garage | **PASS** |
| **Public Projection** | Listings Table | Public can query available published listings | **PASS** |
| **Sold Unpublish** | Listings Table | Sold vehicles are immediately omitted from public view | **PASS** |
| **Platform Admin Audit** | Cross-Tenant Audit | Verified platform admin can inspect records with audit trace | **PASS** |

---

## 4. Frontend Compilation & BasePath Verification

| Application | Configured basePath | Ingress URL Pattern | Build Output Status |
| :--- | :--- | :--- | :---: |
| `apps/marketplace` | None (`/`) | `https://automotive-os.ae/` | **PASS** (18 static/dynamic routes) |
| `apps/dealer` | `/dealer` | `https://automotive-os.ae/dealer/*` | **PASS** (17 static/dynamic routes) |
| `apps/admin` | `/admin` | `https://automotive-os.ae/admin/*` | **PASS** (11 static/dynamic routes) |
| `apps/api` | None (`/api`) | `https://automotive-os.ae/api/*` | **PASS** (NestJS TypeScript build) |
