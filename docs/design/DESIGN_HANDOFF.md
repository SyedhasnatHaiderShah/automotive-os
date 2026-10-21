# Automotive OS — Approved Stitch Design Handoff

**Project Title:** Automotive OS Design System  
**Project ID:** `4467699827252507387` (`projects/4467699827252507387`)  
**Design Theme:** Obsidian & Studio Glass  
**Integration Status:** Verified via Google Stitch MCP (`https://stitch.googleapis.com/mcp`)  
**Last Synced:** 2026-10-20  
**Governing Rule:** No frontend implementation from mock concepts or unapproved screens. The Stitch screens and tokens below represent the visual source of truth; `docs/PRODUCT_BRIEF.md` and `docs/DATABASE_DESIGN.md` represent the behavioral and architectural source of truth.

---

## 1. Design System Tokens & Foundations

### 1.1 Color Palette & Modes

#### Surface Architecture (Obsidian Dark Mode — Consumer Marketplace)
- **Deep Base Canvas (`surface`):** `#101419`
- **Lowest Recessed Ground (`surface-container-lowest`):** `#0a0e13`
- **Low Elevation Surface (`surface-container-low`):** `#181c21`
- **Standard Card / Panel Surface (`surface-container`):** `#1c2025`
- **Elevated Interactive Surface (`surface-container-high`):** `#262a30`
- **Highlight / Hover Surface (`surface-container-highest`):** `#31353b`
- **High-Contrast Text (`on-surface`):** `#e0e2ea`
- **Muted Subtitle / Microcopy (`on-surface-variant`):** `#d0c5af`
- **Dividers & Structural Borders (`outline`):** `#99907c` (Translucent variant: `#4d4635`)

#### Operational Surface Architecture (Light Studio Glass — Dealer DMS & Admin)
- **Canvas Base:** `#f8fafc` (Slate 50)
- **Glass Panel Surface:** `#ffffff` with 80% backdrop blur (`rgba(255, 255, 255, 0.85)`)
- **Border Definers:** `#e2e8f0` (Slate 200) with 1px hairline edges
- **Primary Text:** `#0f172a` (Slate 900)
- **Secondary Text:** `#64748b` (Slate 500)

#### Brand & Telemetry Accents
- **Metallic Gold / Primary (`primary`):** `#f2ca50` (Base Accent: `#d4af37`, Container: `#ffe088`, Text on Primary: `#3c2f00`)
- **Telemetry Azure / Secondary (`secondary`):** `#7bd0ff` (Container: `#00a6e0`, On Secondary: `#00354a`)
- **Verified Emerald / Tertiary (`tertiary`):** `#58e7aa` (Verified Badge: `#10b981`, Deep Emerald: `#003824`)
- **Warning / Review Needed:** `#f59e0b` (Dark Accent: `#fbbf24`)
- **Critical / Blocked / Error (`error`):** `#ffb4ab` (Deep Red: `#93000a`, On Error: `#690005`)

---

### 1.2 Typography & Bilingual Arabic RTL Protocol

| Role | Font Family (English / Latin) | Font Family (Arabic RTL) | Weights | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display & Headlines** | `Outfit` | `IBM Plex Sans Arabic` | SemiBold (600), Medium (500) | Hero banners, vehicle title dossiers, high-impact marketing headers. *(Arabic line-height adjusted by +4px)* |
| **Body & UI Controls** | `Inter` | `Noto Sans Arabic` | Regular (400), Medium (500) | Form fields, descriptions, filter controls, dialogs. |
| **Data, Pricing & VINs** | `JetBrains Mono` | `JetBrains Mono` (Latin LTR) | Regular (400), Medium (500) | Tabular lining figures, odometer readouts, VIN chassis codes, and price figures. |

#### UAE Localization & Formatting Rules
1. **Currency Representation:**
   - English contexts: `AED 350,000` (pairing uppercase ISO code with tabular figures).
   - Arabic contexts: `٣٥٠,٠٠٠ د.إ` or `350,000 د.إ`.
2. **VIN & Technical Spec Preservation:**
   - VINs (e.g. `1GNEK1337PREST01`) must strictly render left-to-right (`dir="ltr"`) in `JetBrains Mono` monospace, even when nested inside Arabic RTL screens.
3. **Corner Roundness:** Standardized to `ROUND_EIGHT` (`rounded-lg` / `8px`) across cards and interactive buttons.

---

### 1.3 Breakpoints & Layout Architecture

- **Desktop (Primary Canvas):** `1440px` (Max contained content width; 12-column grid, `24px` gutter, `48px` outer margins).
- **Tablet / Medium:** `768px - 1024px` (8-column grid, `16px` gutter, `24px` outer margins).
- **Mobile (Handheld):** `390px` reference width (4-column grid, `12px` gutter, `16px` outer margins).

---

## 2. Approved Screen Registry

All 17 production screen instances have been verified and retrieved from Stitch Project `4467699827252507387`:

