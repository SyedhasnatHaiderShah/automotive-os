## 2026-10-26 - React Component Re-render Optimization in Inventory Matrix
**Learning:** High-density client components with multiple interactive state toggles (such as selection sets, page index, and VIN visibility toggles) trigger frequent re-renders. Re-filtering and iterating over dataset collections directly in the render body causes unnecessary string matching and array traversals on every UI interaction.
**Action:** Wrap filtering and transformation operations on list items in `useMemo` so that state changes like row selection or page changes do not re-run filtering algorithms.
