# S03 — Design Reference & Interaction Notes
**Screen Name:** Mobile Filters Overlay Sheet
**Stitch Title:** Mobile Filters Overlay Sheet
**Stitch Project:** 4467699827252507387
**Stitch Screen ID:** `28fac34d59ea40ed8e273e74e7dbe2a0`
**Native Dimensions:** 780 x 3634 px
**Device Type:** MOBILE
**Approved Timestamp:** 2026-10-20T11:23:14Z
**Audit Access Timestamp:** 2026-10-26T08:25:25.492Z
**Source Trace:** [S03-stitch-original.png](./S03-stitch-original.png) | [HTML source](./S03-stitch.html)

---

## 1. Visual Specification & Approved Tokens
- **Design Archetype:** Obsidian Studio Glass dark mode (#0b0f17 / #050505), with primary metallic accent `#d4af37` (UAE Desert Gold / Sovereign Gold).
- **Detected Primary Fonts:** Outfit, Inter, JetBrains Mono
- **Detected Surface Colors:** #101419, #93000a, #e0e2ea, #00354a, #00374d, #7bd0ff, #181c21, #f2ca50, #0a0e13, #ffb4ab, #31353b, #c4e7ff, #1c2025, #574500, #690005
- **Card & Border Treatment:** Semi-transparent dark studio glass, subtle border stroke (1px `rgba(255,255,255,0.08)` or `rgba(212,175,55,0.2)`), backdrop-filter blur.
- **Corner Radii:** Consistent rounded-lg (8px) / rounded-xl (12px) / rounded-2xl (16px) for cards, rounded-md (6px) for pills and badges.

---

## 2. Component Hierarchy & Interactive Controls
- **Interactive Buttons Extracted:** 34 button element(s) in reference
- **Form Inputs Extracted:** 1 input element(s) in reference
- **Tables Detected:** No
- **Dialogs / Modals Detected:** No

---

## 3. Responsive & Localization Intent
- **Stitch Viewport:** 780px (MOBILE)
- **Responsive Handling:** Approved mobile native layout. Desktop requires progressive expansion.
- **RTL Expectation:** Arabic translation layout inversion with mirrored flex directions, right-aligned text for Arabic prose, LTR preservation for VIN codes, currency numbers, and technical specs.

---

## 4. Key Interactive States to Validate
1. **Initial / Loaded State:** Full data render, sharp imagery, typography alignment.
2. **Loading State:** Skeleton shimmers matching card grid aspect ratios.
3. **Empty State:** Honest fallback with descriptive CTA when zero results return.
4. **Error State:** Error banner or modal with correlation ID and retry action.
5. **Mobile Viewport (390px):** Responsive collapsing, no horizontal overflow scrollbar, minimum 44px tap target size.
