# Automotive OS — GitHub Actions CI/CD Architecture & Runbook

**Target Monorepo:** [`SyedhasnatHaiderShah/automotive-os`](https://github.com/SyedhasnatHaiderShah/automotive-os.git)  
**Target Environments:** UAE Staging Sandbox (`me-central-1`) & Production  
**Pipeline Engine:** GitHub Actions + GitHub Container Registry (GHCR)  
**Governance Standards:** [`docs/implementation/QA_GATES.md`](file:///h:/Personal/Automotiv%20OS/docs/implementation/QA_GATES.md) & [`AGENTS.md`](file:///h:/Personal/Automotiv%20OS/AGENTS.md)

---

## 1. Pipeline Overview & Trigger Topology

Automotive OS features a dual-workflow CI/CD architecture separating branch verification from automated deployment on push:

```mermaid
flowchart TD
  subgraph Triggers ["Git Event Triggers"]
    PR["Pull Request (to main, master, develop)"]
    PushFeature["git push (feature/*, fix/*)"]
    PushMain["git push origin main"]
    Manual["workflow_dispatch (Manual Deploy)"]
  end

  subgraph CIWorkflow ["CI Workflow (.github/workflows/ci.yml)"]
    PR --> CI_Gate["1. Turbo Lint, Typecheck, Test, Build"]
    PushFeature --> CI_Gate
    CI_Gate --> CI_K8s["2. Kustomize K8s Manifest Validation"]
  end

  subgraph CDWorkflow ["CD Workflow (.github/workflows/deploy.yml)"]
    PushMain --> CD_Gate1["Gate 1: Monorepo Verification Gate"]
    Manual --> CD_Gate1
    
    CD_Gate1 --> CD_Gate2["Gate 2: Docker Build & GHCR Publish"]
    CD_Gate1 --> CD_Gate3["Gate 3: Prisma Migrations & RLS Policies"]
    
    CD_Gate2 --> CD_Gate4["Gate 4: Staging Deployment Rollout"]
    CD_Gate3 --> CD_Gate4
    
    CD_Gate4 --> CD_Gate5["Gate 5: Staging Health Probes & Summary"]
  end

  subgraph Targets ["Deployment Infrastructure (me-central-1)"]
    CD_Gate4 --> K8sCluster["Kubernetes Cluster (deploy/k8s)"]
    CD_Gate4 --> DockerCompose["Docker Compose Staging VM"]
    CD_Gate2 --> GHCR["GitHub Container Registry (ghcr.io)"]
  end
```

---

## 2. The 5 Continuous Deployment (CD) Gates

### Gate 1: Monorepo Verification Gate
Executed on `ubuntu-latest` with Node.js 22 and pnpm 9.15.9:
1. **Prisma Client Generation:** Pre-generates TypeScript database bindings.
2. **Turbo Lint:** Executes ESLint across all 4 applications and shared packages.
3. **Turbo Typecheck:** Enforces zero TypeScript errors across all 8 packages.
4. **Unit & Integration Tests:** Executes monorepo test suites including the 98 NestJS API tests and database RLS isolation tests.
5. **Turbo Production Build:** Next.js 15 App Router compilation and NestJS production distribution compilation.

### Gate 2: Container Image Build & GHCR Publish
Builds and pushes 4 container images in parallel using Docker Buildx and GitHub Actions cache (`type=gha`):
- `ghcr.io/syedhasnathaidershah/automotive-os/api` (from [`docker/Dockerfile.api`](file:///h:/Personal/Automotiv%20OS/docker/Dockerfile.api))
- `ghcr.io/syedhasnathaidershah/automotive-os/marketplace` (from [`docker/Dockerfile.marketplace`](file:///h:/Personal/Automotiv%20OS/docker/Dockerfile.marketplace))
- `ghcr.io/syedhasnathaidershah/automotive-os/dealer` (from [`docker/Dockerfile.dealer`](file:///h:/Personal/Automotiv%20OS/docker/Dockerfile.dealer))
- `ghcr.io/syedhasnathaidershah/automotive-os/admin` (from [`docker/Dockerfile.admin`](file:///h:/Personal/Automotiv%20OS/docker/Dockerfile.admin))

Each container image is tagged with:
- `latest`
- `staging`
- Git commit SHA (`${{ github.sha }}`)

### Gate 3: Database Migrations & Defense-in-Depth RLS Policies
- Automatically connects to the sovereign PostgreSQL database via `STAGING_DATABASE_URL`.
- Runs `npx prisma migrate deploy` to ensure schema changes are applied deterministically.
- Executes `psql -f packages/database/prisma/tenant_policies.sql` to re-apply the 28 forced tenant RLS isolation policies and composite safety constraints.

### Gate 4: Automated Staging Deployment Rollout
The workflow supports two deployment targets depending on configured repository secrets:
1. **Kubernetes (Native):** If `KUBE_CONFIG` is set, Kustomize synthesizes the updated deployment manifests with the specific commit SHA tags and applies them to namespace `automotive-os-staging`, waiting for deployment rollout confirmation.
2. **SSH / Docker Compose:** If `DEPLOY_SSH_HOST` and `DEPLOY_SSH_KEY` are configured, the runner securely connects to the staging host, pulls the new images from GHCR, and executes `docker-compose -f docker-compose.staging.yml up -d --remove-orphans`.
3. **Static Manifest Synthesis:** If external cloud cluster secrets are not yet added, the step renders the Kubernetes manifests to verify configuration integrity without failing the pipeline.

### Gate 5: Staging Health Probes & Markdown Summary
- Executes automated HTTP probes against `https://api.staging.automotive-os.ae/health` (and frontend routes).
- Emits a comprehensive GitHub Job Summary directly in the GitHub Actions dashboard.

---

## 3. GitHub Repository Secrets Reference

To link your staging cloud infrastructure, add the following secrets in GitHub Repository Settings (`Settings -> Secrets and variables -> Actions`):

| Secret Name | Required? | Purpose | Example Value |
|---|---|---|---|
| `STAGING_DATABASE_URL` | Recommended | Sovereign staging PostgreSQL connection string | `postgresql://automotive_app:pwd@host:5432/automotive_os?schema=public` |
| `KUBE_CONFIG` | Optional (K8s) | Base64-encoded `kubeconfig` for Kubernetes staging cluster | `YXBpVmVyc2lvbjog...` |
| `DEPLOY_SSH_HOST` | Optional (VM) | Public IP or hostname of staging server | `194.163.x.x` or `staging.automotive-os.ae` |
| `DEPLOY_SSH_USER` | Optional (VM) | SSH username on staging host (defaults to `root`) | `deploy` or `ubuntu` |
| `DEPLOY_SSH_KEY` | Optional (VM) | Private SSH key authorized on staging host | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_API_URL` | Optional | Custom API endpoint for post-deployment health probes | `https://api.staging.automotive-os.ae` |

> [!NOTE]
> `GITHUB_TOKEN` is provided automatically by GitHub Actions and has built-in `packages: write` permissions to push container images to GHCR without extra configuration.

---

## 4. Manual / Emergency Deployment Trigger

You can trigger a deployment manually at any time without pushing new code:
1. Go to the **Actions** tab in GitHub: `https://github.com/SyedhasnatHaiderShah/automotive-os/actions`.
2. Select **CD - Automated Deployment on Push** in the left sidebar.
3. Click **Run workflow**.
4. Select the branch (`main`) and choose `staging` or `production`.
5. Click the green **Run workflow** button.

---

## 5. Rollback Runbook

If a deployment needs to be rolled back to a previous stable commit:
1. Find the target stable commit SHA (e.g. `c1afa53`).
2. Run either:
   ```bash
   git revert HEAD
   git push origin main
   ```
   *The CD pipeline will automatically trigger, build the reverted commit, and deploy it.*
3. Or redeploy a known good image tag via `kubectl`:
   ```bash
   kubectl set image deployment/api api=ghcr.io/syedhasnathaidershah/automotive-os/api:c1afa53 -n automotive-os-staging
   kubectl rollout status deployment/api -n automotive-os-staging
   ```
