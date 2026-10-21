# Screen-by-screen implementation order

| Phase | Screens | Outcome | Gate |
|---|---|---|---|
| A public discovery | S01–S04 | search / compare | real stock, mobile, RTL |
| B transaction | S05–S07 | listing / dealer / enquiry | lead privacy + consent |
| C buyer | S08–S11 | status / booking / saved / profile | authenticated real flows |
| D dealer | S12–S13 | metrics + stock lifecycle | tenant isolation |
| E core admin | S14–S16 | governance + KYB + moderation | approvals audited |
| E extended + F DMS | S17–S23 | disputes, quotes, workshop, parts, F&I, tax, fleet | partner/gated actions |
| G exception | S24–S26 | export, finance policy, legal hold | compliance-approved rules |

Note: actual execution may reorder dependency-ready tasks after reading the repo, but cannot skip evidence gates. All numbers match user-supplied 26 designs.
