# Role-Based Access Control (RBAC) & Post-Auth Routing Matrix

**Document:** `ROLE_ACCESS_MATRIX.md`  
**Standard:** 13 Enterprise Roles Across Platform Admin, Dealership Operations, and Public Buyer Subsystems  
**Enforcement Layers:** Next.js Edge Middleware, NestJS Auth & Role Guards, PostgreSQL Row-Level Security  
**Status:** FULLY ENFORCED & VERIFIED

---

## 1. Enterprise Role Taxonomy

Automotive OS defines 13 canonical roles divided into three operational domains:

### Platform Administration (Global Domain)
1. **`PLATFORM_ADMIN` / `SUPER_ADMIN`**: Global system governance, dealership accreditation, user lifecycle, platform audit logs.
2. **`PLATFORM_SUPPORT`**: Read-only platform telemetry, assistance docket triage, KYB preliminary review.

### Dealership Operations (Tenant Domain - Multi-Tenant)
3. **`DEALER_PRINCIPAL` / `OWNER`**: Legal license holder, financial overview, contract signer, full dealership administration.
4. **`GENERAL_MANAGER`**: Overall showroom operations, staff management, margin and inventory oversight.
5. **`SALES_MANAGER`**: CRM pipelines, lead assignment, deal desk approval, sales performance.
6. **`SALES_AGENT`**: Lead engagement, test drive scheduling, customer quotation drafting.
7. **`INVENTORY_MANAGER`**: Vehicle stock intake, Tasjeel RTA inspection coordination, chassis appraisal, pricing updates.
8. **`FINANCE_INSURANCE_MANAGER`**: Bank loan pre-approvals, Islamic finance underwriting, motor insurance policy integration.
9. **`COMPLIANCE_OFFICER`**: Anti-Money Laundering (AML) checks, KYB Trade License verification, statutory audit logging.
10. **`AFTER_SALES_SERVICE`**: Service bookings, warranty claims, service package redemptions.
11. **`DIGITAL_MARKETING`**: Listing promotion, syndicated social media campaigns, analytics review.
12. **`DEALER_STAFF` (General)**: Baseline read-only showroom assistant.

### Public Buyer Domain (Global Consent-Scoped)
13. **`BUYER`**: Public customer account, saved searches, vehicle alerts, finance pre-qualification requests, appointment booking.

---

## 2. Post-Authentication `/dashboard` Redirection Matrix

When an authenticated user lands on `/dashboard`, the server inspects the user's primary membership and permissions, issuing an immediate permanent or temporary redirect according to the following matrix:

| Primary Role / Attribute | Priority | Destination Route | Rationale |
| :--- | :--- | :--- | :--- |
| `isPlatformAdmin === true` | 1 | `/admin` | Direct entry to sovereign governance cockpit |
| `DEALER_PRINCIPAL` / `OWNER` | 2 | `/dealer/analytics` | Executive dealership financial and operational summary |
| `GENERAL_MANAGER` | 2 | `/dealer/overview` | General showroom performance overview |
| `SALES_MANAGER` | 3 | `/dealer/crm` | Deal desk, CRM pipelines, and active negotiations |
| `SALES_AGENT` | 3 | `/dealer/crm` | Assigned customer leads and scheduled appointments |
| `INVENTORY_MANAGER` | 3 | `/dealer/inventory` | Vehicle stock management and listing syndication |
| `FINANCE_INSURANCE_MANAGER` | 3 | `/dealer/finance` | Loan originations and insurance dockets |
| `COMPLIANCE_OFFICER` | 3 | `/dealer/compliance` | AML dossiers and KYB license renewals |
| Other Dealership Staff | 4 | `/dealer` | Showroom home dashboard |
| `BUYER` (Customer) | 5 | `/account/garage` | Personal vehicle garage, saved listings, and inquiries |
| Unauthenticated / Invalid | - | `/auth?tab=login` | Redirected with preservation of target URL parameter |

---

## 3. Protected Route Authorization Grid

| Route | Minimum Role Required | Next.js Edge Middleware Gate | NestJS API Endpoint Gate | PostgreSQL RLS Policy |
| :--- | :--- | :--- | :--- | :--- |
| **`/admin`** | `PLATFORM_ADMIN` | `verify-admin-session` | `@Roles('PLATFORM_ADMIN')` | Global schema access |
| **`/admin/users`** | `PLATFORM_ADMIN` | `verify-admin-session` | `@Roles('PLATFORM_ADMIN')` | Global User table |
| **`/admin/dealers`** | `PLATFORM_ADMIN` | `verify-admin-session` | `@Roles('PLATFORM_ADMIN')` | Global Tenant table |
| **`/admin/audit-logs`** | `PLATFORM_ADMIN` | `verify-admin-session` | `@Roles('PLATFORM_ADMIN')` | Global AuditLog table |
| **`/dealer`** | Active Dealer Membership | Session verification | `@TenantAuth()` | `tenant_id = current_tenant` |
| **`/dealer/inventory`** | Inventory / Sales / Owner | Session verification | `@RequirePermission('inventory:view')` | `dealer_stock` RLS isolation |
| **`/dealer/crm`** | Sales / Owner | Session verification | `@RequirePermission('leads:manage')` | `lead_assignment` RLS isolation |
| **`/dealer/finance`** | Finance / Owner | Session verification | `@RequirePermission('finance:view')` | `deal_finance` RLS isolation |
| **`/account/*`** | `BUYER` | Session verification | `@RequireBuyer()` | `buyer_profile` user ownership |
| **`/cars`, `/dealers`** | Public (Unauthenticated) | None (Public Edge Cache) | Public Read API | Approved published stock only |

---

## 4. Cross-Tenant Denial & Status Lockdown Matrix

| Security Condition | Observed Behavior | HTTP Code | UI Screen |
| :--- | :--- | :--- | :--- |
| Cross-Tenant Data Fetch | RLS policy blocks foreign tenant rows | `200 OK (0 rows)` or `404` | Empty state / Not found |
| User Status: `PENDING_VERIFICATION` | Login rejected until verification link is consumed | `403 EMAIL_NOT_VERIFIED` | Email verification required notice |
| User Status: `SUSPENDED` | All sessions terminated; access to any protected route blocked | `403 ACCOUNT_SUSPENDED` | `/access-suspended` |
| User Status: `DISABLED` | Account permanently locked | `403 ACCOUNT_DISABLED` | `/access-denied` |
| Dealership Tenant: `SUSPENDED` | Dealer staff cannot access dealer console; listings unlisted | `403 TENANT_SUSPENDED` | `/access-suspended?reason=tenant_suspended` |
