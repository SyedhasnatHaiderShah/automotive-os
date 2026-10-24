# CF-02 — Cloudflare & Sovereign UAE Infrastructure Cost Model

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF02_RESOURCE_COSTS.md`  
**Date:** October 23, 2026  
**Auditor / Architect:** Automotive OS Cloudflare Release Architect  
**Status:** REALISTIC INFRASTRUCTURE FINANCIAL AUDIT

---

## 1. Executive Cost Summary

Automotive OS utilizes a **hybrid sovereign architecture**:
1. **Global Edge Tier**: Next.js 15 frontends, static assets, and public vehicle media running on Cloudflare Workers and R2.
2. **Sovereign UAE Origin Tier**: NestJS modular monolith API, PostgreSQL 16 database, Redis BullMQ workers, and encrypted KYB document archives hosted in UAE data centers (`me-central-1`).

| Architecture Tier | Components | Provider / Region | Staging (Monthly) | Production Baseline |
| :--- | :--- | :--- | :--- | :--- |
| **Edge Compute** | 3 Workers (Marketplace, Dealer, Admin) | Cloudflare Global Edge | \$5.00 | \$25.00 – \$50.00 |
| **Edge Storage** | Public Vehicle Media Bucket (R2) | Cloudflare R2 | \$1.50 | \$15.00 – \$30.00 |
| **Edge Ingress** | Cloudflare Tunnel (`cloudflared`) | Cloudflare Edge | \$0.00 (Included) | \$0.00 (Included) |
| **Edge Security** | Cloudflare Access + WAF + DDoS | Cloudflare Zero Trust | \$0.00 (Free ≤50 seats) | \$35.00 – \$100.00 |
| **Origin Compute** | NestJS Node 22 Monolith (4 vCPU / 16GB) | AWS `me-central-1` / UAE VPS | \$120.00 | \$240.00 (Multi-AZ) |
| **Database** | PostgreSQL 16 with RLS (50GB NVMe) | Managed RDS `me-central-1` | \$65.00 | \$180.00 (HA Replica) |
| **Queue / Cache** | Redis 7 + BullMQ Workers | Origin Container / ElastiCache | \$0.00 (Co-located) | \$45.00 |
| **Backups & PITR** | Daily automated snapshots + WAL archive| Sovereign UAE S3 / EBS Snapshots| \$15.00 | \$35.00 |
| **Observability** | Workers Traces + Datadog / Grafana | Cloudflare + SaaS | \$15.00 | \$60.00 |
| **TOTAL** | **Full Platform Operational Stack** | | **\$221.50 / month** | **\$635.00 – \$775.00 / mo** |

---

## 2. Cloudflare Edge Cost Breakdown

### A. Cloudflare Workers Paid Plan
- **Base Subscription**: \$5.00 / month (covers first 10,000,000 requests per month across all account Workers).
- **Additional Requests**: \$0.30 per million requests.
- **CPU Duration**: 10M CPU milliseconds included; \$0.02 per additional 1M CPU milliseconds.
- *Staging Traffic*: ~250,000 requests/month -> **\$5.00 / month flat**.

### B. Cloudflare R2 Object Storage (Public Vehicle Media)
- **Zero Egress Fees**: Free data transfer out from R2 to edge visitors (eliminates traditional AWS S3 \$0.09/GB egress penalties).
- **Storage**: \$0.015 / GB-month (10 GB free tier included).
- **Class A Operations (Uploads/Writes)**: \$4.50 per 1,000,000 requests (1M free tier included).
- **Class B Operations (Reads)**: \$0.36 per 1,000,000 requests (10M free tier included).
- *Staging Media Footprint* (approx. 5,000 images @ 500KB = 2.5 GB) -> **\$0.00 (Covered by Free Tier) to \$1.50 / month**.

### C. Cloudflare Zero Trust (Platform Admin Protection)
- **Access Policies**: MFA, UAE Geo-IP (`AE`), Threat Score Filtering.
- **Seat Cost**: Free tier covers up to 50 active users (sufficient for staging compliance officers and admins).
- *Staging Cost*: **\$0.00 / month**.

---

## 3. Sovereign UAE Origin Cost Breakdown (`me-central-1`)

### A. Origin Compute (UAE VPS / Dedicated Cloud VM)
- **Region**: UAE (`me-central-1` UAE / Dubai or Abu Dhabi local data centers like Moro Hub, Khazna, e& enterprise).
- **Specs**: 4 vCPU, 16 GB RAM, 100 GB SSD storage.
- *Staging Cost*: **\$120.00 / month**.

### B. PostgreSQL 16 Database
- **Specs**: 2 vCPU, 8 GB RAM, 50 GB gp3 NVMe volume with automated automated backups.
- *Staging Cost*: **\$65.00 / month**.

### C. Sovereign Database Backups & PITR
- **Storage**: Automated hourly WAL log shipping + daily full snapshots retained for 30 days within sovereign UAE borders.
- *Staging Cost*: **\$15.00 / month**.

---

## 4. Critical UAE Data Residency Review: R2 vs Sovereign Storage

> [!CAUTION]
> **Data Residency Warning**: Cloudflare R2 default buckets are globally distributed across Cloudflare's international data center mesh. Cloudflare R2 does NOT offer a standalone UAE-only data sovereign boundary in standard self-serve plans.

### Legal Requirements:
Under UAE Federal Decree-Law No. 45/2021 on Personal Data Protection (PDPL):
- Trade licenses, commercial registration certificates, Emirates ID photocopies, and Article 99 dispute records cannot be stored in uncertified offshore locations without explicit legal mechanisms.

### Architecture Solution:
1. **Public Vehicle Media**: Vehicle photography, Studio Glass inspection exterior/interior captures, and public showroom banners are published globally on Cloudflare R2 (`automotive-os-media-staging`) via `https://media.staging.automotive-os.ae` to deliver ultra-low latency.
2. **Confidential KYB / KYC Dossiers**:
   - Stored in a sovereign-restricted S3-compatible bucket hosted strictly inside `me-central-1` (or encrypted with customer-managed AES-256 keys prior to object storage).
   - Pre-signed URLs generated with strict 900-second maximum TTL.
   - Bucket listing and public access are disabled.
