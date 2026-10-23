# CF-02 — Cloudflare & Origin Rollback Runbook

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF02_ROLLBACK.md`  
**Date:** October 23, 2026  
**Audience:** DevOps Engineers, Platform Administrators, Site Reliability Engineers  
**Status:** STANDARD OPERATING PROCEDURE (SOP)

---

## 1. Rollback Objectives & Target Metrics

| Parameter | Target Objective | Description |
| :--- | :--- | :--- |
| **RTO (Recovery Time Objective)** | < 3 minutes | Time to restore service to a known-healthy operational state |
| **RPO (Recovery Point Objective)** | 0 data loss | Preservation of all transactional dealer and buyer ledger records |

---

## 2. Frontend Workers Rollback (Cloudflare Instantaneous Rollback)

Cloudflare Workers provides instant zero-downtime rollback to any previous version. All previous deployment artifacts are preserved in Cloudflare's edge store.

### Rollback Commands:
```bash
# 1. Buyer Marketplace Rollback
wrangler deployments list --config apps/marketplace/wrangler.staging.toml
wrangler rollback <target-deployment-id> --config apps/marketplace/wrangler.staging.toml

# 2. Dealer DMS Cockpit Rollback
wrangler deployments list --config apps/dealer/wrangler.staging.toml
wrangler rollback <target-deployment-id> --config apps/dealer/wrangler.staging.toml

# 3. Platform Admin Ops Command Rollback
wrangler deployments list --config apps/admin/wrangler.staging.toml
wrangler rollback <target-deployment-id> --config apps/admin/wrangler.staging.toml
```

**Verification:**
Execute smoke checks immediately following rollback:
```bash
curl -sSf https://marketplace.staging.automotive-os.ae/api/health | jq .
curl -sSf https://dealer.staging.automotive-os.ae/api/health | jq .
```

---

## 3. Origin Backend API Container Rollback

If a defect is isolated to `apps/api` runtime logic or container binaries:

```bash
# SSH into origin staging host (me-central-1)
ssh -i ~/.ssh/id_rsa root@${DEPLOY_SSH_HOST}

# Navigate to application root
cd /opt/automotive-os

# 1. Point to previous known-good commit / image SHA
export APP_VERSION="<previous-known-good-sha>"

# 2. Pull and re-launch previous API container image
docker compose -f deploy/cloudflare/docker-compose.staging.yml pull api
docker compose -f deploy/cloudflare/docker-compose.staging.yml up -d --remove-orphans api

# 3. Verify health probe
docker compose -f deploy/cloudflare/docker-compose.staging.yml ps
curl -sSf http://localhost:4000/health | jq .
```

---

## 4. Database Schema & RLS Policy Rollback

### Safety Rules:
1. **Never drop columns containing customer or operational data** during an emergency rollback.
2. All migrations must be designed for **backward compatibility** (expand and contract pattern).
3. RLS policies in `packages/database/prisma/tenant_policies.sql` are written with `CREATE OR REPLACE` or `DROP POLICY IF EXISTS`, allowing safe idempotent re-execution.

### Rollback Steps:
```bash
# 1. Restore specific point-in-time snapshot if data corruption occurred:
# aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier automotive-os-staging ...

# 2. In case of schema rollback without data loss:
pnpm --filter @automotive-os/database run prisma:generate

# 3. Re-apply verified tenant RLS policies
psql "$DATABASE_URL" -f packages/database/prisma/tenant_policies.sql

# 4. Verify RLS policy test suite
pnpm --filter @automotive-os/database test
```

---

## 5. Cloudflare Tunnel Ingress Rollback

If tunnel traffic routing encounters network degradation:

```bash
# 1. Check tunnel connection status
cloudflared tunnel info automotive-os-staging-tunnel

# 2. Re-route DNS to standby origin endpoint if primary host fails
cloudflared tunnel route dns automotive-os-staging-tunnel api.staging.automotive-os.ae

# 3. Restart local cloudflared daemon
docker compose -f deploy/cloudflare/docker-compose.staging.yml restart cloudflared
```

---

## 6. Cloudflare Access (Zero Trust) Emergency Bypass

If an authentication issue blocks administrators from accessing `admin.staging.automotive-os.ae`:
1. Navigate to **Cloudflare One Dashboard** > **Access** > **Applications** > `Automotive OS — Platform Admin Staging`.
2. Temporarily switch policy action to allow specific emergency administrative IPs or service tokens.
3. Once the IdP connection is restored, immediately revert to the strict MFA + UAE Geo-fencing policy.
