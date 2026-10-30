# Palette's Journal - Critical UX & Accessibility Learnings

## Format
`## YYYY-MM-DD - [Title]`
**Learning:** [UX/a11y insight]
**Action:** [How to apply next time]

## 2026-10-30 - Modal Accessible Form Control Association and Keyboard Escape Handlers
**Learning:** Modal dialogs with forms must bind labels explicitly to inputs with matching `htmlFor` and `id` attributes, and handle the `Escape` key for keyboard dismissibility to meet WCAG accessibility standards.
**Action:** Always ensure modal overlays attach a `keydown` listener for `Escape` and that form inputs use explicit `id` & `htmlFor` pairs instead of relying solely on implicit text layout.
