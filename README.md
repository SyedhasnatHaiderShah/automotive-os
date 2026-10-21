# Automotive OS — Monorepo

UAE-first, multi-tenant dealership SaaS (DMS) and verified-dealer car marketplace.

---

## 1. Stack & Architecture

- **Monorepo Management:** [Turborepo 2](https://turbo.build/) + [pnpm 9 workspaces](https://pnpm.io/)
- **Backend API:** [NestJS 10](https://nestjs.com/) (modular monolith, Node.js 20+ LTS / v24)
- **Frontend Applications:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) with Row-Level Security (RLS)
- **Caching & Queues:** [Redis 7](https://redis.io/) + [BullMQ](https://bullmq.io/)
- **Styling & UI:** Tailwind CSS, shared UI package (`@automotive-os/ui`)
- **Language & Runtime:** TypeScript 5.7+ / Node.js 24

---

## 2. Pinned Versions

| Component | Exact Version / Specifier |
| :--- | :--- |
| **Node.js** | `v24.11.1` (LTS / current) |
| **pnpm** | `9.15.9` |
| **Turborepo** | `^2.4.4` |
| **TypeScript** | `^5.7.3` |
| **NestJS** | `@nestjs/core@^10.4.15`, `@nestjs/common@^10.4.15`, `@nestjs/platform-express@^10.4.15` |
| **Next.js** | `^15.1.7` |
| **React / React DOM** | `^19.0.0` |
| **Prisma** | `^6.4.1` (`@prisma/client@^6.4.1`) |
| **PostgreSQL** | `16-alpine` (Docker) |
| **Redis** | `7-alpine` (Docker) |

---

## 3. Monorepo Structure

```text
Automotive OS/
├── apps/
│   ├── api/             # NestJS modular-monolith backend (Port 4000)
│   ├── marketplace/     # Next.js buyer portal & public marketplace (Port 3000)
│   ├── dealer/          # Next.js dealer DMS portal (Port 3001)
│   └── admin/           # Next.js platform admin portal (Port 3002)
├── packages/
│   ├── config/          # Shared tsconfig, eslint, and base configs
│   ├── contracts/       # Shared DTOs, interfaces, and tenancy contracts
│   ├── database/        # Prisma schema, client, and tenant isolation extensions
│   └── ui/              # Shared React UI components (Button, Card, Badge, etc.)
├── docs/                # Product briefs, ADRs, and specification documents
├── .github/workflows/   # CI pipeline definition
├── docker-compose.yml   # Local Postgres & Redis services
├── pnpm-workspace.yaml  # Workspace configuration
├── turbo.json           # Turborepo task pipeline
└── package.json         # Root scripts and dev dependencies
```

---

## 4. Getting Started & Commands

### Prerequisites
- Node.js `v20+` (tested on `v24.11.1`)
- pnpm `v9.15.9` (`npm install -g pnpm@9`)
- Docker & Docker Compose (optional, for local DB/Redis)

### Local Infrastructure
Start PostgreSQL and Redis in the background:
```bash
docker compose up -d
```

### Installation
Install dependencies across all workspaces:
```bash
pnpm install
```

### Build & Code Quality
Run Turborepo pipelines across all apps and packages:
```bash
# Build all packages and applications
pnpm run build

# Run type checking across the monorepo
pnpm run typecheck

# Run linting across the monorepo
pnpm run lint

# Run unit and contract tests
pnpm run test
```

### Development Servers
Run all applications in watch mode:
```bash
pnpm run dev
```
Or run individual applications:
```bash
pnpm --filter api dev          # API on http://localhost:4000
pnpm --filter marketplace dev  # Marketplace on http://localhost:3000
pnpm --filter dealer dev       # Dealer DMS on http://localhost:3001
pnpm --filter admin dev        # Platform Admin on http://localhost:3002
```

---

## 5. Health Endpoints

Each service exposes a verified health route:
- **API:** `GET http://localhost:4000/health`
- **Marketplace:** `GET http://localhost:3000/api/health`
- **Dealer DMS:** `GET http://localhost:3001/api/health`
- **Admin:** `GET http://localhost:3002/api/health`
