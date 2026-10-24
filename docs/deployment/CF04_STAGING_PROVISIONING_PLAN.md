# CF-04 — Staging Resource Provisioning Plan & Architecture Assessment

**Milestone:** CF-04 — Automotive OS Staging Provisioning  
**Repository:** `SyedhasnatHaiderShah/automotive-os`  
**Working Branch:** `feature/cf04-staging-provisioning`  
**Baseline Commit:** `main @ c665aa9ee473c42a24ca3195dc7c40341d84a6de` (PR #7)  
**Target Domain:** `syedhasnat.com`  
**Target Cloudflare Zone ID:** `a66068517320394243578be16bae68fc`  
**Target Cloudflare Account ID:** `28178d7287cf04ff563981ce8b091497`  
**Status:** **READ-ONLY AUDIT COMPLETE — STOPPED AT `CLOUD_PROVISIONING_APPROVAL`**

---

## 1. Executive Summary & Verification Findings

In compliance with `AGENTS.md` and project release governance, an exhaustive read-only inspection of Cloudflare resources, account capabilities, and DNS zone status was conducted via the authenticated Cloudflare MCP toolset.

### Live Cloudflare State Audit:
1. **Zone Status:** `syedhasnat.com` is **ACTIVE** on Cloudflare.
   - Nameservers: `bailey.ns.cloudflare.com`, `jihoon.ns.cloudflare.com`
   - Plan: Free Website ($0.00/mo)
   - Permissions Granted: Full zone edit, DNS edit, Workers edit, R2 edit, Access edit, Tunnel edit.
2. **DNS Preservation Invariant:** 5 authoritative records exist on `syedhasnat.com` (personal portfolio on apex and www, and Railway services on `api` and `app`). All 5 records are verified live (HTTP 200) and are **strictly preserved without alteration**.
3. **Cloudflare R2:** Active and operational (HTTP 200). Ready for bucket creation.
4. **Cloudflare Tunnels:** Supported under Zero Trust. Currently 0 active tunnels exist.
5. **Workers Custom Domains:** Supported under `/workers/domains`. 0 custom domains currently attached.
6. **Zero Trust Access:** Needs initial one-time dashboard activation (visiting `https://one.dash.cloudflare.com` to select the free organization team name).

---

## 2. Itemized Resource Creation Plan (Phased Execution)

Upon receiving explicit **`CLOUD_PROVISIONING_APPROVAL`**, execution will proceed through the following phased steps:

```
[Phase 1: R2 Buckets] ────────► [Phase 2: Named Cloudflare Tunnel]
          │                                     │
          ▼                                     ▼
[Attach R2 Custom Domain]             [Origin Ingress: api-staging]
          │                                     │
          └─────────────────┬───────────────────┘
                            ▼
          [Phase 3: Deploy Workers & Attach Custom Domains]
          - cars-staging.syedhasnat.com
          - dealer-staging.syedhasnat.com
          - admin-staging.syedhasnat.com
                            │
                            ▼
          [Phase 4: Zero Trust Access Application for Admin]
```

---

### Phase 1: Cloudflare R2 Object Storage Provisioning
1. **Public Vehicle Media Bucket:**
   - Bucket Name: `automotive-os-media-staging`
   - Location Hint: `weur` or default
   - Access: Public Read enabled
   - Custom Domain Attachment: `media-staging.syedhasnat.com` (attached directly via Cloudflare R2 custom domain API, avoiding synthetic `public.r2.dev` URLs)
   - CORS Configuration: Restrict allowed origins to `https://cars-staging.syedhasnat.com` and `https://dealer-staging.syedhasnat.com`.
2. **Confidential KYB / Trade License Bucket:**
   - Bucket Name: `automotive-os-kyb-staging`
   - Access: **Strictly Private** (Public access disabled, zero public custom domain, no listing)
   - Access Mechanism: AWS SigV4 Pre-signed URLs generated strictly by NestJS API (`VehiclesService`) with 15-minute expiry.
   - CORS Configuration: Restrict allowed origins to `https://dealer-staging.syedhasnat.com` and `https://admin-staging.syedhasnat.com`.

---

### Phase 2: Cloudflare Tunnel & Origin Ingress Provisioning
1. **Named Tunnel Creation:**
   - Name: `automotive-os-staging-tunnel`
   - Created via `POST /accounts/28178d7287cf04ff563981ce8b091497/cfd_tunnel`
   - Capture authentic `tunnel_id` (UUID) and secure `tunnel_secret`.
2. **Tunnel Ingress Configuration:**
   - Hostname: `api-staging.syedhasnat.com`
   - Service: `http://api:4000` (internal bridge network on origin Docker container)
   - Origin Request: Keep-alive timeout 90s, connect timeout 15s.
3. **DNS Tunnel Ingress Routing:**
   - Create CNAME record in zone `syedhasnat.com`:
     - Name: `api-staging`
     - Content: `<actual-tunnel-uuid>.cfargotunnel.com`
     - Proxied: `true`

---

### Phase 3: Cloudflare Workers & Native Custom Domains
1. **OpenNext Workers Deployment:**
   - Deploy `automotive-os-marketplace-staging` (apps/marketplace)
   - Deploy `automotive-os-dealer-staging` (apps/dealer)
   - Deploy `automotive-os-admin-staging` (apps/admin)
2. **Native Custom Domain Attachment:**
   - Do **NOT** manually point arbitrary CNAMEs to `workers.dev`.
   - Call `POST /accounts/28178d7287cf04ff563981ce8b091497/workers/domains` to bind:
     - `hostname: cars-staging.syedhasnat.com` -> `service: automotive-os-marketplace-staging`
     - `hostname: dealer-staging.syedhasnat.com` -> `service: automotive-os-dealer-staging`
     - `hostname: admin-staging.syedhasnat.com` -> `service: automotive-os-admin-staging`
   - Cloudflare automatically provisions edge routing and universal SSL certificate bindings.

---

### Phase 4: Zero Trust Access & Security Hardening
1. **Admin Application Protection:**
   - Create Access Application for `admin-staging.syedhasnat.com`.
   - Policy: Enforce staff email authentication (`syedhasnat.com`, `automotive-os.ae`, or admin email), UAE IP geo-fencing (`AE`), and MFA.
2. **Synthetic Health Probe Service Token:**
   - Generate Service Token for GitHub Actions CI/CD deployment smoke tests.
   - Header credentials passed securely in deployment pipeline.

---

## 3. Cost Validation & Financial Impact

All staging infrastructure runs completely within Cloudflare's standard Free / Pay-As-You-Go allowances:

| Service | Staging Usage / Capacity | Cloudflare Pricing | Estimated Cost |
|---|---|---|---|
| **Cloudflare Zone** | DNS Zone `syedhasnat.com` | Free Plan | **$0.00 / mo** |
| **Cloudflare Workers** | 3 Staging Workers (SSR) | 100,000 req/day included | **$0.00 / mo** |
| **Cloudflare R2** | 2 Buckets (Media + KYB) | 10 GB storage, 1M Class A, 10M Class B operations included | **$0.00 / mo** |
| **Cloudflare Tunnel** | 1 Named Staging Tunnel | Included with Cloudflare Zero Trust | **$0.00 / mo** |
| **Cloudflare Access** | Zero Trust Admin Application | Up to 50 users included free | **$0.00 / mo** |
| **Total Cloudflare Overhead** | Full Staging Edge Stack | Free Tier | **$0.00 / mo** |

---

## 4. Database Architecture & Backup Alignment (Requirement 7)

Before executing database migrations on staging, the origin PostgreSQL architecture must be aligned:

### Architectural Options:
* **Option A: Managed AWS RDS PostgreSQL 16 (in `me-central-1` UAE):**
  - Requires AWS RDS DB instance identifier.
  - Backup adapter: `AwsRdsBackupAdapter` verifying automated snapshots via `DescribeDBSnapshots`.
  - Enforces snapshot age `< 24h` and UAE region match.
* **Option B: Containerized PostgreSQL 16 (on VPS Origin host):**
  - Uses `deploy/cloudflare/docker-compose.staging.yml` (`postgres:16-alpine`).
  - Runtime user: `automotive_app_user` with `NOSUPERUSER NOBYPASSRLS`.
  - Backup verification: Local snapshot / pgBackRest / transactional backup token.

---

## 5. Explicit Approval Gates & Checkpoints

Execution is currently paused. No changes will be applied without explicit user authorization:

1. [ ] **`CLOUD_PROVISIONING_APPROVAL`**: Authorizes Cloudflare R2 bucket creation, Tunnel creation, and Worker deployments.
2. [ ] **`DNS_APPROVAL`**: Authorizes adding the 5 staging CNAME hostnames to zone `syedhasnat.com`.
3. [ ] **`DATABASE_CONFIG_CONFIRMATION`**: User confirms whether staging PostgreSQL is managed AWS RDS or containerized on origin host.
4. [ ] **`DATABASE_MIGRATION_APPROVAL`**: Authorizes running Prisma migration deploy and applying RLS policies on the staging database.
