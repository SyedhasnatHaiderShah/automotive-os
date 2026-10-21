# Add these rules to the EXISTING root AGENTS.md (do not replace its contents)

## Stitch final design handoff
- The user's final Stitch inventory contains 26 screens; visual direction is Obsidian & Studio Glass dark with `#d4af37` gold and Outfit. Real approved Stitch tokens/assets override earlier generic UI sketches. Do not redesign screens to an older light-glass preference unless that matches the actual Stitch export.
- `docs/implementation/SCREEN_COVERAGE.csv` is the only source of implementation status. Never infer completeness from route names or screenshots.
- External provider interfaces and legal claims are not live just because designed. Observe `docs/implementation/INTEGRATION_TRUTH_TABLE.md` and security approval gates.
- For feature work, read the single relevant `prompts/antigravity/screens/Sxx_*.md`, mapped Stitch screen, module source and relevant contract; do NOT reload the full FRD for each screen.
- Per screen: inspect → implement one bounded change → typecheck/lint/test → E2E + browser screenshots → repair (≤3 tries) → update CSV/state/evidence → next independent screen. Stop on unsafe or permission-gated actions.
- QA is 100% only with actual proof, per `docs/implementation/QA_GATES.md`; do not invent passes or mark integration mock as verified.
