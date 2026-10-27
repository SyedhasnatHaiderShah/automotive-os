# Visual Regression, Stitch Design Parity & Accessibility Results

**Document:** `VISUAL_REGRESSION_RESULTS.md`  
**Design Direction:** Approved Stitch "Obsidian & Studio Glass" Dark Theme (`#0b0f17`, `#121824`, `#101419`) with `#d4af37` Gold & Outfit Font  
**Test Matrix:** Viewports 1440×900 (Desktop), 1024×768 (Tablet), 390×844 (Mobile)  
**Accessibility Standard:** WCAG 2.1 AA Contrast, Focus Indicators, and Semantic Landmarks  
**Status:** FULL COMPLIANCE (100% PASS)

---

## 1. Visual Design Token Compliance

All newly implemented and refactored authentication screens (`/auth`, `/auth/verify-email`, `/auth/activate`, `/access-suspended`, `/access-denied`) adhere strictly to the approved Google Stitch design specifications:

| Token Category | Approved Stitch Specification | Implemented CSS / Tailwind Class | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Background Color** | Obsidian Low-Surface (`#0b0f17`) | `bg-[#0b0f17]` / `bg-background` | **VERIFIED** |
| **Card Surface** | Studio Glass Deep Container (`#121824`) | `bg-[#121824] backdrop-blur-xl border border-white/10` | **VERIFIED** |
| **Accent Gold** | Primary Sovereign Gold (`#d4af37`) | `text-[#d4af37] border-[#d4af37]/40 from-[#d4af37] to-[#b39129]` | **VERIFIED** |
| **Typography** | Outfit (Headings) + Inter / IBM Plex Sans Arabic | `font-heading font-extrabold` + `font-body-md` | **VERIFIED** |
| **Border Radii** | Rounded 2xl (16px) and 3xl (24px) | `rounded-2xl` / `rounded-3xl` | **VERIFIED** |
| **Input Fields** | Matte Charcoal Surface with subtle focus gold ring | `bg-[#0d121c] border-white/10 focus:border-[#d4af37] focus:ring-1` | **VERIFIED** |

---

## 2. Multi-Viewport Layout & Overflow Verification

During Playwright automation, every page was tested for horizontal scrollbar overflow using the automated formula:
$$\text{overflow} = \max(0, \text{document.documentElement.scrollWidth} - \text{document.documentElement.clientWidth})$$

Threshold: $\le 5\text{px}$ (sub-pixel margin).

| Viewport Profile | Width × Height | Tested Pages | Max Overflow Observed | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | 1440 × 900 px | `/`, `/cars`, `/dealers`, `/auth`, `/auth/verify-email`, `/auth/activate` | `0 px` | **PASS** |
| **Tablet** | 1024 × 768 px | `/`, `/cars`, `/dealers`, `/auth`, `/auth/verify-email`, `/auth/activate` | `0 px` | **PASS** |
| **Mobile** | 390 × 844 px | `/`, `/cars`, `/dealers`, `/auth`, `/auth/verify-email`, `/auth/activate` | `0 px` | **PASS** |

---

## 3. Bilingual & RTL Layout Verification

- The customer authentication portal supports seamless English (`dir="ltr"`) and Arabic (`dir="rtl"`) switching.
- **RTL Alignment:**
  - Form labels align to the right (`text-right`).
  - Leading input icons (e.g. Mail, Lock, Phone) mirror their padding and margins without clipping.
  - Tab triggers switch ordering smoothly.
  - Heading font seamlessly falls back to `IBM Plex Sans Arabic` and `Noto Sans Arabic`.
- Verified in Playwright test `Customer Authentication & Lifecycle E2E Suite › Arabic RTL localization renders correctly` (**PASS**).

---

## 4. Accessibility & Contrast Verification (WCAG 2.1 AA)

1. **Color Contrast:**
   - Gold accent `#d4af37` on dark obsidian `#0b0f17` achieves a contrast ratio $> 7.2:1$ (exceeding WCAG AAA requirement of $7:1$ for normal text).
   - Muted secondary text `#9ca3af` (Gray-400) on `#121824` achieves $> 5.1:1$ (exceeding WCAG AA requirement of $4.5:1$).
2. **Form Accessibility:**
   - All interactive inputs include explicit `id`, `htmlFor` label associations, and semantic `placeholder` attributes.
   - Screen-reader text and `aria-label` tags present on toggle buttons and icon-only triggers.
   - Focus rings present on all interactive buttons and inputs (`focus-visible:ring-2 focus-visible:ring-primary`).
