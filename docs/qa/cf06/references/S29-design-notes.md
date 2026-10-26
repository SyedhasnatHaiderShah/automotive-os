# S29 — Design Reference & Interaction Notes
**Screen Name:** Forgot Password & Reset Sovereign PIN
**Stitch Title:** Forgot Password & Reset Sovereign PIN
**Stitch Project:** 4467699827252507387
**Stitch Screen ID:** `7b3928ad8d7640fcbb51ed02c9b1e623`
**Native Dimensions:** 2560 x 3812 px
**Device Type:** DESKTOP
**Approved Timestamp:** 2026-10-23T06:00:00Z
**Audit Access Timestamp:** 2026-10-26T08:26:00.903Z
**Source Trace:** [S29-stitch-original.png](./S29-stitch-original.png) | [HTML source](./S29-stitch.html)

---

## 1. Visual Specification & Approved Tokens
- **Design Archetype:** Obsidian Studio Glass dark mode (#0b0f17 / #050505), with primary metallic accent `#d4af37` (UAE Desert Gold / Sovereign Gold).
- **Detected Primary Fonts:** Outfit, Inter, JetBrains Mono
- **Detected Surface Colors:** #d0c5af, #c4e7ff, #005035, #93000a, #e9c349, #101419, #99907c, #33ca90, #58e7aa, #1c2025, #4d4635, #e0e2ea, #00354a, #f2ca50, #003824
- **Card & Border Treatment:** Semi-transparent dark studio glass, subtle border stroke (1px `rgba(255,255,255,0.08)` or `rgba(212,175,55,0.2)`), backdrop-filter blur.
- **Corner Radii:** Consistent rounded-lg (8px) / rounded-xl (12px) / rounded-2xl (16px) for cards, rounded-md (6px) for pills and badges.

---

## 2. Component Hierarchy & Interactive Controls
- **Interactive Buttons Extracted:** 10 button element(s) in reference
- **Form Inputs Extracted:** 22 input element(s) in reference
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
