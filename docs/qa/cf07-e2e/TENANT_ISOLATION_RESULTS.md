# PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation Results

**Document:** `TENANT_ISOLATION_RESULTS.md`  
**Security Standard:** Defense-in-Depth PostgreSQL 16 Row-Level Security with Non-Bypass User  
**Test Suite:** `packages/database/test/rls.test.ts` & Backup Suite  
**Overall Status:** ALL 30 DATABASE TESTS PASS (16/16 RLS + 14/14 Backup)

---

## 1. Tenancy Model & Threat Vectors

Automotive OS enforces multi-tenancy at both the application layer (NestJS AuthGuards) and the database storage layer (PostgreSQL Row-Level Security). This ensures that even if an application vulnerability or SQL injection vector were present, PostgreSQL prevents cross-tenant data leakage.

### Security Guarantees
1. **Tenant ID on Operational Rows:** All operational tables (`VehicleListing`, `DealerStock`, `Lead`, `DealFinance`, `Membership`, etc.) include a non-nullable `tenant_id` foreign key.
2. **Session Context Injection:** Before executing operational queries, NestJS transaction pools set the current tenant context:
   ```sql
   SET LOCAL app.current_tenant_id = 'tenant-uuid';
   ```
3. **Non-Bypass Role:** Application database connections connect via `automotive_app_user`, which strictly lacks the `BYPASSRLS` attribute.
4. **Composite Tenant-Safe Foreign Keys:** Cascades and joins are scoped with `(tenant_id, id)` composite constraints to prevent cross-tenant record tampering.

---

## 2. Row-Level Security Policy Matrix

| Table | Policy Name | Command | Policy Definition | Verified Result |
| :--- | :--- | :--- | :--- | :--- |
| `DealerStock` | `dealer_stock_tenant_isolation` | ALL | `tenant_id = current_setting('app.current_tenant_id', true)::uuid` | **PASS (Cross-tenant blocked)** |
| `Lead` | `lead_tenant_isolation` | ALL | `tenant_id = current_setting('app.current_tenant_id', true)::uuid` | **PASS (Cross-tenant blocked)** |
| `DealFinance` | `deal_finance_tenant_isolation` | ALL | `tenant_id = current_setting('app.current_tenant_id', true)::uuid` | **PASS (Cross-tenant blocked)** |
| `Membership` | `membership_tenant_isolation` | ALL | `tenant_id = current_setting('app.current_tenant_id', true)::uuid` | **PASS (Cross-tenant blocked)** |
| `VehicleListing` (Public) | `public_listing_approved_only` | SELECT | `status = 'PUBLISHED' AND tenant.status = 'ACTIVE'` | **PASS (Draft/Suspended hidden)** |

---

## 3. Database Automated Test Suite Execution

### Command
```bash
pnpm --filter @automotive-os/database test
```

### Output Summary
```text
PASS test/rls.test.ts
  PostgreSQL Row-Level Security Suite
    ✓ enforces tenant isolation when querying DealerStock (45ms)
    ✓ rejects cross-tenant UPDATE attempts on foreign stock records (32ms)
    ✓ rejects cross-tenant DELETE attempts on foreign stock records (28ms)
    ✓ rejects cross-tenant INSERT with mismatched tenant_id (26ms)
    ✓ unsets app.current_tenant_id and blocks all access when context is missing (22ms)
    ✓ allows platform admin superuser to inspect cross-tenant records in audit mode (38ms)
    ✓ hides unverified or draft vehicle listings from public unauthenticated role (29ms)
    ✓ masks buyer contact details from unauthorized dealership staff (34ms)
    ...
    16 passed, 16 total

PASS test/backup.test.ts
    14 passed, 14 total

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        3.412 s
```

---

## 4. Cross-Tenant Attack Scenarios Verified

### Scenario 1: Forged Body Tenant ID in API Request
- **Attack:** An authenticated salesperson from Tenant A (`Dealer Alpha`) submits a lead creation payload containing `"tenant_id": "tenant-beta-uuid"`.
- **Defense:** The API ignores any client-provided `tenant_id`, deriving the tenant ID exclusively from the verified session membership. PostgreSQL RLS rejects mismatched inserts with error `42501 (insufficient_privilege)`.
- **Result:** **ATTACK PREVENTED (PASS)**.

### Scenario 2: Direct IDOR Query for Foreign Tenant Financials
- **Attack:** An authenticated user requests `GET /api/v1/dealer/finance/deal-beta-uuid` belonging to a competitor dealership.
- **Defense:** PostgreSQL evaluates `tenant_id = current_setting('app.current_tenant_id')`. The foreign row is completely invisible, returning `404 Not Found` rather than `403`, preventing ID enumeration.
- **Result:** **ATTACK PREVENTED (PASS)**.
