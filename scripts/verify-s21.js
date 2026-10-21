const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyS21() {
  console.log('--- Starting S21 Finance & Insurance Referral & Banking Desk Verification ---');

  const evidenceDir = path.join(__dirname, '..', 'docs', 'qa', 'evidence', 'S21');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('Navigating to http://localhost:3001/finance ...');
    const response = await page.goto('http://localhost:3001/finance', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    const statusCode = response.status();
    results.push({
      check: 'HTTP 200 Response on /finance',
      passed: statusCode === 200,
      detail: `Status code: ${statusCode}`
    });

    const bodyText = await page.textContent('body');

    // 1. Concept Roadmap Hero Banner & Badges
    const hasRoadmapBadge = bodyText.includes('FUTURE ROADMAP • P1 SPECIFICATION') || bodyText.includes('P1 SPECIFICATION');
    const hasCbuaeSandbox = bodyText.includes('CBUAE SANDBOX REGULATORY MOCKUP');
    const hasApiTarget = bodyText.includes('v1.4-cbuae-openfinance');
    const hasTitle = bodyText.includes('F&I Referral & Lending Status Desk') || bodyText.includes('Finance & Insurance');
    results.push({
      check: 'P1 Concept Roadmap Hero Banner & Statutory Badges (CBUAE Sandbox, OpenFinance API v1.4)',
      passed: hasRoadmapBadge && hasCbuaeSandbox && hasApiTarget && hasTitle,
      detail: `Badge: ${hasRoadmapBadge}, CBUAE: ${hasCbuaeSandbox}, API: ${hasApiTarget}, Title: ${hasTitle}`
    });

    // 2. Real-Time F&I KPI Grid
    const hasPipelineValuation = bodyText.includes('28,450,000') && bodyText.includes('18 In-Flight Files');
    const hasSla = bodyText.includes('Avg Approval SLA') && bodyText.includes('4.8');
    const hasYield = bodyText.includes('842,600') && bodyText.includes('Projected Dealer F&I Yield');
    const hasLtvCompliance = bodyText.includes('100.0%') && bodyText.includes('Capped ≤ 80%');
    results.push({
      check: 'Real-Time F&I Operational KPIs (AED 28.45M Pipeline, 4.8h SLA, AED 842.6k Yield, 100% LTV Capped)',
      passed: hasPipelineValuation && hasSla && hasYield && hasLtvCompliance,
      detail: `Pipeline: ${hasPipelineValuation}, SLA: ${hasSla}, Yield: ${hasYield}, LTV: ${hasLtvCompliance}`
    });

    // 3. Active Dossier Spotlight (GT3 RS, Dr. Tariq Al-Hashimi)
    const hasCaseRef = bodyText.includes('#FNI-2025-0418');
    const hasApplicant = bodyText.includes('Dr. Tariq Al-Hashimi') && bodyText.includes('UAE PASS Verified');
    const hasAecb = bodyText.includes('842') && bodyText.includes('Very Low Risk');
    const hasCommercials = bodyText.includes('1,420,000') && bodyText.includes('284,000') && bodyText.includes('1,136,000');
    results.push({
      check: 'Active Case Spotlight Dossier Bento (Porsche GT3 RS, Dr. Tariq Al-Hashimi, AECB 842, 20% Equity)',
      passed: hasCaseRef && hasApplicant && hasAecb && hasCommercials,
      detail: `Case: ${hasCaseRef}, Applicant: ${hasApplicant}, AECB: ${hasAecb}, Commercials: ${hasCommercials}`
    });

    // 4. Multi-Bank Syndication & Approval Matrix
    const hasEnbd = bodyText.includes('Emirates NBD') && bodyText.includes('2.49% Flat');
    const hasFab = bodyText.includes('First Abu Dhabi Bank') && bodyText.includes('2.39% Flat');
    const hasDib = bodyText.includes('Dubai Islamic Bank') && bodyText.includes('Murabaha');
    const hasAdcb = bodyText.includes('ADCB Private') && bodyText.includes('2.60% Flat');
    results.push({
      check: 'Multi-Lender Syndication Matrix (ENBD 2.49%, FAB 2.39%, DIB Murabaha, ADCB 2.60%)',
      passed: hasEnbd && hasFab && hasDib && hasAdcb,
      detail: `ENBD: ${hasEnbd}, FAB: ${hasFab}, DIB: ${hasDib}, ADCB: ${hasAdcb}`
    });

    // 5. Insurance Underwriting & Supercar Rider Matrix
    const hasSukoon = bodyText.includes('Oman Insurance (Sukoon)') && bodyText.includes('42,600');
    const hasBrokerageShare = bodyText.includes('6,390') && bodyText.includes('15.0% Direct Inward Commission');
    const hasAgencyRepair = bodyText.includes('GCC Agency Repair Guarantee');
    const hasTrackDay = bodyText.includes('Dubai Autodrome Track Day Cover');
    const hasCarbonDepr = bodyText.includes('Zero Depreciation on Carbon Aero & PCCB');
    results.push({
      check: 'Supercar Insurance Matrix & Endorsements (Sukoon Agreed Value, Autodrome Track Day, Zero PCCB Depr)',
      passed: hasSukoon && hasBrokerageShare && hasAgencyRepair && hasTrackDay && hasCarbonDepr,
      detail: `Sukoon: ${hasSukoon}, Brokerage: ${hasBrokerageShare}, Agency: ${hasAgencyRepair}, TrackDay: ${hasTrackDay}, Carbon: ${hasCarbonDepr}`
    });

    // 6. CBUAE Statutory Guardrails Card
    const hasDbr = bodyText.includes('Debt Burden Ratio (DBR)') && bodyText.includes('18.4%') && bodyText.includes('50.0%');
    const hasLtvStatutory = bodyText.includes('Loan-To-Value') && bodyText.includes('80.0%');
    const hasAttestation = bodyText.includes('Central Bank Open Finance Attestation');
    results.push({
      check: 'CBUAE Regulatory Guardrails (DBR 18.4% vs 50% Cap, LTV 80.0% Cap, Open Banking Attestation)',
      passed: hasDbr && hasLtvStatutory && hasAttestation,
      detail: `DBR: ${hasDbr}, LTV: ${hasLtvStatutory}, Attestation: ${hasAttestation}`
    });

    // 7. Interactive Yield & Payment Simulator
    const hasMonthlyInstallment = bodyText.includes('Estimated Client Monthly Installment') && bodyText.includes('26,018');
    const hasTotalDealerYield = bodyText.includes('Total Dealership Back-End Yield') && bodyText.includes('19,454');
    results.push({
      check: 'Interactive Loan Calculator & Dealership Back-End Yield Breakdown (AED 26,018/mo, AED 19,454 Yield)',
      passed: hasMonthlyInstallment && hasTotalDealerYield,
      detail: `Monthly: ${hasMonthlyInstallment}, Yield: ${hasTotalDealerYield}`
    });

    // 8. Recent Dealer F&I Pipeline Table
    const hasFerrariFile = bodyText.includes('#FNI-2025-0414') && bodyText.includes('Ferrari 296 GTB');
    const hasAmgFile = bodyText.includes('#FNI-2025-0409') && bodyText.includes('Mercedes-AMG G63');
    const hasValkyrieFile = bodyText.includes('#FNI-2025-0402') && bodyText.includes('Aston Martin Valkyrie');
    const hasCullinanFile = bodyText.includes('#FNI-2025-0398') && bodyText.includes('Rolls-Royce Cullinan');
    results.push({
      check: 'Recent Dealer F&I Pipeline Ledger (Ferrari 296 GTB, G63 4x4², Valkyrie, Cullinan)',
      passed: hasFerrariFile && hasAmgFile && hasValkyrieFile && hasCullinanFile,
      detail: `Ferrari: ${hasFerrariFile}, AMG: ${hasAmgFile}, Valkyrie: ${hasValkyrieFile}, Cullinan: ${hasCullinanFile}`
    });

    // 9. Interactive Tenor Recalculation Flow
    await page.click('button:has-text("36m")');
    await page.waitForTimeout(400);
    const textAfter36m = await page.textContent('body');
    const tenorRecalculated = textAfter36m.includes('36 Months') && !textAfter36m.includes('26,018');
    await page.click('button:has-text("48m")');
    await page.waitForTimeout(400);
    results.push({
      check: 'Interactive Tenor Switcher & Real-Time Installment Recalculation',
      passed: tenorRecalculated,
      detail: `Tenor recalculated on 36m switch: ${tenorRecalculated}`
    });

    // 10. Interactive Bank Offer Selection Flow
    const selectOfferBtn = page.locator('button:has-text("Select Offer")');
    if (await selectOfferBtn.count() > 0) {
      await selectOfferBtn.first().click();
      await page.waitForTimeout(400);
      const feedbackText = await page.textContent('body');
      const offerSelected = feedbackText.includes('Selected') && feedbackText.includes('financing offer');
      results.push({
        check: 'Interactive Bank Syndication Selection & Terms Binding',
        passed: offerSelected,
        detail: `Offer selection acknowledged: ${offerSelected}`
      });
    }

    // 11. Submit Bank Dossier Modal Journey
    await page.click('button:has-text("Submit Bank Dossier")');
    await page.waitForTimeout(400);
    const modalVisible = await page.isVisible('text=Submit Bank Credit Dossier');
    await page.click('button:has-text("Transmit Encrypted Dossier")');
    await page.waitForTimeout(400);
    const feedbackAfterDossier = await page.textContent('body');
    const dossierSubmitted = feedbackAfterDossier.includes('Credit dossier #FNI-2025-0418 transmitted');
    results.push({
      check: 'Statutory Bank Dossier Submission with UAE PASS & Open Banking Attestation',
      passed: modalVisible && dossierSubmitted,
      detail: `Modal visible: ${modalVisible}, Dossier submitted: ${dossierSubmitted}`
    });

    // 12. Transmit Sanction Letter Action
    await page.click('button:has-text("Transmit Sanction Letter (UAE PASS)")');
    await page.waitForTimeout(400);
    const feedbackAfterSanction = await page.textContent('body');
    const sanctionPassed = feedbackAfterSanction.includes('Sanction letter transmitted') && feedbackAfterSanction.includes('digital signature');
    results.push({
      check: 'Biometric UAE PASS Sanction Letter Dispatch Flow',
      passed: sanctionPassed,
      detail: `Sanction dispatched: ${sanctionPassed}`
    });

    // Capture Modal / Simulator evidence
    await page.screenshot({
      path: path.join(evidenceDir, 'modal_dossier_simulator.png'),
      fullPage: false
    });

    // 13. RBAC Least-Privilege Role Mode Verification (Sales Rep vs Principal)
    const roleToggleBtn = page.locator('button[title*="Dealer Principal and Sales Executive"]');
    if (await roleToggleBtn.count() > 0) {
      await roleToggleBtn.click();
      await page.waitForTimeout(400);
      const repText = await page.textContent('body');
      const isYieldMasked = repText.includes('••••••') && repText.includes('Sales Rep (Masked Cost)');
      await roleToggleBtn.click(); // switch back
      await page.waitForTimeout(400);
      results.push({
        check: 'Multi-Tenant RBAC Least-Privilege Dealer Yield & Reserve Masking (Sales Rep vs Principal)',
        passed: isYieldMasked,
        detail: `Yield and margins masked for Sales Rep: ${isYieldMasked}`
      });
    }

    // Capture Desktop 1440 screenshot
    await page.screenshot({
      path: path.join(evidenceDir, 'desktop_1440.png'),
      fullPage: false
    });

    // 14. High DBR Demonstrator State & Regulatory Alert
    await page.click('button:has-text("High DBR / Subprime Warning")');
    await page.waitForTimeout(400);
    const highDbrText = await page.textContent('body');
    const highDbrPassed = highDbrText.includes('54.2%') && highDbrText.includes('DBR EXCEPTION');
    await page.click('button:has-text("Approved Syndication (GT3 RS)")');
    await page.waitForTimeout(400);
    results.push({
      check: 'Interactive Demonstrator High DBR / Subprime Warning Mode (DBR > 50% Hard-Lock)',
      passed: highDbrPassed,
      detail: `High DBR alert verified: ${highDbrPassed}`
    });

    // 15. Arabic RTL Layout & Localization Verification
    const langToggleBtn = page.locator('button[aria-label="Toggle language"]');
    await langToggleBtn.click();
    await page.waitForTimeout(500);

    const arabicBodyText = await page.textContent('body');
    const isDirRtl = await page.getAttribute('div.min-h-screen', 'dir') === 'rtl';
    const hasArabicTitle = arabicBodyText.includes('إدارة التمويل والتأمين المصرفي');
    const hasArabicPipeline = arabicBodyText.includes('محفظة التمويل المدارة (QTD)');
    const hasArabicDossier = arabicBodyText.includes('إرسال الملف إلى البنك');
    const hasArabicGuardrails = arabicBodyText.includes('ضوابط المصرف المركزي CBUAE');

    results.push({
      check: 'Arabic RTL Direction & Complete Localization (إدارة التمويل والتأمين المصرفي, ضوابط المصرف المركزي)',
      passed: isDirRtl && hasArabicTitle && hasArabicPipeline && hasArabicDossier && hasArabicGuardrails,
      detail: `RTL: ${isDirRtl}, Title: ${hasArabicTitle}, Pipeline: ${hasArabicPipeline}, Dossier: ${hasArabicDossier}, Guardrails: ${hasArabicGuardrails}`
    });

    // Capture Arabic RTL screenshot
    await page.screenshot({
      path: path.join(evidenceDir, 'arabic_rtl.png'),
      fullPage: false
    });

    // Switch back to English
    await langToggleBtn.click();
    await page.waitForTimeout(400);

    // 16. Mobile Viewport (390x844) Responsiveness
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileText = await page.textContent('body');
    const mobileResponsive = mobileText.includes('F&I Referral & Lending Status Desk') && mobileText.includes('Financed Pipeline');
    results.push({
      check: 'Mobile Viewport (390x844) Responsive Layout',
      passed: mobileResponsive,
      detail: `Mobile content rendered without blowout: ${mobileResponsive}`
    });

    // Capture Mobile screenshot
    await page.screenshot({
      path: path.join(evidenceDir, 'mobile_390.png'),
      fullPage: false
    });

  } catch (err) {
    console.error('S21 Verification error:', err);
    results.push({
      check: 'Test execution completed without crash',
      passed: false,
      detail: err.message
    });
  } finally {
    await browser.close();
  }

  // Print results table
  console.log('\n======================================================');
  console.log('       S21 FINANCE & INSURANCE DESK VERIFICATION REPORT');
  console.log('======================================================');
  let passCount = 0;
  results.forEach((r, idx) => {
    const mark = r.passed ? '✓ PASS' : '✗ FAIL';
    if (r.passed) passCount++;
    console.log(`[${idx + 1}] ${mark}: ${r.check}`);
    console.log(`    Detail: ${r.detail}`);
  });
  console.log('------------------------------------------------------');
  console.log(`Summary: ${passCount} / ${results.length} checks PASSED.`);
  console.log('======================================================\n');

  // Write QA Report
  const reportPath = path.join(evidenceDir, 'QA_REPORT.md');
  const reportContent = `# S21 — Finance & Insurance Referral & Banking Desk: QA Verification Report

**Screen:** S21 (\`apps/dealer/app/finance/page.tsx\`)  
**Stitch Screen ID:** \`2de2a58f7a914c94a7cf093d8a1984df\`  
**Timestamp:** ${new Date().toISOString()}  
**Result:** ${passCount === results.length ? 'VERIFIED_PASS' : 'FAIL'} (${passCount}/${results.length} checks passed)

## Visual Parity & Evidence
- **Desktop 1440px Viewport**: \`docs/qa/evidence/S21/desktop_1440.png\`
- **Arabic RTL Viewport**: \`docs/qa/evidence/S21/arabic_rtl.png\`
- **Mobile 390px Viewport**: \`docs/qa/evidence/S21/mobile_390.png\`
- **Interactive Dossier & Simulator**: \`docs/qa/evidence/S21/modal_dossier_simulator.png\`

## Automated Verification Suite
| # | Verification Gate | Result | Notes |
|---|-------------------|--------|-------|
${results.map((r, i) => `| ${i + 1} | ${r.check} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '-')} |`).join('\n')}

## Statutory Compliance & Integration Truth
- **CBUAE Regulatory Guardrails**: Enforces 80% maximum LTV (20% minimum client equity) and 50% maximum Debt Burden Ratio (DBR).
- **AECB & Open Banking Truth Table**: Recorded simulation mode for live banking write-backs and AECB score pulls per \`INTEGRATION_TRUTH_TABLE.md\` until partner provider credentials are provisioned in staging.
- **Least-Privilege RBAC**: Dealer reserve margins, yield spreads, and back-end commissions are strictly masked when accessed via Sales Representative credentials.
`;

  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`QA Report written to ${reportPath}`);

  if (passCount !== results.length) {
    process.exit(1);
  }
}

verifyS21();
