# CF-04 — Staging Deployment Execution & Live Verification Evidence

**Deployment Date:** 2026-10-24  
**Git Branch:** `feature/cf04-staging-execution`  
**Baseline Git SHA:** `3a4b39a70763c124da31a84820799f42274d91fe`  
**Cloudflare Account ID:** `28178d7287cf04ff563981ce8b091497`  
**Target Cloudflare Zone:** `syedhasnat.com` (Zone ID: `a66068517320394243578be16bae68fc`)  
**Deployment Authority:** Explicit User Mission Authorization  

---

## 1. Live Service Status Summary

| Service / Target | Cloudflare Resource ID | Public Domain / URL | Deployment Status | Live HTTP Status | Functional Scope / Verification | Blocker / Dependency |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Marketplace Frontend** | Worker: `automotive-os-marketplace-staging` | [`https://cars-staging.syedhasnat.com`](https://cars-staging.syedhasnat.com) | **DEPLOYED** | **200 OK** | UI Smoke & `/api/health` PASS. Fast edge response (140–599ms). | None. |
| **Dealer Cockpit (DMS)** | Worker: `automotive-os-dealer-staging` | [`https://dealer-staging.syedhasnat.com`](https://dealer-staging.syedhasnat.com) | **DEPLOYED** | **200 OK** | UI Smoke & `/api/health` PASS. Clean dark glass UI rendering. | None. |
| **Platform Admin** | Worker: `automotive-os-admin-staging` | [`https://admin-staging.syedhasnat.com`](https://admin-staging.syedhasnat.com) | **DEPLOYED** | **403 Forbidden** (Anon) / **200 OK** (Auth) | Zero Trust Edge Gate verified. Anonymous access denied (403); service token headers pass (200). | Access dashboard activation. |
| **Public Media CDN** | R2: `automotive-os-media-staging` | [`https://media-staging.syedhasnat.com`](https://media-staging.syedhasnat.com) | **DEPLOYED** | **200 OK** | Synthetic Porsche 911 asset verified live via custom domain (HTTP 200). | None. |
| **Origin API** | Tunnel: `fd8bf03b-b308-4fb6-b2ad-35da70fc9453` | [`https://api-staging.syedhasnat.com`](https://api-staging.syedhasnat.com) | **INGRESS CONFIGURED** | **530 (CF 1033)** | Cloudflare Tunnel Ingress and DNS CNAME active. Origin awaiting VPS host. | Staging VPS host container runner. |
| **Personal Portfolio (Apex)** | DNS: `64.29.17.1`, `216.198.79.1` | [`https://syedhasnat.com`](https://syedhasnat.com) | **PRESERVED** | **200 OK** | Strictly preserved, zero alterations. | None. |
| **Personal Portfolio (WWW)** | DNS: `bbaf9b92a671a3bb.vercel-dns-017.com` | [`https://www.syedhasnat.com`](https://www.syedhasnat.com) | **PRESERVED** | **200 OK** | Strictly preserved, zero alterations. | None. |
| **Railway App & API** | DNS: `api.syedhasnat.com`, `app.syedhasnat.com` | `*.up.railway.app` | **PRESERVED** | **Active** | Strictly preserved, zero alterations. | None. |

---

## 2. Cloudflare Resource Details

### A. R2 Object Storage
- **Bucket Name:** `automotive-os-media-staging`
- **Location Hint:** Western Europe (`WEUR`)
- **Storage Class:** Standard
- **CORS Configuration:** Applied via `deploy/cloudflare/r2-media-cors.json`
  - Allowed Origins: `https://cars-staging.syedhasnat.com`, `https://dealer-staging.syedhasnat.com`
  - Allowed Methods: `GET`, `HEAD`
  - Allowed Headers: `Content-Type`, `Range`
  - Exposed Headers: `ETag`, `Content-Length`, `Content-Range`
- **Native Custom Domain Attachment:** `media-staging.syedhasnat.com` attached via native R2 API.
- **Verified Synthetic Object:** `vehicles/synthetic-porsche-911-hero.svg` (Size: 635 bytes, ETag: `ac18908e8e8dba7436eee5b7624fe046`, HTTP 200 OK).

### B. Cloudflare Workers
1. **`automotive-os-marketplace-staging`**
   - Deployment ID: `2b6bb203995d49a4844e8dcc274a3d0d`
   - workers.dev Subdomain: `automotive-os-marketplace-staging.syedhasnat.workers.dev`
   - Native Custom Domain: `cars-staging.syedhasnat.com`
   - Certificate ID: `55b298f3-8577-48c7-a523-e69b687d94e7`
   - Startup Time: 1ms

2. **`automotive-os-dealer-staging`**
   - Deployment ID: `2f1f065251134c2892871019c18f35b2`
   - workers.dev Subdomain: `automotive-os-dealer-staging.syedhasnat.workers.dev`
   - Native Custom Domain: `dealer-staging.syedhasnat.com`
   - Certificate ID: `e15c3a28-5b95-40ac-adb5-bcf49ca7bb92`
   - Startup Time: 2ms

3. **`automotive-os-admin-staging`**
   - Deployment ID: `342318b9b8b64d0d8e7bebd157ce1cf6`
   - workers.dev Subdomain: `automotive-os-admin-staging.syedhasnat.workers.dev`
   - Native Custom Domain: `admin-staging.syedhasnat.com`
   - Certificate ID: `a48a111d-1287-43d6-894e-c97469d7e145`
   - Security Protection: Edge Fail-Closed Zero Trust enforcement.

### C. Cloudflare Tunnel
- **Tunnel Name:** `automotive-os-staging-tunnel`
- **Tunnel UUID:** `fd8bf03b-b308-4fb6-b2ad-35da70fc9453`
- **Ingress Mapping:** `api-staging.syedhasnat.com` -> `http://api:4000`
- **DNS CNAME Target:** `fd8bf03b-b308-4fb6-b2ad-35da70fc9453.cfargotunnel.com` (Proxied)

---

## 3. Origin Hosting Dependency & Instructions

Because no authorized staging VPS currently exists, the API and database are awaiting container runner initialization on an origin host.

### Required User Action:
1. Provision a disposable staging Linux VPS (e.g. Hetzner Cloud CPX11 or Kamatera UAE, 2 vCPU, 4GB RAM, ~$6.00/month).
2. Install Docker and Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Set the Tunnel Token environment variable and launch the staging stack:
   ```bash
   export TUNNEL_TOKEN="eyJhIjoiMjgxNzhkNzI4N2NmMDRmZjU2Mzk4MWNlOGIwOTE0OTciLCJ0IjoiZmQ4YmYwM2ItYjMwOC00ZmI2LWIyYWQtMzVkYTcwZmM5NDUzIiwicyI6IlF6VXZkUlFaSEdFYmRpeWY0SjhpWTBNaXFRVEJkR0duNXgzdXFoOFh3VVNBQndES1lNbjV4UStKbmlNZkF5Y3gxNTROVFJwWHArNEJDN3gyQjl2a1NBPT0ifQ=="
   docker compose -f deploy/cloudflare/docker-compose.staging.yml up -d
   ```
4. As soon as the container stack starts, `cloudflared` automatically dials outbound to Cloudflare edge, switching `https://api-staging.syedhasnat.com` from HTTP 530 to active HTTP 200 OK.
