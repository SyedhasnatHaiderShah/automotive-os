# CF-03 — DNS Migration Inventory, Authoritative Analysis & Rollback Plan

**Milestone:** CF-03 — Automotive OS Domain Correction  
**Repository:** `SyedhasnatHaiderShah/automotive-os`  
**Execution Branch:** `feature/cf03-domain-correction`  
**Baseline Commit:** `3d19498d2b9a7aa27f2753f37598402734b45bb9`  
**Target Staging Zone:** `syedhasnat.com` (Cloudflare Zone ID: `a66068517320394243578be16bae68fc`)  
**Security Governance:** **HOLD AT `DNS_APPROVAL` / `CLOUD_PROVISIONING_APPROVAL` (Zero Live Mutation without Authorization)**

---

## 1. Executive Summary & Domain Realignment

In milestone CF-03, all active staging configurations were realigned from the provisional domain `automotive-os.ae` (not owned by the user) to the user's authoritative domain `syedhasnat.com`.

### Critical Architecture Requirements Enforced:
1. **Preservation of Existing Personal Assets:** `syedhasnat.com` already hosts the user's personal portfolio (Vercel) and ancillary services (Railway). All existing records are strictly preserved without modification or disruption.
2. **First-Level Subdomain Architecture:** All 5 staging hostnames use exact single-level subdomains (`*-staging.syedhasnat.com`). This ensures seamless TLS termination under Cloudflare Universal SSL without requiring paid Advanced Certificate Manager (ACM) multi-level wildcard subscriptions.
3. **Production Domain Integrity:** Production configurations remain strictly preserved and isolated pending a separate formal production domain registration decision.

---

## 2. Cloudflare Zone Inspection & Authoritative Provider Analysis

A read-only inspection was executed via the authenticated Cloudflare MCP connection against Account `28178d7287cf04ff563981ce8b091497` (`Hasnathaider332@gmail.com's Account`):

| Property | Value | Notes |
|---|---|---|
| **Domain** | `syedhasnat.com` | Primary user-owned domain |
| **Zone ID** | `a66068517320394243578be16bae68fc` | Verified active zone in Cloudflare |
| **Zone Status** | `active` | Activated: `2026-10-24T11:50:32Z` |
| **Authoritative Nameservers** | `bailey.ns.cloudflare.com`<br>`jihoon.ns.cloudflare.com` | Fully authoritative |
| **Original Registrar** | `Hostinger Operations, UAB (ID: 1636)` | Registrar delegation confirmed |
| **Cloudflare R2 Status** | Active (HTTP 200) | Initialized and ready for bucket provisioning |

---

## 3. Existing DNS Inventory (Strict Preservation Guarantee)

The following 5 DNS records currently exist on `syedhasnat.com`. **They MUST NOT be modified or deleted:**

| Record ID | Name | Type | Content / Target | Proxied | Purpose |
|---|---|---|---|---|---|
| `f65c28296e828ef6982343b3e391ae37` | `syedhasnat.com` | `A` | `64.29.17.1` | Yes | Personal Portfolio Apex Hosting |
| `b8dcf0fd3ced13c17ac350047edf420d` | `syedhasnat.com` | `A` | `216.198.79.1` | Yes | Personal Portfolio Apex Hosting (Secondary) |
| `cc22a836550c2e1b977eba283cf7d969` | `www.syedhasnat.com` | `CNAME` | `bbaf9b92a671a3bb.vercel-dns-017.com` | Yes | Personal Portfolio (Vercel Ingress) |
| `1433ef4bd570f5afe1997ffc3abea125` | `api.syedhasnat.com` | `CNAME` | `3uvbe4dx.up.railway.app` | Yes | Personal Railway Service (Independent API) |
| `1f24ed817eb69260a0b298307307d913` | `app.syedhasnat.com` | `CNAME` | `1x5b6c62.up.railway.app` | Yes | Personal Railway Service (Independent App) |

