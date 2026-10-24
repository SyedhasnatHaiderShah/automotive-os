# CF-04.1 — Staging Resource Provisioning Plan & Architecture Assessment

**Milestone:** CF-04.1 — Staging Provisioning Final Adjustments  
**Repository:** `SyedhasnatHaiderShah/automotive-os`  
**Working Branch:** `feature/cf04-staging-provisioning`  
**Baseline Commit:** `main @ c665aa9ee473c42a24ca3195dc7c40341d84a6de` (PR #7)  
**Target Domain:** `syedhasnat.com`  
**Target Cloudflare Zone ID:** `a66068517320394243578be16bae68fc`  
**Target Cloudflare Account ID:** `28178d7287cf04ff563981ce8b091497`  
**Governance State:** **READ-ONLY AUDIT COMPLETE — STOPPED AT `CLOUD_PROVISIONING_APPROVAL`**

---

## 1. Cloudflare Account & Zone Audit

A read-only inspection via the authenticated Cloudflare MCP toolset confirmed:

* **Zone Status:** `syedhasnat.com` is **ACTIVE** (Activated `2026-10-24T11:50:32Z`).
* **Authoritative Nameservers:** `bailey.ns.cloudflare.com` & `jihoon.ns.cloudflare.com`.
* **Current Account Plan:** Free Website ($0.00/month).
* **Permissions:** Full authorization for DNS (`#dns_records:edit`), Workers (`#worker:edit`), R2 Storage (`#r2_bucket:edit`), Cloudflare Tunnels (`#cfone:edit`), and Zero Trust Access (`#access:edit`).
* **Cloudflare R2:** Initialized, active, and operational (HTTP 200).
* **Cloudflare Workers Custom Domains API:** Supported and ready (`/workers/domains`).

### Existing DNS Invariants (Strict Preservation Guarantee)
The 5 existing authoritative DNS records on `syedhasnat.com` were verified live (HTTP 200 OK) and **will remain 100% untouched**:
1. `syedhasnat.com` (`A` -> `64.29.17.1`) — Live Personal Portfolio (Verified)
2. `syedhasnat.com` (`A` -> `216.198.79.1`) — Live Personal Portfolio Secondary (Verified)
3. `www.syedhasnat.com` (`CNAME` -> `bbaf9b92a671a3bb.vercel-dns-017.com`) — Vercel Personal Portfolio (Verified)
4. `api.syedhasnat.com` (`CNAME` -> `3uvbe4dx.up.railway.app`) — Personal Railway Service (Preserved)
5. `app.syedhasnat.com` (`CNAME` -> `1x5b6c62.up.railway.app`) — Personal Railway Service (Preserved)

---

## 2. OpenNext SSR Worker CPU Budget & Pricing Correction (Item 1)

### CPU Limit Analysis: Workers Free vs. Workers Paid
* **Cloudflare Workers Free Tier:** Imposes a strict **10ms CPU time limit** per invocation.
* **OpenNext Next.js 15 SSR Profile:** Next.js 15 App Router server-side rendering, React Server Components (RSC) tree traversal, Outfit typography injection, and hydration payload generation consume between **15ms and 45ms CPU time** during SSR requests (e.g. inventory detail pages, comparison tables).
* **Verdict:** Running Next.js 15 SSR apps reliably under Workers Free risks intermittent HTTP 1101 (CPU Limit Exceeded) errors.
* **Architectural Mandate:** Staging must target **Workers Paid ($5.00/month)** which raises the CPU allowance to **50ms (Standard)** or up to **30s (Workers Unbound)**.

### Realistic Monthly Staging Cost Breakdown

| Component | Specification | Free Tier Capacity | Recommended Staging Option | Estimated Cost |
|---|---|---|---|---|
| **Cloudflare Zone** | DNS Zone `syedhasnat.com` | Free | Free Website Plan | **$0.00** |
| **Cloudflare Workers** | 3 OpenNext SSR Workers | 100k req/day (10ms CPU cap) | **Workers Paid ($5/mo, 50ms CPU cap)** | **$5.00 / mo** |
| **Cloudflare R2** | Public Vehicle Media (`automotive-os-media-staging`) | 10 GB storage, 1M ops included | Free Tier Allowance | **$0.00** |
| **Cloudflare Tunnel** | `automotive-os-staging-tunnel` | Included with Zero Trust | Standard Zero Trust Tunnel | **$0.00** |
| **Cloudflare Access** | Zero Trust Admin MFA | Up to 50 users included | Free Tier | **$0.00** |
| **Origin Compute VPS** | 2 vCPU / 4GB RAM / 80GB NVMe (UAE / ME Region) | N/A | Cloud VPS / Dedicated VM | **~$12.00 – $20.00 / mo** |
| **Backup Storage** | Encrypted container snapshot archive (S3 / VPS) | N/A | Automated snapshot storage | **~$2.00 – $3.00 / mo** |
| **Total Realistic Staging Cost** | **Full End-to-End Staging Stack** | — | **Fully Operational Staging** | **~$19.00 – $28.00 / month** |

---

## 3. Confidential KYB R2 Storage Deferral (Item 2)

* **Regulatory Invariant:** Under UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL), sensitive corporate identities, trade licenses, and Emirates ID photocopies require verified in-country sovereign data residency.
* **Cloudflare R2 Limitation:** Cloudflare R2 currently does not document a legally binding UAE jurisdictional residency guarantee (buckets are placed in regional jurisdictions such as `weur`, `apac`, `wnam`).
* **Decision:** The private KYB bucket (`automotive-os-kyb-staging`) is **DEFERRED**.
* **Staging Mitigation:** Staging dealer verification workflows will operate exclusively using synthetic KYC/KYB documents in memory/fixtures. No sensitive customer or dealer trade licenses will be uploaded to Cloudflare R2 until an approved UAE sovereign storage backend (e.g. AWS S3 `me-central-1` or local UAE object storage) is formally certified.
* **Public Vehicle Media:** Public vehicle photos (`automotive-os-media-staging`) remain approved for Cloudflare R2 edge caching.

