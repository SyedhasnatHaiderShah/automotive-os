# CF-06 Live Baseline & Deployment Audit Report

**Audit Mission:** CF-06 Complete Stitch-to-Implementation Design, Functionality and User Journey Audit  
**Date:** 2026-10-26T12:25:00+04:00 (Asia/Dubai)  
**Lead Auditor:** Google Antigravity (Principal UI/UX Auditor, Staff Frontend Engineer & Full-Stack QA Architect)  
**Repository:** `SyedhasnatHaiderShah/automotive-os`  
**Starting Baseline Requested:** `4f1cdb206d7ea2577af0e5b5e3aeb4062926cc0c` (PR #14)  
**Source HEAD SHA:** `2afedce48b62aa0d667c4618e3a2468351543888` (PR #15 Sentinel Hardening)  
**Audit Working Branch:** `audit/cf06-stitch-full-parity`  
**Google Stitch Project:** `4467699827252507387`  

---

## 1. Executive Baseline & Deployment State

| Target Domain | Infrastructure Provider | Configured App | HTTP Status | Deployed Commit / Identifier | State vs HEAD | Staging Health / Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `https://automotive-marketplace-staging.up.railway.app` | Railway | Marketplace Next.js app | **200 OK** | `143wa37mwr1lel` (`3baefab`) | **DEPLOYMENT_STALE** | Rendered SSR HTML, Next.js cache HIT, dynamic listings loaded. |
| `https://automotive-dealer-staging.up.railway.app` | Railway | Dealer DMS Next.js app | **200 OK** | `ef15mf78ve6c5` (`3baefab`) | **DEPLOYMENT_STALE** | Rendered Studio Glass cockpit, active session check. |
| `https://automotive-admin-staging.up.railway.app` | Railway | Platform Admin | **404 Not Found** | Unmapped on railway domain | **ROUTE_MISCONFIGURED** | Target specified in prompt does not exist on Railway default subdomain. |
| `https://admin-staging.syedhasnat.com` | Cloudflare / Railway | Platform Admin Next.js app | **401 Unauthorized** (Root)<br>**200 OK** (`/api/health`) | `9qww` / `CiONBNCKS...` | **DEPLOYMENT_STALE** | Gated by `Automotive OS Admin Protected Gate` HTTP Basic Auth middleware. |
| `https://api-staging.syedhasnat.com` | Railway | NestJS Monolith API | **200 OK** (`/health`) | `c8-C2JVt...` (uptime ~134k s) | **DEPLOYMENT_STALE** | PostgreSQL connected, `/api/v1/public/listings` active. |

> [!WARNING]
> **DEPLOYMENT_STALE Finding:**
> Staging services were provisioned during the PR #11 cutover (`3baefab` ~37h prior). PR #12 (Stitch UI fixes), PR #13 (route states and Playwright test suite), PR #14 (Codex review findings), and PR #15 (Sentinel security error filter) have been merged into `main` (`2afedce`), but not yet redeployed to Railway staging.
>
> In accordance with CF-06 audit rules:
> 1. We independently audit the **live deployed staging applications** (`3baefab`).
> 2. We audit the **source repository HEAD** (`2afedce`).
> 3. Discrepancies between staging and source HEAD are documented as deployment staleness rather than code omissions.

---

## 2. Service Availability & API Probes

### 2.1 Backend API (`https://api-staging.syedhasnat.com`)
- **Health Check (`GET /health`):** `200 OK`
  ```json
  {
    "status": "ok",
    "service": "api",
    "timestamp": "2026-10-26T08:21:43.728Z",
    "uptimeSeconds": 133844,
    "environment": "staging",
    "details": { "nodeVersion": "v20.20.2", "memoryUsage": 84512768 },
    "database": "connected"
  }
  ```
- **Global API Prefix:** `/api/v1/`
- **Public Listings Probe (`GET /api/v1/public/listings`):** `200 OK`
  - Returned verified dealer stock from PostgreSQL database (e.g., `2024 Porsche Cayenne Turbo GT` in Sharjah, `2024 Toyota Land Cruiser GR Sport` in Dubai).
  - Verified tenant data boundary isolation: No cost prices, wholesale margins, private VIN notes, or unredacted buyer contacts exposed.

### 2.2 Marketplace Web (`https://automotive-marketplace-staging.up.railway.app`)
- **Root URL (`GET /`):** `200 OK`
- **Theme:** Obsidian & Studio Glass dark theme (`<html class="dark">`).
- **Data Integration:** SSR pre-rendered hero and featured listing carousels against live API data.

### 2.3 Dealer Portal (`https://automotive-dealer-staging.up.railway.app`)
- **Root URL (`GET /`):** `200 OK`
- **Protected DMS Shell:** Functional dealer navigation bar and sidebar; redirects unauthenticated visitors to dealer login.

### 2.4 Platform Admin Portal (`https://admin-staging.syedhasnat.com`)
- **Health Check (`GET /api/health`):** `200 OK`
  ```json
  {
    "status": "ok",
    "service": "admin",
    "timestamp": "2026-10-26T08:21:44.119Z",
    "environment": "production"
  }
  ```
- **Auth Gate:** Protected by `apps/admin/middleware.ts`:
  - Returns `401 Unauthorized` with header `WWW-Authenticate: Basic realm="Automotive OS Admin Protected Gate"`.
  - Zero Trust CF Access token header (`cf-access-jwt-assertion`) or configured staging basic auth (`ADMIN_AUTH_USER` / `ADMIN_AUTH_PASSWORD`) required for browser access.
  - No fake header bypass or forged token permitted.

---

## 3. Stitch Project Inventory & Traceability

- **Project ID:** `4467699827252507387`
- **MCP Status:** Authenticated & fully operational via `stitch` MCP toolset.
- **Screen Inventory Count:** 32 screens in project (31 mapped screens S01–S31 + 1 extra screen `e6d308659f274d20b9f2d3434d459c4f` "VIP Checkout & Escrow Deposit Settlement").
- **Mapped Reference Coverage:** **31 / 31 (100%)**
- **Blocked References:** **0**

---

## 4. Scope & Security Boundaries

1. **In-Scope:**
   - Source code HEAD on branch `audit/cf06-stitch-full-parity`.
   - Running Railway staging environments (`automotive-marketplace-staging.up.railway.app`, `automotive-dealer-staging.up.railway.app`, `admin-staging.syedhasnat.com`, `api-staging.syedhasnat.com`).
   - Local Playwright browser automation test suite (`tests/stitch-parity/`).
   - Google Stitch project design files and approved reference artifacts.

2. **Strictly Out-of-Scope (ZERO TOUCH):**
   - Cloudflare production domains and zones (`automotive-os.ae`, `api.automotive-os.ae`, `admin.automotive-os.ae`).
   - Personal portfolio and independent services (`syedhasnat.com` apex, `app.syedhasnat.com`, `api.syedhasnat.com` personal Railway deployments).
   - No destructive database migrations, drops, or schema mutations.
   - No live external third-party API mutations (UAE PASS production, Tasjeel production, CBUAE).

---

## 5. Known Gated Capabilities & Integration Truth Status

Per `docs/implementation/INTEGRATION_TRUTH_TABLE.md`:
- **UAE PASS:** Synthetic staging mock with dual-rail fallback (Collector / Dealer / Admin personas). Production requires signed OIDC client certificate.
- **Tasjeel / RTA / DED Inspection:** Truthful static inspection score card and vehicle history ledger. No manufactured live telemetry.
- **AECB / Credit Underwriting:** Policy-based hardlock simulation on S25. No live central bank credit bureau calls.
- **FTA E-Invoicing (ZATCA/Peppol):** Cryptographic XML invoice preview and QR code verification per UAE FTA requirements. External clearance marked *Coming Soon*.
- **Judicial Freeze / Injunctions:** S26 Court order dossier with legal hold state machine. No live ministry of justice court automation.
