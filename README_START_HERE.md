# Automotive OS — Stitch gap closure + autonomous QA loop

**Use this as an overlay on the existing Automotive OS project. Do NOT replace or regenerate the existing app.**

## Install
1. Unzip into `Automotive OS/` project root, merging folders, preserving existing `AGENTS.md` and all existing code. This pack adds `AGENTS_ADDITION_AUTONOMOUS_LOOP.md`; append its contents to `AGENTS.md` or ask Antigravity to read both.
2. Confirm Antigravity has your approved Stitch project connected via the official Stitch MCP; if not, export source screenshots and link them in `docs/implementation/STITCH_SCREEN_MAP.csv`.
3. Commit current code or make a clean recovery branch BEFORE the autonomous loop; keep safe/sandboxed tool permissions (do not enable unsafe unrestricted auto-execution).
4. Paste `prompts/antigravity/control/00_RECONCILE_STITCH_WITH_CODE.md` into Antigravity. This checks which screens AG-09 really finished instead of presuming gaps.
5. Paste **ONE** `prompts/antigravity/control/01_AUTONOMOUS_MASTER_LOOP.md` to execute sequentially. All 26 per-screen worker instructions live in `prompts/antigravity/screens/`; no need to paste 26 huge prompts.
6. If Antigravity suspends, asks approval, or runs out of context, resolve approvals and paste `02_RESUME_LOOP.md` in a new conversation. Run `03_FINAL_QA_AND_RELEASE_REPORT.md` after implementation.

## Real constraints
- P0 = S01–S16; P1 = S17–S26. Percentage is documented and cannot be manipulated by marking a styled page complete.
- User's design describes bank, tax, court, escrow, government and credit integrations, but visual designs DO NOT supply implementation contracts/permissions. Those are `BLOCKED_EXTERNAL` until verified.
- Antigravity can work through multiple coding and testing tasks with tools and MCP, but a prompt cannot force unlimited continuous execution, bypass tool permissions, or replace review of sensitive actions.
- The exact routes and package scripts must be discovered from the repository; current QA statuses remain `NOT_AUDITED` by design.

## Reference priority
1. Approved actual Stitch design/screen export (visual authority)
2. Existing `AGENTS.md` + accepted ADRs + running code
3. `docs/design/DESIGN_HANDOFF.md`
4. `docs/references/engineering/API_CONTRACTS.md`
5. `docs/references/FRD_v2.1_UAE.docx` (only on targeted requirements disputes)
6. Current design inventory summary in this pack (not a substitute for actual Stitch assets)

## Official Google references
- https://codelabs.developers.google.com/design-to-code-with-antigravity-stitch
- https://www.antigravity.google/docs/mcp
- https://www.antigravity.google/docs/agent-settings
- https://www.antigravity.google/docs/commands/browser/