### Group 1: Marketplace Discovery & Search
| Screen ID | Title / Screen Name | Viewport | Target Route / App |
| :--- | :--- | :--- | :--- |
| `5f05e07d66314d02ba903a3e9635e5e0` | **Marketplace Home & Car Search** | Desktop (1280x2892) | `apps/marketplace/app/page.tsx` |
| `25f8c91796994dafa16e145333eb0cc0` | **Search Results & Dealer Filters** | Desktop (1280x2021) | `apps/marketplace/app/cars/page.tsx` |
| `28fac34d59ea40ed8e273e74e7dbe2a0` | **Mobile Filters Overlay Sheet** | Mobile (390x1832) | `apps/marketplace/components/filters/mobile-sheet.tsx` |
| `b51417ac4c204fedb45c2149513931f0` | **Vehicle Comparison Matrix** | Desktop (1280x2992) | `apps/marketplace/app/compare/page.tsx` |

### Group 2: Listing & Dealer Provenance
| Screen ID | Title / Screen Name | Viewport | Target Route / App |
| :--- | :--- | :--- | :--- |
| `f8eeabe57ad843a1b14e3323102c8151` | **Vehicle Listing Detail Dossier** | Desktop (1280x3146) | `apps/marketplace/app/cars/[slug]/page.tsx` |
| `a6d81d9621e44e26a1c232ee6b5af777` | **Verified Dealership Storefront** | Desktop (1280x3574) | `apps/marketplace/app/dealers/[slug]/page.tsx` |

### Group 3: Buyer Workspace & VIP Engagement
| Screen ID | Title / Screen Name | Viewport | Target Route / App |
| :--- | :--- | :--- | :--- |
| `1ff78cd6f95845538cc81b3849e62c88` | **VIP Enquiry & Consent Flow** | Desktop (1280x2104) | `apps/marketplace/app/cars/[slug]/enquiry/page.tsx` |
| `f01f7d612a404834a9d371d8c38945e2` | **Saved Searches & Favorites** | Desktop (1280x2062) | `apps/marketplace/app/saved/page.tsx` |
| `569db08de4024230815eb363576d3554` | **Buyer Profile & Privacy Permissions** | Desktop (1280x2512) | `apps/marketplace/app/profile/page.tsx` |
| `a22fe42f09924bcf85ec90f61abcf9b7` | **Buyer Enquiry Status Timeline** | Desktop (1280x3173) | `apps/marketplace/app/enquiries/page.tsx` |
| `ad4e47810bc64f479b9f6a871187c52c` | **Appointments, Test Drives & Virtual Garage** | Desktop (1280x2634) | `apps/marketplace/app/garage/page.tsx` |

### Group 4: Dealer SaaS / DMS Operations
| Screen ID | Title / Screen Name | Viewport | Target Route / App |
| :--- | :--- | :--- | :--- |
| `d36891533e434d269961e108cff842e2` | **Dealer Executive Overview Dashboard** | Desktop (1280x1881) | `apps/dealer/app/dashboard/page.tsx` |
| `68e3e92ee73344beaddb67201f3db443` | **Vehicle Inventory Management Grid** | Desktop (1280x1534) | `apps/dealer/app/inventory/page.tsx` |

### Group 5: Platform Administration & Governance
| Screen ID | Title / Screen Name | Viewport | Target Route / App |
| :--- | :--- | :--- | :--- |
| `c66fabd239274215933c237649699f1d` | **KYB Dealer Verification & Audit Dossier** | Desktop (1280x2233) | `apps/admin/app/verifications/[id]/page.tsx` |
| `8ac37f225c8e44ff8d99e824c784ccd7` | **Vehicle Listing Moderation & VIN Risk Review** | Desktop (1280x2469) | `apps/admin/app/moderation/listings/[id]/page.tsx` |
| `10ebda02e492484d9444279dcbfdaa23` | **Seller Sanctions & Escrow Dispute Review** | Desktop (1280x1981) | `apps/admin/app/disputes/page.tsx` |
| `4404fdad57e3414992311b05009d6c7c` | **Platform Operations & Governance Command** | Desktop (1280x2066) | `apps/admin/app/dashboard/page.tsx` |

---

## 3. Unresolved UX & Open Review Items

1. **Mobile Responsive Views for Dealer DMS & Admin**:
   - The current Stitch approval contains mobile overlay sheet (`28fac34d59ea40ed8e273e74e7dbe2a0`) for marketplace discovery.
   - Dedicated mobile viewports for complex DMS tabular data (`68e3e92ee73344beaddb67201f3db443`) and admin review are deferred post-P0 (desktop/tablet responsive baseline).
2. **Web Font Licensing**:
   - Google Fonts (`Outfit`, `Inter`, `JetBrains Mono`, `IBM Plex Sans Arabic`, `Noto Sans Arabic`) are SIL Open Font Licensed (OFL) and approved for commercial web embedding.
3. **Frontend Implementation Sequence**:
   - As mandated by workspace rules, UI slices will be implemented strictly screen-by-screen referencing these approved Stitch screen IDs and exact design tokens without manual redesign.
