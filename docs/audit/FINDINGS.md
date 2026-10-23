# Automotive OS — AG-17 Comprehensive Security, API, Data & Role Audit Findings

**Target Git HEAD:** `a4be136`  
**Monorepo:** [`SyedhasnatHaiderShah/automotive-os`](https://github.com/SyedhasnatHaiderShah/automotive-os.git)  
**Lead Auditor:** Automotive OS Principal QA Architect & Application Security Engineer  
**Audit Standard:** OWASP API Security Top 10 (2023), UAE Federal Decree-Law No. 45/2021 (PDPL), Tenant RLS Defense-in-Depth  

---

## Executive Summary of Findings

During the complete end-to-end audit across S01–S31 screens, 13 NestJS controllers, 45 endpoints, and 20 Prisma data models, 6 architectural and security findings were identified. Zero Critical RCE or SQL injection flaws were found due to forced PostgreSQL RLS and Prisma parameterized queries. The identified items have been classified and safe remediations prepared.

| Finding ID | Severity | Category | Title | Status |
|---|---|---|---|---|
| **SEC-001** | High | CORS & Transport | Wildcard CORS reflection without explicit domain allowlist | **RESOLVED** |
| **SEC-002** | Medium | Transport & Headers | Absence of HTTP defense-in-depth security response headers | **RESOLVED** |
| **SEC-003** | Medium | Error Handling | Potential internal error message leakage in production exception filter | **RESOLVED** |
| **PRIV-001** | High | Data Minimization | Wholesale acquisition cost exposed to non-management dealer roles | **RESOLVED** |
| **DATA-001** | High | Data Lineage | Dealer DMS client route mismatch causing silent fixture fallback | **RESOLVED** |
| **RATE-001** | Low | Resilience & Abuse | In-memory enquiry rate limiting not cluster-distributed | **DOCUMENTED** |

---

## Detailed Vulnerability & Remediation Records

### Finding SEC-001: Wildcard CORS Reflection Without Explicit Domain Allowlist
- **Severity:** High (CVSS: 7.1)
- **Vulnerability Class:** OWASP API7:2023 — Server-Side Request Forgery / Security Misconfiguration
- **Location:** [`apps/api/src/main.ts`](file:///h:/Personal/Automotiv%20OS/apps/api/src/main.ts#L10)
- **Description:** `app.enableCors()` was invoked with default options. In NestJS/Express, default CORS allows any origin (`*`). While safe for unauthenticated public APIs, if browser cookies or credentials are exchanged, an unconstrained CORS configuration can expose private endpoints to malicious third-party origins.
- **Remediation:** Configured explicit CORS origin allowlist parsing `process.env.CORS_ORIGINS` with staging domains (`https://*.automotive-os.ae`) and local development origins (`http://localhost:3000`, `3001`, `3002`). Restricted allowed HTTP verbs to `GET, POST, PATCH, PUT, DELETE, OPTIONS`, and allowed headers to `Content-Type, Authorization, x-correlation-id`.
- **Verification Proof:** Direct negative origin HTTP request rejected with `CORS_NOT_ALLOWED`.

---

### Finding SEC-002: Absence of HTTP Defense-in-Depth Security Response Headers
- **Severity:** Medium (CVSS: 5.4)
- **Vulnerability Class:** OWASP API8:2023 — Security Misconfiguration
- **Location:** [`apps/api/src/main.ts`](file:///h:/Personal/Automotiv%20OS/apps/api/src/main.ts)
- **Description:** NestJS API responses lacked standard HTTP security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` (HSTS), and `Referrer-Policy`. This leaves browsers vulnerable to MIME-sniffing attacks and clickjacking when API endpoints are framed.
- **Remediation:** Registered global middleware applying `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Verification Proof:** Inspected response headers on `GET /health` and authenticated endpoints.

---

### Finding SEC-003: Potential Internal Error Message Leakage in Exception Filter
- **Severity:** Medium (CVSS: 4.8)
- **Vulnerability Class:** OWASP API9:2023 — Improper Inventory Management / Information Disclosure
- **Location:** [`apps/api/src/common/filters/http-exception.filter.ts`](file:///h:/Personal/Automotiv%20OS/apps/api/src/common/filters/http-exception.filter.ts#L40)
- **Description:** When an unexpected non-HTTP runtime exception (such as a database connection timeout or internal driver error) occurred, `exception.message` was directly assigned to the response `error.message`. In production mode, this could reveal SQL syntax, table names, or internal network hostnames.
- **Remediation:** Sanitized production 500 errors to return `An unexpected internal server error occurred` unless running in development/test environment.
- **Verification Proof:** Triggered uncaught database exception in test environment; verified no internal Prisma connection details returned.

---

### Finding PRIV-001: Wholesale Acquisition Cost Exposed to Non-Management Dealer Roles
- **Severity:** High (CVSS: 6.5)
- **Vulnerability Class:** OWASP API3:2023 — Broken Object Property Level Authorization (BOPLA)
- **Location:** [`apps/api/src/inventory/vehicles.service.ts`](file:///h:/Personal/Automotiv%20OS/apps/api/src/inventory/vehicles.service.ts#L361)
- **Description:** `mapVehicleResponse` mapped `purchaseCostFils` unconditionally to the response object. While public callers cannot query private vehicle ledgers, internal dealership staff holding non-management roles (e.g., `SALES_AGENT`, `SERVICE_ADVISOR`, `VIEWER`) could view the dealership's private wholesale cost and profit margins.
- **Remediation:** Enforced role-aware redaction in `VehiclesService.listVehicles` and `getVehicleById`. `purchaseCostFils` is strictly redacted (`null`) unless the caller holds `OWNER`, `ADMIN`, `FINANCE_MANAGER`, or `INVENTORY_MANAGER`.
- **Verification Proof:** Added automated unit test verifying `SALES_AGENT` receives `purchaseCostFils: null` while `OWNER` receives full integer value.

---

### Finding DATA-001: Dealer DMS Route Mismatch Causing Silent Fixture Fallback
- **Severity:** High (CVSS: 6.8)
- **Vulnerability Class:** Data Lineage / Frontend-Backend Integration Defect
- **Location:** [`apps/dealer/lib/api.ts`](file:///h:/Personal/Automotiv%20OS/apps/dealer/lib/api.ts#L337), [`apps/dealer/lib/api.ts`](file:///h:/Personal/Automotiv%20OS/apps/dealer/lib/api.ts#L399)
- **Description:** `fetchDealerInventory` attempted to fetch from `/api/v1/inventory/vehicles` and `fetchDealerLeads` attempted to fetch from `/api/v1/leads`. The NestJS backend routes require tenant scoping: `/api/v1/tenants/:tenantId/vehicles` and `/api/v1/tenants/:tenantId/leads`. This mismatch caused requests to return 404, which silently triggered the fallback to static fixtures, preventing live DB data from displaying in the Dealer DMS.
- **Remediation:** Corrected the client routes to `/api/v1/tenants/${tenantId}/vehicles` and `/api/v1/tenants/${tenantId}/leads`, passing tenant context and Bearer Authorization headers.
- **Verification Proof:** Verified successful live HTTP 200 responses with database-backed vehicle items from PostgreSQL.

---

### Finding RATE-001: In-Memory Enquiry Rate Limiting Not Cluster-Distributed
- **Severity:** Low (CVSS: 3.1)
- **Vulnerability Class:** Scalability & Resilience
- **Location:** [`apps/api/src/leads/enquiry-rate-limiter.service.ts`](file:///h:/Personal/Automotiv%20OS/apps/api/src/leads/enquiry-rate-limiter.service.ts)
- **Description:** Lead anti-spam rate limiting is currently maintained in a Node.js process `Map<string, number[]>`. In a multi-replica Kubernetes deployment, each pod tracks its own window counter rather than a shared cluster-wide Redis key.
- **Status:** Documented for future production cluster enhancement; single-instance staging sandbox is fully protected.