> [!IMPORTANT]
> Because the personal services utilize `api.syedhasnat.com` and `app.syedhasnat.com`, the Automotive OS staging subdomains use the explicit prefix `*-staging.syedhasnat.com` (`api-staging`, `cars-staging`, etc.), guaranteeing **zero namespace collision**.

---

## 4. Staging Ingress Hostname Inventory

The following 5 DNS records are planned for provisioning in Cloudflare Zone `syedhasnat.com` (`a66068517320394243578be16bae68fc`):

| Staging Service | Subdomain | Record Type | Target Content | Proxy Status | SSL Coverage |
|---|---|---|---|---|---|
| **Buyer Marketplace** | `cars-staging.syedhasnat.com` | `CNAME` | `automotive-os-marketplace-staging.syedhasnathaidershah.workers.dev` | Proxied (`orange-cloud`) | Universal SSL (`*.syedhasnat.com`) |
| **Dealer DMS Cockpit** | `dealer-staging.syedhasnat.com` | `CNAME` | `automotive-os-dealer-staging.syedhasnathaidershah.workers.dev` | Proxied (`orange-cloud`) | Universal SSL (`*.syedhasnat.com`) |
| **Platform Admin** | `admin-staging.syedhasnat.com` | `CNAME` | `automotive-os-admin-staging.syedhasnathaidershah.workers.dev` | Proxied (`orange-cloud`) | Universal SSL (`*.syedhasnat.com`) + CF Zero Trust |
| **NestJS API Origin** | `api-staging.syedhasnat.com` | `CNAME` | `${TUNNEL_ID_STAGING}.cfargotunnel.com` | Proxied (`orange-cloud`) | Universal SSL (`*.syedhasnat.com`) |
| **Public Vehicle Media** | `media-staging.syedhasnat.com` | `CNAME` | `public.r2.dev` / Custom R2 Domain | Proxied (`orange-cloud`) | Universal SSL (`*.syedhasnat.com`) |

---

## 5. Itemized Configuration Alignment

All active repository configurations have been updated to reflect the new staging hostnames:

