# Automotive OS — Staging Deployment Plan

**Environment:** UAE Staging Sandbox (`me-central-1`)  
**Target Release:** `v0.1.0-staging.1` (Git Checkpoint: `7659b67`)  
**Lead:** Autonomous Release Orchestrator (Antigravity)  
**Standard Governance:** [`docs/implementation/QA_GATES.md`](file:///h:/Personal/Automotiv%20OS/docs/implementation/QA_GATES.md) & [`AGENTS.md`](file:///h:/Personal/Automotiv%20OS/AGENTS.md)

---

## 1. Staging Scope & Country Configuration

Automotive OS is engineered as a UAE-first, internationalization-ready multi-tenant dealership SaaS and verified car marketplace:

- **Sovereign Region:** `me-central-1` (UAE / Dubai data residency compliant).
- **Default Currency:** `AED` (United Arab Emirates Dirham). All financial figures are persisted in the database as 64-bit integer fils (`1 AED = 100 fils`), eliminating floating-point rounding errors.
- **Timezone:** `Asia/Dubai` (UTC+4). All database timestamps are persisted in strict UTC (`TIMESTAMPTZ`) and formatted in `Asia/Dubai` for UI presentation.
- **Bi-Directional Localization:** English (`en`, LTR default) and Arabic (`ar`, RTL with native `dir="rtl"` layout flipping).
- **Statutory Compliance References:**
  - UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL).
  - UAE Federal Decree-Law No. 8 of 2017 on Value Added Tax (VAT 5%).
  - UAE Federal Decree-Law No. 50 of 2022 on Commercial Transactions (Consignment Bailment).
  - Central Bank of the UAE (CBUAE) Debt Burden Ratio limits (50% DBR / 85% LTV).

---

## 2. Infrastructure Topology

```mermaid
flowchart TD
  subgraph Client ["Client Tier (Browser / Mobile)"]
    Buyer["Public Buyer (1440px / 390px / RTL)"]
    Dealer["Dealership Staff (RBAC Personas)"]
    Admin["Platform Operator / Compliance"]
  end

  subgraph Edge ["Edge Ingress / Reverse Proxy (Traefik / Caddy)"]
    RouteMarket["marketplace.staging.automotive-os.ae (:443)"]
    RouteDealer["dealer.staging.automotive-os.ae (:443)"]
    RouteAdmin["admin.staging.automotive-os.ae (:443)"]
    RouteApi["api.staging.automotive-os.ae (:443)"]
  end

  subgraph AppTier ["Application Services (Node.js 20+ / Docker)"]
    MarketplaceApp["apps/marketplace (Next.js 15 SSR/ISR - :3000)"]
    DealerApp["apps/dealer (Next.js 15 - :3001)"]
    AdminApp["apps/admin (Next.js 15 - :3002)"]
    NestApi["apps/api (NestJS 10 Monolith - :4000)"]
    OutboxWorker["Outbox & Search Projection Worker"]
  end

  subgraph DataTier ["Sovereign Data Tier (me-central-1)"]
    PostgreSQL[("PostgreSQL 16 Managed\n(Forced RLS & Composite FKs)")]
    RedisCache[("Redis 7 (Sessions, Cache & BullMQ)")]
    ObjectStorage[("S3-Compatible Media Store\n(Cloudflare R2 / MinIO)")]
  end

  Buyer --> RouteMarket --> MarketplaceApp
  Dealer --> RouteDealer --> DealerApp
  Admin --> RouteAdmin --> AdminApp
  
  MarketplaceApp --> RouteApi
  DealerApp --> RouteApi
  AdminApp --> RouteApi
  RouteApi --> NestApi

  NestApi --> PostgreSQL
  NestApi --> RedisCache
  NestApi --> ObjectStorage
  NestApi --> OutboxWorker
  OutboxWorker --> PostgreSQL
```

---

## 3. Environment Variables & Secret Configuration

