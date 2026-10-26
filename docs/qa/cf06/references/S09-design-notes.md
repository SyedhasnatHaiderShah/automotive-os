# S09 — Design Reference & Interaction Notes
**Screen Name:** Appointments, Test Drives & Virtual Garage
**Stitch Title:** Appointments, Test Drives & Virtual Garage
**Stitch Project:** 4467699827252507387
**Stitch Screen ID:** `ad4e47810bc64f479b9f6a871187c52c`
**Native Dimensions:** 2560 x 5270 px
**Device Type:** DESKTOP
**Approved Timestamp:** 2026-10-20T11:23:14Z
**Audit Access Timestamp:** 2026-10-26T08:25:32.786Z
**Source Trace:** [S09-stitch-original.png](./S09-stitch-original.png) | [HTML source](./S09-stitch.html)

---

## 1. Visual Specification & Approved Tokens
- **Design Archetype:** Obsidian Studio Glass dark mode (#0b0f17 / #050505), with primary metallic accent `#d4af37` (UAE Desert Gold / Sovereign Gold).
- **Detected Primary Fonts:** Outfit, Inter, JetBrains Mono
- **Detected Surface Colors:** #e0e2ea, #690005, #2d3136, #ffb4ab, #101419, #4d4635, #f2ca50, #ffdad6, #241a00, #4edea3, #ffe088, #262a30, #33ca90, #d0c5af, #e9c349
- **Card & Border Treatment:** Semi-transparent dark studio glass, subtle border stroke (1px `rgba(255,255,255,0.08)` or `rgba(212,175,55,0.2)`), backdrop-filter blur.
- **Corner Radii:** Consistent rounded-lg (8px) / rounded-xl (12px) / rounded-2xl (16px) for cards, rounded-md (6px) for pills and badges.

---

## 2. Component Hierarchy & Interactive Controls
- **Interactive Buttons Extracted:** 32 button element(s) in reference
- **Form Inputs Extracted:** 6 input element(s) in reference
- **Tables Detected:** No
- **Dialogs / Modals Detected:** No

---

## 3. Responsive & Localization Intent
- **Stitch Viewport:** 2560px (DESKTOP)
- **Responsive Handling:** Approved desktop layout (1440px / 2560px canvas). Mobile (390px) and Tablet (768px/1024px) are [INFERRED] from token hierarchy and flexible flex/grid wrapping.
- **RTL Expectation:** Arabic translation layout inversion with mirrored flex directions, right-aligned text for Arabic prose, LTR preservation for VIN codes, currency numbers, and technical specs.

---

## 4. Key Interactive States to Validate
1. **Initial / Loaded State:** Full data render, sharp imagery, typography alignment.
2. **Loading State:** Skeleton shimmers matching card grid aspect ratios.
3. **Empty State:** Honest fallback with descriptive CTA when zero results return.
4. **Error State:** Error banner or modal with correlation ID and retry action.
5. **Mobile Viewport (390px):** Responsive collapsing, no horizontal overflow scrollbar, minimum 44px tap target size.
