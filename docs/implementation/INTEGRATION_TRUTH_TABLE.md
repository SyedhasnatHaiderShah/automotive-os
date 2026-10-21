# External integrations and regulatory truth table

| Design claim | Safe dev behavior before verified partner access | May mark live verified only with |
|---|---|---|
| UAE PASS SSO | Local login; integration feature flag OFF; clearly label "Not connected" | Signed agreement/credentials, documented callback and integration tests |
| DED/KYB/license telemetry | Manual document review with reviewer identity/source | Authorized up-to-date government/business-registry feed |
| RTA/Tasjeel inspection score | Show certificate only with verified uploaded document/source; no invented ≥95 | Contracted source, result provenance and expiry verification |
| VIN stolen/flood/salvage registry | Manual flags/evidence, no falsely definitive green badge | Licensed API/data provenance and limitations disclosures |
| AECB credit score/soft check | Consent capture + referral tracking only; disabled check action | AECB/provider contract, explicit permissions, secure API |
| Lender live terms/DBR/LTV | Illustrative calculator with disclaimer, not approved finance | Partner-approved offer API and verified current legal/business rules |
| FTA VAT/e-invoicing/QR/Peppol | Configurable invoice drafts, no compliant/certified badge | Tax counsel approval + accredited integration/testing as applicable |
| CBUAE rules | Policy engine with versioned configurable rules and legal review flag | Relevant rules counsel/compliance have verified and approved |
| FAB/third-party escrow | Internal case state only; no holding balances or release action | Licensed custody/settlement service, contract, audited flows |
| DIFC/courts/judicial injunction | Manual verified legal hold status + audit | Authorized verification and documented legal process |
| Customs/Bayan/ZATCA export clock | Evidence checklist + configurable due date | Verified jurisdictions/rules and authorized integrations |
| OEM microsites/sensor telemetry/WhatsApp | Manual upload, instrumented sandbox adapters and UI fallback | Provider credentials, privacy policy and tested webhooks |

Never print fabricated integration telemetry or invented legal/court identifiers as if live. Reference examples may appear only in explicit sandbox/demo fixtures.
