# CF-07: Single-Domain Routing & Multi-Zone Ingress Architecture

## 1. Context & Business Drivers

Historically, Automotive OS operated across multiple independent domains or ports:
- Public Marketplace: `http://localhost:3000` / `automotive-marketplace-staging.up.railway.app`
- Dealer Portal: `http://localhost:3001` / `automotive-dealer-staging.up.railway.app`
- Platform Admin: `http://localhost:3002` / `automotive-admin-staging.up.railway.app`
- API Backend: `http://localhost:4000` / `api-staging.syedhasnat.com`

This architectural fragmentation produced significant user-experience friction and security complications:
1. **Cross-Site Cookie Partitioning**: Modern browsers (Safari ITP, Chrome Privacy Sandbox, Firefox ETP) block third-party cookies, causing session drops when navigating from Marketplace to Dealer or Admin.
2. **CORS Complexity & Preflight Latency**: All browser interactions required explicit CORS headers, preflight `OPTIONS` requests, and credentials sharing.
3. **Disjointed User Journeys**: Customers had to remember multiple subdomains, leading to phishing vulnerabilities and brand dilution.

---

## 2. Target Single-Domain URL Hierarchy

Under Mission CF-07, all applications are unified behind a **single domain** (e.g., `https://automotive-os.ae` or the primary Railway ingress) using Next.js App Router Multi-Zones:

| Route Pattern | Target Application | Ingress Mechanism | basePath |
| :--- | :--- | :--- | :--- |
| `/` | `apps/marketplace` | Direct Ingress (Root App) | None (`/`) |
| `/cars/*` | `apps/marketplace` | Direct Ingress | None (`/`) |
| `/dealers/*` | `apps/marketplace` | Direct Ingress | None (`/`) |
| `/auth` | `apps/marketplace` | Direct Ingress (Unified Auth) | None (`/`) |
| `/dashboard` | `apps/marketplace` | Direct Ingress (Role Resolver)| None (`/`) |
| `/account/*` | `apps/marketplace` | Direct Ingress (Customer Hub) | None (`/`) |
| `/dealer/:path*` | `apps/dealer` | Next.js Multi-Zone Rewrite | `basePath: '/dealer'` |
| `/admin/:path*` | `apps/admin` | Next.js Multi-Zone Rewrite | `basePath: '/admin'` |
| `/api/:path*` | `apps/api` | Next.js Multi-Zone Rewrite | NestJS Global Prefix `/api` |

---

## 3. Next.js Multi-Zone Implementation Details

### Ingress App Configuration (`apps/marketplace/next.config.mjs`)
The marketplace application acts as the edge reverse-proxy for the monorepo:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
  async rewrites() {
    const dealerServiceUrl = process.env.DEALER_SERVICE_URL || 'http://localhost:3001';
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL || 'http://localhost:3002';
    const apiServiceUrl = process.env.API_SERVICE_URL || 'http://localhost:4000';

    return [
      {
        source: '/dealer/:path*',
        destination: `${dealerServiceUrl}/dealer/:path*`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminServiceUrl}/admin/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiServiceUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

### Micro-Frontend BasePath Configurations

1. **Dealer App (`apps/dealer/next.config.mjs`)**:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     basePath: '/dealer',
     reactStrictMode: true,
     transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
   };
   export default nextConfig;
   ```
   - Automatically prefixes all page routes, static assets (`/_next/static/*`), and internal links with `/dealer`.
   - Eliminates route collision between `/dealer/dashboard` and root `/dashboard`.

2. **Admin App (`apps/admin/next.config.mjs`)**:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     basePath: '/admin',
     reactStrictMode: true,
     transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
   };
   export default nextConfig;
   ```
   - Prefixes all admin pages (`/admin/users`, `/admin/dealers`, `/admin/audit-logs`) and static assets.

---

## 4. Single-Origin Cookie Propagation

Because all requests share the same origin (`Origin: https://automotive-os.ae`):
1. **Cookie Scope**: The `ao_session` cookie is issued with `Path=/`.
2. **Universal Delivery**: Any request to `/`, `/dealer/*`, `/admin/*`, or `/api/*` automatically includes `Cookie: ao_session=...`.
3. **Zero Third-Party Partitioning**: Browsers treat the cookie as first-party in every zone.
4. **No CORS Overhead**: Browser-to-API requests over `/api/*` do not trigger CORS preflight requests or origin validation errors.

---

## 5. Architectural Benefits & Production Readiness

| Dimension | Multi-Zone Single-Domain Architecture | Legacy Fragmented Architecture |
| :--- | :--- | :--- |
| **User Experience** | Single unified URL, persistent authentication, seamless tab transitions | Fragmented logins, unexpected redirects across subdomains |
| **Security Posture** | First-party `ao_session` cookies, strict CSRF protection via SameSite=Lax | Complex cross-origin headers, risk of CORS misconfiguration |
| **Deployment Independence** | Each Next.js service deploys independently in Railway without lockstep builds | Tight coupling or fragile token handoffs |
| **Edge Routing Latency** | Direct intra-cluster rewrites within Railway internal network | Public internet hops between subdomains |