### 3.1 Global / API Monolith (`apps/api/.env`)
```bash
# Core Runtime
NODE_ENV="staging"
API_PORT=4000
API_HOST="https://api.staging.automotive-os.ae"

# Sovereign Database (PostgreSQL 16)
# Application connection uses non-bypass user 'automotive_app'
DATABASE_URL="postgresql://automotive_app:SECURE_STAGING_PASSWORD@postgres.internal:5432/automotive_os?schema=public&sslmode=require"
DIRECT_URL="postgresql://postgres:SUPERUSER_PASSWORD@postgres.internal:5432/automotive_os?schema=public&sslmode=require"

# Cache & Queues (Redis 7)
REDIS_URL="redis://:REDIS_STAGING_PASSWORD@redis.internal:6379"

# Authentication / Security
JWT_SECRET="GENERATE_MIN_64_CHAR_CRYPTOGRAPHIC_SECRET_HERE"
JWT_EXPIRATION="24h"

# CORS Allowed Origins
CORS_ORIGINS="https://marketplace.staging.automotive-os.ae,https://dealer.staging.automotive-os.ae,https://admin.staging.automotive-os.ae"

# Object Storage (S3 / R2 me-central-1)
S3_ENDPOINT="https://s3.me-central-1.amazonaws.com"
S3_REGION="me-central-1"
S3_BUCKET="automotive-os-staging-media"
S3_ACCESS_KEY_ID="STAGING_S3_ACCESS_KEY"
S3_SECRET_ACCESS_KEY="STAGING_S3_SECRET_KEY"

# Feature Flags (All external partner live rails DISABLED per truth table)
FEATURE_FLAG_UAE_PASS_LIVE=false
FEATURE_FLAG_DED_LIVE=false
FEATURE_FLAG_RTA_TASJEEL_LIVE=false
FEATURE_FLAG_VIN_REGISTRY_LIVE=false
FEATURE_FLAG_AECB_LIVE=false
FEATURE_FLAG_BANK_OFFERS_LIVE=false
FEATURE_FLAG_FTA_PEPPOL_LIVE=false
FEATURE_FLAG_ESCROW_CUSTODY_LIVE=false
FEATURE_FLAG_COURTS_FEED_LIVE=false
FEATURE_FLAG_CUSTOMS_MIRSAL_LIVE=false
```

### 3.2 Marketplace Frontend (`apps/marketplace/.env`)
```bash
PORT=3000
NODE_ENV="staging"
NEXT_PUBLIC_API_URL="https://api.staging.automotive-os.ae"
NEXT_PUBLIC_MARKETPLACE_URL="https://marketplace.staging.automotive-os.ae"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
NEXT_PUBLIC_DEFAULT_CURRENCY="AED"
```

### 3.3 Dealer Cockpit Frontend (`apps/dealer/.env`)
```bash
PORT=3001
NODE_ENV="staging"
NEXT_PUBLIC_API_URL="https://api.staging.automotive-os.ae"
NEXT_PUBLIC_DEALER_URL="https://dealer.staging.automotive-os.ae"
NEXT_PUBLIC_DEFAULT_CURRENCY="AED"
```

### 3.4 Platform Admin Command (`apps/admin/.env`)
```bash
PORT=3002
NODE_ENV="staging"
NEXT_PUBLIC_API_URL="https://api.staging.automotive-os.ae"
NEXT_PUBLIC_ADMIN_URL="https://admin.staging.automotive-os.ae"
```

---

## 4. Database Setup, Migrations & RLS Policy Execution

### 4.1 Role Separation Principle
1. **Migration / Provisioning Role:** `postgres` (or cloud provider admin). Used solely for creating extensions, running migrations, and applying schema changes.
2. **Application Runtime Role:** `automotive_app` (strictly non-superuser, non-table-owner, and non-bypass RLS).

```sql
-- Step 1: Create application role with no bypass permissions
CREATE ROLE automotive_app WITH LOGIN PASSWORD 'SECURE_STAGING_PASSWORD' NOSUPERUSER NOBYPASSRLS;

-- Step 2: Grant standard schema usage and table permissions
GRANT USAGE ON SCHEMA public TO automotive_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO automotive_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO automotive_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO automotive_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO automotive_app;
```

### 4.2 Migration Execution Sequence
Execute the migration pipeline from repo root using Prisma:

```powershell
# 1. Generate Prisma Client
pnpm --filter @automotive-os/database run prisma:generate

# 2. Deploy versioned migrations to target database
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# 3. Apply Defense-in-Depth RLS Policies (Forced RLS & Composite Constraints)
psql "$DATABASE_URL" -f packages/database/prisma/tenant_policies.sql

# 4. Verify RLS Isolation Suite Passes in Staging Context
pnpm --filter @automotive-os/database run test
```

---

## 5. Deployment Step-by-Step Runbook

### Step 1: Clone Checkpoint & Verify Integrity
```powershell
git checkout 7659b67
git status
# Verify working tree is clean
```

