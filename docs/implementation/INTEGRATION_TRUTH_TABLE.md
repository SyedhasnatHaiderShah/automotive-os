# External Integrations & Regulatory Truth Table

**Operational Strategy:** Go-Live Without Live External Rails  
**Runtime Posture:** All Third-Party Live Handshakes Designated as **"Coming Soon"**  
**Integration Flags:** All `FEATURE_FLAG_*_LIVE=false` by Design  
**Production Onboarding:** Commercial partner API keys, OIDC client secrets, and banking custody endpoints to be provisioned during subsequent enterprise onboarding.

---

## 1. Truth Matrix & "Coming Soon" Designation

| Design Claim / External Rail | Designated Provider | Go-Live Operational Status | User-Facing Label / Badge | Safe Go-Live Fallback Mechanism | Production Onboarding Gate |
|---|---|---|---|---|---|
| **UAE PASS Identity SSO** | UAE Digital Government / OIDC | **Coming Soon** | `Live Rail: Coming Soon` | Local username/password, Emirates ID input, and safe sandbox biometric token simulator. | Signed DGA commercial agreement, production OIDC credentials (`client_id`, `client_secret`). |
| **DED Commercial Registry** | UAE DED / Ministry of Economy | **Coming Soon** | `Registry Feed: Coming Soon` | Manual Trade License document intake and compliance officer review log in S15 (`/verifications/[id]`). | Authorized UAE government registry web service integration. |
| **RTA Tasjeel Technical Inspection** | RTA Tasjeel / Emirates Transport | **Coming Soon** | `Live Inspection Sync: Coming Soon` | 34-point MPI inspection display; certificates shown only when supported by uploaded PDF report. | Contracted RTA inspection data exchange API credentials. |
| **VIN Integrity / Salvage Registry** | UAE Police / Commercial Carfax | **Coming Soon** | `Salvage Feed: Coming Soon` | Manual chassis inspection review checklist; no counterfeit "cleared" badges. | Licensed salvage/stolen vehicle API data provider agreement. |
| **AECB Credit Bureau Scoring** | Al Etihad Credit Bureau (AECB) | **Coming Soon** | `Direct Bureau Feed: Coming Soon` | Client consent token capture and referral status tracking; automated live bureau query button disabled. | Executed AECB direct enterprise pull license. |
| **Lender Financing & DBR Underwriting**| CBUAE Open Banking | **Coming Soon** | `Live Syndicate API: Coming Soon` | Indicative 50% DBR / 85% LTV rules engine with statutory indicative disclaimer; manual application pack export. | CBUAE Open Finance API participant certificate. |
| **FTA E-Invoicing (Peppol BIS 3.0)** | Federal Tax Authority (FTA) | **Coming Soon** | `Live Peppol Exchange: Coming Soon` | Compliant Base64 TLV QR code and Peppol UBL XML generator exporting in "Draft / Staging" status. | FTA accredited Peppol Service Metadata Publisher (SMP) onboarding. |
| **Escrow & Custody Settlement** | Licensed UAE Custody Bank (FAB/ENBD) | **Coming Soon** | `Live Bank Escrow: Coming Soon` | Dispute state machine and milestone hold tracking; manual certified manager's cheque / bank draft settlement. | Bilateral custody banking agreement and live IPP payment rail keys. |
| **Judicial Injunctions & Sanctions** | Dubai Courts Execution Dept | **Coming Soon** | `Live Courts Feed: Coming Soon` | Manual court order intake, officer ID attestation, and Article 99 interpleader escrow filing workflow. | Dubai Courts electronic notification API gateway. |
| **Customs Export Bonds (Mirsal 2)** | Dubai Customs Mirsal 2 | **Coming Soon** | `Live Mirsal Sync: Coming Soon` | Statutory 90-day export bond countdown timer with manual bill of entry upload. | Dubai Customs Mirsal 2 B2B direct channel certificate. |

---

## 2. Core Go-Live Operational Rules

1. **Zero Fake Claims:** The platform never displays mock telemetry as production-certified or represents simulated balances as real money.
2. **"Coming Soon" Disclosure:** Every button, card, or toggle associated with an unintegrated third-party live rail carries an explicit **"Coming Soon"** (or Arabic **"قريباً"**) badge.
3. **Manual Settlement Guardrails:** Vehicle purchases and deposit holdings during the initial launch operate through traditional certified cashier cheques, manager's cheques, or direct dealer wire transfers.
4. **Audit Immutability:** All administrative inspections, trade license verifications, and listing moderations record immutable audit entries with the actor's user ID, IP address, and timestamp.