1. **Wrangler Staging Manifests:**
   - [`apps/marketplace/wrangler.staging.toml`](file:///H:/Personal/Automotiv%20OS/apps/marketplace/wrangler.staging.toml):
     - `NEXT_PUBLIC_API_URL = "https://api-staging.syedhasnat.com"`
     - `NEXT_PUBLIC_STORAGE_URL = "https://media-staging.syedhasnat.com"`
     - `NEXT_PUBLIC_MARKETPLACE_URL = "https://cars-staging.syedhasnat.com"`
   - [`apps/dealer/wrangler.staging.toml`](file:///H:/Personal/Automotiv%20OS/apps/dealer/wrangler.staging.toml):
     - `NEXT_PUBLIC_API_URL = "https://api-staging.syedhasnat.com"`
     - `NEXT_PUBLIC_STORAGE_URL = "https://media-staging.syedhasnat.com"`
     - `NEXT_PUBLIC_DEALER_URL = "https://dealer-staging.syedhasnat.com"`
   - [`apps/admin/wrangler.staging.toml`](file:///H:/Personal/Automotiv%20OS/apps/admin/wrangler.staging.toml):
     - `NEXT_PUBLIC_API_URL = "https://api-staging.syedhasnat.com"`
     - `NEXT_PUBLIC_ADMIN_URL = "https://admin-staging.syedhasnat.com"`
2. **Container Orchestration & Environment:**
   - [`deploy/cloudflare/docker-compose.staging.yml`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/docker-compose.staging.yml) & [`docker-compose.staging.yml`](file:///H:/Personal/Automotiv%20OS/docker-compose.staging.yml):
     - `CORS_ORIGINS=https://cars-staging.syedhasnat.com,https://dealer-staging.syedhasnat.com,https://admin-staging.syedhasnat.com`
     - `R2_PUBLIC_URL=https://media-staging.syedhasnat.com`
     - `API_HOST=https://api-staging.syedhasnat.com`
3. **Cloudflare Tunnel Sidecar:**
   - [`deploy/cloudflare/tunnel-config.yml`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/tunnel-config.yml):
     - `httpHostHeader: api-staging.syedhasnat.com`
     - `originServerName: api-staging.syedhasnat.com`
     - `hostname: api-staging.syedhasnat.com` -> `http://api:4000`
4. **Cloudflare R2 CORS & Custom Domains:**
   - [`deploy/cloudflare/r2-media-cors.json`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/r2-media-cors.json): Allowed origins `https://cars-staging.syedhasnat.com`, `https://dealer-staging.syedhasnat.com`.
   - [`deploy/cloudflare/r2-kyb-cors.json`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/r2-kyb-cors.json): Allowed origins `https://dealer-staging.syedhasnat.com`, `https://admin-staging.syedhasnat.com`.
   - [`deploy/cloudflare/r2-policies.json`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/r2-policies.json): `custom_domain: "media-staging.syedhasnat.com"`.
5. **Zero Trust Access & Synthetic Probes:**
   - [`deploy/cloudflare/access-policy.json`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/access-policy.json): Gated domain `admin-staging.syedhasnat.com`.
   - [`deploy/cloudflare/service-tokens.json`](file:///H:/Personal/Automotiv%20OS/deploy/cloudflare/service-tokens.json): Synthetic monitoring application `admin-staging.syedhasnat.com`.
6. **Deployment Pipelines & Smoke Tests:**
   - [`.github/workflows/deploy.yml`](file:///H:/Personal/Automotiv%20OS/.github/workflows/deploy.yml): Dynamic health probes verify `https://cars-staging.syedhasnat.com`, `https://dealer-staging.syedhasnat.com`, `https://admin-staging.syedhasnat.com`, and `https://api-staging.syedhasnat.com/health` in staging, while preserving `automotive-os.ae` routes for production.
7. **Automated CORS Security Test Suite:**
   - [`apps/api/test/cf03-staging-domain-cors.spec.ts`](file:///H:/Personal/Automotiv%20OS/apps/api/test/cf03-staging-domain-cors.spec.ts): 6/6 tests passing, confirming positive preflights for staging frontends and strict denial of unlisted origins (including personal portfolio `https://syedhasnat.com`).

---

## 6. Comprehensive Rollback Plan

If at any point staging services on `syedhasnat.com` need to be modified, rolled back, or decommissioned:

### 6.1 Safe DNS Deletion via Cloudflare API / MCP
Execute the deletion of only the 5 specific staging CNAME records by name:
```javascript
const stagingNames = [
  'cars-staging.syedhasnat.com',
  'dealer-staging.syedhasnat.com',
  'admin-staging.syedhasnat.com',
  'api-staging.syedhasnat.com',
  'media-staging.syedhasnat.com'
];

// Query zone records, filter by exact staging name, and delete ONLY those records
for (const record of records) {
  if (stagingNames.includes(record.name)) {
    await cloudflare.request({
      method: 'DELETE',
      path: `/zones/${zoneId}/dns_records/${record.id}`
    });
  }
}
```

### 6.2 Rollback Invariant & Verification
1. Verify portfolio records `syedhasnat.com` and `www.syedhasnat.com` return HTTP 200:
   ```bash
   curl -I https://syedhasnat.com
   curl -I https://www.syedhasnat.com
   ```
2. Verify railway personal services `api.syedhasnat.com` and `app.syedhasnat.com` remain unaffected.
3. Because staging uses distinct subdomains, deletion of staging records has **zero risk** of affecting the apex domain or existing portfolio records.

---

## 7. Approval Gate & Next Action

Per project governance rules:
* **No DNS records have been created or modified.**
* **No live cloud infrastructure has been mutated.**
* Execution halts safely at **`DNS_APPROVAL`** / **`CLOUD_PROVISIONING_APPROVAL`**.
