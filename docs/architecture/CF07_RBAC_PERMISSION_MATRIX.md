# CF-07: Role-Based Access Control (RBAC) & Permission Matrix

## 1. Overview & Hierarchy

Automotive OS enforces multi-tenant defense-in-depth authorization across 13 defined roles. Access control is verified at three distinct layers:
1. **Frontend App & Route Navigation**: Next.js App Router middleware and server-side redirects at `/dashboard`.
2. **NestJS Modular API Guards**: Token verification (`JwtAuthGuard`), tenant membership validation (`TenantAccessGuard`), and platform admin validation (`PlatformAdminGuard`).
3. **PostgreSQL Row-Level Security (RLS)**: Enforced directly on the database engine using non-bypass database roles (`automotive_app_user`) and transaction-scoped configuration variables (`SET LOCAL app.current_tenant_id`).

---

## 2. Complete Role Definition & Capabilities

| Role Code | Tier | Scope | Description |
| :--- | :--- | :--- | :--- |
| `PLATFORM_ADMIN` | Platform | Global | System operator with full supervisory privileges across all dealerships, users, moderation queues, and audit logs. Protected against self-demotion or disabling the last active admin. |
| `OWNER` | Dealership | Tenant | Primary commercial license holder for a dealership tenant. Unrestricted operational, financial, and staff authority within that specific tenant. |
| `ADMIN` | Dealership | Tenant | General dealership executive with administrative privileges over inventory, leads, CRM, staff management, and branch locations. |
| `SALES_MANAGER` | Dealership | Tenant | Sales team leader with authority to assign leads, view and approve deal structures, modify vehicle listing pricing, and manage sales agents. |
| `SALES_AGENT` | Dealership | Tenant | Sales representative with access to assigned buyer leads, test drive scheduling, customer communication, and inventory inspection. |
| `INVENTORY_MANAGER`| Dealership | Tenant | Vehicle stock specialist with authority to intake vehicles, manage specifications, upload media, inspect appraisals, and request listing publication. |
| `SERVICE_ADVISOR` | Dealership | Tenant | Aftersales workshop coordinator handling repair orders, service bookings, vehicle check-in, parts requisitions, and job status updates. |
| `FINANCE_MANAGER` | Dealership | Tenant | F&I officer handling banking pre-approvals, financing applications, insurance integrations, tax settlement, and payment reconciliation. |
| `COMPLIANCE_OFFICER`| Dealership | Tenant | Regulatory officer reviewing vehicle title clearances, RTA broker disclosures, VAT compliance, and consumer contracts. |
| `MARKETING_SPECIALIST`| Dealership | Tenant | Marketing personnel managing syndication channels, promotional banners, feature placement, and analytics reports. |
| `ANALYST` | Dealership | Tenant | Business intelligence user with read-only access to sales velocity, turnover days, margin trends, and conversion analytics. |
| `VIEWER` | Dealership | Tenant | Read-only dealership user (auditor, partner, or trainee) permitted to inspect stock and pipeline without mutation rights. |
| `BUYER` | Consumer | Global | Public consumer identity holding a `BuyerProfile`, managing virtual garage items, saving listings, and submitting lead inquiries with explicit consent. |

---

## 3. Comprehensive Feature & Route Permission Matrix

| Feature / Workspace | Route / Endpoint | `PLATFORM_ADMIN` | `OWNER` / `ADMIN` | `SALES_MANAGER` | `SALES_AGENT` | `INVENTORY_MGR` | `FINANCE_MGR` | `SERVICE_ADV` | `VIEWER` | `BUYER` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Marketplace** | `/`, `/cars`, `/dealers` | Read | Read | Read | Read | Read | Read | Read | Read | Read |
| **Buyer Garage & Saved**| `/account/garage`, `/account/saved` | Read | Read | Read | Read | Read | Read | Read | Read | Full (Own) |
| **Customer Enquiries** | `/cars/:slug/enquire` | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Create |
| **Post-Auth Resolver** | `/dashboard` | Resolve | Resolve | Resolve | Resolve | Resolve | Resolve | Resolve | Resolve | Resolve |
| **Dealer Cockpit** | `/dealer` | Read (All) | Full | Full | Read | Read | Read | Read | Read | Denied |
| **Dealer Inventory** | `/dealer/inventory` | Read (All) | Full | Read/Price | Read | Full | Read | Read | Read | Denied |
| **Dealer CRM & Deals** | `/dealer/crm`, `/dealer/sales`| Read (All) | Full | Full | Assigned | Denied | Read | Denied | Read | Denied |
| **Dealer Leads Desk** | `/dealer/leads` | Read (All) | Full | Full | Assigned | Denied | Denied | Denied | Read | Denied |
| **Dealer F&I Banking** | `/dealer/finance` | Read (All) | Full | Read | Denied | Denied | Full | Denied | Read | Denied |
| **Dealer Workshop** | `/dealer/workshop` | Read (All) | Full | Denied | Denied | Denied | Denied | Full | Read | Denied |
| **Dealer Parts Dept** | `/dealer/parts` | Read (All) | Full | Denied | Denied | Denied | Denied | Full | Read | Denied |
| **Dealer Accounting** | `/dealer/accounting` | Read (All) | Full | Denied | Denied | Denied | Read/Export| Denied | Denied | Denied |
| **Platform Console** | `/admin` | Full | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied |
| **User Governance** | `/admin/users` | Full | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied |
| **Dealership Governance**| `/admin/dealers` | Full | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied |
| **Moderation Queue** | `/admin/moderation` | Full | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied |
| **Audit Ledger** | `/admin/audit-logs` | Full | Denied | Denied | Denied | Denied | Denied | Denied | Denied | Denied |

---

## 4. API Guard Enforcement Architecture

### 1. `JwtAuthGuard`
- Applied globally across private endpoints.
- Verifies JWT signature against `JWT_SECRET`.
- Extracts `ao_session` cookie or `Bearer` token.
- Validates user status (`ACTIVE` vs `SUSPENDED` / `DISABLED`).

### 2. `PlatformAdminGuard`
- Attached to `/api/v1/admin/*` endpoints.
- Inspects `req.user.isPlatformAdmin === true`.
- If falsy, immediately halts execution with `403 Forbidden` (`PLATFORM_ADMIN_REQUIRED`).
- Bypasses tenant RLS restrictions through trusted system operations context while preserving immutable audit logs.

### 3. `TenantAccessGuard`
- Attached to `/api/v1/dealer/*` and private operational endpoints.
- Resolves target `tenantId` from route params or headers.
- Checks `req.user.memberships` for an active membership matching `tenantId`.
- Rejects cross-tenant requests with `403 Forbidden` (`TENANT_ACCESS_DENIED`).
- Sets PostgreSQL transaction context `SET LOCAL app.current_tenant_id = $tenantId`.

---

## 5. Defense-in-Depth RLS Enforcement

Even if a frontend route or API guard were misconfigured, the database engine guarantees that tenant boundaries remain intact:

```sql
-- Example RLS Policy for operational inventory table:
CREATE POLICY inventory_tenant_isolation ON vehicles
  FOR ALL
  TO automotive_app_user
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_platform_admin', true), 'false')::boolean IS TRUE
  );
```

- When an unprivileged database connection queries `vehicles`, PostgreSQL restricts rows strictly to `tenant_id`.
- The database connection runs as `automotive_app_user` with `NOBYPASSRLS`.
- Cross-tenant data exfiltration is mathematically impossible at the database engine level.