---

## 4. Containerized PostgreSQL 16 & Self-Hosted Backup Adapter (Item 3)

The staging origin database architecture is finalized as **Containerized PostgreSQL 16 Alpine on the staging VPS host** via [`deploy/cloudflare/docker-compose.staging.yml`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/docker-compose.staging.yml).

### Architecture & Non-Bypass Security:
1. **Runtime Role:** Dedicated user `automotive_app_user` with `NOSUPERUSER NOBYPASSRLS` initialized via [`deploy/initdb/01-init-app-role.sh`](file:///H:/Personal/Automotiv%20OS/deploy/initdb/01-init-app-role.sh).
2. **Row-Level Security:** `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` enforced across all 20 public tables.
3. **Backup Verification Architecture:**
   - Replaced AWS RDS-only assumptions with [`SelfHostedPostgresBackupAdapter`](file:///H:/Personal/Automotiv%20OS/packages/database/src/backup/self-hosted.adapter.ts).
   - Validates independent backup snapshot presence, file integrity, timestamp freshness (`<= 24.0 hours`), engine version (`PostgreSQL 16`), and target database match.
   - 14/14 automated database backup and RLS verification tests passing (including positive self-hosted verification and stale backup rejection).

---

## 5. Origin VPS Availability & Secret Verification Status (Item 4)

In accordance with strict auditing guidelines, infrastructure components that have not yet been provisioned or connected are recorded as **NOT VERIFIED**:

| Infrastructure Component | Status | Evidence / Notes |
|---|---|---|
| **Origin Host Availability (VPS)** | **NOT RUN / NOT VERIFIED** | Origin VPS has not yet been provisioned or connected via SSH. |
| **Storage Durability (NVMe/pgdata)** | **NOT RUN / NOT VERIFIED** | Physical host volume persistence and backup sync have not been benchmarked. |
| **Physical Restore Procedure** | **NOT RUN / NOT VERIFIED** | End-to-end container restore from snapshot file has not been executed on live VPS. |
| **GitHub Secrets Ingestion** | **NOT RUN / NOT VERIFIED** | Secrets (`CLOUDFLARE_API_TOKEN`, `STAGING_DATABASE_URL`, `DEPLOY_SSH_KEY`) await repository ingestion. |

---

## 6. Phased Provisioning Approval Gates (Item 5)

To guarantee safe, incremental rollout and isolation of responsibilities, staging provisioning is divided into three sequential authorization gates:

### Phase A: `STAGING_INFRASTRUCTURE_APPROVAL`
* **Actions:**
  1. Create public vehicle media R2 bucket (`automotive-os-media-staging`).
  2. Create named Cloudflare Tunnel (`automotive-os-staging-tunnel`) and extract genuine tunnel UUID and credentials.
* **Impact:** Provisions storage bucket and tunnel metadata in Cloudflare account. Zero DNS changes.

### Phase B: `STAGING_EDGE_DNS_APPROVAL`
* **Actions:**
  1. Deploy OpenNext workers (`automotive-os-marketplace-staging`, `automotive-os-dealer-staging`, `automotive-os-admin-staging`).
  2. Attach native Workers Custom Domains via Cloudflare API (`POST /accounts/{id}/workers/domains`):
     - `cars-staging.syedhasnat.com`
     - `dealer-staging.syedhasnat.com`
     - `admin-staging.syedhasnat.com`
  3. Attach native R2 Custom Domain (`media-staging.syedhasnat.com`).
  4. Attach Cloudflare Tunnel CNAME (`api-staging.syedhasnat.com` -> `<tunnel-uuid>.cfargotunnel.com`).
* **Impact:** Modifies DNS in zone `syedhasnat.com` by adding 5 new staging subdomains. Zero changes to portfolio/Railway records.

### Phase C: `STAGING_DATABASE_MIGRATION_APPROVAL`
* **Actions:**
  1. Initialize containerized PostgreSQL 16 on VPS origin with non-bypass role (`automotive_app_user`).
  2. Execute Prisma migration deploy (`prisma migrate deploy`).
  3. Apply defense-in-depth tenant RLS policies (`apply-tenant-policies.ts`) and verify all 20 tables forced.
  4. Start NestJS API and Cloudflare Tunnel sidecar.
* **Impact:** Populates schema, tenant policies, and fixtures on staging database.

---

## 7. Native Edge Routing & DNS Invariant (Items 6 & 7)

* **No CNAME to `workers.dev`:** Frontends use native Cloudflare Workers Custom Domain attachments.
* **No CNAME to `public.r2.dev`:** Media uses native Cloudflare R2 Custom Domain attachment (`media-staging.syedhasnat.com`).
* **Zero Collision Guarantee:** Existing records (`syedhasnat.com`, `www.syedhasnat.com`, `api.syedhasnat.com`, `app.syedhasnat.com`) are fully segregated and preserved.
