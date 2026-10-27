# CF-07: Existing System Authentication, RBAC & Architecture Audit

**Status:** Completed  
**Branch:** `feature/cf07-unified-auth-rbac`  
**Baseline Commit:** `0103a62` (Merged PR #21)  
**Date:** 2026-10-27  
**Author:** Principal Software Architect & Security Lead (Google Antigravity)

---

## 1. Executive Summary & Audit Scope

Mission CF-07 transitions Automotive OS from siloed, per-application authentication interfaces and mock redirections to an enterprise, single-domain, unified authentication and role-based access control (RBAC) architecture.

This audit evaluates the codebase at `origin/main` (commit `0103a62`) across:
1. **Authentication & Registration**: Current NestJS `AuthService` and Next.js frontend pages.
2. **Database Schema & RLS**: Existing Prisma schema, PostgreSQL row-level security (RLS), and session models.
3. **Guards & Middleware**: NestJS `TenantAccessGuard`, `PlatformAdminGuard`, and Next.js edge middleware.
4. **Role System**: Current representations of the 13 platform and dealership roles.
5. **Session & Token Management**: Current JWT issuance, verification, and cookie handling.
6. **Application Routing & Deployment**: Multi-zone ingress, subdomains vs. single-domain path routing, and Railway staging configurations.

---

## 2. Existing Authentication & Registration Implementation

### 2.1 Backend (`apps/api/src/auth`)
- **`AuthService` (`auth.service.ts`)**:
  - Implements `validateOidcPayload(payload: OidcJwtPayload)` for UAE PASS / OIDC subject resolution.
  - Automatically provisions a `User` + `BuyerProfile` if the subject does not exist.
  - Rejects `pending_reg_*` subjects with `UnauthorizedException`.
  - Implements `registerVipLead(dto: RegisterVipLeadDto)` enforcing UAE Federal PDPL consent (Law No. 45/2021). It creates unverified accounts with `pending_reg_*` identity subjects to prevent account takeover without OIDC/email verification.
  - Implements `generateDevToken(...)` which is gated strictly to `NODE_ENV !== 'production' && NODE_ENV !== 'staging'`.
- **`AuthController` (`auth.controller.ts`)**:
  - Exposes `POST /api/v1/auth/token` (development token only, throws `ForbiddenException` in staging/prod).
  - Exposes `POST /api/v1/auth/register` (VIP intake).
  - **Gaps**: Lacks standard `/login` credential validation, `/me` profile introspection for authenticated sessions, `/logout`, and `/invite/accept` workflows.
- **`JwtStrategy` (`jwt.strategy.ts`)**:
  - Uses `ExtractJwt.fromAuthHeaderAsBearerToken()`.
  - Enforces mandatory `JWT_SECRET` in production/staging (preventing default secrets).
  - Validates issuer (`https://auth.autonexa.ae`) and audience (`autonexa-api`).
  - **Gaps**: Does not extract tokens from HTTP-only browser cookies (`ao_session`), preventing seamless browser navigation across Next.js apps without client-side Bearer header injection.

### 2.2 Frontend Applications
- **`apps/marketplace/app/auth/login/page.tsx`**:
  - UI provides persona selector (`vip`, `dealer`, `escrow`).
  - Implements mock `setTimeout` that redirects to `http://localhost:3001/dashboard` (dealer) or `http://localhost:3002/disputes` (admin).
  - Hardcodes localhost ports, breaking staging deployments (`automotive-marketplace-staging.up.railway.app`).
- **`apps/marketplace/app/auth/register/page.tsx`**:
  - Contains lead registration wizard with UAE PDPL checkbox.
  - Invokes `POST /api/v1/auth/register`, receiving `PENDING_VERIFICATION` status.
- **Missing Ingress**: No root `/auth` page exists. Navigating to `/auth` results in a Next.js 404.

---

## 3. Database Schema & RLS Policy Analysis

### 3.1 Prisma Schema (`packages/database/prisma/schema.prisma`)
- **`User` Model**:
  ```prisma
  model User {
    id              String        @id @default(uuid()) @db.Uuid
    identitySubject String        @unique @map("identity_subject")
    email           String?       @unique
    phoneE164       String?       @unique @map("phone_e164")
    displayName     String        @map("display_name")
    isPlatformAdmin Boolean       @default(false) @map("is_platform_admin")
    createdAt       DateTime      @default(now()) @map("created_at")
    updatedAt       DateTime      @updatedAt @map("updated_at")
    buyer           BuyerProfile?
    memberships     Membership[]
    ...
  }
  ```
- **Identified Gaps on `User`**:
  1. No `passwordHash` field for local/fallback credential authentication.
  2. No `status` enum (`ACTIVE`, `SUSPENDED`, `DISABLED`, `PENDING_VERIFICATION`).
  3. No `emailVerifiedAt` timestamp.
  4. No `failedLoginAttempts` or `lockedUntil` for brute-force mitigation.
  5. No `mfaSecret` or `mfaEnabled` fields for mandatory administrator 2FA.
  6. No `Session` model for revoking compromised user sessions or tracking devices.
  7. No `UserInvitation` model for secure dealer staff / admin onboarding.

### 3.2 Row-Level Security (RLS) Enforcement
- Verified migration `20261020140500_enable_rls_and_app_role`:
  - Runtime application role `automotive_app_user` with `NOBYPASSRLS`.
  - Context helpers: `app.current_tenant_uuid()`, `app.current_user_uuid()`, `app.is_platform_admin()`.
  - Dealer tables (`branches`, `memberships`, `vehicles`, `vehicle_media`, `listings`, `leads`, `lead_data_grants`, `appointments`, `subscriptions`, `dealer_verifications`) have `FORCE ROW LEVEL SECURITY` with `tenant_isolation` policy:
    ```sql
    tenant_id = app.current_tenant_uuid() OR app.is_platform_admin()
    ```
  - Buyer tables (`buyer_profiles`, `favorites`, `saved_searches`) have `buyer_isolation`:
    ```sql
    user_id = app.current_user_uuid() OR app.is_platform_admin()
    ```
  - **Verdict**: RLS policies are architecturally sound and non-bypassable. Schema changes for CF-07 must preserve all RLS policies and add explicit RLS to new `sessions` and `user_invitations` tables.

---

## 4. Next.js Middleware & NestJS Guards

### 4.1 NestJS Guards (`apps/api/src/common/guards`)
- **`TenantAccessGuard`**:
  - Strictly reads `:tenantId` from route parameters.
  - Allows platform admin override (`isPlatformAdmin: true` sets `store.isAdmin = true`).
  - Cross-references tenant membership from the authenticated user token; rejects invalid or non-member tenants with `403 TENANT_FORBIDDEN`.
  - Validates `membership.active === true` and `tenant.status === 'ACTIVE'`.
  - Checks fine-grained roles via `REQUIRED_ROLES_KEY` decorator.
- **`PlatformAdminGuard`**:
  - Verifies `user.isPlatformAdmin === true`.
  - Sets `store.isAdmin = true` and `store.userId = user.id` in AsyncLocalStorage context storage.

### 4.2 Next.js Edge Middleware
- **`apps/admin/middleware.ts`**:
  - Implements perimeter gate using Cloudflare Access JWT verification (`cf-access-jwt-assertion`) or HTTP Basic Auth (`ADMIN_AUTH_USER`, `ADMIN_AUTH_PASSWORD`).
  - Fails closed in production/staging if credentials are unset.
- **`apps/marketplace` & `apps/dealer`**:
  - No edge middleware exists. Unauthenticated requests to private dealer pages rely solely on client-side checks or API rejection.

---

## 5. 13 Roles & Authorization Matrix

The platform specifies 13 distinct roles across 4 tiers:

| Tier | Role Key | Storage Mechanism | Permission Scope |
|---|---|---|---|
| **Platform** | `PLATFORM_ADMIN` | `User.isPlatformAdmin = true` | Universal read/write, tenant creation, user suspension, audit log access |
| **Dealership** | `OWNER` | `Membership.role = OWNER` | Dealership settings, billing, staff management, full inventory/leads |
| **Dealership** | `ADMIN` | `Membership.role = ADMIN` | Operational dealership administration, staff management, inventory/leads |
| **Dealership** | `SALES_MANAGER` | `Membership.role = SALES_MANAGER` | Pricing approval, lead assignment, stock management, sales pipeline |
| **Dealership** | `SALES_AGENT` | `Membership.role = SALES_AGENT` | Assigned leads, view inventory, log test drives, offer creation |
| **Dealership** | `INVENTORY_MANAGER`| `Membership.role = INVENTORY_MANAGER` | Vehicle intake, media management, stock appraisal, listing publishing |
| **Dealership** | `SERVICE_ADVISOR` | `Membership.role = SERVICE_ADVISOR` | Service bookings, vehicle inspection notes, repair orders |
| **Dealership** | `FINANCE_MANAGER` | `Membership.role = FINANCE_MANAGER` | Escrow verification, bank financing docs, invoice generation |
| **Dealership** | `VIEWER` | `Membership.role = VIEWER` | Read-only dealership stock and report access |
| **Customer** | `BUYER` | `User.buyer != null` | Marketplace browsing, saved cars, test drive requests, garage dossier |
| **Account State**| `DISABLED` | `User.status = DISABLED` | Complete login denial across all interfaces |
| **Account State**| `SUSPENDED` | `User.status = SUSPENDED` | Login redirects to `/access-suspended`; all API actions blocked |
| **Tenant State** | `SUSPENDED_TENANT`| `Tenant.status = SUSPENDED` | Dealership staff blocked with `TENANT_INACTIVE` error |

---

## 6. Single-Domain Multi-Zone Routing Analysis

### Current Ingress Architecture:
- Staging deploys 4 distinct services on Railway:
  - Marketplace: `https://automotive-marketplace-staging.up.railway.app`
  - Dealer: `https://automotive-dealer-staging.up.railway.app`
  - Admin: `https://automotive-admin-staging.up.railway.app`
  - API: `https://api-staging.syedhasnat.com`
- Cross-origin navigation between subdomains causes cookie partitioning unless cookies are scoped with explicit domain attributes or proxied through a single origin.

### Target Single-Domain Routing Plan:
1. **Public Origin**: Primary traffic enters through Marketplace at root domain (`/`).
2. **Path Mapping**:
   - `/` $\rightarrow$ Marketplace home, catalog (`/cars`), directory (`/dealers`)
   - `/auth` $\rightarrow$ Unified Login & Customer Registration
   - `/dashboard` $\rightarrow$ Post-login role-based routing resolver
   - `/dealer/*` $\rightarrow$ Dealer Portal (via `basePath: '/dealer'` and Next.js rewrites)
   - `/admin/*` $\rightarrow$ Platform Admin Portal (via `basePath: '/admin'` and Next.js rewrites)
   - `/api/*` $\rightarrow$ NestJS Modular Monolith API (via Next.js rewrites)
3. **Session Cookie**:
   - Cookie name: `ao_session`
   - Attributes: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
   - Shared transparently across all path prefixes without cross-subdomain CORS or cookie partitioning issues.

---

## 7. Platform Admin Bootstrap Strategy

To maintain zero-trust security and prevent account takeover:
- Designated admin emails:
  1. `hasnathaider332@gmail.com`
  2. `hasnatshah230@gmail.com`
- **Zero Default Passwords**:
  - An administrative bootstrap script (`scripts/bootstrap-platform-admins.ts`) will idempotently verify or create these accounts with `isPlatformAdmin: true` and `status: PENDING_VERIFICATION`.
  - It generates a cryptographically random (256-bit entropy) single-use invitation token valid for 24 hours.
  - The administrator must complete activation by verifying their email and setting their initial secure password.
  - No plain-text passwords or deterministic seeds will ever be committed to git or printed to console.

---

## 8. Summary of Additive Modifications Required

1. **Prisma**:
   - Add `UserStatus` enum.
   - Add fields to `User`: `passwordHash`, `status`, `emailVerifiedAt`, `mfaSecret`, `mfaEnabled`, `failedLoginAttempts`, `lockedUntil`.
   - Add `Session` model.
   - Add `UserInvitation` model.
2. **API (`apps/api`)**:
   - Add scrypt password hashing utility (`apps/api/src/auth/password.util.ts`).
   - Implement `/api/v1/auth/login`, `/api/v1/auth/signup` (customer only), `/api/v1/auth/me`, `/api/v1/auth/logout`.
   - Implement cookie extraction in `JwtStrategy`.
   - Implement platform admin user management endpoints under `/api/v1/admin/users`.
   - Implement platform admin dealership management endpoints under `/api/v1/admin/dealers`.
3. **Frontend Multi-Zone**:
   - `apps/dealer`: Set `basePath: '/dealer'`.
   - `apps/admin`: Set `basePath: '/admin'`.
   - `apps/marketplace`: Configure Next.js rewrites for `/dealer/:path*`, `/admin/:path*`, and `/api/:path*`.
   - Implement `/auth` (Login & Customer Signup tabs).
   - Implement `/dashboard` role resolver.
   - Implement `/admin/users` and `/admin/dealers` management dashboards.
4. **Verification**:
   - Full test suite, static typecheck, and Playwright verification.