### Step 2: Install Locked Dependencies & Build Monorepo
```powershell
# Clean install using frozen pnpm lockfile
pnpm install --frozen-lockfile

# Run complete monorepo build (Next.js 15 App Router & NestJS dist)
pnpm run build
```

### Step 3: Run Monorepo Pre-Deployment Verification
```powershell
# Run strict TypeScript check across all 8 packages
pnpm run typecheck

# Run unit and integration tests
pnpm run test
```

### Step 4: Start Services with Process Manager (PM2 / Systemd / Container)
For staging VM hosting:

```powershell
# Start NestJS API
pm2 start apps/api/dist/src/main.js --name "automotive-api" --env staging

# Start Marketplace Frontend
pm2 start "node_modules/next/dist/bin/next" --name "automotive-marketplace" -- start apps/marketplace -p 3000

# Start Dealer Cockpit Frontend
pm2 start "node_modules/next/dist/bin/next" --name "automotive-dealer" -- start apps/dealer -p 3001

# Start Admin Command Frontend
pm2 start "node_modules/next/dist/bin/next" --name "automotive-admin" -- start apps/admin -p 3002
```

---

## 6. Health Checks, Liveness & Readiness Probes

| Service | Probe Endpoint | Expected Status | Check Criteria |
|---|---|---|---|
| **NestJS API** | `GET /health` | `HTTP 200` | Returns `{ status: "ok", service: "api", uptimeSeconds: ... }` |
| **Marketplace** | `GET /api/health` | `HTTP 200` | Returns `{ status: "ok", service: "marketplace" }` |
| **Dealer Cockpit** | `GET /api/health` | `HTTP 200` | Returns `{ status: "ok", service: "dealer" }` |
| **Admin Command** | `GET /api/health` | `HTTP 200` | Returns `{ status: "ok", service: "admin" }` |
| **PostgreSQL 16** | `pg_isready -U automotive_app -d automotive_os` | Exit Code `0` | Database accepting TCP connections |
| **Redis 7** | `redis-cli ping` | `PONG` | Redis memory and cache responsive |

---

## 7. Backup, Disaster Recovery & Point-in-Time Recovery (PITR)

### 7.1 Automated Snapshot Schedule
- **Full Database Dumps:** Scheduled daily at 02:00 UTC (06:00 Asia/Dubai) via `pg_dump`:
  ```bash
  pg_dump -Fc -U postgres -d automotive_os -f /backups/automotive_os_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Continuous WAL Archiving:** WAL logs streamed to encrypted S3 bucket (`automotive-os-backups`) enabling Point-in-Time Recovery with a 15-minute Recovery Point Objective (RPO).
- **Target RTO:** Recovery Time Objective ≤ 30 minutes.

### 7.2 Database Restore Verification Runbook
To verify or restore backup into staging:
```bash
# 1. Terminate active application connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'automotive_os' AND pid <> pg_backend_pid();"

# 2. Drop and recreate clean database
dropdb -U postgres automotive_os
createdb -U postgres automotive_os

# 3. Restore dump file
pg_restore -U postgres -d automotive_os -v /backups/TARGET_BACKUP_FILE.dump

# 4. Re-apply RLS policies and grant permissions
psql -U postgres -d automotive_os -f packages/database/prisma/tenant_policies.sql

# 5. Run isolation verification
pnpm --filter @automotive-os/database run test
```

---

## 8. Telemetry, Monitoring & Alerting Thresholds

| Metric | Target SLA | Warning Threshold | Critical Incident Threshold | Action Required |
|---|---|---|---|---|
| **API P95 Latency** | `< 250ms` | `> 400ms` for 5 min | `> 1000ms` for 2 min | Scale API containers; inspect slow query logs. |
| **API Error Rate (5xx)** | `< 0.05%` | `> 1.0%` for 3 min | `> 3.0%` for 1 min | Check database connection pool exhaustion. |
| **Outbox Queue Lag** | `< 10 events` | `> 50 events` | `> 200 events` | Inspect OutboxService worker logs; check search sync. |
| **Postgres Connection Pool**| `< 60% capacity`| `> 75% capacity` | `> 90% capacity` | Increase connection limit or tune Prisma pool size. |
| **Frontend SSR P95** | `< 500ms` | `> 800ms` | `> 2000ms` | Invalidate ISR cache; inspect upstream API responses. |
