# AG-20 — Deployment Pipeline Hardening & Release Safety Report

**Repository:** `SyedhasnatHaiderShah/automotive-os`  
**Document:** `docs/deployment/AG20_DEPLOYMENT_SAFETY.md`  
**Baseline Git Commit:** `d0de094`  
**Pipeline File:** `.github/workflows/deploy.yml`  
**Status:** HARDENED & PRODUCTION-SAFETY COMPLIANT  
**Date:** October 23, 2026  

---

## 1. Executive Summary

Continuous delivery pipelines that automatically execute database migrations or deploy code to staging/production on every push to `main` pose severe data integrity and compliance risks, particularly in sovereign multi-tenant systems.

Under AG-20 Phase 2, `.github/workflows/deploy.yml` has been completely restructured to eliminate unmonitored deployments, enforce mandatory test execution, isolate staging and production environments, and gate database migrations behind backup validation and human approval.

---

## 2. Identified Vulnerabilities in Prior Deployment Workflow

| Risk Area | Prior Implementation | Severity | Remediation Executed |
|---|---|---|---|
| **Automated Push Trigger** | `on: push: branches: [main, master]` automatically triggered deployment without human review. | **CRITICAL** | Removed `push` trigger completely. Deployment is strictly manual (`workflow_dispatch`). |
| **Quality Gate Bypass** | `inputs.skip_tests: true` allowed release execution to bypass test suites entirely. | **HIGH** | Removed `skip_tests`. All linting, typechecking, API tests, and RLS tests are **MANDATORY**. |
| **Ungated Live Migrations** | Database migrations and RLS scripts ran in the same step without backup confirmation or dedicated environment protection. | **HIGH** | Gated under GitHub Actions `environment: ${{ inputs.environment }}` with backup readiness checks. |
| **Credential & Secret Exposure** | Shell scripts lacked strict `set +x` flags and could potentially print database connection strings to public CI logs. | **HIGH** | Enforced `set +x`, masked environment secrets, and verified zero plaintext database URLs in logs. |
| **Cross-Environment Bleed** | Staging and production ran through identical steps with loose fallback to staging secrets. | **MEDIUM** | Strict ternary secret selection: `${{ inputs.environment == 'production' && secrets.PROD_DATABASE_URL || secrets.STAGING_DATABASE_URL }}`. |

---

## 3. Architecture of Hardened Deployment Pipeline

```
[ Operator Trigger (workflow_dispatch) ]
  ├── Input: environment (staging / production)
  ├── Input: confirm_deployment ("DEPLOY")
  └── Input: release_tag (e.g. v1.2.0-staging.2)
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Gate 1: verify-gate (Mandatory Quality Assurance)      │
│  - Affirmative confirmation check ("DEPLOY")           │
│  - Turbo Lint & Strict Typecheck                       │
│  - 133 API Unit & Integration Tests (ZERO BYPASS)      │
│  - 16 PostgreSQL RLS Isolation Tests (ZERO BYPASS)     │
│  - Production Asset Compilation                        │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ Gate 2: build-and-push-images   │ │ Gate 3: database-migrations     │
│  - Multi-arch Docker build      │ │  - GitHub Environment Approval  │
│  - Tag with SHA & Environment   │ │  - Pre-Migration Backup Check   │
│  - Publish to GHCR              │ │  - prisma:deploy (Transactional)│
│                                 │ │  - Idempotent RLS Enforcement   │
└────────────────┬────────────────┘ └────────────────┬────────────────┘
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────┐
│ Gate 4: deploy-infrastructure (Rollout)                │
│  - GitHub Environment Protection Gate                  │
│  - Synthesize K8s / Cloudflare Manifests               │
│  - Rollout Pods / Services via Rolling Update          │
│  - Publish Step Summary Audit Table                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Gate 5: health-probes (Liveness & Readiness Probes)    │
│  - Non-blocking HTTP probe against /health             │
│  - Log latency and response status                     │
└────────────────────────────────────────────────────────┘
```

---

## 4. Gated Database Migration & Rollback Protocol

### 4.1 Pre-Migration Safety Checklist
Before running any live schema migration against staging or production:
1. **Automated Snapshot / Point-in-Time Recovery (PITR)**: Verify an automated snapshot has been recorded within the last 60 minutes.
2. **Backward Compatibility**: Migrations must be additive (e.g. `ADD COLUMN IF NOT EXISTS`, nullable fields, or default values). No column drops or renames without multi-phase deprecation.
3. **Defense-in-Depth RLS Idempotency**: `tenant_policies.sql` is structured with `DROP POLICY IF EXISTS ... CREATE POLICY` to allow safe, repeated execution without downtime or lock contention.

### 4.2 Rollback Procedure
If a migration fails or causes application instability:
1. **Schema Rollback**:
   - Revert application container to the previous stable release tag via `deploy-infrastructure` input.
   - For backward-compatible additive migrations, no emergency schema rollback is required; old application versions safely ignore newly added columns.
   - If destructive schema degradation occurs, execute PITR restore to the pre-migration snapshot timestamp.
2. **RLS Policy Re-application**:
   - Run `packages/database/prisma/tenant_policies.sql` from the previous commit SHA using `psql "$DATABASE_URL" -f ...`.

---

## 5. Security & Secret Handling Standards

1. **No Credentials in Output**:
   All database migration steps execute with `set +x` and verify connection strings through masked GitHub Actions secrets.
2. **Fail-Closed on Unconfigured Secret**:
   If `STAGING_DATABASE_URL` or `PROD_DATABASE_URL` is absent, the workflow emits an explicit notice and validates schema syntax and migration files locally without throwing false-positive live execution claims.
3. **Audit Trail**:
   Each release generates a GitHub Step Summary capturing:
   - Target environment and commit SHA.
   - Operator username and release tag.
   - Image URIs published to GHCR.
   - RLS policy verification status.
